from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field, Column, JSON

from src.models.enums import ProjectStatus, ScheduleVIIHead


class Project(SQLModel, table=True):
    __tablename__ = "projects"

    id: Optional[int] = Field(default=None, primary_key=True)
    funder_id: int = Field(foreign_key="funder_profiles.id", index=True)
    status: ProjectStatus = Field(default=ProjectStatus.GENERATED)

    # AI-generated content
    title: str
    problem_statement: str = Field(default="")
    intervention_logic: str = Field(default="")
    projected_outcomes: str = Field(default="")
    me_framework: str = Field(default="")
    schedule_vii_head: Optional[ScheduleVIIHead] = None

    # Funder brief (input)
    brief_text: str = Field(default="")
    brief_theme: Optional[str] = None
    brief_geography: Optional[str] = None
    brief_budget_inr: Optional[float] = None
    brief_demographic: Optional[str] = None
    brief_gender_focus: Optional[str] = None
    brief_beneficiary_type: Optional[str] = None
    brief_technology_approach: Optional[str] = None
    brief_scale: Optional[str] = None

    # Awarded
    awarded_ngo_id: Optional[int] = Field(default=None, foreign_key="ngo_profiles.id")
    awarded_budget_inr: Optional[float] = None
    platform_fee_percent: Optional[float] = None
    platform_fee_inr: Optional[float] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class NGORecommendation(SQLModel, table=True):
    __tablename__ = "ngo_recommendations"

    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="projects.id", index=True)
    ngo_id: int = Field(foreign_key="ngo_profiles.id", index=True)
    rank: int
    match_score: float = Field(default=0.0)
    rationale: str = Field(default="")

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
