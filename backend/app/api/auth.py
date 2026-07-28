from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from jose import JWTError
import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth_schema import RegisterSchema, VerifyOtpSchema, ResendOtpSchema, LoginSchema
from app.services.twilio_service import (
    send_phone_otp,
    verify_phone_otp,
    send_verification_success_sms,
)
from app.core.config import settings
from app.middleware.auth import auth_middleware
from datetime import datetime, timedelta
import secrets

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    data: RegisterSchema,
    db: AsyncSession = Depends(get_db)
):
    try:
        # Check existing email
        result = await db.execute(
            select(User).where(User.email == data.email)
        )

        existing_user = result.scalar_one_or_none()

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already exists"
            )

        phone = data.phone.strip()

        if not phone.startswith("+"):
            phone = f"+91{phone}"

        # Generate secure 6-digit OTP
        otp = str(secrets.randbelow(900000) + 100000)

        user = User(
            name=data.name,
            email=data.email,
            phone_number=phone,
            company_name=data.company_name,

            otp=otp,
            otp_sent=True,
            otp_verified=False,
            otp_attempts=0,
            otp_expires_at=datetime.utcnow() + timedelta(minutes=5)
        )

        db.add(user)

        await db.commit()
        await db.refresh(user)

        # Send SMS
        await send_phone_otp(
            phone=phone,
            otp=otp
        )

        return {
            "success": True,
            "message": "OTP sent successfully",
            "user_id": user.id,
            "phone": phone
        }

    except HTTPException:
        raise

    except Exception as e:
        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
        

@router.post("/verify-otp")
async def verify_otp(
    payload: VerifyOtpSchema,
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(User).where(User.id == payload.user_id)
        )

        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        # Check if OTP exists
        if not user.otp:
            raise HTTPException(
                status_code=400,
                detail="No OTP found. Please request a new OTP."
            )

        # Check expiry
        if (
            user.otp_expires_at is None or
            user.otp_expires_at < datetime.utcnow()
        ):
            raise HTTPException(
                status_code=400,
                detail="OTP has expired. Please request a new OTP."
            )

        if user.otp_attempts >= 5:
            raise HTTPException(
                status_code=400,
                detail="Maximum OTP attempts exceeded. Please request a new OTP."
        )

        # Check OTP
        if user.otp != payload.otp:
            user.otp_attempts += 1
            await db.commit()

            raise HTTPException(
                status_code=400,
                detail="Invalid OTP"
            )

        # OTP verified successfully
        user.otp = None
        user.otp_sent = False
        user.otp_verified = True
        user.otp_attempts = 0
        user.otp_expires_at = None

        await db.commit()
        await db.refresh(user)

        # Optional success SMS
        try:
            await send_verification_success_sms(
                user.phone_number
            )
        except Exception:
            pass

        return {
            "success": True,
            "message": "OTP verified successfully",
            "user_id": user.id
        }

    except HTTPException:
        raise

    except Exception as e:
        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    
@router.post("/resend-otp")
async def resend_otp(
    payload: ResendOtpSchema,
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(User).where(User.id == payload.user_id)
        )

        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        # Generate new secure 6-digit OTP
        otp = str(secrets.randbelow(900000) + 100000)

        # Update OTP details
        user.otp = otp
        user.otp_sent = True
        user.otp_verified = False
        user.otp_attempts = 0
        user.otp_expires_at = datetime.utcnow() + timedelta(minutes=5)

        await db.commit()
        await db.refresh(user)

        # Send the new OTP
        await send_phone_otp(
            phone=user.phone_number,
            otp=otp
        )

        return {
            "success": True,
            "message": "OTP resent successfully"
        }

    except HTTPException:
        raise

    except Exception as e:
        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.post("/login")
async def login(
    payload: LoginSchema,
    db: AsyncSession = Depends(get_db)
):
    try:
        phone = payload.phone.strip()

        # Convert to E.164 format
        if not phone.startswith("+"):
            phone = f"+91{phone}"

        print("Login Phone:", phone)

        result = await db.execute(
            select(User).where(
                User.phone_number == phone
            )
        )

        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        # Generate secure 6-digit OTP
        otp = str(secrets.randbelow(900000) + 100000)

        # Store OTP details
        user.otp = otp
        user.otp_sent = True
        user.otp_verified = False
        user.otp_attempts = 0
        user.otp_expires_at = datetime.utcnow() + timedelta(minutes=5)

        await db.commit()
        await db.refresh(user)

        # Send OTP SMS
        await send_phone_otp(
            phone=user.phone_number,
            otp=otp
        )

        return {
            "success": True,
            "message": "OTP sent successfully",
            "user_id": user.id,
            "phone": user.phone_number
        }

    except HTTPException:
        raise

    except Exception as e:
        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.post("/verify-login-otp")
