export type UserRole = "funder" | "ngo" | "admin";

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  user_id: number;
}

export interface NGOProfile {
  id: number;
  name: string;
  description: string;
  thematic_areas: string[];
  operating_states: string[];
  trust_score: number;
  impact_score: number;
}

export interface NGODetail extends NGOProfile {
  operating_districts: string[];
  beneficiary_types: string[];
  founded_year: number | null;
  annual_budget_inr: number | null;
  team_size: number | null;
  trust_breakdown: TrustBreakdownItem[];
}

export interface TrustBreakdownItem {
  credential: string;
  points: number;
  earned: boolean;
  earned_points: number;
}

export interface FunderProfile {
  id: number;
  company_name: string;
  designation: string;
  sector: string;
  total_csr_budget_inr: number;
  deployed_budget_inr: number;
  undeployed_budget_inr: number;
  financial_year: string;
  me_plan: string | null;
}

export interface ProjectBrief {
  brief_text: string;
  theme?: string;
  geography?: string;
  budget_inr?: number;
  demographic?: string;
  gender_focus?: string;
  beneficiary_type?: string;
  technology_approach?: string;
  scale?: string;
}

export interface Recommendation {
  ngo_id: number;
  rank: number;
  match_score: number;
  rationale: string;
}

export interface Project {
  id: number;
  title: string;
  status: string;
  problem_statement: string;
  intervention_logic: string;
  projected_outcomes: string;
  me_framework: string;
  schedule_vii_head: string | null;
  brief_text: string;
  platform_fee_percent: number | null;
  platform_fee_inr: number | null;
}

export interface ProjectDetail extends Project {
  recommendations: Recommendation[];
}
