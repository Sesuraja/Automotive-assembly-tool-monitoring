from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

class DeviceBase(BaseModel):
    device_id: str = Field(..., description="Unique device identifier e.g. ble_node_01")
    name: str
    device_type: str = "BLE_VIBRATION_SENSOR"
    vendor: str = "Generic Industrial BLE"
    ble_address: Optional[str] = None
    firmware_version: str = "1.0.0"
    hardware_revision: str = "rev-A"
    config_json: Dict[str, Any] = {}

class DeviceCreate(DeviceBase):
    company_id: Optional[str] = None

class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    vendor: Optional[str] = None
    ble_address: Optional[str] = None
    firmware_version: Optional[str] = None
    hardware_revision: Optional[str] = None
    connection_status: Optional[str] = None
    health_status: Optional[str] = None
    battery_pct: Optional[int] = None
    config_json: Optional[Dict[str, Any]] = None

class DeviceResponse(DeviceBase):
    id: str
    company_id: str
    battery_pct: int
    connection_status: str
    health_status: str
    last_seen_utc: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    mapped_asset_id: Optional[str] = None
    mapped_asset_name: Optional[str] = None
    mapped_station_name: Optional[str] = None

    class Config:
        from_attributes = True

class DeviceCommissionRequest(BaseModel):
    device_id: str
    name: str
    device_type: str = "BLE_VIBRATION_SENSOR"
    ble_address: str
    asset_id: str
    station_id: str
    sampling_rate_hz: int = 100
    vendor: str = "Generic Industrial BLE"

class ControllerResponse(BaseModel):
    id: str
    company_id: str
    station_id: Optional[str] = None
    asset_id: Optional[str] = None
    name: str
    controller_type: str
    vendor: str
    interface_endpoint: str
    status: str
    last_measured_rpm: int
    last_commanded_rpm: int

    class Config:
        from_attributes = True

class ControllerCreate(BaseModel):
    company_id: Optional[str] = None
    station_id: Optional[str] = None
    asset_id: Optional[str] = None
    name: str
    controller_type: str = "VFD_MOTOR_CONTROLLER"
    vendor: str = "Aperture Control System"
    interface_endpoint: str = "local://serial-0"
