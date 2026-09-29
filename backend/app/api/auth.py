from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.database.session import get_db
from app.models.user import User
from app.models.company import Company
from app.schemas.auth import LoginRequest, RefreshRequest, Token, UserProfileResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )

    roles = [ur.role.name for ur in user.user_roles if ur.role] if not user.is_super_admin else ["SUPER_ADMIN"]
    perms = []
    if user.is_super_admin:
        perms = ["*"]
    else:
        for ur in user.user_roles:
            if ur.role:
                for rp in ur.role.permissions:
                    if rp.permission:
                        perms.append(rp.permission.name)

    access_token = create_access_token(
        subject=user.id,
        company_id=user.company_id,
        roles=roles,
        permissions=perms
    )
    refresh_token = create_refresh_token(subject=user.id)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        company_id=user.company_id,
        roles=roles,
        permissions=perms
    )

@router.post("/refresh", response_model=Token)
def refresh_token_endpoint(req: RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(req.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=400, detail="Invalid token type")
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    roles = [ur.role.name for ur in user.user_roles if ur.role] if not user.is_super_admin else ["SUPER_ADMIN"]
    perms = ["*"] if user.is_super_admin else [
        rp.permission.name for ur in user.user_roles if ur.role for rp in ur.role.permissions if rp.permission
    ]

    new_access = create_access_token(
        subject=user.id,
        company_id=user.company_id,
        roles=roles,
        permissions=perms
    )
    new_refresh = create_refresh_token(subject=user.id)

    return Token(
        access_token=new_access,
        refresh_token=new_refresh,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        company_id=user.company_id,
        roles=roles,
        permissions=perms
    )

@router.get("/me", response_model=UserProfileResponse)
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comp_name = None
    if current_user.company_id:
        comp = db.query(Company).filter(Company.id == current_user.company_id).first()
        if comp:
            comp_name = comp.name

    roles = [ur.role.name for ur in current_user.user_roles if ur.role] if not current_user.is_super_admin else ["SUPER_ADMIN"]
    perms = ["*"] if current_user.is_super_admin else [
        rp.permission.name for ur in current_user.user_roles if ur.role for rp in ur.role.permissions if rp.permission
    ]

    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_super_admin=current_user.is_super_admin,
        company_id=current_user.company_id,
        company_name=comp_name,
        roles=roles,
        permissions=perms,
        site_id=current_user.site_id,
        department_id=current_user.department_id,
        project_id=current_user.project_id
    )

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully"}
