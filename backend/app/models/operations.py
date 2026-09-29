from sqlalchemy import Column, String, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, generate_uuid

class Site(Base, TimestampMixin):
    __tablename__ = "sites"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    location = Column(String(255), nullable=True)
    timezone = Column(String(50), default="UTC")
    status = Column(String(50), default="ACTIVE")

    company = relationship("Company", back_populates="sites")
    stations = relationship("Station", back_populates="site", cascade="all, delete-orphan")
    departments = relationship("Department", back_populates="site", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="site", cascade="all, delete-orphan")

class Department(Base, TimestampMixin):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    site_id = Column(String(36), ForeignKey("sites.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=True)

    site = relationship("Site", back_populates="departments")

class Project(Base, TimestampMixin):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    site_id = Column(String(36), ForeignKey("sites.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    status = Column(String(50), default="ACTIVE")

    company = relationship("Company", back_populates="projects")
    site = relationship("Site", back_populates="projects")
    stations = relationship("Station", back_populates="project", cascade="all, delete-orphan")

class Station(Base, TimestampMixin):
    __tablename__ = "stations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    site_id = Column(String(36), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)
    status = Column(String(50), default="READY")  # IDLE, READY, RUNNING, STOPPED, FAULT, LATCHED_STOP
    is_latched = Column(String(50), default="NONE")  # NONE, INSPECTION_REQUIRED, DATA_FAULT, TRIP

    company = relationship("Company", back_populates="stations")
    site = relationship("Site", back_populates="stations")
    project = relationship("Project", back_populates="stations")
    assets = relationship("Asset", back_populates="station", cascade="all, delete-orphan")

class Asset(Base, TimestampMixin):
    __tablename__ = "assets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    station_id = Column(String(36), ForeignKey("stations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    asset_type = Column(String(100), default="Motor")  # Motor, Assembly Tool, Spindle, Press
    serial_number = Column(String(100), nullable=True)
    rated_rpm = Column(Integer, default=1800)
    max_rpm = Column(Integer, default=3000)
    current_state = Column(String(50), default="IDLE") # IDLE, READY, RUNNING, RUNNING_REDUCED, LATCHED_STOP, FAULT
    active_latch = Column(String(50), default="NONE")
    metadata_json = Column(JSON, default=dict)

    company = relationship("Company", back_populates="assets")
    station = relationship("Station", back_populates="assets")
    controllers = relationship("Controller", back_populates="asset")
    runs = relationship("Run", back_populates="asset", cascade="all, delete-orphan")
