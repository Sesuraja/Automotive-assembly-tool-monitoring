from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.audit import EventTrace, AuditLog
from app.models.user import User
from app.schemas.audit import EventTraceResponse, AuditLogResponse
from app.core.tenant import verify_tenant_access
from app.api.deps import get_current_user

router = APIRouter(tags=["Traceability & Audit"])

@router.get("/events", response_model=List[EventTraceResponse])
def list_events(
    company_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_comp = company_id or current_user.company_id
    if not current_user.is_super_admin:
        verify_tenant_access(target_comp, current_user)
    query = db.query(EventTrace)
    if target_comp:
        query = query.filter(EventTrace.company_id == target_comp)
    return query.order_by(EventTrace.timestamp_utc.desc()).limit(100).all()

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def list_audit_logs(
    company_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_comp = company_id or current_user.company_id
    if not current_user.is_super_admin:
        verify_tenant_access(target_comp, current_user)
    query = db.query(AuditLog)
    if target_comp:
        query = query.filter(AuditLog.company_id == target_comp)
    return query.order_by(AuditLog.timestamp_utc.desc()).limit(100).all()
