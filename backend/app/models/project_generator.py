from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from sqlalchemy.sql import func
from app.core.database import Base


class ProjectRequest(Base):
    __tablename__ = "project_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    vision = Column(Text, nullable=False)
    gender = Column(String(100), nullable=True)
    geography = Column(String(255), nullable=True)
    budget = Column(String(100), nullable=True)
    duration = Column(String(50), nullable=True)
    beneficiary = Column(String(255), nullable=True)
    area = Column(String(255), nullable=True)
    scale = Column(String(100), nullable=True)

    proposal = Column(Text, nullable=True)
    project_title = Column(Text, nullable=True)
    key_activities = Column(JSONB, nullable=True)
    partner_requirements = Column(JSONB, nullable=True)
    created_by = Column(String(13), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    ngos = relationship(
        "ProjectNGOMatch",
        back_populates="project",
        cascade="all, delete-orphan"
    )


class ProjectNGOMatch(Base):
    __tablename__ = "project_ngo_matches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("project_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    org_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    name = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    area = Column(String(255), nullable=True)

    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    whatsapp_number = Column(String(50), nullable=True)
    website = Column(String(500), nullable=True)
    logo = Column(String(500), nullable=True)

    score = Column(Integer, nullable=True)
    raw_data = Column(JSONB, nullable=True)

    rfp_sent = Column(Boolean, default=False, nullable=False)
    rfp_sent_at = Column(DateTime(timezone=True), nullable=True)

    interested = Column(Boolean, nullable=False, default=False)
    selected_program_ids = Column(JSONB, nullable=True)
    eoi_note = Column(Text, nullable=True)

    accepted = Column(Boolean, nullable=False, default=False)
    declined = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project = relationship(
        "ProjectRequest",
        back_populates="ngos"
    )