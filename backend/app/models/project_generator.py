# models/project_generator.py

from sqlalchemy import Column, Integer, String, Text
from app.core.database import Base



class ProjectGenerator(Base):
    __tablename__ = "project_generators"

    id = Column(Integer, primary_key=True, index=True)

    vision = Column(Text, nullable=False)
    gender = Column(String, nullable=False)
    beneficiary = Column(String, nullable=False)
    technology = Column(String, nullable=False)
    scale = Column(String, nullable=False)