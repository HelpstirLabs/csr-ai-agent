from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from app.core.database import Base


class CSRMandate(Base):
    __tablename__ = "csr_mandates"

    id = Column(Integer, primary_key=True, index=True)


    user_id = Column(
        String,
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    annual_budget = Column(String, nullable=True)
    deployment_timeline = Column(String, nullable=True)
    csr_decision_making = Column(String, nullable=True)

    focus_areas = Column(JSON, nullable=True)
    geographic_preferences = Column(JSON, nullable=True)
    goals = Column(JSON, nullable=True)
    past_csr_partner = Column(String, nullable=True)
    deployment_urgency = Column(String, nullable=True)
    decision_structure = Column(String, nullable=True)
    approval_timeline = Column(String, nullable=True)
    annual_commitments = Column(String, nullable=True)