async def verify_login_otp(
    payload: VerifyOtpSchema,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    try:
        print("========== VERIFY LOGIN OTP START ==========")

        print("Payload user_id:", payload.user_id)
        print("Payload OTP:", payload.otp)

        result = await db.execute(
            select(User).where(
                User.id == payload.user_id
            )
        )

        print("Database query executed")

        user = result.scalar_one_or_none()

        print("User result:", user)

        if not user:
            print("USER NOT FOUND FOR ID:", payload.user_id)

            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        print("User found")
        print("User ID:", user.id)
        print("Phone:", user.phone_number)
        print("Stored OTP:", user.otp)
        print("OTP Expiry:", user.otp_expires_at)
        print("OTP Attempts:", user.otp_attempts)

        # Check OTP exists
        if not user.otp:
            print("OTP DOES NOT EXIST")

            raise HTTPException(
                status_code=400,
                detail="OTP not found. Please request a new OTP."
            )

        print("OTP exists")

        # Check expiry
        if (
            user.otp_expires_at is None or
            user.otp_expires_at < datetime.utcnow()
        ):
            print("OTP EXPIRED")

            raise HTTPException(
                status_code=400,
                detail="OTP expired. Please request a new OTP."
            )

        print("OTP not expired")

        # Check attempts
        if user.otp_attempts >= 5:
            print("MAX OTP ATTEMPTS REACHED")

            raise HTTPException(
                status_code=400,
                detail="Too many failed attempts"
            )

        print("OTP attempts OK")

        # Verify OTP
        if user.otp != payload.otp:

            print(
                "INVALID OTP",
                "Expected:",
                user.otp,
                "Received:",
                payload.otp
            )

            user.otp_attempts += 1

            await db.commit()

            raise HTTPException(
                status_code=400,
                detail="Invalid OTP"
            )

        print("OTP VERIFIED SUCCESSFULLY")

        token = create_access_token(
            user_id=user.id,
            email=user.email
        )

        print("JWT CREATED")

        is_first_login = user.login_count == 0

        print("First login:", is_first_login)

        user.otp = None
        user.otp_sent = False
        user.otp_verified = True
        user.otp_expires_at = None
        user.otp_attempts = 0
        user.login_count += 1
        user.access_token = token

        await db.commit()

        print("USER UPDATED")

        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=60 * 60 * 24 * 7,
            path="/"
        )

        print("COOKIE SET")

        print("========== VERIFY LOGIN OTP END ==========")

        return {
            "success": True,
            "message": "Login successful",
            "token": token,
            "is_first_login": is_first_login,
            "user": {
                "user_id": user.id,
                "name": user.name,
                "email": user.email,
                "company_name": user.company_name,
                "phone": user.phone_number,
                "profile_strength": user.profile_strength,
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        print("ERROR:", str(e))

        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    
    
@router.get("/verifytoken")
async def verify_token(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    try:
        print("========== VERIFY TOKEN START ==========")

        # Step 1: Check cookies
        print("All Cookies:", request.cookies)

        token = request.cookies.get("access_token")

        print("Access Token:", token)

        if not token:
            print("NO ACCESS TOKEN FOUND")

            raise HTTPException(
                status_code=401,
                detail="Not authenticated"
            )

        print("TOKEN FOUND")

        # Step 2: Decode token

        print("SECRET KEY EXISTS:", bool(settings.SECRET_KEY))
        print("ALGORITHM:", settings.ALGORITHM)

        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        print("JWT PAYLOAD:", payload)

        user_id = payload.get("user_id")

        print("USER ID FROM TOKEN:", user_id)

        if not user_id:
            print("USER ID MISSING IN TOKEN")

            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        print("USER ID FOUND")

        # Step 3: Fetch user

        result = await db.execute(
            select(User).where(
                User.id == user_id
            )
        )

        print("DATABASE QUERY DONE")

        user = result.scalar_one_or_none()

        print("USER FROM DATABASE:", user)

        if not user:
            print("USER DOES NOT EXIST")

            raise HTTPException(
                status_code=401,
                detail="User not found"
            )

        print("USER VERIFIED")

        print("========== VERIFY TOKEN SUCCESS ==========")

        return {
            "token": True,
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone_number,
            "company": user.company_name,
            "is_first_login": user.login_count,
            "profile_strength": user.profile_strength
        }


    except JWTError as e:

        print("JWT ERROR:")
        print(type(e).__name__)
        print(str(e))

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )


    except HTTPException:
        raise


    except Exception as e:

        print("GENERAL ERROR:")
        print(type(e).__name__)
        print(str(e))

        raise HTTPException(
            status_code=401,
            detail=str(e)
        )

    
@router.post("/logout")
async def logout(
    response: Response,
    current_user: User = Depends(auth_middleware),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Remove token from database
        current_user.auth_token = None

        await db.commit()

        # Clear cookie
        response.delete_cookie(
            key="authToken",
            httponly=True,
            samesite="lax"
        )

        return {
            "success": True,
            "message": "Logged out successfully"
        }

    except Exception as e:
        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )