import os
import asyncio
import json

from anthropic import Anthropic, OverloadedError

from app.services.reference_docs import REFERENCE_CONTENT

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


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

    max_retries = 5

    for attempt in range(max_retries):

        try:
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

            if (
                not response.content
                or len(response.content) == 0
            ):
                raise Exception(
                    "Claude returned empty content."
                )

            raw_text = response.content[0].text.strip()

            cleaned_text = raw_text

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

            try:
                result = json.loads(
                    cleaned_text
                )

            except json.JSONDecodeError as json_error:
                raise Exception(
                    "Claude returned invalid JSON."
                )

            if not isinstance(result, dict):

                raise Exception(
                    "Claude response must be a JSON object."
                )

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

            if not project_title:

                raise Exception(
                    "Missing project_title in Claude response."
                )

            if not proposal:

                raise Exception(
                    "Missing proposal in Claude response."
                )

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

            key_activities = [
                str(activity).strip()
                for activity in key_activities
                if activity
            ]
            partner_requirements = [
                str(requirement).strip()
                for requirement in partner_requirements
                if requirement
            ]

            if not key_activities:

                raise Exception(
                    "No valid key activities generated."
                )


            if not partner_requirements:

                raise Exception(
                    "No valid partner requirements generated."
                )

            for index, activity in enumerate(
                key_activities,
                start=1
            ):

                print(
                    f"{index}. {activity}"
                )

            for index, requirement in enumerate(
                partner_requirements,
                start=1
            ):

                print(
                    f"{index}. {requirement}"
                )

            return {
                "project_title": project_title,
                "proposal": proposal,
                "key_activities": key_activities,
                "partner_requirements": partner_requirements,
            }
        except OverloadedError:

            wait_time = min(
                2 ** attempt,
                30
            )

            if attempt == max_retries - 1:

                raise Exception(
                    "Claude is currently overloaded. "
                    "Please try again in a few minutes."
                )

            await asyncio.sleep(
                wait_time
            )

        except Exception as e:

            raise Exception(
                f"Proposal generation failed: {str(e)}"
            )