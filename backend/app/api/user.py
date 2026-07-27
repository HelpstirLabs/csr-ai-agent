from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.schemas.user_schema import ProfileUpdateSchema
from app.core.database import get_db
from app.models.user import User
from app.middleware.auth import auth_middleware
from sqlalchemy.inspection import inspect

user_router = APIRouter(
    prefix="/user",
    tags=["User"]
)

 
@user_router.get("/profile/{user_id}")
async def get_profile(
    user_id: str,
    current_user: User = Depends(auth_middleware),
    db: AsyncSession = Depends(get_db)
):
    if current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden"
        )

    result = await db.execute(
        select(User).where(User.id == user_id)
    )

    user = result.scalar_one_or_none()
    print(user.__dict__)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Convert every database column to a dictionary
    user_data = {
        column.key: getattr(user, column.key)
        for column in inspect(User).columns
    }

    return {
        "success": True,
        "user": user_data
    }


    
@user_router.put("/profile/{user_id}")
async def update_profile(
    user_id: str,
    payload: ProfileUpdateSchema,
    current_user: User = Depends(auth_middleware),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Ensure the authenticated user can only update their own profile
        if current_user.id != user_id:
            raise HTTPException(
                status_code=403,
                detail="You are not authorized to update this profile."
            )

        result = await db.execute(
            select(User).where(User.id == user_id)
        )

        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        profile_score = 0

        # Name
        if payload.name is not None:
            if not user.name and payload.name:
                profile_score += 4
            user.name = payload.name

        # Designation
        if payload.designation is not None:
            if not user.designation and payload.designation:
                profile_score += 4
            user.designation = payload.designation

        # LinkedIn
        if payload.linkedin is not None:
            if not user.linkedin and payload.linkedin:
                profile_score += 4
            user.linkedin = payload.linkedin

        # Years in CSR
        if payload.years_in_csr is not None:
            if not user.years_in_csr:
                profile_score += 4
            user.years_in_csr = payload.years_in_csr

        # Company Name
        if payload.company_name is not None:
            if not user.company_name and payload.company_name:
                profile_score += 4
            user.company_name = payload.company_name

        # Industry
        if payload.industry is not None:
            if not user.industry and payload.industry:
                profile_score += 4
            user.industry = payload.industry

        # Company Size
        if payload.company_size is not None:
            if not user.company_size and payload.company_size:
                profile_score += 4
            user.company_size = payload.company_size

        # Headquarters
        if payload.headquarters is not None:
            if not user.headquarters and payload.headquarters:
                profile_score += 4
            user.headquarters = payload.headquarters

        # Update profile strength
        user.profile_strength = (user.profile_strength or 0) + profile_score

        await db.commit()
        await db.refresh(user)

        return {
            "success": True,
            "message": "Profile updated successfully",
            "user": {
                "user_id": user.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone_number,
                "designation": user.designation,
                "linkedin": user.linkedin,
                "years_in_csr": user.years_in_csr,
                "company_name": user.company_name,
                "industry": user.industry,
                "company_size": user.company_size,
                "headquarters": user.headquarters,
                "profile_strength": user.profile_strength
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to update profile: {str(e)}"
        )