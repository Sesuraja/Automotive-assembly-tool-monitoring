from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

# Sites
class SiteBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    code: str = Field(..., min_length=2, max_length=50)
    location: Optional[str] = None
    timezone: str = "UTC"

class SiteCreate(SiteBase):
    company_id: Optional[str] = None

class SiteUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    location: Optional[str] = None
    timezone: Optional[str] = None
    status: Optional[str] = None

class SiteResponse(SiteBase):
    id: str
    company_id: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Departments
class DepartmentBase(BaseModel):
    name: str
    code: Optional[str] = None
    site_id: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    company_id: Optional[str] = None

class DepartmentResponse(DepartmentBase):
    id: str
    company_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Projects
class ProjectBase(BaseModel):
    name: str
    code: str
    site_id: Optional[str] = None

class ProjectCreate(ProjectBase):
    company_id: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    status: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: str
    company_id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Stations
class StationBase(BaseModel):
    name: str
    code: str
    site_id: str
    project_id: Optional[str] = None

class StationCreate(StationBase):
    company_id: Optional[str] = None

class StationUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    site_id: Optional[str] = None
    project_id: Optional[str] = None
    status: Optional[str] = None
    is_latched: Optional[str] = None

class StationResponse(StationBase):
    id: str
    company_id: str
    status: str
    is_latched: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Assets
class AssetBase(BaseModel):
    name: str
    asset_type: str = "Motor" # Motor, Assembly Tool, Spindle
    serial_number: Optional[str] = None
    rated_rpm: int = 1800
    max_rpm: int = 3000
    metadata_json: Dict[str, Any] = {}

class AssetCreate(AssetBase):
    company_id: Optional[str] = None
    station_id: str

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    asset_type: Optional[str] = None
    serial_number: Optional[str] = None
    rated_rpm: Optional[int] = None
    max_rpm: Optional[int] = None
    current_state: Optional[str] = None
    active_latch: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None

class AssetResponse(AssetBase):
    id: str
    company_id: str
    station_id: str
    current_state: str
    active_latch: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
