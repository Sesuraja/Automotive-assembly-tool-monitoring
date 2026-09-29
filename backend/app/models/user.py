from sqlalchemy import Boolean, Column, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, generate_uuid

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    employee_id = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, INACTIVE, SUSPENDED
    is_active = Column(Boolean, default=True)
    is_super_admin = Column(Boolean, default=False)

    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=True, index=True)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    team_id = Column(String(36), ForeignKey("organization_nodes.id", ondelete="SET NULL"), nullable=True)
    site_id = Column(String(36), ForeignKey("sites.id", ondelete="SET NULL"), nullable=True)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    company = relationship("Company", back_populates="users")
    user_roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    scopes = relationship("UserScope", back_populates="user", cascade="all, delete-orphan")
