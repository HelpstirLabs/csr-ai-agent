from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, Field
from app.core.database import get_db
from app.models.user import User
from app.middleware.auth import auth_middleware
from app.models.project_generator import ProjectRequest, ProjectNGOMatch
from typing import Optional, List
import uuid
import httpx
from app.services.email_service import send_email


rfp_router = APIRouter(
    prefix="/rfp",
    tags=["RFP"]
)


class EOIReceivedRequest(BaseModel):
    rfp_id: str
    org_id: str
    csr_id: Optional[str] = None
    project_request_id: str

    csr_name: Optional[str] = None

    selected_program_ids: Optional[List[str]] = None

    note: Optional[str] = None

    eoi_status: str = "submitted"

    interested: bool = True

    submitted_at: Optional[str] = None


@rfp_router.get("/list")
async def generate_project(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(auth_middleware),
):
    try:
        result = await db.execute(
            select(ProjectRequest)
            .where(
                ProjectRequest.created_by == current_user.id
            )
        )

        project_requests = result.scalars().all()

        if not project_requests:
            return {
                "success": True,
                "status_code": 200,
                "data": [],
                "count": 0
            }

        project_request_ids = [
            project.id
            for project in project_requests
        ]

        match_result = await db.execute(
            select(ProjectNGOMatch)
            .where(
                ProjectNGOMatch.project_id.in_(
                    project_request_ids
                )
            )
        )

        ngo_matches = match_result.scalars().all()

        matches_by_project = {}

        for match in ngo_matches:
            matches_by_project.setdefault(
                match.project_id,
                []
            ).append(match)

        data = []

        today = datetime.now(timezone.utc).date()

        for project in project_requests:

            project_matches = matches_by_project.get(
                project.id,
                []
            )

            # -----------------------------------
            # COUNTS
            # -----------------------------------

            ngo_matched_count = len(project_matches)

            rfp_sent_count = sum(
                1
                for match in project_matches
                if match.rfp_sent is True
            )

            eois_received_count = sum(
                1
                for match in project_matches
                if match.interested is True
            )

            accepted_count = sum(
                1
                for match in project_matches
                if match.accepted is True
            )

            rejected_count = sum(
                1
                for match in project_matches
                if match.declined is True
            )

            # -----------------------------------
            # DUE DATE
            # -----------------------------------

            due_date = None

            if project.created_at:
                due_date = project.created_at + timedelta(days=15)

            # Convert due date to date for comparison
            due_date_date = (
                due_date.date()
                if due_date
                else None
            )

            # -----------------------------------
            # STATUS
            # -----------------------------------

            status = "draft"

            # -----------------------------------
            # 1. CLOSED
            #
            # Today exceeds due date
            # AND no accepted
            # AND no rejected
            # -----------------------------------

            if (
                due_date_date
                and today > due_date_date
                and accepted_count == 0
                and rejected_count == 0
            ):
                status = "closed"

            # -----------------------------------
            # 2. NOT YET SENT
            #
            # NGOs matched
            # BUT no RFP sent
            # -----------------------------------

            elif (
                ngo_matched_count > 0
                and rfp_sent_count == 0
            ):
                status = "not_yet_sent"

            # -----------------------------------
            # 3. PARTNER ACCEPTED
            #
            # At least one NGO accepted
            # -----------------------------------

            elif accepted_count > 0:
                status = "partner_accepted"

            # -----------------------------------
            # 4. RESPONSES RECEIVED
            #
            # Interested = true
            # Accepted = false
            # Rejected = false
            # -----------------------------------

            elif any(
                match.interested is True
                and match.accepted is not True
                and match.declined is not True
                for match in project_matches
            ):
                status = "responses_received"

            # -----------------------------------
            # 5. SENT
            #
            # At least one RFP sent
            # but no response yet
            # -----------------------------------

            elif rfp_sent_count > 0:
                status = "sent"

            # -----------------------------------
            # RESPONSE
            # -----------------------------------

            data.append({
                "id": project.id,

                "status": status,

                "project_vision": project.vision,

                "geography": project.geography,

                "budget": project.budget,

                "created_at": project.created_at,

                "due_date": due_date,

                "ngo_matched_count": ngo_matched_count,

                "rfp_sent_count": rfp_sent_count,

                "eois_received_count": eois_received_count,

                "accepted_count": accepted_count,

                "rejected_count": rejected_count,
            })

        return {
            "success": True,
            "status_code": 200,
            "data": data,
            "count": len(data)
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch RFP data: {str(e)}"
        )

    
