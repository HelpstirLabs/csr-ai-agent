from __future__ import annotations

from typing import Optional

from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.db.session import get_session
from src.models.user import User
from src.models.enums import UserRole, ProjectStatus
from src.models.project import Project, NGORecommendation
from src.models.funder import FunderProfile
from src.auth.jwt import require_role
from src.services.project_designer import generate_project
from src.services.fee_engine import compute_platform_fee

router = APIRouter(prefix="/v1/projects", tags=["projects"])


class ProjectBrief(BaseModel):
    brief_text: str
    theme: Optional[str] = None
    geography: Optional[str] = None
    budget_inr: Optional[float] = None
    demographic: Optional[str] = None
    gender_focus: Optional[str] = None
    beneficiary_type: Optional[str] = None
    technology_approach: Optional[str] = None
    scale: Optional[str] = None
    model: Optional[str] = None


class ProjectOut(BaseModel):
    id: int
    title: str
    status: str
    problem_statement: str
    intervention_logic: str
    projected_outcomes: str
    me_framework: str
    schedule_vii_head: Optional[str]
    brief_text: str
    platform_fee_percent: Optional[float]
    platform_fee_inr: Optional[float]

    class Config:
        from_attributes = True


class RecommendationOut(BaseModel):
    ngo_id: int
    rank: int
    match_score: float
    rationale: str


class ProjectDetailOut(ProjectOut):
    recommendations: list[RecommendationOut] = []


@router.post("/generate", response_model=ProjectDetailOut)
async def generate(
    body: ProjectBrief,
    request: Request,
    user: User = Depends(require_role(UserRole.FUNDER, UserRole.ADMIN)),
    session: AsyncSession = Depends(get_session),
):
    funder_result = await session.execute(select(FunderProfile).where(FunderProfile.user_id == user.id))
    funder = funder_result.scalars().first()
    if not funder:
        raise HTTPException(status_code=404, detail="Funder profile not found. Create a profile first.")

    ai_engine = request.app.state.ai_engine
    project = await generate_project(
        ai=ai_engine,
        session=session,
        funder_id=funder.id,
        brief_text=body.brief_text,
        theme=body.theme,
        geography=body.geography,
        budget_inr=body.budget_inr,
        demographic=body.demographic,
        gender_focus=body.gender_focus,
        beneficiary_type=body.beneficiary_type,
        technology_approach=body.technology_approach,
        scale=body.scale,
        model=body.model,
    )

    rec_result = await session.execute(
        select(NGORecommendation).where(NGORecommendation.project_id == project.id).order_by(NGORecommendation.rank)
    )
    recs = [RecommendationOut(ngo_id=r.ngo_id, rank=r.rank, match_score=r.match_score, rationale=r.rationale)
            for r in rec_result.scalars().all()]

    return ProjectDetailOut(
        id=project.id, title=project.title, status=project.status.value,
        problem_statement=project.problem_statement, intervention_logic=project.intervention_logic,
        projected_outcomes=project.projected_outcomes, me_framework=project.me_framework,
        schedule_vii_head=project.schedule_vii_head.value if project.schedule_vii_head else None,
        brief_text=project.brief_text,
        platform_fee_percent=project.platform_fee_percent, platform_fee_inr=project.platform_fee_inr,
        recommendations=recs,
    )


@router.get("/", response_model=list[ProjectOut])
async def list_projects(
    user: User = Depends(require_role(UserRole.FUNDER, UserRole.ADMIN)),
    session: AsyncSession = Depends(get_session),
):
    funder_result = await session.execute(select(FunderProfile).where(FunderProfile.user_id == user.id))
    funder = funder_result.scalars().first()
    if not funder:
        return []

    result = await session.execute(
        select(Project).where(Project.funder_id == funder.id).order_by(Project.created_at.desc())
    )
    projects = result.scalars().all()
    return [
        ProjectOut(
            id=p.id, title=p.title, status=p.status.value,
            problem_statement=p.problem_statement, intervention_logic=p.intervention_logic,
            projected_outcomes=p.projected_outcomes, me_framework=p.me_framework,
            schedule_vii_head=p.schedule_vii_head.value if p.schedule_vii_head else None,
            brief_text=p.brief_text,
            platform_fee_percent=p.platform_fee_percent, platform_fee_inr=p.platform_fee_inr,
        )
        for p in projects
    ]


@router.get("/{project_id}", response_model=ProjectDetailOut)
async def get_project(
    project_id: int,
    user: User = Depends(require_role(UserRole.FUNDER, UserRole.ADMIN)),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Project).where(Project.id == project_id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    rec_result = await session.execute(
        select(NGORecommendation).where(NGORecommendation.project_id == project.id).order_by(NGORecommendation.rank)
    )
    recs = [RecommendationOut(ngo_id=r.ngo_id, rank=r.rank, match_score=r.match_score, rationale=r.rationale)
            for r in rec_result.scalars().all()]

    return ProjectDetailOut(
        id=project.id, title=project.title, status=project.status.value,
        problem_statement=project.problem_statement, intervention_logic=project.intervention_logic,
        projected_outcomes=project.projected_outcomes, me_framework=project.me_framework,
        schedule_vii_head=project.schedule_vii_head.value if project.schedule_vii_head else None,
        brief_text=project.brief_text,
        platform_fee_percent=project.platform_fee_percent, platform_fee_inr=project.platform_fee_inr,
        recommendations=recs,
    )


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: int,
    user: User = Depends(require_role(UserRole.FUNDER, UserRole.ADMIN)),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Project).where(Project.id == project_id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Delete related recommendations first
    recs = await session.execute(select(NGORecommendation).where(NGORecommendation.project_id == project_id))
    for rec in recs.scalars().all():
        await session.delete(rec)

    await session.delete(project)
    await session.commit()


@router.post("/{project_id}/award/{ngo_id}")
async def award_project(
    project_id: int,
    ngo_id: int,
    user: User = Depends(require_role(UserRole.FUNDER, UserRole.ADMIN)),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(Project).where(Project.id == project_id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not project.brief_budget_inr:
        raise HTTPException(status_code=400, detail="Project budget must be set before awarding")

    fee = compute_platform_fee(project.brief_budget_inr)
    project.status = ProjectStatus.AWARDED
    project.awarded_ngo_id = ngo_id
    project.awarded_budget_inr = project.brief_budget_inr
    project.platform_fee_percent = fee.fee_percent
    project.platform_fee_inr = fee.fee_inr

    session.add(project)
    await session.commit()
    await session.refresh(project)

    return {
        "message": "Project awarded",
        "project_id": project.id,
        "awarded_ngo_id": ngo_id,
        "fee": {"percent": fee.fee_percent, "amount_inr": fee.fee_inr, "tier": fee.tier_label},
    }
