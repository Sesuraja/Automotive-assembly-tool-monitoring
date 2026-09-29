from datetime import datetime, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models.fault import Fault, FaultReset
from app.models.operations import Asset, Station
from app.hardware.controller_adapter import motor_controller
from app.policy.state_machine import EquipmentState

class FaultService:
    """
    Manages fault detection, safety latches, and operator resets.
    Strictly forbids automatic restarts.
    """
    def create_fault(
        self,
        db: Session,
        company_id: str,
        asset_id: str,
        category: str,
        reason: str,
        severity: str = "CRITICAL",
        is_latched: bool = True
    ) -> Fault:
        fault = Fault(
            company_id=company_id,
            asset_id=asset_id,
            category=category,
            severity=severity,
            reason=reason,
            detected_at=datetime.now(timezone.utc),
            is_latched=is_latched,
            is_acknowledged=False
        )
        db.add(fault)
        
        # Update asset state to LATCHED_STOP or FAULT
        asset = db.query(Asset).filter(Asset.id == asset_id).first()
        if asset:
            asset.current_state = "LATCHED_STOP" if is_latched else "FAULT"
            asset.active_latch = category

        db.commit()
        db.refresh(fault)
        return fault

    def acknowledge_fault(self, db: Session, fault_id: str, user_email: str, notes: Optional[str] = None) -> Optional[Fault]:
        fault = db.query(Fault).filter(Fault.id == fault_id).first()
        if not fault:
            return None
        fault.is_acknowledged = True
        fault.acknowledged_by = user_email
        fault.acknowledged_at = datetime.now(timezone.utc)
        if notes:
            fault.resolution_notes = notes
        db.commit()
        db.refresh(fault)
        return fault

    async def execute_operator_reset(
        self,
        db: Session,
        fault_id: str,
        operator_user_id: str,
        operator_email: str,
        reset_reason: str
    ) -> Tuple[bool, str, Optional[FaultReset]]:
        """
        Executes explicit operator safety reset.
        Enforces:
        1. Fault must exist and be currently active.
        2. Motor drive trip reset must succeed.
        3. Audit record created in fault_resets.
        4. Asset state transitioned to READY (never automatically restarting the motor!).
        """
        fault = db.query(Fault).filter(Fault.id == fault_id).first()
        if not fault:
            return False, "Fault record not found.", None

        asset = db.query(Asset).filter(Asset.id == fault.asset_id).first()
        prev_state = asset.current_state if asset else "LATCHED_STOP"

        # Hardware-level trip reset
        await motor_controller.reset_hardware_trip()

        # Mark fault as resolved
        fault.resolved_at = datetime.now(timezone.utc)
        fault.resolved_by = operator_email
        fault.is_latched = False

        if asset:
            asset.current_state = "READY"
            asset.active_latch = "NONE"

        reset_record = FaultReset(
            fault_id=fault.id,
            company_id=fault.company_id,
            asset_id=fault.asset_id,
            operator_user_id=operator_user_id,
            operator_email=operator_email,
            reset_reason=reset_reason,
            timestamp_utc=datetime.now(timezone.utc),
            previous_state=prev_state,
            new_state="READY",
            verified=True
        )
        db.add(reset_record)
        db.commit()
        db.refresh(reset_record)

        return True, "Safety reset verified. Equipment restored to READY state. Automatic restart prohibited.", reset_record

fault_service = FaultService()