@rfp_router.get("/{project_id}")
async def get_rfp_project(
    project_id: str = Path(..., description="Project Request ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(auth_middleware),
):
    try:
        # ---------------------------------------------------------
        # 1. Get project request using project_id
        # ---------------------------------------------------------
        project_result = await db.execute(
            select(ProjectRequest)
            .where(
                ProjectRequest.id == project_id,
                ProjectRequest.created_by == current_user.id
            )
        )

        project = project_result.scalar_one_or_none()

        if not project:
            raise HTTPException(
                status_code=404,
                detail="Project not found"
            )

        # ---------------------------------------------------------
        # 2. Get all NGO matches for this project
        # ---------------------------------------------------------
        match_result = await db.execute(
            select(ProjectNGOMatch)
            .where(
                ProjectNGOMatch.project_id == project_id
            )
        )

        ngo_matches = match_result.scalars().all()

        # ---------------------------------------------------------
        # 3. Calculate counts
        # ---------------------------------------------------------
        ngo_matched_count = len(ngo_matches)

        rfp_sent_count = sum(
            1 for match in ngo_matches
            if match.rfp_sent is True
        )

        # ---------------------------------------------------------
        # 4. Calculate due date = project created_at + 15 days
        # ---------------------------------------------------------
        due_date = project.created_at + __import__("datetime").timedelta(days=15)

        # ---------------------------------------------------------
        # 5. Return response
        # ---------------------------------------------------------
        return {
            "success": True,
            "status_code": 200,
            "data": {
                "project_request": project,
                "ngo_matches": ngo_matches,
                "summary": {
                    "ngo_matched_count": ngo_matched_count,
                    "rfp_sent_count": rfp_sent_count,
                    "due_date": due_date
                }
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch RFP project: {str(e)}"
        )


@rfp_router.post("/eoi-received")
async def receive_eoi(
    payload: EOIReceivedRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        try:

            rfp_id = uuid.UUID(str(payload.rfp_id))
            org_id = uuid.UUID(str(payload.org_id))
            project_request_id = uuid.UUID(str(payload.project_request_id))

        except (ValueError, TypeError) as e:

            print(
                "INVALID UUID:",
                str(e)
            )

            raise HTTPException(
                status_code=400,
                detail="Invalid UUID provided",
            )

        result = await db.execute(
            select(ProjectNGOMatch)
            .where(
                ProjectNGOMatch.project_id
                == project_request_id,

                ProjectNGOMatch.org_id
                == org_id,
            )
        )

        ngo_match = (result.scalars().first())

        if not ngo_match:

            raise HTTPException(
                status_code=404,
                detail={
                    "message":
                        "Project NGO match not found",

                    "project_request_id":
                        str(project_request_id),

                    "org_id":
                        str(org_id),
                },
            )

        ngo_match.interested = (
            payload.interested
        )

        if payload.selected_program_ids:

            ngo_match.selected_program_ids = [
                str(program_id)
                for program_id
                in payload.selected_program_ids
            ]

        else:

            ngo_match.selected_program_ids = None

        if payload.note:

            note = payload.note.strip()

            ngo_match.eoi_note = (
                note[:500]
                if note
                else None
            )

        else:

            ngo_match.eoi_note = None

        await db.commit()

        await db.refresh(
            ngo_match
        )

        response_data = {

            "match_id":
                str(ngo_match.id),

            "rfp_id":
                str(rfp_id),

            "project_request_id":
                str(ngo_match.project_id),

            "org_id":
                str(ngo_match.org_id),

            "interested":
                ngo_match.interested,

            "selected_program_ids":
                ngo_match.selected_program_ids,

            "eoi_note":
                ngo_match.eoi_note,

            "rfp_sent":
                ngo_match.rfp_sent,

            "rfp_sent_at":
                (
                    ngo_match.rfp_sent_at.isoformat()
                    if ngo_match.rfp_sent_at
                    else None
                ),
        }

        return {
            "success": True,

            "message":
                "EOI information updated successfully",

            "data":
                response_data,
        }

    except HTTPException:
        raise

    except Exception as e:

        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@rfp_router.get("/eoi/{project_id}/{ngo_match_id}")
async def get_rfp_eoi_detail(
    project_id: UUID,
    ngo_match_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    try:
        # --------------------------------------------------
        # 1. Get Project
        # --------------------------------------------------

        project_result = await db.execute(
            select(ProjectRequest)
            .where(
                ProjectRequest.id == project_id
            )
        )

        project = project_result.scalar_one_or_none()

        if not project:
            raise HTTPException(
                status_code=404,
                detail="Project request not found",
            )

        # --------------------------------------------------
        # 2. Get NGO Match
        # --------------------------------------------------

        ngo_match_result = await db.execute(
            select(ProjectNGOMatch)
            .where(
                ProjectNGOMatch.id == ngo_match_id,
                ProjectNGOMatch.project_id == project_id,
            )
        )

        ngo_match = ngo_match_result.scalar_one_or_none()

        if not ngo_match:
            raise HTTPException(
                status_code=404,
                detail="NGO match not found for this project",
            )

        # --------------------------------------------------
        # 3. Get Selected Program IDs
        # --------------------------------------------------

        selected_program_ids = (
            ngo_match.selected_program_ids or []
        )

        selected_program_ids = [
            str(program_id)
            for program_id in selected_program_ids
        ]

        organization_id = (
            str(ngo_match.org_id)
            if ngo_match.org_id
            else None
        )

        print("ORGANIZATION ID:", organization_id)
        print(
            "SELECTED PROGRAM IDS:",
            selected_program_ids
        )

        # --------------------------------------------------
        # 4. Fetch Organization + Program Details
        # --------------------------------------------------

        organization = None
        programs = []

        if organization_id:

            async with httpx.AsyncClient() as client:

                program_response = await client.post(
                    "http://127.0.0.1:8000/api/v1/project-generator/programs/by-ids",
                    json={
                        "program_ids": selected_program_ids,
                        "org_id": organization_id,
                    },
                    timeout=10.0,
                )

            print(
                "PROGRAM API STATUS:",
                program_response.status_code
            )

            if program_response.status_code == 200:

                program_data = (
                    program_response.json()
                )

                response_data = (
                    program_data.get(
                        "data",
                        {}
                    )
                )

                # Organization details
                organization = (
                    response_data.get(
                        "organization"
                    )
                )

                # Program details
                programs = (
                    response_data.get(
                        "programs",
                        []
                    )
                )

                print(
                    "ORGANIZATION:",
                    organization
                )

                print(
                    "PROGRAMS:",
                    programs
                )

            else:

                print(
                    "Failed to fetch organization/program details:",
                    program_response.status_code,
                    program_response.text,
                )

        # --------------------------------------------------
        # 5. Final Response
        # --------------------------------------------------

        return {
            "success": True,
            "status_code": 200,

            "data": {

                # ------------------------------------------
                # NGO Match Details
                # ------------------------------------------

                "ngo": {
                    "match_id": str(ngo_match.id),

                    "organization_id": organization_id,

                    "name": ngo_match.name,

                    "description": ngo_match.description,

                    "area": ngo_match.area,

                    "selected_program_ids": selected_program_ids,

                    "eoi_note": ngo_match.eoi_note,

                    # EOI status from ProjectNGOMatch
                    "accepted": ngo_match.accepted,

                    "declined": ngo_match.declined,
                },

                # ------------------------------------------
                # Organization Details
                # ------------------------------------------

                "organization": organization,

                # ------------------------------------------
                # Selected Programs
                # ------------------------------------------

                "programs": programs,
            },

        }

    except HTTPException:
        raise

    except Exception as e:

        print(
            "ERROR GETTING EOI DETAILS:",
            str(e)
        )

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to fetch EOI details: {str(e)}"
            ),
        )
    

@rfp_router.post("/eoi/accept/{ngo_match_id}")
async def accept_eoi(
    ngo_match_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            select(ProjectNGOMatch)
            .where(
                ProjectNGOMatch.id == ngo_match_id
            )
        )

        ngo_match = result.scalar_one_or_none()

        if not ngo_match:
            raise HTTPException(
                status_code=404,
                detail="NGO match not found",
            )

        # --------------------------------------------------
        # Get NGO email
        # --------------------------------------------------

        ngo_email = ngo_match.contact_email

        if not ngo_email:
            raise HTTPException(
                status_code=400,
                detail="NGO email address not available",
            )

        print("NGO EMAIL:", ngo_email)

        # --------------------------------------------------
        # Update EOI status
        # --------------------------------------------------

        ngo_match.interested = True
        ngo_match.accepted = True
        ngo_match.declined = False

        await db.commit()
        await db.refresh(ngo_match)

        # --------------------------------------------------
        # Send accepted email
        # --------------------------------------------------

        subject = "Your EOI has been accepted"

        body = f"""
Hello {ngo_match.name or "Team"},

We are pleased to inform you that your Expression of Interest (EOI)
has been accepted.

Our team will be in touch with you shortly regarding the next steps.

Thank you for your interest and participation.

Regards,
HELPSTiR Team
"""

        await send_email(
            to_email=ngo_email,
            subject=subject,
            body=body,
        )

        return {
            "success": True,
            "message": "EOI accepted and email sent successfully",
            "data": {
                "ngo_match_id": str(ngo_match.id),
                "interested": ngo_match.interested,
                "accepted": ngo_match.accepted,
                "declined": ngo_match.declined,
                "email": ngo_email,
            },
        }

    except HTTPException:
        raise

    except Exception as e:

        await db.rollback()

        print(
            "ERROR ACCEPTING EOI:",
            str(e)
        )

        raise HTTPException(
            status_code=500,
            detail=f"Failed to accept EOI: {str(e)}",
        )


@rfp_router.post("/eoi/decline/{ngo_match_id}")
async def decline_eoi(
    ngo_match_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            select(ProjectNGOMatch)
            .where(
                ProjectNGOMatch.id == ngo_match_id
            )
        )

        ngo_match = result.scalar_one_or_none()

        if not ngo_match:
            raise HTTPException(
                status_code=404,
                detail="NGO match not found",
            )

        # --------------------------------------------------
        # Get NGO email
        # --------------------------------------------------

        ngo_email = ngo_match.contact_email

        if not ngo_email:
            raise HTTPException(
                status_code=400,
                detail="NGO email address not available",
            )

        # --------------------------------------------------
        # Update EOI status
        # --------------------------------------------------

        ngo_match.interested = False
        ngo_match.accepted = False
        ngo_match.declined = True

        await db.commit()
        await db.refresh(ngo_match)

        # --------------------------------------------------
        # Send rejection email
        # --------------------------------------------------

        subject = "Update on your EOI submission"

        body = f"""
Dear {ngo_match.name or "Team"},

Thank you for expressing your interest in partnering with us.

After reviewing your Expression of Interest (EOI), we regret to inform you
that your EOI has not been selected to proceed at this stage.

We appreciate the time and effort your organisation has invested in
submitting the EOI and hope to have an opportunity to engage with you
on suitable opportunities in the future.

Thank you for your understanding.

Regards,
HELPSTiR Team
"""

        await send_email(
            to_email=ngo_email,
            subject=subject,
            body=body,
        )

        return {
            "success": True,
            "message": "EOI declined and rejection email sent successfully",
            "data": {
                "ngo_match_id": str(ngo_match.id),
                "interested": ngo_match.interested,
                "accepted": ngo_match.accepted,
                "declined": ngo_match.declined,
            },
        }

    except HTTPException:
        raise

    except Exception as e:

        await db.rollback()

        print(
            "ERROR DECLINING EOI:",
            str(e)
        )

        raise HTTPException(
            status_code=500,
            detail=f"Failed to decline EOI: {str(e)}",
        )