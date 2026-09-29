from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class PolicyVersionResponse(BaseModel):
    id: str
    policy_id: str
    version: str
    status: str
    is_active: bool
    strong_threshold: float
    strong_persistence_windows: int
    mild_threshold: float
    mild_persistence_windows: int
    normal_threshold: float
    stale_data_timeout_sec: float
    reduced_speed_ratio: float
    config_json: Dict[str, Any] = {}

    class Config:
        from_attributes = True

class DecisionPolicyResponse(BaseModel):
    id: str
    company_id: str
    name: str
    description: Optional[str] = None
    is_active: bool
    versions: List[PolicyVersionResponse] = []

    class Config:
        from_attributes = True

class DecisionPolicyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    company_id: Optional[str] = None
    strong_threshold: float = 0.85
    strong_persistence_windows: int = 2
    mild_threshold: float = 0.80
    mild_persistence_windows: int = 3
    normal_threshold: float = 0.90
    stale_data_timeout_sec: float = 3.0
    reduced_speed_ratio: float = 0.50

class DecisionResponse(BaseModel):
    id: str
    asset_id: str
    timestamp_utc: datetime
    action: str
    reason: str
    persistence_count: int
    persistence_threshold: int
    latch_state: str
