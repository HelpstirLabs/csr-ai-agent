from pydantic import BaseModel
from typing import Optional


class ProfileUpdateSchema(BaseModel):
    name: Optional[str] = None
    designation: Optional[str] = None
    linkedin: Optional[str] = None
    years_in_csr: Optional[str] = None

    company_name: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    headquarters: Optional[str] = None

    # These may come from frontend but will be ignored
    email: Optional[str] = None
    phone: Optional[str] = None