import os
import asyncio
import json

from anthropic import Anthropic, OverloadedError

from app.services.reference_docs import REFERENCE_CONTENT


client = Anthropic(
    api_key=os.getenv("ANTHROPIC_API_KEY")
)


async def generate_proposal(
    vision: str,
    gender: str | None = None,
    geography: str | None = None,
    budget: str | None = None,
    duration: str | None = None,
    beneficiary: list[str] | None = None,
    area: str | None = None,
    scale: str | None = None,
    age_group: str | None = None,
    gender_focus: str | None = None,
    technology_approach: str | None = None,
    timeline_type: str | None = "estimated",
    start: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    section135: bool = False,
):

    beneficiary = beneficiary or []

    beneficiary_text = ", ".join(beneficiary) if beneficiary else "Not specified"

    if timeline_type == "exact":
        timeline_text = (
            f"Exact Start Date: {start_date or 'Not specified'}\n"
            f"Exact End Date: {end_date or 'Not specified'}"
        )
    else:
        timeline_text = (
            f"Timeline Type: Estimated\n"
            f"Expected Start: {start or 'Not specified'}"
        )

    section135_text = (
        "Yes - The project should be aligned with Section 135 CSR requirements."
        if section135
        else "No specific Section 135 requirement selected."
    )

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

Vision:
{vision}

Gender:
{gender or "Not specified"}

Geography:
{geography or "Not specified"}

Budget:
{budget or "Not specified"}

Duration:
{duration or "Not specified"}

Target Community / Beneficiaries:
{beneficiary_text}

Focus Area:
{area or "Not specified"}

Scale:
{scale or "Not specified"}

Age Group:
{age_group or "Not specified"}

Gender Focus:
{gender_focus or "Not specified"}

Technology Approach:
{technology_approach or "Not specified"}

Timeline:
{timeline_text}

Section 135 CSR Requirement:
{section135_text}

--------------------------------------------------

IMPORTANT PROJECT ALIGNMENT RULES

The proposal MUST be directly based on the project details
provided above.

Do not ignore any selected field.

1. VISION

The vision must be the central purpose of the project.

All objectives, activities, outcomes and recommendations
must support this vision.

2. GEOGRAPHY

Design the implementation approach for the selected geography.

Mention the geography naturally in the proposal.

Activities should be realistic for the selected geography.

3. TARGET COMMUNITY

The selected target communities are:

{beneficiary_text}

The project must be designed specifically for these
beneficiaries.

Do not replace them with generic beneficiaries.

If multiple beneficiaries are selected, address all of them
appropriately.

4. FOCUS AREA

The selected focus area is:

{area or "Not specified"}

Ensure the project approach and activities are relevant
to this focus area.

5. SCALE

The selected implementation scale is:

{scale or "Not specified"}

The implementation model, monitoring approach and partner
requirements should be appropriate for this scale.

6. AGE GROUP

The selected age group is:

{age_group or "Not specified"}

Where applicable, activities and outcomes should reflect
the selected age group.

7. GENDER FOCUS

The selected gender focus is:

{gender_focus or "Not specified"}

Ensure the programme design reflects this focus.

8. TECHNOLOGY APPROACH

The selected technology approach is:

{technology_approach or "Not specified"}

If a technology approach is selected, incorporate it
meaningfully into the implementation methodology.

Do not add unnecessary technology if the selected approach
is "No tech, community-led".

9. BUDGET

Budget:

{budget or "Not specified"}

The proposed activities must be financially realistic
within the stated budget.

Do not propose activities that would obviously exceed
the available budget.

10. DURATION

Duration:

{duration or "Not specified"}

Ensure the implementation activities and outcomes can
realistically be achieved within this duration.

11. TIMELINE

{timeline_text}

The implementation timeline in the proposal must reflect
the selected timeline.

12. SECTION 135

{section135_text}

If Section 135 is selected, ensure the proposal uses
appropriate CSR terminology and includes suitable
monitoring, reporting, compliance and outcome measurement
considerations.

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
- Align the project with the selected focus area.
- Align the project with the selected scale.
- Align activities with the selected age group.
- Respect the selected gender focus.
- Respect the selected technology approach.
- Align the budget with the provided budget.
- Align the implementation timeline with the selected duration
  and timeline.
- No placeholders.
- Create a realistic project title.
- Do not invent a different budget.
- Do not invent a different geography.
- Do not replace the selected beneficiaries.
- Do not ignore the additional project details.

--------------------------------------------------

GENERATE THE FOLLOWING

1. PROJECT TITLE

Create a clear, realistic and donor-friendly CSR
project title based on all relevant project details.

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

The proposal must reflect:

- Vision
- Geography
- Target beneficiaries
- Focus area
- Scale
- Age group
- Gender focus
- Technology approach
- Budget
- Duration
- Timeline
- Section 135 requirement where applicable

3. KEY ACTIVITIES

Generate 5–8 specific activities that will actually
be implemented as part of this project.

The activities must:

- Directly support the project objectives.
- Be realistic for the selected geography.
- Be appropriate for the selected beneficiaries.
- Reflect the selected focus area.
- Reflect the selected age group where relevant.
- Reflect the selected gender focus where relevant.
- Incorporate the selected technology approach where relevant.
- Be achievable within the stated budget.
- Be practical for an NGO implementation partner.
- Be appropriate for the selected implementation scale.
- Be specific rather than generic.

4. WHAT THE CSR FUNDER IS LOOKING FOR IN A PARTNER

Generate 5–8 specific requirements that a CSR funder
would expect from an NGO/implementation partner for
this particular project.

Consider:

- Relevant project experience
- Geographic presence
- Experience with the target beneficiaries
- Experience in the selected focus area
- Community mobilisation
- Programme implementation capability
- Experience at the selected scale
- Monitoring and evaluation
- Beneficiary tracking
- Financial accountability
- CSR reporting
- Compliance and documentation
- Government/community coordination
- Sustainability
- Outcome measurement
- Technology capability where relevant

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
                    :-len("```"):
                ]

            cleaned_text = cleaned_text.strip()

            try:

                result = json.loads(
                    cleaned_text
                )

            except json.JSONDecodeError:

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