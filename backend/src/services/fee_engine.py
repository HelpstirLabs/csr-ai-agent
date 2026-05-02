"""Platform facilitation fee calculation per the HELPSTiR tiered model."""
from __future__ import annotations

from dataclasses import dataclass

TIERS = [
    (25_00_000, 0.10),
    (75_00_000, 0.06),
    (2_00_00_000, 0.04),
    (float("inf"), 0.03),
]


@dataclass
class FeeResult:
    project_value_inr: float
    fee_percent: float
    fee_inr: float
    tier_label: str


def compute_platform_fee(project_value_inr: float) -> FeeResult:
    for ceiling, rate in TIERS:
        if project_value_inr <= ceiling:
            fee = project_value_inr * rate
            if ceiling == 25_00_000:
                label = "Small/pilot"
            elif ceiling == 75_00_000:
                label = "Standard"
            elif ceiling == 2_00_00_000:
                label = "Mid-scale"
            else:
                label = "Enterprise"
            return FeeResult(
                project_value_inr=project_value_inr,
                fee_percent=rate * 100,
                fee_inr=round(fee, 2),
                tier_label=label,
            )
    last_rate = TIERS[-1][1]
    return FeeResult(
        project_value_inr=project_value_inr,
        fee_percent=last_rate * 100,
        fee_inr=round(project_value_inr * last_rate, 2),
        tier_label="Enterprise",
    )
