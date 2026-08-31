from typing import Optional, Any
from pydantic import BaseModel, EmailStr


class ProjectGenerateRequest(BaseModel):
    vision: str
    gender: Optional[str] = None
    geography: Optional[str] = None
    budget: Optional[str] = None
    duration: Optional[str] = None
    beneficiary: Optional[str] = None
    area: Optional[str] = None
    scale: Optional[str] = None


class NGODetailResponse(BaseModel):
    org_id: str

    name: Optional[str] = None
    description: Optional[str] = None
    area: Optional[str] = None

    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    whatsapp_number: Optional[str] = None

    website: Optional[str] = None
    logo: Optional[str] = None

    score: Optional[int] = None


class ProjectGenerateResponse(BaseModel):
    project_id: str

    # Generated project information
    project_title: str
    proposal: str

    # Generated structured information
    key_activities: list[str]
    partner_requirements: list[str]

    # NGO information
    need_capture_response: list[Any]
    ngo_details: list[NGODetailResponse]

    # Number of matched NGOs saved
    ngo_match_count: int