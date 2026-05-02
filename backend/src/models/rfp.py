from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field

from src.models.enums import RFPStatus


class RFP(SQLModel, table=True):
    __tablename__ = "rfps"

    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="projects.id", index=True)
    ngo_id: int = Field(foreign_key="ngo_profiles.id", index=True)
    funder_id: int = Field(foreign_key="funder_profiles.id", index=True)
    status: RFPStatus = Field(default=RFPStatus.SENT)

    proposal_text: Optional[str] = None
    proposed_budget_inr: Optional[float] = None
    proposed_timeline_months: Optional[int] = None

    sent_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    responded_at: Optional[datetime] = None
    awarded_at: Optional[datetime] = None


class PlatformMessage(SQLModel, table=True):
    __tablename__ = "platform_messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    rfp_id: int = Field(foreign_key="rfps.id", index=True)
    sender_user_id: int = Field(foreign_key="users.id")
    content: str
    sent_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
