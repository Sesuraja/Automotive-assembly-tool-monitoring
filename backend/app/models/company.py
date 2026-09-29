from sqlalchemy import Boolean, Column, String, Text, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, generate_uuid

class Company(Base, TimestampMixin):
    __tablename__ = "companies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    legal_name = Column(String(255), nullable=True)
    industry = Column(String(100), default="Automotive Manufacturing")
    country = Column(String(100), default="Canada")
    timezone = Column(String(50), default="UTC")
    contact_email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, SUSPENDED, ARCHIVED
    settings = Column(JSON, default=dict)

    # Relationships
    users = relationship("User", back_populates="company", cascade="all, delete-orphan")
    organization_nodes = relationship("OrganizationNode", back_populates="company", cascade="all, delete-orphan")
    sites = relationship("Site", back_populates="company", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="company", cascade="all, delete-orphan")
    stations = relationship("Station", back_populates="company", cascade="all, delete-orphan")
    assets = relationship("Asset", back_populates="company", cascade="all, delete-orphan")
    devices = relationship("Device", back_populates="company", cascade="all, delete-orphan")
    controllers = relationship("Controller", back_populates="company", cascade="all, delete-orphan")
