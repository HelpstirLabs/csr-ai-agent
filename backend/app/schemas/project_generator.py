# schemas/project_generator.py

from pydantic import BaseModel


class ProjectGenerateRequest(BaseModel):
    vision: str
    gender: str
    geography:str
    budget:str
    beneficiary: str
    area: str
    scale: str


class ProjectGenerateResponse(BaseModel):
    rfp: str