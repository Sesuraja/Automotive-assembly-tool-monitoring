from sqlalchemy import Column, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, generate_uuid

class OrganizationNode(Base, TimestampMixin):
    __tablename__ = "organization_nodes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(String(36), ForeignKey("organization_nodes.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(100), nullable=True)
    node_type = Column(String(50), nullable=False)  # business_unit, division, department, team, custom
    manager_id = Column(String(36), nullable=True)
    metadata_json = Column(JSON, default=dict)

    # Relationships
    company = relationship("Company", back_populates="organization_nodes")
    parent = relationship("OrganizationNode", remote_side=[id], backref="children")
