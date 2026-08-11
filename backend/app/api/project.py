import logging

import httpx
from fastapi import APIRouter, HTTPException

from app.schemas.project_generator import ProjectGenerateRequest
from app.services.claude_service import generate_proposal

logger = logging.getLogger(__name__)

project_router = APIRouter(
    prefix="/project-generator",
    tags=["Project Generator"],
)


@project_router.post("/generate")
async def generate_project(
    payload: ProjectGenerateRequest,
):
    try:
        # ============================================================
        # 1. GENERATE RFP / PROPOSAL
        # ============================================================

        proposal = await generate_proposal(
            vision=payload.vision,
            gender=payload.gender,
            geography=payload.geography,
            budget=payload.budget,
            beneficiary=payload.beneficiary,
            area=payload.area,
            scale=payload.scale,
        )

        # ============================================================
        # 2. CALL NGO NEED CAPTURE API
        # ============================================================

        ngo_url = (
            "http://127.0.0.1:8000"
            "/api/v1/project-generator/need_capture"
        )

        ngo_params = {
            "geography": payload.geography,
            "area": payload.area,
        }

        async with httpx.AsyncClient(
            timeout=60.0
        ) as client:

            response = await client.get(
                ngo_url,
                params=ngo_params,
            )

            response.raise_for_status()

            ngo_data = response.json()

        # ============================================================
        # 3. PRINT NEED CAPTURE RESPONSE
        # ============================================================

        print("\n")
        print("=" * 100)
        print("NEED CAPTURE API RESPONSE")
        print("=" * 100)

        print("\nREQUEST URL:")
        print(str(response.url))

        print("\nSTATUS CODE:")
        print(response.status_code)

        print("\nRESPONSE DATA:")
        print(ngo_data)

        print("\nNUMBER OF NGO RECORDS:")
        print(len(ngo_data))

        print("=" * 100)

        # ============================================================
        # 4. EXTRACT UNIQUE ORG IDS
        # ============================================================

        selected_org_ids = list(
            dict.fromkeys(
            str(org_id)
            for org_id in ngo_data
            if org_id
            )
        )

        # ============================================================
        # 5. PRINT ORG IDS
        # ============================================================

        print("\n")
        print("=" * 100)
        print("UNIQUE NGO ORG IDS")
        print("=" * 100)

        print("\nORG IDS:")
        print(selected_org_ids)

        print("\nTOTAL UNIQUE ORG IDS:")
        print(len(selected_org_ids))

        print("=" * 100)

        # ============================================================
        # 6. NO NGO FOUND
        # ============================================================

        if not selected_org_ids:

            print("\nNo NGOs found from need_capture API.")

            return {
                "rfp": proposal,
                "need_capture_response": ngo_data,
                "ngo_details": [],
            }

        # ============================================================
        # 7. CALL NGO DETAILS API USING ORG IDS
        # ============================================================

        org_url = (
            "http://127.0.0.1:8000"
            "/api/v1/project-generator/by-ids"
        )

        org_payload = {
            "org_ids": selected_org_ids,
        }

        async with httpx.AsyncClient(
            timeout=60.0
        ) as client:

            org_response = await client.post(
                org_url,
                json=org_payload,
            )

            org_response.raise_for_status()

            ngo_details = org_response.json()

        # ============================================================
        # 8. PRINT NGO DETAILS RESPONSE
        # ============================================================

        print("\n")
        print("=" * 100)
        print("NGO DETAILS API RESPONSE")
        print("=" * 100)

        print("\nREQUEST URL:")
        print(str(org_response.url))

        print("\nREQUEST PAYLOAD:")
        print(org_payload)

        print("\nSTATUS CODE:")
        print(org_response.status_code)

        print("\nRESPONSE DATA:")
        print(ngo_details)

        print("\nNUMBER OF NGO DETAILS:")
        print(len(ngo_details))

        print("=" * 100)

        # ============================================================
        # 9. FINAL RESPONSE
        # ============================================================

        print("\n")
        print("=" * 100)
        print("PROJECT GENERATION COMPLETED")
        print("=" * 100)

        print("\nRFP GENERATED:")
        print(bool(proposal))

        print("\nNGOs FROM NEED CAPTURE:")
        print(len(ngo_data))

        print("\nUNIQUE ORG IDS:")
        print(len(selected_org_ids))

        print("\nNGO DETAILS RECEIVED:")
        print(len(ngo_details))

        print("=" * 100)

        return {
            "rfp": proposal,
            "need_capture_response": ngo_data,
            "ngo_details": ngo_details,
        }

    # ================================================================
    # HTTPX ERROR
    # ================================================================

    except httpx.HTTPError as e:

        logger.exception(
            "HTTP error while generating project"
        )

        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch NGO data: {str(e)}",
        )

    # ================================================================
    # GENERAL ERROR
    # ================================================================

    except Exception as e:

        logger.exception(
            "Project generation failed"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )

