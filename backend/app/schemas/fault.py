from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class FaultResponse(BaseModel):
    id: str
    company_id: str
    asset_id: str
    category: str
    severity: str
    reason: str
    detected_at: datetime
    is_latched: bool
    is_acknowledged: bool
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolution_notes: Optional[str] = None
    context_data: Dict[str, Any] = {}

    class Config:
        from_attributes = True

class FaultAcknowledgeRequest(BaseModel):
    notes: Optional[str] = None

class FaultResetRequest(BaseModel):
    fault_id: str
    reset_reason: str = Field(..., min_length=5, description="Engineering reason for safety reset")

class FaultResetResponse(BaseModel):
    id: str
    fault_id: str
    asset_id: str
    operator_email: str
    reset_reason: str
    timestamp_utc: datetime
    previous_state: str
    new_state: str
    verified: bool
