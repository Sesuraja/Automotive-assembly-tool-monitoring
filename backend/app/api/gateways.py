import time
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.company import Company
from app.models.hardware import BleGateway, Device, DeviceMapping
from app.models.operations import Asset
from app.models.user import User
from app.models.telemetry import Telemetry
from app.schemas.gateway import GatewayCreate, GatewayResponse, SensorCreate, GatewayPacketPayload, GatewayIngestResult
from app.ml.features import feature_extractor
from app.ml.registry import model_registry
from app.policy.engine import policy_engine
from app.policy.state_machine import EquipmentState, LatchReason
from app.hardware.controller_adapter import motor_controller
from app.services.command_service import command_service
from app.services.websocket_manager import ws_manager
from app.core.tenant import verify_tenant_access
from app.api.deps import get_current_user

router = APIRouter(prefix="/gateways", tags=["Industrial BLE Gateways & Ingestion"])

@router.get("", response_model=List[GatewayResponse])
def list_gateways(
    company_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_comp = company_id or current_user.company_id
    if not current_user.is_super_admin:
        verify_tenant_access(target_comp, current_user)
    query = db.query(BleGateway)
    if target_comp:
        query = query.filter(BleGateway.company_id == target_comp)
    return query.order_by(BleGateway.created_at.desc()).all()

@router.post("", response_model=GatewayResponse, status_code=status.HTTP_201_CREATED)
def create_gateway(
    req: GatewayCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_comp = req.company_id or current_user.company_id
    if not target_comp:
        first_comp = db.query(Company).first()
        target_comp = first_comp.id if first_comp else None
    if not current_user.is_super_admin:
        verify_tenant_access(target_comp, current_user)

    existing = db.query(BleGateway).filter(BleGateway.gateway_id == req.gateway_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Gateway ID '{req.gateway_id}' is already registered.")

    gw = BleGateway(
        company_id=target_comp,
        gateway_id=req.gateway_id,
        name=req.name,
        ip_address=req.ip_address or "192.168.1.100",
        mac_address=req.mac_address,
        protocol=req.protocol or "HTTP_REST",
        status="ONLINE",
        firmware_version="2.1.0",
        last_heartbeat_utc=datetime.now(timezone.utc)
    )
    db.add(gw)
    db.commit()
    db.refresh(gw)
    return gw

@router.delete("/{gateway_id_or_pk}", status_code=status.HTTP_200_OK)
def delete_gateway(
    gateway_id_or_pk: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    gw = db.query(BleGateway).filter(
        (BleGateway.id == gateway_id_or_pk) | (BleGateway.gateway_id == gateway_id_or_pk)
    ).first()
    if not gw:
        raise HTTPException(status_code=404, detail="Gateway not found")
    if not current_user.is_super_admin:
        verify_tenant_access(gw.company_id, current_user)
    db.delete(gw)
    db.commit()
    return {"message": f"Gateway '{gw.gateway_id}' deleted successfully"}

@router.post("/sensors", status_code=status.HTTP_201_CREATED)
def add_sensor_to_gateway(
    req: SensorCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_comp = req.company_id or current_user.company_id
    if not target_comp:
        first_comp = db.query(Company).first()
        target_comp = first_comp.id if first_comp else None
    if not current_user.is_super_admin:
        verify_tenant_access(target_comp, current_user)

    existing = db.query(Device).filter(Device.device_id == req.device_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Sensor ID '{req.device_id}' already exists.")

    sensor = Device(
        company_id=target_comp,
        device_id=req.device_id,
        name=req.name,
        device_type="BLE_VIBRATION_SENSOR",
        vendor="Industrial MEMS BLE",
        ble_address=req.ble_address or "D4:36:39:B2:11:04",
        gateway_id=req.gateway_id or "GW-001",
        sampling_rate_hz=req.sampling_rate_hz or 3200,
        connection_status="CONNECTED",
        health_status="HEALTHY",
        battery_pct=98,
        last_seen_utc=datetime.now(timezone.utc)
    )
    db.add(sensor)
    db.commit()
    db.refresh(sensor)

    # Optional mapping to target asset
    if req.asset_id:
        asset = db.query(Asset).filter(Asset.id == req.asset_id).first()
        if asset:
            mapping = DeviceMapping(
                company_id=target_comp,
                device_id=sensor.id,
                asset_id=asset.id,
                station_id=asset.station_id,
                is_active=True
            )
            db.add(mapping)
            db.commit()

    return {"message": f"Sensor '{sensor.device_id}' registered successfully", "id": sensor.id}

@router.post("/telemetry", response_model=GatewayIngestResult)
async def ingest_gateway_telemetry(
    packet: GatewayPacketPayload,
    db: Session = Depends(get_db)
):
    """
    PRD Section 7 Industrial BLE Gateway Ingestion Webhook.
    Accepts high-frequency triaxial vibration packets directly from industrial gateways:
    {
      "gateway_id": "GW-001",
      "sensor_id": "BLE-VIB-001",
      "asset_id": "MOTOR-001",
      "sequence": 12345,
      "timestamp": "UTC timestamp",
      "sampling_rate_hz": 3200,
      "x": [...], "y": [...], "z": [...]
    }
    """
    now = datetime.now(timezone.utc)
    pkt_time = packet.timestamp or now
    age_ms = max(0.0, (now.timestamp() - pkt_time.timestamp()) * 1000)

    # Look up asset
    asset = None
    if packet.asset_id:
        asset = db.query(Asset).filter(
            (Asset.id == packet.asset_id) | (Asset.serial_number == packet.asset_id)
        ).first()
    if not asset:
        asset = db.query(Asset).first()

    company_id = asset.company_id if asset else "comp_default"
    asset_id = asset.id if asset else "asset_default"

    # Push samples into feature extractor buffer
    x_samples = packet.x if packet.x else [0.08]
    y_samples = packet.y if packet.y else [0.05]
    z_samples = packet.z if packet.z else [0.99]

    for i in range(min(len(x_samples), len(y_samples), len(z_samples))):
        feature_extractor.push_sample(x_samples[i], y_samples[i], z_samples[i])

    measured_rpm = await motor_controller.get_measured_rpm()
    features = feature_extractor.compute_features(measured_rpm)

    # Run AI inference
    active_ml = model_registry.get_active_model()
    inference_result = active_ml.predict_features(features)

    # Evaluate deterministic safety policy
    curr_state = EquipmentState(asset.current_state) if asset and asset.current_state in [e.value for e in EquipmentState] else EquipmentState.READY
    curr_latch = LatchReason(asset.active_latch) if asset and asset.active_latch in [l.value for l in LatchReason] else LatchReason.NONE

    policy_engine.update_telemetry_time(asset_id)
    decision = policy_engine.evaluate(
        asset_id=asset_id,
        inference=inference_result,
        current_state=curr_state,
        active_latch=curr_latch
    )

    # Execute deterministic safety actions if needed
    cmd_executed = None
    if decision.action == "STOP" and curr_state not in [EquipmentState.LATCHED_STOP, EquipmentState.FAULT]:
        if asset:
            asset.current_state = "LATCHED_STOP"
            asset.active_latch = decision.latch_state
            db.commit()
        await motor_controller.set_speed(0)
        cmd_executed = "EMERGENCY_STOP_EXECUTED"
    elif decision.action == "REDUCE_SPEED" and curr_state != EquipmentState.LATCHED_STOP:
        if asset and asset.current_state != "RUNNING_REDUCED":
            asset.current_state = "RUNNING_REDUCED"
            db.commit()
        await motor_controller.set_speed(decision.target_rpm)
        cmd_executed = f"REDUCE_SPEED_EXECUTED_{decision.target_rpm}_RPM"

    # Broadcast to WebSocket subscribers in real time
    await ws_manager.broadcast({
        "type": "LIVE_TELEMETRY",
        "asset_id": asset_id,
        "asset_name": asset.name if asset else "Motor Asset",
        "station_id": asset.station_id if asset else "st-01",
        "station_name": "Station 01",
        "connection_status": "CONNECTED",
        "sensor_health": "OK",
        "data_age_ms": round(age_ms, 1),
        "telemetry": {
            "sequence": packet.sequence,
            "accel_x": x_samples[-1],
            "accel_y": y_samples[-1],
            "accel_z": z_samples[-1],
            "motor_rpm": measured_rpm,
            "commanded_rpm": motor_controller._commanded_rpm
        },
        "features": features,
        "ai": inference_result,
        "decision": decision.to_dict(),
        "command": {
            "command_id": f"cmd_gw_{packet.sequence}",
            "target_rpm": decision.target_rpm,
            "controller_status": "RUNNING" if measured_rpm > 0 else "STOPPED",
            "measured_rpm": measured_rpm,
            "status": "COMPLETE"
        },
        "state": {
            "current_state": asset.current_state if asset else "READY",
            "active_latch": asset.active_latch if asset else "NONE",
            "reset_required": asset.current_state in ["LATCHED_STOP", "FAULT"] if asset else False
        }
    })

    return GatewayIngestResult(
        status="ACCEPTED",
        packet_valid=True,
        gateway_id=packet.gateway_id,
        sensor_id=packet.sensor_id,
        sequence=packet.sequence,
        received_at_utc=now,
        data_age_ms=round(age_ms, 1),
        features=features,
        ai_inference=inference_result,
        policy_decision=decision.to_dict(),
        command_executed=cmd_executed
    )
