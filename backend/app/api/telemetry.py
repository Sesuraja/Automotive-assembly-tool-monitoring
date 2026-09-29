from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.telemetry import Telemetry, Run
from app.models.operations import Asset, Station
from app.models.user import User
from app.schemas.telemetry import NormalizedTelemetry, LiveMonitoringState
from app.services.execution_service import execution_service
from app.hardware.ble_adapter import ble_adapter
from app.hardware.controller_adapter import motor_controller
from app.api.deps import get_current_user

router = APIRouter(prefix="/telemetry", tags=["Telemetry & Monitoring"])

@router.get("/latest/{asset_id}", response_model=Optional[NormalizedTelemetry])
def get_latest_telemetry(
    asset_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(Telemetry).filter(Telemetry.asset_id == asset_id).order_by(Telemetry.timestamp_utc.desc()).first()
    if not record:
        return None
    return NormalizedTelemetry(
        asset_id=record.asset_id,
        sensor_id=record.sensor_id,
        run_id=record.run_id,
        sequence=record.sequence,
        timestamp_utc=record.timestamp_utc,
        received_at_utc=record.received_at_utc,
        accel_x=record.accel_x,
        accel_y=record.accel_y,
        accel_z=record.accel_z,
        motor_rpm=record.motor_rpm,
        commanded_rpm=record.commanded_rpm,
        health=record.health,
        data_age_ms=record.data_age_ms
    )

@router.get("/live/{asset_id}")
async def get_live_state(
    asset_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    station = db.query(Station).filter(Station.id == asset.station_id).first()
    st_name = station.name if station else "Station 01"

    cached = execution_service.get_latest_state(asset_id)
    if cached:
        return cached

    # Fallback to initial healthy state
    health = await motor_controller.get_health()
    return {
        "asset_id": asset.id,
        "asset_name": asset.name,
        "station_id": asset.station_id,
        "station_name": st_name,
        "connection_status": "CONNECTED",
        "sensor_health": "OK",
        "data_age_ms": 25,
        "telemetry": {
            "sequence": 1,
            "accel_x": 0.08,
            "accel_y": 0.05,
            "accel_z": 0.99,
            "motor_rpm": health["measured_rpm"],
            "commanded_rpm": health["commanded_rpm"]
        },
        "features": {
            "rms": 0.082,
            "peak": 0.24,
            "crest_factor": 2.9,
            "kurtosis": 2.95,
            "measured_motor_speed": health["measured_rpm"]
        },
        "ai": {
            "model_version": "motor_v1",
            "score_normal": 0.96,
            "score_mild": 0.03,
            "score_strong": 0.01,
            "predicted_class": "NORMAL",
            "confidence": 0.96
        },
        "decision": {
            "action": "CONTINUE",
            "reason": "NORMAL_OPERATING_CONDITION",
            "persistence_count": 1,
            "persistence_threshold": 1,
            "target_rpm": 1800,
            "latch_state": "NONE",
            "reset_required": False
        },
        "command": {
            "command_id": "cmd_init_001",
            "target_rpm": 1800,
            "controller_status": health["status"],
            "measured_rpm": health["measured_rpm"],
            "status": "COMPLETE"
        },
        "state": {
            "current_state": asset.current_state,
            "active_latch": asset.active_latch,
            "reset_required": asset.current_state in ["LATCHED_STOP", "FAULT"]
        }
    }

@router.post("/simulate-condition")
def simulate_condition(
    condition: str,
    current_user: User = Depends(get_current_user)
):
    """
    Simulation mode hook for condition injection conforming to PRD Section 15:
    NORMAL, MILD_DISTURBANCE, STRONG_DISTURBANCE, STALE_DATA, PACKET_LOSS, MOTOR_STOP_FAILURE
    """
    valid_conditions = [
        "NORMAL",
        "MILD_DISTURBANCE",
        "STRONG_DISTURBANCE",
        "STALE_DATA",
        "PACKET_LOSS",
        "MOTOR_STOP_FAILURE"
    ]
    if condition not in valid_conditions:
        raise HTTPException(status_code=400, detail=f"Invalid condition label. Allowed: {valid_conditions}")

    if condition == "MOTOR_STOP_FAILURE":
        motor_controller.set_stop_failure_simulation(True)
        return {"message": "Simulation Mode: Motor Stop Failure injected (Tachometer will simulate brake slip on stop)"}
    else:
        motor_controller.set_stop_failure_simulation(False)
        ble_adapter.set_condition_injection("ble_node_01", condition)
        return {"message": f"Simulation Mode: BLE adapter profile set to {condition}"}
