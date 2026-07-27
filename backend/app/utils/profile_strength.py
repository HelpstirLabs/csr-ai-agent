def calculate_profile_strength(user):
    strength = 35

    if user.designation:
        strength += 4

    if user.linkedin:
        strength += 4

    if user.years_in_csr:
        strength += 4

    if user.company_name:
        strength += 4

    if user.industry:
        strength += 4

    if user.company_size:
        strength += 5

    if user.headquarters:
        strength += 5

    return strength

def calculate_csr_score(payload):
    score = 0

    if payload.annual_budget:
        score += 4

    if payload.deployment_timeline:
        score += 4

    if payload.csr_decision_making:
        score += 4

    if payload.focus_areas and len(payload.focus_areas) > 0:
        score += 4

    if payload.geographic_preferences and len(payload.geographic_preferences) > 0:
        score += 4

    return score



def calculate_csrgoal_score(payload):
    score = 0

    if payload.past_csr_partner:
        score += 3

    if payload.deployment_urgency:
        score += 3

    if payload.decision_structure:
        score += 3

    if payload.approval_timeline:
        score += 3

    if payload.annual_commitments:
        score += 3

    return score