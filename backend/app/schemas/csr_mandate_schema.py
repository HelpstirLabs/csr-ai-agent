from pydantic import BaseModel
from typing import List


class CSRMandateCreate(BaseModel):
    annual_budget: str
    deployment_timeline: str
    csr_decision_making: str
    focus_areas: List[str]
    geographic_preferences: List[str]


class CSRMandateResponse(CSRMandateCreate):
    id: int
    user_id: str

    class Config:
        from_attributes = True


class CSRGoalsUpdate(BaseModel):
    goals: List[str]
    past_csr_partner: str
    deployment_urgency: str
    decision_structure: str
    approval_timeline: str
    annual_commitments: str


class CSRGoalsResponse(CSRGoalsUpdate):
    id: int
    user_id: str

    class Config:
        from_attributes = True


class SuccessResponse(BaseModel):
    success: bool
    message: str