from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel

class AuditLogResponse(BaseModel):
    id: str
    company_id: Optional[str] = None
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    role: Optional[str] = None
    action: str
    entity: str
    entity_id: Optional[str] = None
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    timestamp_utc: datetime
    result: str
    reason: Optional[str] = None

    class Config:
        from_attributes = True

class EventTraceResponse(BaseModel):
    id: str
    trace_id: str
    company_id: str
    asset_id: str
    sensor_event_id: Optional[str] = None
    telemetry_id: Optional[str] = None
    inference_id: Optional[str] = None
    decision_id: Optional[str] = None
    command_id: Optional[str] = None
    feedback_id: Optional[str] = None
    physical_result_rpm: Optional[int] = None
    timestamp_utc: datetime
    duration_ms: float
    summary: Optional[str] = None
    trace_payload: Dict[str, Any] = {}

    class Config:
        from_attributes = True
