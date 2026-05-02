"""Orchestrates AI-powered CSR project generation."""
from __future__ import annotations

import json
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from src.ai.engine import AIEngine
from src.ai.prompts.project_generator import SYSTEM_PROMPT, PROJECT_GENERATION_PROMPT
from src.models.ngo import NGOProfile, NGOProgramme, LocationNeed
from src.models.project import Project, NGORecommendation
from src.models.enums import ProjectStatus, ScheduleVIIHead

logger = logging.getLogger(__name__)


def _extract_json(text: str) -> dict:
    """Extract JSON object from AI response, handling markdown fences and surrounding text."""
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strip markdown code fences
    import re
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fenced:
        try:
            return json.loads(fenced.group(1))
        except json.JSONDecodeError:
            pass

    # Find the outermost JSON object by brace matching
    start = text.find("{")
    if start < 0:
        raise ValueError("AI returned no JSON object")

    depth = 0
    in_string = False
    escape = False
    for i in range(start, len(text)):
        c = text[i]
        if escape:
            escape = False
            continue
        if c == "\\":
            escape = True
            continue
        if c == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(text[start:i + 1])
                except json.JSONDecodeError:
                    raise ValueError("AI returned malformed JSON")

    raise ValueError("AI returned incomplete JSON object")


def _format_ngo_data(profiles: list[NGOProfile], programmes: list[NGOProgramme]) -> str:
    lines = []
    for ngo in profiles:
        prog_lines = []
        for p in programmes:
            if p.ngo_id == ngo.id:
                prog_lines.append(f"  - {p.title} ({p.location_state}, {p.location_district}): {p.beneficiary_count} beneficiaries, {p.outcomes}")
        lines.append(
            f"NGO #{ngo.id}: {ngo.name}\n"
            f"  Trust Score: {ngo.trust_score}/100 | Impact Score: {ngo.impact_score}/100\n"
            f"  Areas: {', '.join(ngo.thematic_areas)} | Regions: {', '.join(ngo.operating_states)}\n"
            f"  Programmes:\n" + ("\n".join(prog_lines) if prog_lines else "  (none)")
        )
    return "\n\n".join(lines)


def _format_location_needs(needs: list[LocationNeed]) -> str:
    if not needs:
        return "(No location-specific data available)"
    lines = []
    for n in needs:
        lines.append(
            f"- {n.state}, {n.district}: {n.description}\n"
            f"  Gaps: {', '.join(n.demographic_gaps)} | Problems: {', '.join(n.community_problems)}\n"
            f"  Capacity: {n.delivery_capacity}"
        )
    return "\n".join(lines)


async def generate_project(
    ai: AIEngine,
    session: AsyncSession,
    funder_id: int,
    brief_text: str,
    theme: str | None = None,
    geography: str | None = None,
    budget_inr: float | None = None,
    demographic: str | None = None,
    gender_focus: str | None = None,
    beneficiary_type: str | None = None,
    technology_approach: str | None = None,
    scale: str | None = None,
    model: str | None = None,
) -> Project:
    # Fetch NGO data — filter by theme/geography for relevance, fall back to top 3 by trust score
    all_result = await session.execute(select(NGOProfile).order_by(NGOProfile.trust_score.desc()))
    all_profiles = list(all_result.scalars().all())

    geo_lower = (geography or "").lower()
    theme_lower = (theme or "").lower()

    def _ngo_relevance(ngo: NGOProfile) -> int:
        score = 0
        if theme_lower and any(theme_lower in t.lower() for t in ngo.thematic_areas):
            score += 2
        if geo_lower:
            if any(geo_lower in s.lower() for s in ngo.operating_states):
                score += 2
            if any(geo_lower in d.lower() for d in ngo.operating_districts):
                score += 1
        return score

    ranked = sorted(all_profiles, key=lambda n: (_ngo_relevance(n), n.trust_score), reverse=True)
    ngo_profiles = ranked[:5]

    ngo_ids = [n.id for n in ngo_profiles]
    prog_result = await session.execute(select(NGOProgramme).where(NGOProgramme.ngo_id.in_(ngo_ids)))
    programmes = list(prog_result.scalars().all())

    needs_query = select(LocationNeed).where(LocationNeed.ngo_id.in_(ngo_ids))
    needs_result = await session.execute(needs_query)
    location_needs = list(needs_result.scalars().all())

    prompt = PROJECT_GENERATION_PROMPT.format(
        brief_text=brief_text,
        theme=theme or "Not specified",
        geography=geography or "Not specified",
        budget=f"{budget_inr:,.0f}" if budget_inr else "Not specified",
        demographic=demographic or "Not specified",
        gender_focus=gender_focus or "Not specified",
        beneficiary_type=beneficiary_type or "Not specified",
        technology_approach=technology_approach or "Not specified",
        scale=scale or "Not specified",
        ngo_data=_format_ngo_data(ngo_profiles, programmes),
        location_needs=_format_location_needs(location_needs),
    )

    response = await ai.generate(prompt, system=SYSTEM_PROMPT, model=model, temperature=0.4, max_tokens=8192)

    parsed = _extract_json(response.text)

    schedule_head = None
    raw_head = parsed.get("schedule_vii_head", "")
    try:
        schedule_head = ScheduleVIIHead(raw_head)
    except ValueError:
        pass

    project = Project(
        funder_id=funder_id,
        status=ProjectStatus.GENERATED,
        title=parsed["title"],
        problem_statement=parsed.get("problem_statement", ""),
        intervention_logic=parsed.get("intervention_logic", ""),
        projected_outcomes=parsed.get("projected_outcomes", ""),
        me_framework=parsed.get("me_framework", ""),
        schedule_vii_head=schedule_head,
        brief_text=brief_text,
        brief_theme=theme,
        brief_geography=geography,
        brief_budget_inr=budget_inr,
        brief_demographic=demographic,
        brief_gender_focus=gender_focus,
        brief_beneficiary_type=beneficiary_type,
        brief_technology_approach=technology_approach,
        brief_scale=scale,
    )
    session.add(project)
    await session.flush()

    for rec in parsed.get("ngo_recommendations", []):
        ngo_rec = NGORecommendation(
            project_id=project.id,
            ngo_id=rec["ngo_id"],
            rank=rec["rank"],
            match_score=rec.get("match_score", 0),
            rationale=rec.get("rationale", ""),
        )
        session.add(ngo_rec)

    await session.commit()
    await session.refresh(project)
    return project
