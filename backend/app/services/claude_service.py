import os
import asyncio
import json

from anthropic import Anthropic, OverloadedError

from app.services.reference_docs import REFERENCE_CONTENT


# ============================================================
# ANTHROPIC CLIENT
# ============================================================

client = Anthropic(
    api_key=os.getenv("ANTHROPIC_API_KEY")
)


# ============================================================
# GENERATE CSR PROPOSAL
# ============================================================

async def generate_proposal(
    vision: str,
    gender: str,
    geography: str,
    budget: str,
    duration:str,
    beneficiary: str,
    area: str,
    scale: str,
):
    prompt = f"""
You are an expert CSR proposal writer.

REFERENCE DOCUMENTS

The following documents are approved CSR concept notes,
proposal references, implementation approaches, and
writing samples.

Use them as guidance for:

- Writing style
- Proposal structure
- CSR terminology
- Budget presentation
- Implementation methodology
- Outcome design
- Monitoring and evaluation approaches

Do NOT copy text verbatim.

Create a new proposal inspired by these references.

REFERENCE CONTENT:

{REFERENCE_CONTENT}

--------------------------------------------------

PROJECT DETAILS

Vision: {vision}
Gender Focus: {gender}
Geography: {geography}
Budget: {budget}
Duration: {duration}
Beneficiaries: {beneficiary}
Area Focus: {area}
Scale: {scale}

--------------------------------------------------

IMPORTANT WRITING RULES

- Total proposal length: 700–1000 words maximum.
- Keep every section concise and meaningful.
- Avoid long storytelling.
- Use short paragraphs.
- Ensure all sections are completed.
- Keep the proposal donor-ready and business-oriented.
- Follow the style and quality of the reference documents.
- Create original content.
- Do not copy any section from the references.
- Mention the selected geography naturally.
- Align recommendations with the selected beneficiaries.
- Align the budget with the provided budget.
- Ensure all sections are completed.
- No placeholders.
- Create a realistic project title.

--------------------------------------------------

GENERATE THE FOLLOWING

1. PROJECT TITLE

Create a clear, realistic and donor-friendly CSR
project title based on the project details.

2. PROPOSAL

Generate the following sections:

PROJECT TITLE

EXECUTIVE SUMMARY

PROBLEM STATEMENT

PROJECT OBJECTIVES

TARGET BENEFICIARIES

PROJECT APPROACH

EXPECTED OUTCOMES

IMPLEMENTATION TIMELINE

ESTIMATED BUDGET SUMMARY

CONCLUSION

3. KEY ACTIVITIES

Generate 5–8 specific activities that will actually
be implemented as part of this project.

The activities must:

- Directly support the project objectives.
- Be realistic for the selected geography.
- Be appropriate for the selected beneficiaries.
- Be achievable within the stated budget.
- Be practical for an NGO implementation partner.
- Be specific rather than generic.

4. WHAT THE CSR FUNDER IS LOOKING FOR IN A PARTNER

Generate 5–8 specific requirements that a CSR funder
would expect from an NGO/implementation partner for
this particular project.

Consider:

- Relevant project experience
- Geographic presence
- Experience with the target beneficiaries
- Community mobilisation
- Programme implementation capability
- Monitoring and evaluation
- Beneficiary tracking
- Financial accountability
- CSR reporting
- Compliance and documentation
- Government/community coordination
- Sustainability
- Outcome measurement

Make the requirements specific to this project.
Do not return generic NGO requirements.

--------------------------------------------------

OUTPUT FORMAT

Return ONLY valid JSON.

Use exactly this structure:

{{
    "project_title": "string",
    "proposal": "string",
    "key_activities": [
        "activity 1",
        "activity 2",
        "activity 3"
    ],
    "partner_requirements": [
        "requirement 1",
        "requirement 2",
        "requirement 3"
    ]
}}

IMPORTANT:

- Return valid JSON only.
- Do not wrap the JSON in markdown.
- Do not use ```json.
- Do not add explanations outside the JSON.
- Do not leave any field empty.
- key_activities must contain 5–8 items.
- partner_requirements must contain 5–8 items.
"""


    # ========================================================
    # RETRY CONFIGURATION
    # ========================================================

    max_retries = 5


    # ========================================================
    # CLAUDE REQUEST
    # ========================================================

    for attempt in range(max_retries):

        try:

            print(
                "\n"
                "=================================================="
            )

            print(
                f"Claude proposal generation attempt "
                f"{attempt + 1}/{max_retries}"
            )

            print(
                "=================================================="
            )


            response = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=4000,
                temperature=0.6,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
            )


            # =================================================
            # CHECK RESPONSE
            # =================================================

            if (
                not response.content
                or len(response.content) == 0
            ):
                raise Exception(
                    "Claude returned empty content."
                )


            raw_text = response.content[0].text.strip()


            print(
                f"Claude response received "
                f"({len(raw_text)} characters)"
            )


            # =================================================
            # CLEAN RESPONSE
            # =================================================

            cleaned_text = raw_text


            # Remove accidental markdown code fences
            if cleaned_text.startswith("```json"):

                cleaned_text = cleaned_text[
                    len("```json"):
                ]


            elif cleaned_text.startswith("```"):

                cleaned_text = cleaned_text[
                    len("```"):
                ]


            if cleaned_text.endswith("```"):

                cleaned_text = cleaned_text[
                    :-len("```")
                ]


            cleaned_text = cleaned_text.strip()


            # =================================================
            # PARSE JSON
            # =================================================

            try:

                result = json.loads(
                    cleaned_text
                )

            except json.JSONDecodeError as json_error:

                print(
                    "\nClaude returned invalid JSON."
                )

                print(
                    f"JSON error: {json_error}"
                )

                print(
                    "\nRaw Claude response:"
                )

                print(raw_text)

                raise Exception(
                    "Claude returned invalid JSON."
                )


            # =================================================
            # VALIDATE RESPONSE TYPE
            # =================================================

            if not isinstance(result, dict):

                raise Exception(
                    "Claude response must be a JSON object."
                )


            # =================================================
            # GET GENERATED VALUES
            # =================================================

            project_title = result.get(
                "project_title"
            )

            proposal = result.get(
                "proposal"
            )

            key_activities = result.get(
                "key_activities"
            )

            partner_requirements = result.get(
                "partner_requirements"
            )


            # =================================================
            # VALIDATE PROJECT TITLE
            # =================================================

            if not project_title:

                raise Exception(
                    "Missing project_title in Claude response."
                )


            # =================================================
            # VALIDATE PROPOSAL
            # =================================================

            if not proposal:

                raise Exception(
                    "Missing proposal in Claude response."
                )


            # =================================================
            # VALIDATE KEY ACTIVITIES
            # =================================================

            if not isinstance(
                key_activities,
                list
            ):

                raise Exception(
                    "key_activities must be a list."
                )


            if len(key_activities) == 0:

                raise Exception(
                    "key_activities cannot be empty."
                )


            # =================================================
            # VALIDATE PARTNER REQUIREMENTS
            # =================================================

            if not isinstance(
                partner_requirements,
                list
            ):

                raise Exception(
                    "partner_requirements must be a list."
                )


            if len(partner_requirements) == 0:

                raise Exception(
                    "partner_requirements cannot be empty."
                )


            # =================================================
            # CLEAN KEY ACTIVITIES
            # =================================================

            key_activities = [
                str(activity).strip()
                for activity in key_activities
                if activity
            ]


            # =================================================
            # CLEAN PARTNER REQUIREMENTS
            # =================================================

            partner_requirements = [
                str(requirement).strip()
                for requirement in partner_requirements
                if requirement
            ]


            # =================================================
            # FINAL VALIDATION
            # =================================================

            if not key_activities:

                raise Exception(
                    "No valid key activities generated."
                )


            if not partner_requirements:

                raise Exception(
                    "No valid partner requirements generated."
                )


            # =================================================
            # PRINT PROJECT TITLE
            # =================================================

            print(
                "\n"
                "=================================================="
            )

            print(
                "PROJECT TITLE"
            )

            print(
                "=================================================="
            )

            print(
                project_title
            )


            # =================================================
            # PRINT KEY ACTIVITIES
            # =================================================

            print(
                "\n"
                "=================================================="
            )

            print(
                "KEY ACTIVITIES"
            )

            print(
                "=================================================="
            )

            for index, activity in enumerate(
                key_activities,
                start=1
            ):

                print(
                    f"{index}. {activity}"
                )


            # =================================================
            # PRINT PARTNER REQUIREMENTS
            # =================================================

            print(
                "\n"
                "=================================================="
            )

            print(
                "WHAT THE CSR FUNDER IS LOOKING FOR IN A PARTNER"
            )

            print(
                "=================================================="
            )

            for index, requirement in enumerate(
                partner_requirements,
                start=1
            ):

                print(
                    f"{index}. {requirement}"
                )


            # =================================================
            # PRINT PROPOSAL
            # =================================================

            print(
                "\n"
                "=================================================="
            )

            print(
                "PROPOSAL"
            )

            print(
                "=================================================="
            )

            print(
                proposal
            )


            # =================================================
            # PRINT GENERATION SUMMARY
            # =================================================

            print(
                "\n"
                "=================================================="
            )

            print(
                "PROPOSAL GENERATION COMPLETED"
            )

            print(
                "=================================================="
            )

            print(
                f"Project title: {project_title}"
            )

            print(
                f"Key activities: "
                f"{len(key_activities)}"
            )

            print(
                f"Partner requirements: "
                f"{len(partner_requirements)}"
            )

            print(
                f"Proposal characters: "
                f"{len(proposal)}"
            )

            print(
                "==================================================\n"
            )


            # =================================================
            # RETURN STRUCTURED RESULT
            # =================================================

            return {
                "project_title": project_title,
                "proposal": proposal,
                "key_activities": key_activities,
                "partner_requirements": partner_requirements,
            }


        # =====================================================
        # CLAUDE OVERLOADED
        # =====================================================

        except OverloadedError:

            wait_time = min(
                2 ** attempt,
                30
            )

            print(
                f"Claude overloaded "
                f"(attempt {attempt + 1}/{max_retries})"
            )

            print(
                f"Retrying in {wait_time} seconds..."
            )


            if attempt == max_retries - 1:

                raise Exception(
                    "Claude is currently overloaded. "
                    "Please try again in a few minutes."
                )


            await asyncio.sleep(
                wait_time
            )


        # =====================================================
        # OTHER ERRORS
        # =====================================================

        except Exception as e:

            print(
                "\n"
                "=================================================="
            )

            print(
                "CLAUDE PROPOSAL GENERATION FAILED"
            )

            print(
                "=================================================="
            )

            print(
                str(e)
            )

            print(
                "==================================================\n"
            )

            raise Exception(
                f"Proposal generation failed: {str(e)}"
            )