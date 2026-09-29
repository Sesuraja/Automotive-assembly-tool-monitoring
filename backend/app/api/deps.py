from typing import Generator, Optional, List, Set, Callable
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import decode_token
from app.core.permissions import has_permission, Permission, PlatformRole
from app.core.tenant import set_current_company_id, set_current_user_id, set_is_super_admin
from app.database.session import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise credentials_exception

    # Establish thread/task context
    set_current_user_id(user.id)
    set_current_company_id(user.company_id)
    set_is_super_admin(user.is_super_admin)

    return user

def require_super_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin platform privilege required."
        )
    return current_user

def require_permission(required_perm: str) -> Callable:
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.is_super_admin:
            return current_user

        # Collect user permissions from user_roles -> role -> role_permissions
        user_perms: Set[str] = set()
        for ur in current_user.user_roles:
            if ur.role:
                for rp in ur.role.permissions:
                    if rp.permission:
                        user_perms.add(rp.permission.name)

        if not has_permission(user_perms, required_perm):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required: {required_perm}"
            )
        return current_user
    return dependency
