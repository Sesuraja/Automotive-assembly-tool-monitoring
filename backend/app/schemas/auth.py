from typing import Optional, List
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    company_id: Optional[str] = None
    roles: List[str] = []
    permissions: List[str] = []

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    company_id: Optional[str] = None
    roles: List[str] = []
    permissions: List[str] = []

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    is_super_admin: bool
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    roles: List[str] = []
    permissions: List[str] = []
    site_id: Optional[str] = None
    department_id: Optional[str] = None
    project_id: Optional[str] = None
