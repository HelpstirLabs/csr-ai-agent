from __future__ import annotations

from typing import Optional

from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.db.session import get_session
from src.models.user import User
from src.models.enums import UserRole, RFPStatus
from src.models.ngo import NGOProfile, NGOProgramme, LocationNeed
from src.models.rfp import RFP
from src.auth.jwt import get_current_user, require_role
from src.services.trust_score import compute_trust_score, trust_score_breakdown

router = APIRouter(prefix="/v1/ngos", tags=["ngos"])


class NGOProfileOut(BaseModel):
    id: int
    name: str
    description: str
    thematic_areas: list[str]
    operating_states: list[str]
    trust_score: float
    impact_score: float

    class Config:
        from_attributes = True


class NGODetailOut(NGOProfileOut):
    operating_districts: list[str]
    beneficiary_types: list[str]
    founded_year: Optional[int]
    annual_budget_inr: Optional[float]
    team_size: Optional[int]
    trust_breakdown: list[dict] = []


class LocationNeedIn(BaseModel):
    state: str
    district: str
    description: str
    demographic_gaps: list[str] = []
    community_problems: list[str] = []
    delivery_capacity: str = ""


class LocationNeedOut(BaseModel):
    id: int
    state: str
    district: str
    description: str
    demographic_gaps: list[str]
    community_problems: list[str]

    class Config:
        from_attributes = True


@router.get("/", response_model=list[NGOProfileOut])
async def list_ngos(
    theme: Optional[str] = None,
    state: Optional[str] = None,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    query = select(NGOProfile).order_by(NGOProfile.trust_score.desc())
    if theme:
        query = query.where(NGOProfile.thematic_areas.contains(theme))
    result = await session.execute(query)
    return list(result.scalars().all())


@router.get("/me", response_model=NGODetailOut)
async def my_profile(
    user: User = Depends(require_role(UserRole.NGO)),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(NGOProfile).where(NGOProfile.user_id == user.id))
    ngo = result.scalars().first()
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO profile not found")

    breakdown = trust_score_breakdown(ngo)
    return NGODetailOut(
        id=ngo.id, name=ngo.name, description=ngo.description,
        thematic_areas=ngo.thematic_areas, operating_states=ngo.operating_states,
        operating_districts=ngo.operating_districts, beneficiary_types=ngo.beneficiary_types,
        trust_score=ngo.trust_score, impact_score=ngo.impact_score,
        founded_year=ngo.founded_year, annual_budget_inr=ngo.annual_budget_inr,
        team_size=ngo.team_size, trust_breakdown=breakdown,
    )


@router.post("/location-needs", response_model=LocationNeedOut, status_code=201)
async def post_location_need(
    body: LocationNeedIn,
    user: User = Depends(require_role(UserRole.NGO)),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(NGOProfile).where(NGOProfile.user_id == user.id))
    ngo = result.scalars().first()
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO profile not found")

    need = LocationNeed(
        ngo_id=ngo.id,
        state=body.state,
        district=body.district,
        description=body.description,
        demographic_gaps=body.demographic_gaps,
        community_problems=body.community_problems,
        delivery_capacity=body.delivery_capacity,
    )
    session.add(need)
    await session.commit()
    await session.refresh(need)
    return need


@router.get("/rfps", response_model=list[dict])
async def my_rfps(
    user: User = Depends(require_role(UserRole.NGO)),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(NGOProfile).where(NGOProfile.user_id == user.id))
    ngo = result.scalars().first()
    if not ngo:
        return []

    rfp_result = await session.execute(
        select(RFP).where(RFP.ngo_id == ngo.id).order_by(RFP.sent_at.desc())
    )
    rfps = rfp_result.scalars().all()
    return [
        {"id": r.id, "project_id": r.project_id, "status": r.status.value, "sent_at": r.sent_at.isoformat()}
        for r in rfps
    ]
