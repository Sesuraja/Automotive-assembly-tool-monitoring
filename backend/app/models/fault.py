from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean, JSON
from app.database.base import Base, TimestampMixin, generate_uuid

class Fault(Base, TimestampMixin):
    __tablename__ = "faults"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(100), nullable=False) # e.g. DATA_FAULT, SENSOR_DISCONNECTED, OVERSPEED, MANUAL_STOP, etc.
    severity = Column(String(50), default="CRITICAL") # WARNING, CRITICAL, EMERGENCY
    reason = Column(String(500), nullable=False)
    detected_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    is_latched = Column(Boolean, default=True) # Latched faults strictly require explicit reset
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String(255), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)

    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(String(255), nullable=True)
    resolution_notes = Column(String(500), nullable=True)
    context_data = Column(JSON, default=dict)

class FaultReset(Base):
    __tablename__ = "fault_resets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    fault_id = Column(String(36), ForeignKey("faults.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    operator_user_id = Column(String(36), nullable=False)
    operator_email = Column(String(255), nullable=False)
    reset_reason = Column(String(500), nullable=False)
    timestamp_utc = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    previous_state = Column(String(50), nullable=False)
    new_state = Column(String(50), default="READY")
    verified = Column(Boolean, default=True)
