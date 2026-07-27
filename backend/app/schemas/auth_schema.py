from pydantic import BaseModel, EmailStr, Field

class RegisterSchema(BaseModel):
    name: str
    email: EmailStr
    phone: str = Field(min_length=10, max_length=15)
    company_name: str
    is_verified: bool = False


class LoginSchema(BaseModel):
    phone: str = Field(min_length=10, max_length=15)

class VerifyOtpSchema(BaseModel):
    user_id: str
    otp: str

class ResendOtpSchema(BaseModel):
    user_id: str