"""Seed the database with mock NGO and funder data for development."""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.models.user import User
from src.models.enums import UserRole
from src.models.ngo import NGOProfile, NGOProgramme, LocationNeed
from src.models.funder import FunderProfile
from src.auth.passwords import hash_password

logger = logging.getLogger(__name__)


async def seed_mock_data(session: AsyncSession) -> None:
    existing = await session.execute(select(User).limit(1))
    if existing.scalars().first():
        logger.info("Database already seeded, skipping.")
        return

    logger.info("Seeding mock data...")

    # --- NGO Users & Profiles ---
    ngo_users = [
        User(email="ngo1@example.com", hashed_password=hash_password("password123"), name="Rajesh Kumar", role=UserRole.NGO, organisation="Pratham Education Foundation"),
        User(email="ngo2@example.com", hashed_password=hash_password("password123"), name="Sunita Devi", role=UserRole.NGO, organisation="Gram Vikas Sansthan"),
        User(email="ngo3@example.com", hashed_password=hash_password("password123"), name="Amit Patel", role=UserRole.NGO, organisation="Green Earth Initiative"),
        User(email="ngo4@example.com", hashed_password=hash_password("password123"), name="Priya Sharma", role=UserRole.NGO, organisation="Mahila Kalyan Samiti"),
        User(email="ngo5@example.com", hashed_password=hash_password("password123"), name="Vikram Singh", role=UserRole.NGO, organisation="Rural Health Connect"),
    ]
    for u in ngo_users:
        session.add(u)
    await session.flush()

    ngo_profiles = [
        NGOProfile(
            user_id=ngo_users[0].id, name="Pratham Education Foundation",
            description="India's largest education NGO working to improve quality of education for underprivileged children.",
            registration_12a=True, registration_80g=True, fcra_status=True, csr1_registration=True,
            clean_audit_3yr=True, no_adverse_news=True, leadership_stability=True, mca21_match=True,
            thematic_areas=["education", "skill_development"], operating_states=["Rajasthan", "Maharashtra", "Delhi"],
            operating_districts=["Ajmer", "Pune", "South Delhi"], beneficiary_types=["out_of_school_children", "youth"],
            trust_score=95.0, impact_score=88.0, founded_year=1995, annual_budget_inr=50_00_000, team_size=45,
        ),
        NGOProfile(
            user_id=ngo_users[1].id, name="Gram Vikas Sansthan",
            description="Grassroots organisation focused on rural livelihoods and water sanitation in Rajasthan.",
            registration_12a=True, registration_80g=True, fcra_status=False, csr1_registration=True,
            clean_audit_3yr=True, no_adverse_news=True, leadership_stability=True, mca21_match=False,
            thematic_areas=["livelihood", "water_sanitation"], operating_states=["Rajasthan"],
            operating_districts=["Ajmer", "Jodhpur", "Udaipur"], beneficiary_types=["rural_poor", "women"],
            trust_score=72.0, impact_score=65.0, founded_year=2008, annual_budget_inr=15_00_000, team_size=18,
        ),
        NGOProfile(
            user_id=ngo_users[2].id, name="Green Earth Initiative",
            description="Environmental conservation and sustainable agriculture programme across Maharashtra and Gujarat.",
            registration_12a=True, registration_80g=True, fcra_status=True, csr1_registration=True,
            clean_audit_3yr=True, no_adverse_news=True, leadership_stability=False, mca21_match=True,
            thematic_areas=["environment", "sustainable_agriculture"], operating_states=["Maharashtra", "Gujarat"],
            operating_districts=["Pune", "Nashik", "Ahmedabad"], beneficiary_types=["farmers", "rural_communities"],
            trust_score=82.0, impact_score=75.0, founded_year=2012, annual_budget_inr=25_00_000, team_size=22,
        ),
        NGOProfile(
            user_id=ngo_users[3].id, name="Mahila Kalyan Samiti",
            description="Women empowerment and gender equality programmes in urban slums of Delhi NCR.",
            registration_12a=True, registration_80g=True, fcra_status=False, csr1_registration=True,
            clean_audit_3yr=True, no_adverse_news=True, leadership_stability=True, mca21_match=True,
            thematic_areas=["gender_equality", "skill_development"], operating_states=["Delhi", "Haryana"],
            operating_districts=["South Delhi", "Gurugram", "Faridabad"], beneficiary_types=["women", "urban_poor"],
            trust_score=78.0, impact_score=70.0, founded_year=2005, annual_budget_inr=20_00_000, team_size=25,
        ),
        NGOProfile(
            user_id=ngo_users[4].id, name="Rural Health Connect",
            description="Primary healthcare delivery and community health worker training in tribal areas.",
            registration_12a=True, registration_80g=True, fcra_status=True, csr1_registration=True,
            clean_audit_3yr=True, no_adverse_news=True, leadership_stability=True, mca21_match=True,
            thematic_areas=["healthcare", "community_health"], operating_states=["Madhya Pradesh", "Chhattisgarh"],
            operating_districts=["Dindori", "Mandla", "Bastar"], beneficiary_types=["tribal_communities", "women", "children"],
            trust_score=90.0, impact_score=85.0, founded_year=2010, annual_budget_inr=35_00_000, team_size=30,
        ),
    ]
    for p in ngo_profiles:
        session.add(p)
    await session.flush()

    # --- Programmes ---
    programmes = [
        NGOProgramme(
            ngo_id=ngo_profiles[0].id, title="Read India — Ajmer", description="Remedial learning camps for children lagging in reading and arithmetic.",
            thematic_area="education", location_state="Rajasthan", location_district="Ajmer",
            beneficiary_count=3200, cost_per_beneficiary=1500, outcomes="78% children reached grade-level reading within 6 months",
            sdg_alignment=["SDG4"], is_completed=True,
        ),
        NGOProgramme(
            ngo_id=ngo_profiles[1].id, title="Jal Jeevan — Udaipur", description="Community-managed water harvesting structures in 15 villages.",
            thematic_area="water_sanitation", location_state="Rajasthan", location_district="Udaipur",
            beneficiary_count=8500, cost_per_beneficiary=800, outcomes="12 of 15 villages now have year-round water access",
            sdg_alignment=["SDG6"], is_completed=True,
        ),
        NGOProgramme(
            ngo_id=ngo_profiles[2].id, title="Green Farms Pune", description="Organic farming transition support for smallholder farmers.",
            thematic_area="sustainable_agriculture", location_state="Maharashtra", location_district="Pune",
            beneficiary_count=450, cost_per_beneficiary=5000, outcomes="Average yield improvement of 22%, 30% reduction in chemical input costs",
            sdg_alignment=["SDG2", "SDG12"], is_completed=True,
        ),
        NGOProgramme(
            ngo_id=ngo_profiles[4].id, title="Swasthya Sathi — Dindori", description="Training 200 community health workers for maternal and child health.",
            thematic_area="healthcare", location_state="Madhya Pradesh", location_district="Dindori",
            beneficiary_count=15000, cost_per_beneficiary=350, outcomes="Institutional delivery rate increased from 42% to 71% in target blocks",
            sdg_alignment=["SDG3"], is_completed=True,
        ),
    ]
    for prog in programmes:
        session.add(prog)

    # --- Location Needs ---
    location_needs = [
        LocationNeed(
            ngo_id=ngo_profiles[0].id, state="Rajasthan", district="Ajmer",
            description="High dropout rate among girls after Class 5 due to distance to secondary schools and lack of safe transport.",
            demographic_gaps=["adolescent_girls", "SC_ST_communities"],
            community_problems=["school_dropout", "gender_disparity", "lack_of_transport"],
            delivery_capacity="Can deliver in 25 villages within Ajmer block with existing team",
        ),
        LocationNeed(
            ngo_id=ngo_profiles[1].id, state="Rajasthan", district="Jodhpur",
            description="Severe water scarcity in western blocks. Women walk 3-5 km daily for water. No groundwater recharge structures.",
            demographic_gaps=["women", "small_farmers"],
            community_problems=["water_scarcity", "women_drudgery", "crop_failure"],
            delivery_capacity="Can cover 20 villages in Phalodi and Shergarh blocks",
        ),
        LocationNeed(
            ngo_id=ngo_profiles[4].id, state="Madhya Pradesh", district="Mandla",
            description="Tribal population with minimal access to primary healthcare. Nearest PHC is 25 km from most hamlets.",
            demographic_gaps=["tribal_communities", "pregnant_women", "children_under_5"],
            community_problems=["no_primary_healthcare", "malnutrition", "high_infant_mortality"],
            delivery_capacity="Can deploy 50 ASHA-level health workers across 3 blocks",
        ),
    ]
    for ln in location_needs:
        session.add(ln)

    # --- Funder Users & Profiles ---
    funder_users = [
        User(email="csr@tatagroup.example.com", hashed_password=hash_password("password123"), name="Ananya Mehta", role=UserRole.FUNDER, organisation="Tata Steel CSR"),
        User(email="csr@infosys.example.com", hashed_password=hash_password("password123"), name="Rohan Gupta", role=UserRole.FUNDER, organisation="Infosys Foundation"),
    ]
    for u in funder_users:
        session.add(u)
    await session.flush()

    funder_profiles = [
        FunderProfile(
            user_id=funder_users[0].id, company_name="Tata Steel CSR", designation="Head of CSR",
            sector="Manufacturing", total_csr_budget_inr=2_00_00_000, deployed_budget_inr=75_00_000, financial_year="2026-27",
        ),
        FunderProfile(
            user_id=funder_users[1].id, company_name="Infosys Foundation", designation="VP Sustainability",
            sector="Technology", total_csr_budget_inr=5_00_00_000, deployed_budget_inr=1_50_00_000, financial_year="2026-27",
        ),
    ]
    for f in funder_profiles:
        session.add(f)

    # --- Admin User ---
    admin = User(email="admin@helpstir.in", hashed_password=hash_password("admin123"), name="Admin", role=UserRole.ADMIN, organisation="HELPSTiR")
    session.add(admin)

    await session.commit()
    logger.info("Mock data seeded successfully.")
