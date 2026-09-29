from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, generate_uuid

class Command(Base, TimestampMixin):
    __tablename__ = "commands"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    command_id = Column(String(100), unique=True, index=True, nullable=False) # e.g. cmd_001
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    command_type = Column(String(50), nullable=False) # SET_SPEED, STOP, RESET, EMERGENCY_CUT
    target_rpm = Column(Integer, nullable=False)
    reason = Column(String(255), nullable=False)
    model_version = Column(String(50), nullable=True)
    decision_id = Column(String(36), nullable=True, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(50), default="ACCEPTED") # ACCEPTED, RUNNING, COMPLETE, REJECTED, TIMEOUT, FAULT

    feedbacks = relationship("CommandFeedback", back_populates="command", cascade="all, delete-orphan")

class CommandFeedback(Base):
    __tablename__ = "command_feedback"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    command_id = Column(String(36), ForeignKey("commands.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    measured_rpm = Column(Integer, nullable=False) # Verification via actual tachometer RPM
    status = Column(String(50), nullable=False) # COMPLETE, FAILED, TIMEOUT
    completion_timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    error_message = Column(String(500), nullable=True)

    command = relationship("Command", back_populates="feedbacks")
