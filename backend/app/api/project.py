import logging
import uuid

import httpx
from fastapi import APIRouter, HTTPException, Depends
from requests import Session
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone, timedelta

from app.schemas.project_generator import (
    ProjectGenerateRequest,
    ProjectGenerateResponse,
)
from app.models.project_generator import (
    ProjectRequest,
    ProjectNGOMatch,
)
from app.core.database import get_db
from app.services.claude_service import generate_proposal
from app.services.email_service import send_test_email
from app.models.user import User
from app.middleware.auth import auth_middleware


logger = logging.getLogger(__name__)

project_router = APIRouter(
    prefix="/project-generator",
    tags=["Project Generator"],
)


@project_router.post(
    "/generate",
    response_model=ProjectGenerateResponse,
)
async def generate_project(
    payload: ProjectGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(auth_middleware),
):
    try:

        generated = await generate_proposal(
            vision=payload.vision,
            gender=payload.gender,
            geography=payload.geography,
            budget=payload.budget,
            duration=payload.duration,
            beneficiary=payload.beneficiary,
            area=payload.area,
            scale=payload.scale,
        )

        project_title = generated.get("project_title")

        proposal = generated.get("proposal")

        key_activities = generated.get(
            "key_activities",
            []
        )

        partner_requirements = generated.get(
            "partner_requirements",
            []
        )

        if not project_title:
            logger.error(
                "STEP 4/12 FAILED - Project title missing"
            )

            raise HTTPException(
                status_code=500,
                detail="Project title was not generated.",
            )


        if not proposal:
            logger.error(
                "STEP 4/12 FAILED - Proposal missing"
            )

            raise HTTPException(
                status_code=500,
                detail="Proposal was not generated.",
            )


        if not isinstance(
            key_activities,
            list,
        ):
            logger.error(
                "STEP 4/12 FAILED - key_activities is not a list"
            )

            raise HTTPException(
                status_code=500,
                detail="Invalid key activities generated.",
            )


        if not isinstance(
            partner_requirements,
            list,
        ):
            logger.error(
                "STEP 4/12 FAILED - partner_requirements is not a list"
            )

            raise HTTPException(
                status_code=500,
                detail=(
                    "Invalid partner requirements generated."
                ),
            )

        for index, activity in enumerate(
            key_activities,
            start=1,
        ):
            logger.info(
                "Activity %d: %s",
                index,
                activity,
            )

        for index, requirement in enumerate(
            partner_requirements,
            start=1,
        ):
            logger.info(
                "Requirement %d: %s",
                index,
                requirement,
            )

        ngo_url = (
            "http://127.0.0.1:8088"
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

        selected_org_ids = list(
            dict.fromkeys(
                str(org_id)
                for org_id in ngo_data
                if org_id
            )
        )

        if selected_org_ids:

            for index, org_id in enumerate(
                selected_org_ids,
                start=1,
            ):
                logger.info(
                    "NGO ID %d: %s",
                    index,
                    org_id,
                )
        else:
            logger.info(
                "No matching NGO organization IDs found"
            )

        project = ProjectRequest(
            vision=payload.vision,
            gender=payload.gender,
            geography=payload.geography,
            budget=payload.budget,
            duration=payload.duration,
            beneficiary=payload.beneficiary,
            created_by=current_user.id,
            area=payload.area,
            scale=payload.scale,
            project_title=project_title,
            proposal=proposal,
            key_activities=key_activities,
            partner_requirements=partner_requirements,
        )

        db.add(project)
        await db.flush()

        ngo_details = []

        if selected_org_ids:
            org_url = (
                "http://127.0.0.1:8088"
                "/api/v1/project-generator/by-ids"
            )

            async with httpx.AsyncClient(
                timeout=60.0
            ) as client:

                org_response = await client.post(
                    org_url,
                    json={
                        "org_ids": selected_org_ids
                    },
                )

                org_response.raise_for_status()

                ngo_details = org_response.json()

        else:

            logger.info(
                "No NGO IDs available"
            )

            logger.info(
                "Skipping NGO details API call"
            )

        saved_ngo_count = 0

        if not ngo_details:

            logger.info(
                "No NGO details to save"
            )

        for index, ngo in enumerate(
            ngo_details,
            start=1,
        ):
            org_id = ngo.get("org_id")

            if not org_id:
                continue

            try:

                ngo_uuid = uuid.UUID(
                    str(org_id)
                )

                ngo_match = ProjectNGOMatch(
                    project_id=project.id,

                    org_id=ngo_uuid,
                    name=ngo.get("name"),
                    description=ngo.get("description"),
                    area=ngo.get("area"),
                    contact_email=ngo.get("contact_email"),
                    contact_phone=ngo.get("contact_phone"),
                    whatsapp_number=ngo.get( "whatsapp_number"),
                    website=ngo.get("website"),
                    logo=ngo.get( "logo"),
                    score=ngo.get( "score"),
                    raw_data=ngo,
                )

                db.add(ngo_match)
                saved_ngo_count += 1

            except ValueError:

                logger.error(
                    "Invalid NGO organization UUID: %s",
                    org_id,
                )

                raise HTTPException(
                    status_code=500,
                    detail=(
                        "Invalid NGO organization ID: "
                        f"{org_id}"
                    ),
                )

        await db.commit()
        await db.refresh(project)

        result = {
            "project_id": str(project.id),
            "project_title": project_title,
            "proposal": proposal,
            "key_activities": key_activities,
            "partner_requirements": partner_requirements,
            "need_capture_response": ngo_data,
            "ngo_details": ngo_details,
            "ngo_match_count": saved_ngo_count,
        }

        return result


    # =============================================================
    # HTTPX ERROR
    # =============================================================

    except httpx.HTTPError as e:

        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to fetch NGO data: "
                f"{str(e)}"
            ),
        )

    except HTTPException:
        await db.rollback()
        raise

    except Exception as e:

        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )

    
