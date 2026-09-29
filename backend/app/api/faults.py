from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.fault import Fault, FaultReset
from app.models.user import User
from app.schemas.fault import FaultResponse, FaultAcknowledgeRequest, FaultResetRequest, FaultResetResponse
from app.services.fault_service import fault_service
from app.core.tenant import verify_tenant_access
from app.services.audit_service import audit_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/faults", tags=["Faults & Safety"])

@router.get("", response_model=List[FaultResponse])
def list_faults(
    company_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_comp = company_id or current_user.company_id
    if not current_user.is_super_admin:
        verify_tenant_access(target_comp, current_user)
    query = db.query(Fault)
    if target_comp:
        query = query.filter(Fault.company_id == target_comp)
    return query.order_by(Fault.detected_at.desc()).limit(50).all()

@router.post("/{fault_id}/acknowledge", response_model=FaultResponse)
def acknowledge_fault(
    fault_id: str,
    req: FaultAcknowledgeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    fault = db.query(Fault).filter(Fault.id == fault_id).first()
    if not fault:
        raise HTTPException(status_code=404, detail="Fault not found")
    if not current_user.is_super_admin:
        verify_tenant_access(fault.company_id, current_user)

    updated = fault_service.acknowledge_fault(db, fault_id, current_user.email, req.notes)
    audit_service.log_event(
        db=db,
        action="ACKNOWLEDGE_FAULT",
        entity="Fault",
        company_id=fault.company_id,
        user_id=current_user.id,
        user_email=current_user.email,
        entity_id=fault.id,
        new_value={"notes": req.notes}
    )
    return updated

@router.post("/reset", response_model=FaultResetResponse)
async def reset_fault(
    req: FaultResetRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    fault = db.query(Fault).filter(Fault.id == req.fault_id).first()
    if not fault:
        raise HTTPException(status_code=404, detail="Fault not found")
    if not current_user.is_super_admin:
        verify_tenant_access(fault.company_id, current_user)

    success, msg, reset_record = await fault_service.execute_operator_reset(
        db=db,
        fault_id=req.fault_id,
        operator_user_id=current_user.id,
        operator_email=current_user.email,
        reset_reason=req.reset_reason
    )

    if not success:
        raise HTTPException(status_code=400, detail=msg)

    audit_service.log_event(
        db=db,
        action="OPERATOR_RESET_FAULT",
        entity="Fault",
        company_id=fault.company_id,
        user_id=current_user.id,
        user_email=current_user.email,
        entity_id=fault.id,
        new_value={"reason": req.reset_reason, "new_state": "READY"}
    )

    return FaultResetResponse(
        id=reset_record.id,
        fault_id=reset_record.fault_id,
        asset_id=reset_record.asset_id,
        operator_email=reset_record.operator_email,
        reset_reason=reset_record.reset_reason,
        timestamp_utc=reset_record.timestamp_utc,
        previous_state=reset_record.previous_state,
        new_state=reset_record.new_state,
        verified=reset_record.verified
    )
