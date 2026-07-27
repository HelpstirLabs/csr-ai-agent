import logging
import httpx

from fastapi import APIRouter, HTTPException

from app.schemas.project_generator import (
    ProjectGenerateRequest,
)

from app.services.claude_service import (
    generate_proposal,
    rank_ngos,
)

logger = logging.getLogger(__name__)

project_router = APIRouter(
    prefix="/project-generator",
    tags=["Project Generator"],
)


@project_router.post("/generate")
async def generate_project(payload: ProjectGenerateRequest):
    try:
        logger.info("Project generation started")
        logger.info("Payload: %s", payload.model_dump())

        # ----------------------------------
        # Generate RFP
        # ----------------------------------
        proposal = await generate_proposal(
            vision=payload.vision,
            gender=payload.gender,
            geography=payload.geography,
            budget=payload.budget,
            beneficiary=payload.beneficiary,
            area=payload.area,
            scale=payload.scale,
        )

        # ----------------------------------
        # Fetch NGO Need/Service Data
        # ----------------------------------
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(
                "http://127.0.0.1:8000/api/v1/project-generator/need_capture",
                params={
                    "geography": payload.geography,
                }
            )

            response.raise_for_status()
            ngo_data = response.json()

        logger.info(
            "Fetched %s NGOs for geography=%s",
            len(ngo_data),
            payload.geography
        )

        # ----------------------------------
        # Rank NGOs using Claude
        # ----------------------------------
        logger.info("Starting NGO ranking")

        top_ngos = await rank_ngos(
            csr_requirement={
                "vision": payload.vision,
                "gender": payload.gender,
                "geography": payload.geography,
                "budget": payload.budget,
                "beneficiary": payload.beneficiary,
                "area": payload.area,
                "scale": payload.scale,
            },
            ngo_data=ngo_data,
            top_k=3,
        )

        logger.info("Top NGOs selected: %s", top_ngos)

        if not top_ngos:
            return {
                "rfp": proposal,
                "recommended_ngos": [],
                "ngo_details": [],
            }

        # ----------------------------------
        # Get Selected Org IDs
        # ----------------------------------
        selected_org_ids = [
            str(item["org_id"])
            for item in top_ngos
        ]

        logger.info(
            "Fetching details for org_ids=%s",
            selected_org_ids
        )

        # ----------------------------------
        # Fetch NGO Details from NGO App
        # ----------------------------------
        async with httpx.AsyncClient(timeout=60.0) as client:
            org_response = await client.post(
                "http://127.0.0.1:8000/api/v1/project-generator/by-ids",
                json={
                    "org_ids": selected_org_ids
                }
            )

            org_response.raise_for_status()

            ngo_details = org_response.json()

        print(
            "Fetched NGO details count=%s",
            len(ngo_details)
        )

        # ----------------------------------
        # Merge Ranking + NGO Details
        # ----------------------------------
        ngo_map = {
            str(ngo["org_id"]): ngo
            for ngo in ngo_details
        }

        recommended_ngos = []

        for ranked in top_ngos:
            org_id = str(ranked["org_id"])

            org = ngo_map.get(org_id)

            if org:
                recommended_ngos.append({
                    **org,
                    "score": ranked["score"],
                    "reason": ranked["reason"],
                })

        logger.info(
            "Final recommended NGOs count=%s",
            len(recommended_ngos)
        )

        return {
            "rfp": proposal,
            "recommended_ngos": recommended_ngos,
        }

    except httpx.HTTPError as e:
        logger.exception("Failed to fetch NGO data")

        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch NGO data: {str(e)}"
        )

    except Exception as e:
        logger.exception("Project generation failed")

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )