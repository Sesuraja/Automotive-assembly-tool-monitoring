from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.services.report_service import report_service
from app.core.tenant import verify_tenant_access
from app.api.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["Reporting"])

@router.get("/operational")
def get_operational_report(
    company_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_comp = company_id or current_user.company_id
    if not current_user.is_super_admin:
        verify_tenant_access(target_comp, current_user)
    return report_service.get_operational_report(db, target_comp or "comp_default")

@router.get("/ai")
def get_ai_report(
    company_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    target_comp = company_id or current_user.company_id
    return report_service.get_ai_report(target_comp or "comp_default")

@router.get("/acceptance")
async def get_acceptance_report(
    company_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    target_comp = company_id or current_user.company_id
    return await report_service.get_acceptance_report(target_comp or "comp_default", current_user.email)

@router.get("/audit")
def get_audit_summary(
    company_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_comp = company_id or current_user.company_id
    if not current_user.is_super_admin:
        verify_tenant_access(target_comp, current_user)
    return report_service.get_audit_summary(db, target_comp)
