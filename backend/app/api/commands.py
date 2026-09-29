from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.command import Command, CommandFeedback
from app.models.operations import Asset
from app.models.user import User
from app.schemas.command import SetSpeedCommandRequest, StopCommandRequest, CommandResponse, CommandFeedbackResponse
from app.services.command_service import command_service
from app.core.tenant import verify_tenant_access
from app.services.audit_service import audit_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/commands", tags=["Control & Commands"])

@router.get("", response_model=List[CommandResponse])
def list_commands(
    company_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_comp = company_id or current_user.company_id
    if not current_user.is_super_admin:
        verify_tenant_access(target_comp, current_user)
    query = db.query(Command)
    if target_comp:
        query = query.filter(Command.company_id == target_comp)
    return query.order_by(Command.created_at.desc()).limit(50).all()

@router.post("/set-speed", response_model=CommandResponse)
async def command_set_speed(
    req: SetSpeedCommandRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    asset = db.query(Asset).filter(Asset.id == req.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if not current_user.is_super_admin:
        verify_tenant_access(asset.company_id, current_user)

    # Prohibit commanding speed if equipment is latched stop or fault
    if asset.current_state in ["LATCHED_STOP", "FAULT"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot execute speed command: Station is in {asset.current_state} ({asset.active_latch}). Explicit operator reset required."
        )

    cmd, fb = await command_service.execute_command(
        db=db,
        company_id=asset.company_id,
        asset_id=asset.id,
        command_type="SET_SPEED",
        target_rpm=req.target_rpm,
        reason=req.reason
    )

    audit_service.log_event(
        db=db,
        action="COMMAND_SET_SPEED",
        entity="Command",
        company_id=asset.company_id,
        user_id=current_user.id,
        user_email=current_user.email,
        entity_id=cmd.id,
        new_value={"target_rpm": req.target_rpm, "status": cmd.status}
    )
    return cmd

@router.post("/stop", response_model=CommandResponse)
async def command_stop(
    req: StopCommandRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    asset = db.query(Asset).filter(Asset.id == req.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if not current_user.is_super_admin:
        verify_tenant_access(asset.company_id, current_user)

    cmd, fb = await command_service.execute_command(
        db=db,
        company_id=asset.company_id,
        asset_id=asset.id,
        command_type="STOP",
        target_rpm=0,
        reason=req.reason
    )

    audit_service.log_event(
        db=db,
        action="COMMAND_STOP",
        entity="Command",
        company_id=asset.company_id,
        user_id=current_user.id,
        user_email=current_user.email,
        entity_id=cmd.id,
        new_value={"reason": req.reason}
    )
    return cmd
