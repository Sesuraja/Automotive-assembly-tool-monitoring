from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class NormalizedTelemetry(BaseModel):
    asset_id: str
    sensor_id: str
    run_id: str
    sequence: int
    timestamp_utc: datetime
    received_at_utc: datetime
    accel_x: float
    accel_y: float
    accel_z: float
    motor_rpm: int
    commanded_rpm: int
    health: str = "OK"
    data_age_ms: int = 0

class TelemetryIngest(BaseModel):
    asset_id: str
    sensor_id: str
    run_id: Optional[str] = None
    sequence: int
    timestamp_utc: Optional[datetime] = None
    accel_x: float
    accel_y: float
    accel_z: float
    motor_rpm: int
    commanded_rpm: int
    health: str = "OK"

class RunResponse(BaseModel):
    id: str
    company_id: str
    asset_id: str
    station_id: str
    run_number: str
    start_time: datetime
    end_time: Optional[datetime] = None
    status: str

    class Config:
        from_attributes = True

class LiveMonitoringState(BaseModel):
    asset_id: str
    asset_name: str
    station_id: str
    station_name: str
    connection_status: str
    sensor_health: str
    data_age_ms: int
    
    # Telemetry metrics
    latest_telemetry: Optional[NormalizedTelemetry] = None
    vibration_rms: float = 0.0
    vibration_peak: float = 0.0
    crest_factor: float = 0.0
    kurtosis: float = 0.0
    motor_rpm: int = 0
    commanded_rpm: int = 0
    
    # AI Inference
    model_name: str = "motor_v1"
    score_normal: float = 0.95
    score_mild: float = 0.03
    score_strong: float = 0.02
    selected_condition: str = "NORMAL"
    confidence: float = 0.95
    
    # Policy Decision
    decision_action: str = "CONTINUE"
    decision_reason: str = "NORMAL"
    persistence_windows: str = "0 / 2"
    policy_name: str = "Automotive Tool Safety Policy"
    
    # Command & Execution
    command_id: Optional[str] = None
    target_rpm: int = 0
    controller_status: str = "READY"
    measured_rpm: int = 0
    completion_status: str = "IDLE"
    completion_timestamp: Optional[datetime] = None
    
    # State & Latch
    current_state: str = "READY"
    active_latch: str = "NONE"
    fallback_reason: Optional[str] = None
    reset_required: bool = False
