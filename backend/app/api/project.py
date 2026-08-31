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
        # 1. GENERATE PROJECT CONTENT

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

        # =========================================================
        # 2. EXTRACT GENERATED VALUES
        # =========================================================

        project_title = generated.get(
            "project_title"
        )

        proposal = generated.get(
            "proposal"
        )

        key_activities = generated.get(
            "key_activities",
            []
        )

        partner_requirements = generated.get(
            "partner_requirements",
            []
        )

        # =========================================================
        # 3. VALIDATE GENERATED DATA
        # =========================================================

        if not project_title:
            raise HTTPException(
                status_code=500,
                detail="Project title was not generated.",
            )

        if not proposal:
            raise HTTPException(
                status_code=500,
                detail="Proposal was not generated.",
            )

        if not isinstance(
            key_activities,
            list
        ):
            raise HTTPException(
                status_code=500,
                detail="Invalid key activities generated.",
            )

        if not isinstance(
            partner_requirements,
            list
        ):
            raise HTTPException(
                status_code=500,
                detail=(
                    "Invalid partner requirements generated."
                ),
            )

        # =========================================================
        # 4. PRINT GENERATED DATA
        # =========================================================

        print(
            "\n"
            "=================================================="
        )

        print(
            "GENERATED PROJECT"
        )

        print(
            "=================================================="
        )

        print(
            f"\nPROJECT TITLE:\n{project_title}"
        )

        print(
            "\nKEY ACTIVITIES:"
        )

        for index, activity in enumerate(
            key_activities,
            start=1
        ):
            print(
                f"{index}. {activity}"
            )

        print(
            "\nWHAT THE CSR FUNDER IS LOOKING FOR "
            "IN A PARTNER:"
        )

        for index, requirement in enumerate(
            partner_requirements,
            start=1
        ):
            print(
                f"{index}. {requirement}"
            )

        print(
            "\nPROPOSAL:"
        )

        print(
            proposal
        )

        print(
            "\n"
            "=================================================="
        )

        # =========================================================
        # 5. FETCH NGO NEED CAPTURE
        # =========================================================

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

        # =========================================================
        # 6. EXTRACT NGO IDS
        # =========================================================

        selected_org_ids = list(
            dict.fromkeys(
                str(org_id)
                for org_id in ngo_data
                if org_id
            )
        )

        # =========================================================
        # 7. CREATE PROJECT REQUEST
        # =========================================================

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

            # Generated project title
            project_title=project_title,

            # Generated proposal text
            proposal=proposal,

            # Generated JSON arrays
            key_activities=key_activities,

            partner_requirements=partner_requirements,
        )

        db.add(project)

        # Generate project ID before creating NGO matches
        await db.flush()

        # =========================================================
        # 8. FETCH NGO DETAILS
        # =========================================================

        ngo_details = []

        if selected_org_ids:

            logger.info(
                "STEP 6: Fetching NGO details"
            )

            org_url = (
                "http://127.0.0.1:8000"
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
                "Skipping NGO details API call"
            )

        # =========================================================
        # 9. SAVE NGO MATCHES
        # =========================================================

        saved_ngo_count = 0

        for ngo in ngo_details:

            org_id = ngo.get(
                "org_id"
            )

            if not org_id:

                logger.warning(
                    "Skipping NGO because org_id "
                    "is missing: %s",
                    ngo,
                )

                continue

            try:

                ngo_match = ProjectNGOMatch(
                    project_id=project.id,

                    org_id=uuid.UUID(
                        str(org_id)
                    ),

                    name=ngo.get(
                        "name"
                    ),

                    description=ngo.get(
                        "description"
                    ),

                    area=ngo.get(
                        "area"
                    ),

                    contact_email=ngo.get(
                        "contact_email"
                    ),

                    contact_phone=ngo.get(
                        "contact_phone"
                    ),

                    whatsapp_number=ngo.get(
                        "whatsapp_number"
                    ),

                    website=ngo.get(
                        "website"
                    ),

                    logo=ngo.get(
                        "logo"
                    ),

                    score=ngo.get(
                        "score"
                    ),

                    raw_data=ngo,
                )

                db.add(
                    ngo_match
                )

                saved_ngo_count += 1

            except ValueError:

                raise HTTPException(
                    status_code=500,
                    detail=(
                        "Invalid NGO organization ID: "
                        f"{org_id}"
                    ),
                )

        # =========================================================
        # 10. COMMIT EVERYTHING
        # =========================================================

        await db.commit()

        # =========================================================
        # 11. REFRESH PROJECT
        # =========================================================

        await db.refresh(
            project
        )

        # =========================================================
        # 12. RESPONSE
        # =========================================================

        return {
            "project_id": str(
                project.id
            ),

            "project_title": project_title,

            "proposal": proposal,

            "key_activities": key_activities,

            "partner_requirements":
                partner_requirements,

            "need_capture_response":
                ngo_data,

            "ngo_details":
                ngo_details,

            "ngo_match_count":
                saved_ngo_count,
        }

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

        logger.exception(
            "Project generation failed"
        )

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

        print("\n" + "=" * 60)
        print("START SEND RFP")
        print("=" * 60)

        print("PROJECT ID:", project_id)
        print("NGO ID:", ngo_id)
        print("CURRENT USER ID:", current_user.id)

        # ---------------------------------------------------------
        # 1. Find EXACT NGO match for THIS PROJECT
        # ---------------------------------------------------------
        print("\nSTEP 1: Finding NGO match")

        print("Searching:")
        print("Project ID:", project_id)
        print("Organization ID:", ngo_id)

        result = await db.execute(
            select(ProjectNGOMatch)
            .where(
                ProjectNGOMatch.project_id == project_id,
                ProjectNGOMatch.org_id == ngo_id,
            )
        )

        ngo_match = result.scalars().first()

        print("NGO match result:", ngo_match)

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

        print("STEP 1 SUCCESS")

        print("NGO Match ID:", ngo_match.id)
        print("Organization ID:", ngo_match.org_id)
        print("NGO Name:", ngo_match.name)
        print("Project ID:", ngo_match.project_id)
        print("RFP Sent:", ngo_match.rfp_sent)
        print("RFP Sent At:", ngo_match.rfp_sent_at)

        # ---------------------------------------------------------
        # 2. Check whether THIS PROJECT + NGO already has RFP
        # ---------------------------------------------------------
        print("\nSTEP 2: Checking whether RFP was already sent")

        if ngo_match.rfp_sent:

            print("\n" + "=" * 60)
            print("RFP ALREADY SENT")
            print("=" * 60)

            print("Organization ID:", ngo_id)
            print("Project ID:", project_id)
            print("RFP Sent:", ngo_match.rfp_sent)
            print("RFP Sent At:", ngo_match.rfp_sent_at)
            print("STOPPING PROCESS")
            print("=" * 60)

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

        print("STEP 2 SUCCESS: RFP has NOT been sent")

        # ---------------------------------------------------------
        # 3. Get ProjectRequest
        # ---------------------------------------------------------
        print("\nSTEP 3: Finding ProjectRequest")

        print("Looking for project ID:", project_id)

        project_result = await db.execute(
            select(ProjectRequest)
            .where(
                ProjectRequest.id == project_id
            )
        )

        project = project_result.scalars().first()

        print("Project result:", project)

        if not project:
            print("STEP 3 FAILED: ProjectRequest not found")

            raise HTTPException(
                status_code=404,
                detail="Project request not found",
            )

        print("STEP 3 SUCCESS")

        print("Project ID:", project.id)
        print("Project Title:", project.project_title)

        # ---------------------------------------------------------
        # 4. Get NGO email
        # ---------------------------------------------------------
        print("\nSTEP 4: Getting NGO email")

        email = ngo_match.contact_email

        print("NGO Email:", email)

        if not email:
            print("STEP 4 FAILED: NGO email not found")

            raise HTTPException(
                status_code=400,
                detail="NGO email not found",
            )

        print("STEP 4 SUCCESS")

        # ---------------------------------------------------------
        # 5. Generate timestamps
        # ---------------------------------------------------------
        print("\nSTEP 5: Generating timestamps")

        received_at = datetime.now(timezone.utc)

        deadline = received_at + timedelta(days=15)

        print("Received At:", received_at)
        print("Deadline:", deadline)

        # ---------------------------------------------------------
        # 6. Send RFP email
        # ---------------------------------------------------------
        print("\nSTEP 6: Sending RFP email")

        print("Sending to:", email)

        email_result = await send_test_email(
            to_email=email,
            ngo_id=str(ngo_id),
        )

        print("STEP 6 SUCCESS: Email sent")
        print("Email Result:", email_result)

        # ---------------------------------------------------------
        # 7. Build RFP payload
        # ---------------------------------------------------------
        print("\nSTEP 7: Building RFP payload")

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

        print("STEP 7 SUCCESS")
        print("Payload RFP ID:", external_payload["id"])
        print("Payload Project ID:", external_payload["project_request_id"])
        print("Payload NGO ID:", external_payload["org_id"])

        # ---------------------------------------------------------
        # 8. Send RFP data to NGO application
        # ---------------------------------------------------------
        print("\nSTEP 8: Sending RFP data to NGO application")

        ngo_api_url = (
            "http://127.0.0.1:8000"
            "/api/v1/project-generator/rfp/receive_data"
        )

        print("NGO API:", ngo_api_url)

        async with httpx.AsyncClient(
            timeout=10.0
        ) as client:

            external_response = await client.post(
                ngo_api_url,
                json=external_payload,
            )

        print(
            "STEP 8 RESPONSE STATUS:",
            external_response.status_code,
        )

        print(
            "STEP 8 RESPONSE:",
            external_response.text,
        )

        # ---------------------------------------------------------
        # 9. Check NGO application response
        # ---------------------------------------------------------
        print("\nSTEP 9: Checking NGO application response")

        if external_response.status_code >= 400:

            print(
                "STEP 9 FAILED: NGO application rejected RFP"
            )

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

        print(
            "STEP 9 SUCCESS: NGO accepted RFP"
        )

        external_result = external_response.json()

        print("External Result:", external_result)

        # ---------------------------------------------------------
        # 10. Mark THIS project + NGO match as sent
        # ---------------------------------------------------------
        print("\nSTEP 10: Marking RFP as sent")

        ngo_match.rfp_sent = True
        ngo_match.rfp_sent_at = received_at

        print("Project ID:", ngo_match.project_id)
        print("Organization ID:", ngo_match.org_id)
        print("rfp_sent:", ngo_match.rfp_sent)
        print("rfp_sent_at:", ngo_match.rfp_sent_at)

        await db.commit()

        await db.refresh(ngo_match)

        print("STEP 10 SUCCESS: Database updated")

        # ---------------------------------------------------------
        # 11. Completed
        # ---------------------------------------------------------
        print("\nSTEP 11: RFP completed successfully")

        print("=" * 60)
        print("RFP SEND COMPLETED")
        print("=" * 60)

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

        print("\nHTTP ERROR:")
        print(str(e))

        await db.rollback()

        raise HTTPException(
            status_code=502,
            detail=(
                "Failed to communicate with "
                f"NGO application: {str(e)}"
            ),
        )

    except Exception as e:

        print("\nUNEXPECTED ERROR:")
        print(str(e))

        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )