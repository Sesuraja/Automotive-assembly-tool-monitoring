from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Index
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, generate_uuid

class Run(Base, TimestampMixin):
    __tablename__ = "runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    station_id = Column(String(36), ForeignKey("stations.id", ondelete="CASCADE"), nullable=False, index=True)
    run_number = Column(String(100), nullable=False) # e.g. run_017
    start_time = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), default="RUNNING") # RUNNING, COMPLETED, ABORTED_FAULT

    asset = relationship("Asset", back_populates="runs")
    telemetries = relationship("Telemetry", back_populates="run", cascade="all, delete-orphan")

class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    sensor_id = Column(String(100), nullable=False, index=True)
    run_id = Column(String(36), ForeignKey("runs.id", ondelete="CASCADE"), nullable=False, index=True)
    sequence = Column(Integer, nullable=False)
    timestamp_utc = Column(DateTime(timezone=True), nullable=False)
    received_at_utc = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    accel_x = Column(Float, nullable=False)
    accel_y = Column(Float, nullable=False)
    accel_z = Column(Float, nullable=False)
    motor_rpm = Column(Integer, nullable=False) # Actual measured tachometer RPM
    commanded_rpm = Column(Integer, nullable=False)
    health = Column(String(50), default="OK")
    data_age_ms = Column(Integer, default=0)

    run = relationship("Run", back_populates="telemetries")

    __table_args__ = (
        Index("idx_telemetry_asset_time", "asset_id", "timestamp_utc"),
        Index("idx_telemetry_run_seq", "run_id", "sequence"),
    )

class TelemetryWindow(Base, TimestampMixin):
    __tablename__ = "telemetry_windows"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(String(36), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    run_id = Column(String(36), ForeignKey("runs.id", ondelete="CASCADE"), nullable=False, index=True)
    window_start = Column(DateTime(timezone=True), nullable=False)
    window_end = Column(DateTime(timezone=True), nullable=False)
    sample_count = Column(Integer, nullable=False)
