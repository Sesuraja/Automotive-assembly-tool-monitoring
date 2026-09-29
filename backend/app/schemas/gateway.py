from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class GatewayCreate(BaseModel):
    gateway_id: str = Field(..., description="Unique hardware gateway identifier e.g. GW-001")
    name: str = Field(..., description="Descriptive industrial gateway label")
    ip_address: Optional[str] = "192.168.1.100"
    mac_address: Optional[str] = "A4:C1:38:12:44:99"
    protocol: Optional[str] = "HTTP_REST"
    company_id: Optional[str] = None

class GatewayResponse(BaseModel):
    id: str
    gateway_id: str
    name: str
    ip_address: str
    mac_address: Optional[str]
    protocol: str
    status: str
    firmware_version: str
    last_heartbeat_utc: Optional[datetime]
    company_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SensorCreate(BaseModel):
    device_id: str = Field(..., description="Unique sensor ID e.g. BLE-VIB-001")
    name: str = Field(..., description="Sensor descriptive label")
    ble_address: Optional[str] = "D4:36:39:B2:11:04"
    gateway_id: Optional[str] = "GW-001"
    sampling_rate_hz: Optional[int] = 3200
    asset_id: Optional[str] = None
    company_id: Optional[str] = None

class GatewayPacketPayload(BaseModel):
    gateway_id: str = Field(..., description="Originating industrial gateway ID")
    sensor_id: str = Field(..., description="Transmitting BLE sensor node ID")
    asset_id: Optional[str] = Field(None, description="Mapped tool asset identifier")
    sequence: int = Field(..., description="Strictly monotonic packet sequence number")
    timestamp: Optional[datetime] = Field(None, description="UTC acquisition timestamp")
    sampling_rate_hz: Optional[int] = Field(3200, description="Acquisition rate in Hertz")
    x: List[float] = Field(default_factory=list, description="Triaxial X-axis vibration samples (g)")
    y: List[float] = Field(default_factory=list, description="Triaxial Y-axis vibration samples (g)")
    z: List[float] = Field(default_factory=list, description="Triaxial Z-axis vibration samples (g)")

class GatewayIngestResult(BaseModel):
    status: str
    packet_valid: bool
    gateway_id: str
    sensor_id: str
    sequence: int
    received_at_utc: datetime
    data_age_ms: float
    features: Dict[str, Any]
    ai_inference: Dict[str, Any]
    policy_decision: Dict[str, Any]
    command_executed: Optional[str] = None
