from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class OrgNodeBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    code: Optional[str] = None
    node_type: str = Field(..., description="business_unit, division, department, team, custom")
    parent_id: Optional[str] = None
    manager_id: Optional[str] = None
    metadata_json: Dict[str, Any] = {}

class OrgNodeCreate(OrgNodeBase):
    company_id: Optional[str] = None

class OrgNodeUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    node_type: Optional[str] = None
    parent_id: Optional[str] = None
    manager_id: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None

class OrgNodeResponse(OrgNodeBase):
    id: str
    company_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class OrgNodeTreeResponse(OrgNodeResponse):
    children: List["OrgNodeTreeResponse"] = []
