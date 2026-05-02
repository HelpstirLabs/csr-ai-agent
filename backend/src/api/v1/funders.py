from __future__ import annotations

from typing import Optional

from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.db.session import get_session
from src.models.user import User
from src.models.enums import UserRole, MEPlan
from src.models.funder import FunderProfile
from src.auth.jwt import require_role

router = APIRouter(prefix="/v1/funders", tags=["funders"])


class FunderProfileOut(BaseModel):
    id: int
    company_name: str
    designation: str
    sector: str
    total_csr_budget_inr: float
    deployed_budget_inr: float
    undeployed_budget_inr: float
    financial_year: str
    me_plan: Optional[str]

    class Config:
        from_attributes = True


class FunderProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    designation: Optional[str] = None
    sector: Optional[str] = None
    total_csr_budget_inr: Optional[float] = None
    deployed_budget_inr: Optional[float] = None
    financial_year: Optional[str] = None
    me_plan: Optional[MEPlan] = None


@router.get("/me", response_model=FunderProfileOut)
async def my_profile(
    user: User = Depends(require_role(UserRole.FUNDER)),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(FunderProfile).where(FunderProfile.user_id == user.id))
    funder = result.scalars().first()
    if not funder:
        raise HTTPException(status_code=404, detail="Funder profile not found")

    return FunderProfileOut(
        id=funder.id,
        company_name=funder.company_name,
        designation=funder.designation,
        sector=funder.sector,
        total_csr_budget_inr=funder.total_csr_budget_inr,
        deployed_budget_inr=funder.deployed_budget_inr,
        undeployed_budget_inr=funder.total_csr_budget_inr - funder.deployed_budget_inr,
        financial_year=funder.financial_year,
        me_plan=funder.me_plan.value if funder.me_plan else None,
    )


@router.patch("/me", response_model=FunderProfileOut)
async def update_profile(
    body: FunderProfileUpdate,
    user: User = Depends(require_role(UserRole.FUNDER)),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(FunderProfile).where(FunderProfile.user_id == user.id))
    funder = result.scalars().first()
    if not funder:
        raise HTTPException(status_code=404, detail="Funder profile not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(funder, field, value)

    session.add(funder)
    await session.commit()
    await session.refresh(funder)

    return FunderProfileOut(
        id=funder.id,
        company_name=funder.company_name,
        designation=funder.designation,
        sector=funder.sector,
        total_csr_budget_inr=funder.total_csr_budget_inr,
        deployed_budget_inr=funder.deployed_budget_inr,
        undeployed_budget_inr=funder.total_csr_budget_inr - funder.deployed_budget_inr,
        financial_year=funder.financial_year,
        me_plan=funder.me_plan.value if funder.me_plan else None,
    )
