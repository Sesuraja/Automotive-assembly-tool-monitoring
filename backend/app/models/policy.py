from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, generate_uuid

class DecisionPolicy(Base, TimestampMixin):
    __tablename__ = "decision_policies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False) # e.g. "Automotive Assembly Tool Policy"
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)

    versions = relationship("PolicyVersion", back_populates="policy", cascade="all, delete-orphan")

class PolicyVersion(Base, TimestampMixin):
    __tablename__ = "policy_versions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    policy_id = Column(String(36), ForeignKey("decision_policies.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(String(50), nullable=False) # e.g. "pol_v1.0"
    status = Column(String(50), default="ACTIVE") # DRAFT, ACTIVE, ARCHIVED
    is_active = Column(Boolean, default=True)

    # Configurable deterministic thresholds
    strong_threshold = Column(Float, default=0.85)
    strong_persistence_windows = Column(Integer, default=2)
    mild_threshold = Column(Float, default=0.80)
    mild_persistence_windows = Column(Integer, default=3)
    normal_threshold = Column(Float, default=0.90)
    stale_data_timeout_sec = Column(Float, default=3.0)
    reduced_speed_ratio = Column(Float, default=0.50) # 50% nominal
    config_json = Column(JSON, default=dict)

    policy = relationship("DecisionPolicy", back_populates="versions")

class Decision(Base):
    __tablename__ = "decisions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    inference_id = Column(String(36), ForeignKey("inferences.id", ondelete="SET NULL"), nullable=True, index=True)
    policy_version_id = Column(String(36), ForeignKey("policy_versions.id", ondelete="SET NULL"), nullable=True)
    timestamp_utc = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    action = Column(String(50), nullable=False) # CONTINUE, REDUCE_SPEED, STOP, FAULT
    reason = Column(String(255), nullable=False) # e.g. STRONG_VIBRATION, MILD_VIBRATION, NORMAL, STALE_DATA
    persistence_count = Column(Integer, default=1)
    persistence_threshold = Column(Integer, default=2)
    latch_state = Column(String(50), default="NONE") # NONE, INSPECTION_REQUIRED, DATA_FAULT, HARDWARE_FAULT
