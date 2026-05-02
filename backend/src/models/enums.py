from __future__ import annotations

from enum import Enum


class UserRole(str, Enum):
    FUNDER = "funder"
    NGO = "ngo"
    ADMIN = "admin"


class RFPStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    RESPONDED = "responded"
    UNDER_REVIEW = "under_review"
    AWARDED = "awarded"
    DECLINED = "declined"


class ProjectStatus(str, Enum):
    GENERATED = "generated"
    CUSTOMISED = "customised"
    RFP_SENT = "rfp_sent"
    AWARDED = "awarded"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class MilestoneStatus(str, Enum):
    PENDING = "pending"
    SELF_REPORTED = "self_reported"
    VERIFIED = "verified"
    REJECTED = "rejected"


class MEPlan(str, Enum):
    BASIC = "basic"
    STANDARD = "standard"
    ENTERPRISE = "enterprise"


class ScheduleVIIHead(str, Enum):
    EDUCATION = "education"
    HEALTHCARE = "healthcare"
    ENVIRONMENT = "environment"
    LIVELIHOOD = "livelihood"
    GENDER_EQUALITY = "gender_equality"
    HERITAGE = "heritage"
    ARMED_FORCES = "armed_forces"
    SPORTS = "sports"
    TECHNOLOGY = "technology"
    RURAL_DEVELOPMENT = "rural_development"
    SLUM_DEVELOPMENT = "slum_development"
    DISASTER_MANAGEMENT = "disaster_management"
    OTHER = "other"
