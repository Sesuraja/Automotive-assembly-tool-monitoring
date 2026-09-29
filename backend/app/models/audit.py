from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, JSON
from app.database.base import Base, TimestampMixin, generate_uuid

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), nullable=True, index=True) # None = platform-level event
    user_id = Column(String(36), nullable=True, index=True)
    user_email = Column(String(255), nullable=True)
    role = Column(String(100), nullable=True)
    action = Column(String(100), nullable=False, index=True) # e.g. "CREATE_COMPANY", "DEPLOY_MODEL", "RESET_FAULT"
    entity = Column(String(100), nullable=False, index=True) # e.g. "Company", "ModelVersion", "Fault"
    entity_id = Column(String(100), nullable=True)
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp_utc = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    result = Column(String(50), default="SUCCESS") # SUCCESS, FAILURE, REJECTED
    reason = Column(String(500), nullable=True)

class EventTrace(Base):
    __tablename__ = "event_traces"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    trace_id = Column(String(100), unique=True, index=True, nullable=False) # e.g. trace_42
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    sensor_event_id = Column(String(100), nullable=True)
    telemetry_id = Column(String(36), nullable=True)
    inference_id = Column(String(36), nullable=True)
    decision_id = Column(String(36), nullable=True)
    command_id = Column(String(36), nullable=True)
    feedback_id = Column(String(36), nullable=True)
    physical_result_rpm = Column(Integer, nullable=True)
    timestamp_utc = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    duration_ms = Column(Float, default=0.0)
    summary = Column(String(500), nullable=True)
    trace_payload = Column(JSON, default=dict)
