from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    employee_id: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[str] = None
    team_id: Optional[str] = None
    site_id: Optional[str] = None
    project_id: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    company_id: Optional[str] = None # Inferred from tenant context if company admin
    roles: List[str] = ["OPERATOR"]
    scope_type: Optional[str] = "COMPANY"
    scope_id: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[str] = None
    team_id: Optional[str] = None
    site_id: Optional[str] = None
    project_id: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None
    roles: Optional[List[str]] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: str
    company_id: Optional[str] = None
    status: str
    is_active: bool
    is_super_admin: bool
    roles: List[str] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RoleResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    is_system: bool
    permissions: List[str] = []

    class Config:
        from_attributes = True

class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: List[str] = []
