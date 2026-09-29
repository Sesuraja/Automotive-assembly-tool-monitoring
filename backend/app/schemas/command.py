from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class SetSpeedCommandRequest(BaseModel):
    asset_id: str
    target_rpm: int = Field(..., ge=0, le=3500)
    reason: str = "OPERATOR_MANUAL_ADJUSTMENT"

class StopCommandRequest(BaseModel):
    asset_id: str
    reason: str = "OPERATOR_EMERGENCY_STOP"

class CommandResponse(BaseModel):
    id: str
    command_id: str
    company_id: str
    asset_id: str
    command_type: str
    target_rpm: int
    reason: str
    model_version: Optional[str] = None
    decision_id: Optional[str] = None
    created_at: datetime
    expires_at: datetime
    status: str

    class Config:
        from_attributes = True

class CommandFeedbackResponse(BaseModel):
    id: str
    command_id: str
    asset_id: str
    measured_rpm: int
    status: str
    completion_timestamp: datetime
    error_message: Optional[str] = None

    class Config:
        from_attributes = True
