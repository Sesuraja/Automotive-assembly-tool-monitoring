from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class CompanyBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    legal_name: Optional[str] = None
    code: str = Field(..., min_length=2, max_length=50)
    industry: str = "Automotive Manufacturing"
    country: str = "Canada"
    timezone: str = "UTC"
    contact_email: EmailStr
    phone: Optional[str] = None

class CompanyCreate(CompanyBase):
    # Optional nested initial admin creation (Wizard Step 2)
    admin_name: Optional[str] = None
    admin_email: Optional[EmailStr] = None
    admin_password: Optional[str] = None
    # Optional nested organization & site (Wizard Step 3)
    initial_site_name: Optional[str] = None
    initial_site_code: Optional[str] = None
    initial_division_name: Optional[str] = None

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    legal_name: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None
    settings: Optional[Dict[str, Any]] = None

class CompanyResponse(CompanyBase):
    id: str
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    settings: Dict[str, Any] = {}

    class Config:
        from_attributes = True

class CompanyStats(BaseModel):
    company_id: str
    company_name: str
    total_users: int
    active_sites: int
    total_stations: int
    connected_devices: int
    active_assets: int
    open_faults: int
    commands_count: int
