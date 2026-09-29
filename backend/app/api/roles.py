from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.rbac import Role, PermissionModel, RolePermission
from app.models.user import User
from app.schemas.user import RoleResponse, RoleCreate
from app.api.deps import get_current_user

router = APIRouter(prefix="/roles", tags=["Roles & Permissions"])

@router.get("", response_model=List[RoleResponse])
def list_roles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roles = db.query(Role).all()
    res = []
    for r in roles:
        perms = [rp.permission.name for rp in r.permissions if rp.permission]
        res.append(
            RoleResponse(
                id=r.id,
                name=r.name,
                description=r.description,
                is_system=r.is_system,
                permissions=perms
            )
        )
    return res

@router.get("/permissions")
def list_permissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    perms = db.query(PermissionModel).all()
    return [{"id": p.id, "name": p.name, "category": p.category, "description": p.description} for p in perms]
