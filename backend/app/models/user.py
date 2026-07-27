import random
import string

from sqlalchemy import Boolean, Column, Integer, String

from app.core.database import Base


def generate_user_id():
    return ''.join(
        random.choices(
            string.ascii_uppercase + string.digits,
            k=13
        )
    )


class User(Base):
    __tablename__ = "users"

    id = Column(
        String(13),
        primary_key=True,
        default=generate_user_id
    )

    # Basic Details
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone_number = Column(String(20))
    company_name = Column(String(255))

    # OTP & Authentication
    otp_sent = Column(Boolean, default=False)
    otp_verified = Column(Boolean, default=False)
    access_token = Column(String(1000), nullable=True)
    login_count = Column(Integer, default=0)

    # Profile Information
    designation = Column(String(255), nullable=True)
    linkedin = Column(String(500), nullable=True)
    years_in_csr = Column(String(100), nullable=True)

    # Organization Information
    industry = Column(String(255), nullable=True)
    company_size = Column(String(100), nullable=True)
    headquarters = Column(String(255), nullable=True)

    # Profile Completion
    profile_completed = Column(Boolean, default=False)
    profile_strength = Column(Integer, default=35)