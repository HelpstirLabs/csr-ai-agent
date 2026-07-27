import os
import asyncio
from anthropic import Anthropic, OverloadedError
import json
import re

from app.services.reference_docs import REFERENCE_CONTENT

client = Anthropic(
    api_key=os.getenv("ANTHROPIC_API_KEY")
)


async def generate_proposal(
    vision: str,
    gender: str,
    geography: str,
    budget: str,
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

IMPORTANT

- Mention the selected geography naturally.
- Align recommendations with the selected beneficiaries.
- Align the budget with the provided budget.
- Ensure all sections are completed.
- No placeholders.
- Create a realistic project title.
- Return plain text only.
- No markdown.
- No JSON.
"""

    max_retries = 5

    for attempt in range(max_retries):
        try:

            print(
                f"Claude proposal generation attempt "
                f"{attempt + 1}/{max_retries}"
            )

            response = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=2500,
                temperature=0.6,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            if (
                not response.content
                or len(response.content) == 0
            ):
                raise Exception(
                    "Claude returned empty content."
                )

            proposal_text = response.content[0].text

            print(
                f"Proposal generated successfully "
                f"({len(proposal_text)} chars)"
            )

            return proposal_text

        except OverloadedError as e:

            wait_time = min(2 ** attempt, 30)

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

            await asyncio.sleep(wait_time)

        except Exception as e:

            print(
                f"Claude proposal generation failed: "
                f"{str(e)}"
            )

            raise Exception(
                f"Proposal generation failed: {str(e)}"
            )



def extract_json(text: str):
    """
    Extract JSON array or object from Claude response.
    Arrays are checked first because Claude usually returns:
    [
        {...}
    ]
    """

    text = text.strip()

    # Remove markdown fences
    text = re.sub(r"^```json\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"^```\s*", "", text)
    text = re.sub(r"\s*```$", "", text)

    # Try parsing entire response directly
    try:
        return json.loads(text)
    except Exception:
        pass

    # Check for JSON array FIRST
    arr_match = re.search(r"\[.*\]", text, re.DOTALL)
    if arr_match:
        return json.loads(arr_match.group())

    # Then check for JSON object
    obj_match = re.search(r"\{.*\}", text, re.DOTALL)
    if obj_match:
        return json.loads(obj_match.group())

    raise ValueError(
        f"No valid JSON found in response:\n{text}"
    )
async def rank_ngos(
    csr_requirement: dict,
    ngo_data: list,
    top_k: int = 3
):
    """
    Returns:
    [
        {
            "org_id": "...",
            "score": 95,
            "reason": "..."
        }
    ]

    OR

    []
    """


    for ngo in ngo_data:
        print(
            f"ORG ID: {ngo.get('org_id')} | "
            f"Location Needs: {len(ngo.get('location_needs', []))} | "
            f"Services: {len(ngo.get('services', []))}"
        )


    prompt = f"""
                You are a CSR-NGO matching expert.

                CSR Requirement: {json.dumps(csr_requirement, indent=2)}

                Available NGOs: {json.dumps(ngo_data, indent=2, default=str)}

                Task:

                1. Analyze every NGO.
                2. Compare NGO services and location needs against CSR requirements.
                3. Consider:
                - geography alignment
                - beneficiary alignment
                - service relevance
                - need relevance
                - impact potential
                - CSR readiness

                4. Score each NGO from 0 to 100.
                5. Keep only NGOs with score >= 50.
                6. Sort by score descending.
                7. Return only top {top_k} NGOs.

                IMPORTANT RULES:

                - Return ONLY valid JSON.
                - No markdown.
                - No explanations outside JSON.
                - If no NGO qualifies, return an empty JSON array [].
                - Do not include any text before or after the JSON.

                Output format:

                [
                {{
                    "org_id": "123",
                    "score": 95,
                    "reason": "Strong alignment with CSR objectives"
                }}
                ]

                OR

                []
                """

    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2000,
            temperature=0,
            system="""
                    You are a JSON API.

                    Return valid JSON only.

                    Do not use markdown.
                    Do not use ```json.
                    Do not provide explanations outside JSON.
                    If no NGOs match, return [].
                    """,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        content = response.content[0].text.strip()

        print("\n========== NGO RANKING RAW RESPONSE ==========")
        print(content)
        print("==============================================\n")

        result = extract_json(content)

        print("\n========== PARSED RESULT ==========")
        print(result)
        print(type(result))
        print("===================================\n")

        # Ensure result is always a list
        if isinstance(result, list):
            return result

        if isinstance(result, dict):
            return result.get("matched_ngos", [])

        return []

    except Exception as e:
        print("\n========== NGO RANKING ERROR ==========")
        print(str(e))
        print("=======================================\n")

        # Return empty list instead of crashing
        return []


