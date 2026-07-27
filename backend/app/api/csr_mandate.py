from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.csr_mandate import CSRMandate
from app.schemas.csr_mandate_schema import (
    CSRMandateCreate,
    CSRMandateResponse,
    CSRGoalsResponse,
    CSRGoalsUpdate,
    SuccessResponse
)
from app.models.user import User
from app.utils.profile_strength import calculate_csr_score, calculate_csrgoal_score

csr_router = APIRouter(
    prefix="/user",
    tags=["CSR Mandate"]
)


@csr_router.get(
    "/{user_id}/csr-mandate",
    response_model=CSRMandateResponse
)
async def get_csr_mandate(
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CSRMandate).where(
            CSRMandate.user_id == user_id
        )
    )

    csr_mandate = result.scalar_one_or_none()

    if not csr_mandate:
        raise HTTPException(
            status_code=404,
            detail="CSR mandate not found"
        )

    return csr_mandate


@csr_router.put(
    "/{user_id}/csr-mandate",
    response_model=CSRMandateResponse
)
async def save_csr_mandate(
    user_id: str,
    payload: CSRMandateCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        # Get user
        user_result = await db.execute(
            select(User).where(User.id == user_id)
        )

        user = user_result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        # Check existing CSR mandate
        result = await db.execute(
            select(CSRMandate).where(
                CSRMandate.user_id == user_id
            )
        )

        csr_mandate = result.scalar_one_or_none()

        # Calculate score before updating values
        csr_score = 0

        if csr_mandate:

            # Add score only if field was previously empty
            if not csr_mandate.annual_budget and payload.annual_budget:
                csr_score += 4

            if not csr_mandate.deployment_timeline and payload.deployment_timeline:
                csr_score += 4

            if not csr_mandate.csr_decision_making and payload.csr_decision_making:
                csr_score += 4

            if (
                not csr_mandate.focus_areas
                or len(csr_mandate.focus_areas) == 0
            ) and payload.focus_areas:
                csr_score += 4

            if (
                not csr_mandate.geographic_preferences
                or len(csr_mandate.geographic_preferences) == 0
            ) and payload.geographic_preferences:
                csr_score += 4

            # Update existing record
            csr_mandate.annual_budget = payload.annual_budget
            csr_mandate.deployment_timeline = payload.deployment_timeline
            csr_mandate.csr_decision_making = payload.csr_decision_making
            csr_mandate.focus_areas = payload.focus_areas
            csr_mandate.geographic_preferences = payload.geographic_preferences

        else:
            # Create new record
            csr_mandate = CSRMandate(
                user_id=user_id,
                annual_budget=payload.annual_budget,
                deployment_timeline=payload.deployment_timeline,
                csr_decision_making=payload.csr_decision_making,
                focus_areas=payload.focus_areas,
                geographic_preferences=payload.geographic_preferences,
            )

            db.add(csr_mandate)

            # New record → calculate full score
            csr_score = calculate_csr_score(payload)

        # Update profile strength
        user.profile_strength = (user.profile_strength or 0) + csr_score

        await db.commit()

        await db.refresh(csr_mandate)
        await db.refresh(user)

        return csr_mandate

    except Exception as e:
        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@csr_router.put(
    "/{user_id}/csr-goals",
    response_model=SuccessResponse
)
async def update_csr_goals(
    user_id: str,
    payload: CSRGoalsUpdate,
    db: AsyncSession = Depends(get_db)
):
    try:
        # Get user
        user_result = await db.execute(
            select(User).where(User.id == user_id)
        )

        user = user_result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        # Get existing CSR Mandate
        result = await db.execute(
            select(CSRMandate).where(
                CSRMandate.user_id == user_id
            )
        )

        csr_goals = result.scalar_one_or_none()

        # Calculate profile score before updating
        goals_score = 0

        if csr_goals:

            # Add score only if field was previously empty
            if (not csr_goals.goals or len(csr_goals.goals) == 0) and payload.goals:
                goals_score += 3

            if not csr_goals.past_csr_partner and payload.past_csr_partner:
                goals_score += 3

            if not csr_goals.deployment_urgency and payload.deployment_urgency:
                goals_score += 3

            if not csr_goals.decision_structure and payload.decision_structure:
                goals_score += 4

            if not csr_goals.approval_timeline and payload.approval_timeline:
                goals_score += 4

            if not csr_goals.annual_commitments and payload.annual_commitments:
                goals_score += 4

            # Update existing values
            csr_goals.goals = payload.goals
            csr_goals.past_csr_partner = payload.past_csr_partner
            csr_goals.deployment_urgency = payload.deployment_urgency
            csr_goals.decision_structure = payload.decision_structure
            csr_goals.approval_timeline = payload.approval_timeline
            csr_goals.annual_commitments = payload.annual_commitments

        else:
            # Create new record
            csr_goals = CSRMandate(
                user_id=user_id,
                goals=payload.goals,
                past_csr_partner=payload.past_csr_partner,
                deployment_urgency=payload.deployment_urgency,
                decision_structure=payload.decision_structure,
                approval_timeline=payload.approval_timeline,
                annual_commitments=payload.annual_commitments,
            )

            db.add(csr_goals)

            # New record → calculate full score
            goals_score = calculate_csrgoal_score(payload)

        # Update profile strength
        user.profile_strength = (user.profile_strength or 0) + goals_score

        await db.commit()

        await db.refresh(csr_goals)
        await db.refresh(user)

        return {
            "success": True,
            "message": "CSR goals updated successfully"
        }

    except Exception as e:
        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )  

@csr_router.get("/{user_id}/csr-goals")
async def get_csr_goals(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    try:

        user_result = await db.execute(
            select(User).where(User.id == user_id)
        )

        user = user_result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        result = await db.execute(
            select(CSRMandate).where(
                CSRMandate.user_id == user_id
            )
        )

        csr_goals = result.scalar_one_or_none()

        if not csr_goals:
            raise HTTPException(
                status_code=404,
                detail="CSR goals not found"
            )

        return {
            "success": True,
            "data": {
                "goals": csr_goals.goals,
                "past_csr_partner": csr_goals.past_csr_partner,
                "deployment_urgency": csr_goals.deployment_urgency,
                "decision_structure": csr_goals.decision_structure,
                "approval_timeline": csr_goals.approval_timeline,
                "annual_commitments": csr_goals.annual_commitments,
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )    