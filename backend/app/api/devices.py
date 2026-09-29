from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.hardware import Device, DeviceMapping
from app.models.operations import Asset, Station
from app.models.user import User
from app.schemas.hardware import DeviceCreate, DeviceUpdate, DeviceResponse, DeviceCommissionRequest
from app.hardware.ble_adapter import ble_adapter
from app.core.tenant import verify_tenant_access
from app.services.audit_service import audit_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/devices", tags=["Devices & Hardware"])

@router.get("/discover")
async def discover_ble_devices(current_user: User = Depends(get_current_user)):
    devices = await ble_adapter.discover()
    return devices

@router.get("", response_model=List[DeviceResponse])
def list_devices(
    company_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_comp = company_id or current_user.company_id
    if not current_user.is_super_admin:
        verify_tenant_access(target_comp, current_user)
    query = db.query(Device)
    if target_comp:
        query = query.filter(Device.company_id == target_comp)

    devices = query.all()
    res = []
    for d in devices:
        # Check mapping
        mapping = db.query(DeviceMapping).filter(DeviceMapping.device_id == d.id, DeviceMapping.is_active == True).first()
        asset_name = None
        st_name = None
        if mapping:
            asset = db.query(Asset).filter(Asset.id == mapping.asset_id).first()
            if asset:
                asset_name = asset.name
                station = db.query(Station).filter(Station.id == asset.station_id).first()
                if station:
                    st_name = station.name

        res.append(DeviceResponse(
            id=d.id,
            device_id=d.device_id,
            name=d.name,
            device_type=d.device_type,
            vendor=d.vendor,
            ble_address=d.ble_address,
            firmware_version=d.firmware_version,
            hardware_revision=d.hardware_revision,
            battery_pct=d.battery_pct,
            connection_status=d.connection_status,
            health_status=d.health_status,
            last_seen_utc=d.last_seen_utc,
            company_id=d.company_id,
            config_json=d.config_json or {},
            created_at=d.created_at,
            updated_at=d.updated_at,
            mapped_asset_id=mapping.asset_id if mapping else None,
            mapped_asset_name=asset_name,
            mapped_station_name=st_name
        ))
    return res

@router.post("/commission", response_model=DeviceResponse)
async def commission_device(
    req: DeviceCommissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company_id = current_user.company_id
    if not company_id:
        raise HTTPException(status_code=400, detail="Company ID required for device commissioning.")

    # 1. Check if device exists or create
    device = db.query(Device).filter(Device.device_id == req.device_id).first()
    if not device:
        device = Device(
            company_id=company_id,
            device_id=req.device_id,
            name=req.name,
            device_type=req.device_type,
            vendor=req.vendor,
            ble_address=req.ble_address,
            connection_status="CONNECTED",
            health_status="HEALTHY"
        )
        db.add(device)
        db.commit()
        db.refresh(device)

    # 2. Connect via BLE adapter
    await ble_adapter.connect(req.device_id)

    # 3. Create or activate DeviceMapping
    mapping = db.query(DeviceMapping).filter(DeviceMapping.device_id == device.id).first()
    if not mapping:
        mapping = DeviceMapping(
            company_id=company_id,
            device_id=device.id,
            asset_id=req.asset_id,
            station_id=req.station_id,
            is_active=True
        )
        db.add(mapping)
    else:
        mapping.asset_id = req.asset_id
        mapping.station_id = req.station_id
        mapping.is_active = True
    db.commit()

    audit_service.log_event(
        db=db,
        action="COMMISSION_DEVICE",
        entity="Device",
        company_id=company_id,
        user_id=current_user.id,
        user_email=current_user.email,
        entity_id=device.id,
        new_value={"device_id": device.device_id, "mapped_asset_id": req.asset_id}
    )

    asset = db.query(Asset).filter(Asset.id == req.asset_id).first()
    return DeviceResponse(
        id=device.id,
        device_id=device.device_id,
        name=device.name,
        device_type=device.device_type,
        vendor=device.vendor,
        ble_address=device.ble_address,
        firmware_version=device.firmware_version,
        hardware_revision=device.hardware_revision,
        battery_pct=device.battery_pct,
        connection_status=device.connection_status,
        health_status=device.health_status,
        last_seen_utc=device.last_seen_utc,
        company_id=device.company_id,
        config_json=device.config_json or {},
        created_at=device.created_at,
        updated_at=device.updated_at,
        mapped_asset_id=req.asset_id,
        mapped_asset_name=asset.name if asset else None
    )

@router.get("/{device_id}/health")
async def get_device_health(
    device_id: str,
    current_user: User = Depends(get_current_user)
):
    health = await ble_adapter.get_health(device_id)
    return health

@router.post("/{device_id}/connect")
async def connect_device(
    device_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = await ble_adapter.connect(device_id)
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if device:
        device.connection_status = "CONNECTED"
        db.commit()
    return {"device_id": device_id, "connected": success}

@router.post("/{device_id}/disconnect")
async def disconnect_device(
    device_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    await ble_adapter.disconnect(device_id)
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if device:
        device.connection_status = "DISCONNECTED"
        db.commit()
    return {"device_id": device_id, "connected": False}
