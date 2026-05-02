from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field

from src.models.enums import MilestoneStatus


class Milestone(SQLModel, table=True):
    __tablename__ = "milestones"

    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="projects.id", index=True)
    title: str
    description: str = Field(default="")
    target_date: Optional[datetime] = None
    status: MilestoneStatus = Field(default=MilestoneStatus.PENDING)
    disbursement_inr: Optional[float] = None
    verified_at: Optional[datetime] = None
    evidence_notes: Optional[str] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
