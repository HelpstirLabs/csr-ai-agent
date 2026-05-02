from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field

from src.models.enums import MEPlan


class FunderProfile(SQLModel, table=True):
    __tablename__ = "funder_profiles"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", unique=True, index=True)
    company_name: str = Field(index=True)
    designation: str = Field(default="")
    sector: str = Field(default="")
    total_csr_budget_inr: float = Field(default=0.0)
    deployed_budget_inr: float = Field(default=0.0)
    financial_year: str = Field(default="2026-27")
    me_plan: Optional[MEPlan] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
