from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.rbac import Role, UserRole, UserScope
from app.schemas.user import UserCreate, UserUpdate, UserResponse, RoleResponse
from app.core.security import get_password_hash
from app.core.tenant import verify_tenant_access
from app.services.audit_service import audit_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserResponse])
def list_users(
    company_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if not current_user.is_super_admin:
        query = query.filter(User.company_id == current_user.company_id)
    elif company_id:
        query = query.filter(User.company_id == company_id)

    users = query.all()
    res = []
    for u in users:
        roles = [ur.role.name for ur in u.user_roles if ur.role] if not u.is_super_admin else ["SUPER_ADMIN"]
        res.append(
            UserResponse(
                id=u.id,
                email=u.email,
                full_name=u.full_name,
                employee_id=u.employee_id,
                phone=u.phone,
                department_id=u.department_id,
                team_id=u.team_id,
                site_id=u.site_id,
                project_id=u.project_id,
                company_id=u.company_id,
                status=u.status,
                is_active=u.is_active,
                is_super_admin=u.is_super_admin,
                roles=roles,
                created_at=u.created_at,
                updated_at=u.updated_at
            )
        )
    return res

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    req: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_comp = req.company_id or current_user.company_id
    if not current_user.is_super_admin:
        if not target_comp or str(target_comp) != str(current_user.company_id):
            raise HTTPException(status_code=403, detail="Cannot create user in another company.")

    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    new_user = User(
        email=req.email,
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name,
        employee_id=req.employee_id,
        phone=req.phone,
        company_id=target_comp,
        department_id=req.department_id,
        team_id=req.team_id,
        site_id=req.site_id,
        project_id=req.project_id,
        is_active=True,
        status="ACTIVE"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Assign roles
    assigned_roles = []
    for r_name in req.roles:
        role_obj = db.query(Role).filter(Role.name == r_name).first()
        if role_obj:
            ur = UserRole(user_id=new_user.id, role_id=role_obj.id)
            db.add(ur)
            assigned_roles.append(r_name)

    if req.scope_type and req.scope_id:
        us = UserScope(user_id=new_user.id, scope_type=req.scope_type, scope_id=req.scope_id)
        db.add(us)

    db.commit()

    audit_service.log_event(
        db=db,
        action="CREATE_USER",
        entity="User",
        company_id=target_comp,
        user_id=current_user.id,
        user_email=current_user.email,
        entity_id=new_user.id,
        new_value={"email": new_user.email, "roles": assigned_roles}
    )

    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        employee_id=new_user.employee_id,
        phone=new_user.phone,
        department_id=new_user.department_id,
        team_id=new_user.team_id,
        site_id=new_user.site_id,
        project_id=new_user.project_id,
        company_id=new_user.company_id,
        status=new_user.status,
        is_active=new_user.is_active,
        is_super_admin=new_user.is_super_admin,
        roles=assigned_roles,
        created_at=new_user.created_at,
        updated_at=new_user.updated_at
    )
