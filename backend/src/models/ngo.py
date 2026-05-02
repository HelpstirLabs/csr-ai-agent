from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field, Column, JSON


class NGOProfile(SQLModel, table=True):
    __tablename__ = "ngo_profiles"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", unique=True, index=True)
    name: str = Field(index=True)
    description: str = Field(default="")

    # Credentials
    registration_12a: bool = Field(default=False)
    registration_80g: bool = Field(default=False)
    fcra_status: bool = Field(default=False)
    csr1_registration: bool = Field(default=False)
    clean_audit_3yr: bool = Field(default=False)
    no_adverse_news: bool = Field(default=True)
    leadership_stability: bool = Field(default=False)
    mca21_match: bool = Field(default=False)

    # Operations
    thematic_areas: list[str] = Field(default=[], sa_column=Column(JSON))
    operating_states: list[str] = Field(default=[], sa_column=Column(JSON))
    operating_districts: list[str] = Field(default=[], sa_column=Column(JSON))
    beneficiary_types: list[str] = Field(default=[], sa_column=Column(JSON))

    # Scores (computed)
    trust_score: float = Field(default=0.0)
    impact_score: float = Field(default=0.0)

    # Metadata
    founded_year: Optional[int] = None
    annual_budget_inr: Optional[float] = None
    team_size: Optional[int] = None
    website: Optional[str] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class NGOProgramme(SQLModel, table=True):
    __tablename__ = "ngo_programmes"

    id: Optional[int] = Field(default=None, primary_key=True)
    ngo_id: int = Field(foreign_key="ngo_profiles.id", index=True)
    title: str
    description: str
    thematic_area: str
    location_state: str
    location_district: str
    beneficiary_count: int = Field(default=0)
    cost_per_beneficiary: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    outcomes: str = Field(default="")
    sdg_alignment: list[str] = Field(default=[], sa_column=Column(JSON))
    is_completed: bool = Field(default=False)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LocationNeed(SQLModel, table=True):
    __tablename__ = "location_needs"

    id: Optional[int] = Field(default=None, primary_key=True)
    ngo_id: int = Field(foreign_key="ngo_profiles.id", index=True)
    state: str
    district: str
    description: str
    demographic_gaps: list[str] = Field(default=[], sa_column=Column(JSON))
    community_problems: list[str] = Field(default=[], sa_column=Column(JSON))
    delivery_capacity: str = Field(default="")

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
