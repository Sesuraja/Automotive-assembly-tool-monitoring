from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, generate_uuid

class MLModel(Base, TimestampMixin):
    __tablename__ = "ml_models"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False) # e.g. "motor_disturbance_classifier"
    algorithm = Column(String(100), default="RandomForestClassifier")
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)

    versions = relationship("ModelVersion", back_populates="model", cascade="all, delete-orphan")

class ModelVersion(Base, TimestampMixin):
    __tablename__ = "model_versions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    model_id = Column(String(36), ForeignKey("ml_models.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(String(50), nullable=False) # e.g. "motor_v1", "v1.2.0"
    dataset_name = Column(String(255), default="Automotive Tool Vibration D1")
    features_version = Column(String(50), default="v1.0")
    training_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    status = Column(String(50), default="DRAFT") # DRAFT, VALIDATION, TESTING, APPROVED, DEPLOYED, ARCHIVED
    is_deployed = Column(Boolean, default=False)

    # Metrics
    accuracy = Column(Float, default=0.0)
    precision = Column(Float, default=0.0)
    recall = Column(Float, default=0.0)
    f1_score = Column(Float, default=0.0)
    strong_detection_rate = Column(Float, default=0.0)
    false_intervention_rate = Column(Float, default=0.0)
    confusion_matrix = Column(JSON, default=dict)
    artifact_path = Column(String(500), nullable=True)

    model = relationship("MLModel", back_populates="versions")

class FeatureRecord(Base):
    __tablename__ = "feature_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    run_id = Column(String(36), ForeignKey("runs.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp_utc = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    rms = Column(Float, nullable=False)
    peak = Column(Float, nullable=False)
    crest_factor = Column(Float, nullable=False)
    kurtosis = Column(Float, nullable=False)
    band_energy_low = Column(Float, default=0.0)
    band_energy_mid = Column(Float, default=0.0)
    band_energy_high = Column(Float, default=0.0)
    measured_motor_speed = Column(Float, default=0.0)

class Inference(Base):
    __tablename__ = "inferences"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    run_id = Column(String(36), ForeignKey("runs.id", ondelete="CASCADE"), nullable=False, index=True)
    model_version_id = Column(String(36), ForeignKey("model_versions.id", ondelete="SET NULL"), nullable=True, index=True)
    model_version = Column(String(50), default="motor_v1")
    timestamp_utc = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    score_normal = Column(Float, default=0.0)
    score_mild = Column(Float, default=0.0)
    score_strong = Column(Float, default=0.0)
    predicted_class = Column(String(50), nullable=False) # NORMAL, MILD_DISTURBANCE, STRONG_DISTURBANCE
    confidence = Column(Float, nullable=False)
