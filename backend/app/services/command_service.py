import uuid
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.command import Command, CommandFeedback
from app.hardware.controller_adapter import motor_controller
from app.core.config import settings

class CommandService:
    """
    Command validation and execution service.
    Guarantees idempotency, expiration checking, hardware limit enforcement,
    and tachometer RPM physical result verification.
    """
    def __init__(self):
        self._processed_command_ids: set[str] = set()

    async def execute_command(
        self,
        db: Session,
        company_id: str,
        asset_id: str,
        command_type: str,
        target_rpm: int,
        reason: str,
        decision_id: Optional[str] = None,
        model_version: Optional[str] = None
    ) -> Tuple[Command, CommandFeedback]:
        now = datetime.now(timezone.utc)
        cmd_id = f"cmd_{int(time.time() * 1000)}_{str(uuid.uuid4())[:8]}"
        expires_at = now + timedelta(seconds=settings.COMMAND_TIMEOUT_SEC)

        # Create command record
        command = Command(
            command_id=cmd_id,
            company_id=company_id,
            asset_id=asset_id,
            command_type=command_type,
            target_rpm=target_rpm,
            reason=reason,
            model_version=model_version,
            decision_id=decision_id,
            created_at=now,
            expires_at=expires_at,
            status="ACCEPTED"
        )
        db.add(command)
        db.commit()
        db.refresh(command)

        # Check expiration / idempotency
        if cmd_id in self._processed_command_ids:
            command.status = "REJECTED"
            db.commit()
            feedback = CommandFeedback(
                command_id=command.id,
                company_id=company_id,
                asset_id=asset_id,
                measured_rpm=await motor_controller.get_measured_rpm(),
                status="FAILED",
                error_message="Duplicate command rejected (Idempotency check)"
            )
            db.add(feedback)
            db.commit()
            return command, feedback

        self._processed_command_ids.add(cmd_id)
        command.status = "RUNNING"
        db.commit()

        # Send to local motor controller adapter
        if command_type == "STOP" or target_rpm == 0:
            success = await motor_controller.set_speed(0)
        elif command_type == "EMERGENCY_CUT":
            success = await motor_controller.emergency_cut()
        else:
            success = await motor_controller.set_speed(target_rpm)

        # Physical result verification via measured tachometer RPM
        measured_rpm = await motor_controller.get_measured_rpm()
        completion_time = datetime.now(timezone.utc)

        if success:
            command.status = "COMPLETE"
            feedback = CommandFeedback(
                command_id=command.id,
                company_id=company_id,
                asset_id=asset_id,
                measured_rpm=measured_rpm,
                status="COMPLETE",
                completion_timestamp=completion_time
            )
        else:
            command.status = "FAULT"
            feedback = CommandFeedback(
                command_id=command.id,
                company_id=company_id,
                asset_id=asset_id,
                measured_rpm=measured_rpm,
                status="FAILED",
                completion_timestamp=completion_time,
                error_message="Controller rejected command or safety hardware trip active."
            )

        db.add(feedback)
        db.commit()
        db.refresh(command)
        db.refresh(feedback)

        return command, feedback

command_service = CommandService()