@project_router.post("/send-rfp/{project_id}/{ngo_id}")
async def send_rfp(
    project_id: uuid.UUID,
    ngo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(auth_middleware),
):
    try:
        result = await db.execute(
            select(ProjectNGOMatch)
            .where(
                ProjectNGOMatch.project_id == project_id,
                ProjectNGOMatch.org_id == ngo_id,
            )
        )

        ngo_match = result.scalars().first()

        if not ngo_match:
            print("STEP 1 FAILED: NGO match not found")

            raise HTTPException(
                status_code=404,
                detail={
                    "message": "NGO match not found for this project",
                    "project_id": str(project_id),
                    "org_id": str(ngo_id),
                },
            )

        # ---------------------------------------------------------
        # 2. Check whether THIS PROJECT + NGO already has RFP
        # ---------------------------------------------------------

        if ngo_match.rfp_sent:

            raise HTTPException(
                status_code=400,
                detail={
                    "message": "RFP already sent",
                    "org_id": str(ngo_id),
                    "project_id": str(project_id),
                    "rfp_sent": True,
                    "rfp_sent_at": (
                        ngo_match.rfp_sent_at.isoformat()
                        if ngo_match.rfp_sent_at
                        else None
                    ),
                },
            )

        project_result = await db.execute(
            select(ProjectRequest)
            .where(
                ProjectRequest.id == project_id
            )
        )

        project = project_result.scalars().first()

        if not project:
            print("STEP 3 FAILED: ProjectRequest not found")

            raise HTTPException(
                status_code=404,
                detail="Project request not found",
            )

        email = ngo_match.contact_email

        if not email:
            print("STEP 4 FAILED: NGO email not found")

            raise HTTPException(
                status_code=400,
                detail="NGO email not found",
            )

        received_at = datetime.now(timezone.utc)

        deadline = received_at + timedelta(days=15)

        email_result = await send_test_email(
            to_email=email,
            ngo_id=str(ngo_id),
        )

        external_payload = {
            "id": str(uuid.uuid4()),

            # NGO
            "org_id": str(ngo_match.org_id),

            # CSR/User
            "csr_id": (
                str(project.created_by)
                if project.created_by
                else None
            ),

            # Project
            "project_request_id": str(project.id),

            # NGO user receiving RFP
            "received_by": current_user.id,

            # CSR information
            "csr_name": getattr(
                current_user,
                "username",
                "CSR Funder",
            ),

            "address": getattr(
                current_user,
                "address",
                None,
            ),

            # Project information
            "budget": project.budget,
            "thematic_area": project.area,
            "duration": project.duration,

            "vision": project.vision,
            "location": project.geography,

            "key_activities": project.key_activities,

            "project_title": project.project_title,

            "partner_requirements": (
                project.partner_requirements
            ),

            "proposal": project.proposal,

            # Dates
            "received_at": received_at.isoformat(),
            "deadline": deadline.isoformat(),

            "eoi_status": "pending",
            "interested": False,

            "created_at": received_at.isoformat(),
            "updated_at": received_at.isoformat(),

            # Complete project
            "project": {
                "id": str(project.id),

                "vision": project.vision,
                "gender": project.gender,
                "geography": project.geography,
                "budget": project.budget,
                "duration": project.duration,
                "beneficiary": project.beneficiary,
                "area": project.area,
                "scale": project.scale,

                "proposal": project.proposal,

                "project_title": project.project_title,

                "key_activities": (
                    project.key_activities
                ),

                "partner_requirements": (
                    project.partner_requirements
                ),

                "created_by": (
                    str(project.created_by)
                    if project.created_by
                    else None
                ),
            },

            # NGO match
            "ngo_match": {
                "org_id": str(
                    ngo_match.org_id
                ),

                "name": ngo_match.name,
                "description": ngo_match.description,
                "area": ngo_match.area,

                "contact_email":
                    ngo_match.contact_email,

                "contact_phone":
                    ngo_match.contact_phone,

                "whatsapp_number":
                    ngo_match.whatsapp_number,

                "website": ngo_match.website,
                "logo": ngo_match.logo,

                "score": ngo_match.score,

                "rfp_sent":
                    ngo_match.rfp_sent,

                "rfp_sent_at": (
                    ngo_match.rfp_sent_at.isoformat()
                    if ngo_match.rfp_sent_at
                    else None
                ),
            },
        }

        ngo_api_url = (
            "http://127.0.0.1:8088"
            "/api/v1/project-generator/rfp/receive_data"
        )

        async with httpx.AsyncClient(
            timeout=10.0
        ) as client:

            external_response = await client.post(
                ngo_api_url,
                json=external_payload,
            )

        if external_response.status_code >= 400:

            raise HTTPException(
                status_code=502,
                detail={
                    "message": (
                        "RFP email was sent, but "
                        "external application rejected "
                        "the RFP data"
                    ),
                    "external_status":
                        external_response.status_code,
                    "external_response":
                        external_response.text,
                },
            )

        external_result = external_response.json()

        # # print("\nSTEP 10: Marking RFP as sent")

        ngo_match.rfp_sent = True
        ngo_match.rfp_sent_at = received_at


        await db.commit()
        await db.refresh(ngo_match)

        return {
            "success": True,

            "org_id": str(ngo_id),

            "project_id": str(project.id),

            "email": email,

            "message": (
                "RFP email sent and "
                "RFP data sent successfully"
            ),

            "email_result": email_result,

            "external_result": external_result,

            "rfp_sent": True,

            "rfp_sent_at":
                received_at.isoformat(),

            "deadline":
                deadline.isoformat(),
        }

    except HTTPException:
        raise

    except httpx.HTTPError as e:

        # print("\nHTTP ERROR:")
        # print(str(e))

        await db.rollback()

        raise HTTPException(
            status_code=502,
            detail=(
                "Failed to communicate with "
                f"NGO application: {str(e)}"
            ),
        )

    except Exception as e:

        # print("\nUNEXPECTED ERROR:")
        # print(str(e))

        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )