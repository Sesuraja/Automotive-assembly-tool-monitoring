from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.audit import AuditLog

class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        action: str,
        entity: str,
        company_id: Optional[str] = None,
        user_id: Optional[str] = None,
        user_email: Optional[str] = None,
        role: Optional[str] = None,
        entity_id: Optional[str] = None,
        old_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        result: str = "SUCCESS",
        reason: Optional[str] = None
    ) -> AuditLog:
        audit = AuditLog(
            company_id=company_id,
            user_id=user_id,
            user_email=user_email,
            role=role,
            action=action,
            entity=entity,
            entity_id=entity_id,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address,
            timestamp_utc=datetime.now(timezone.utc),
            result=result,
            reason=reason
        )
        db.add(audit)
        db.commit()
        db.refresh(audit)
        return audit

audit_service = AuditService()
