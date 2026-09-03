from fastapi import Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import secrets

from app.core.database import get_db
from app.models.user import User
from app.utils.jwt import verify_jwt


async def auth_middleware(
    request: Request,
    db: AsyncSession = Depends(get_db)
):

    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized, token not found"
        )

    # 2️ Verify JWT and get user_id
    try:
        user_id = verify_jwt(token)
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    # 3️ Check user exists in DB
    result = await db.execute(
        select(User).where(User.id == user_id)
    )

    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    # 4️ Compare DB token with cookie token
    db_token = (user.access_token or "").strip()

    if not secrets.compare_digest(
        db_token,
        token.strip()
    ):
        raise HTTPException(
            status_code=401,
            detail="Token mismatch"
        )

    # 5️ Return user for protected routes
    return user