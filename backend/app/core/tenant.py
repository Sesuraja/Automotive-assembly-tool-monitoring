from contextvars import ContextVar
from typing import Optional, Any
from fastapi import HTTPException, status

# Thread/asyncio context-local tenant tracking
current_company_id: ContextVar[Optional[str]] = ContextVar("current_company_id", default=None)
current_user_id: ContextVar[Optional[str]] = ContextVar("current_user_id", default=None)
is_super_admin: ContextVar[bool] = ContextVar("is_super_admin", default=False)

def get_current_company_id() -> Optional[str]:
    return current_company_id.get()

def set_current_company_id(company_id: Optional[str]) -> None:
    current_company_id.set(company_id)

def get_current_user_id() -> Optional[str]:
    return current_user_id.get()

def set_current_user_id(user_id: Optional[str]) -> None:
    current_user_id.set(user_id)

def set_is_super_admin(val: bool) -> None:
    is_super_admin.set(val)

def verify_tenant_access(target_company_id: str, current_user: Optional[Any] = None) -> None:
    """
    Enforces strict multi-tenant boundary:
    If caller is not Super Admin and target_company_id does not match caller's company,
    raise 403 Forbidden.
    """
    if current_user and getattr(current_user, "is_super_admin", False):
        return
    if is_super_admin.get():
        return
    caller_cid = getattr(current_user, "company_id", None) if current_user else current_company_id.get()
    if not caller_cid or str(caller_cid) != str(target_company_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Cross-tenant operation unauthorized."
        )
