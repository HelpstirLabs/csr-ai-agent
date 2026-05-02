"""Trust Score and Impact Score computation for NGOs."""
from __future__ import annotations

from src.models.ngo import NGOProfile


TRUST_WEIGHTS = {
    "registration_12a": 18,
    "registration_80g": 15,
    "fcra_status": 12,
    "csr1_registration": 10,
    "clean_audit_3yr": 15,
    "no_adverse_news": 15,
    "leadership_stability": 8,
    "mca21_match": 7,
}


def compute_trust_score(ngo: NGOProfile) -> float:
    score = 0.0
    for field, weight in TRUST_WEIGHTS.items():
        if getattr(ngo, field, False):
            score += weight
    return score


def trust_score_breakdown(ngo: NGOProfile) -> list[dict]:
    breakdown = []
    for field, weight in TRUST_WEIGHTS.items():
        has_it = getattr(ngo, field, False)
        breakdown.append({
            "credential": field,
            "points": weight,
            "earned": has_it,
            "earned_points": weight if has_it else 0,
        })
    return breakdown
