from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean, JSON
from app.database.base import Base, TimestampMixin, generate_uuid

class SystemSettings(Base, TimestampMixin):
    __tablename__ = "system_settings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(JSON, nullable=False)
    description = Column(String(255), nullable=True)

class CompanySettings(Base, TimestampMixin):
    __tablename__ = "company_settings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    key = Column(String(100), nullable=False)
    value = Column(JSON, nullable=False)

class ApiKey(Base, TimestampMixin):
    __tablename__ = "api_keys"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    key_name = Column(String(100), nullable=False)
    key_prefix = Column(String(16), nullable=False) # e.g. "apt_live_4f2..."
    key_hash = Column(String(255), nullable=False)
    scopes = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    created_by = Column(String(36), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
