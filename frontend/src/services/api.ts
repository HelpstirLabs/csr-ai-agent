import type {
  TokenResponse,
  FunderProfile,
  NGOProfile,
  NGODetail,
  ProjectBrief,
  ProjectDetail,
  Project,
} from "../types/api";

const BASE = "";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { ...authHeaders(), ...init?.headers } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Auth
export const login = (email: string, password: string) =>
  request<TokenResponse>("/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

export const register = (email: string, password: string, name: string, role: string, organisation: string) =>
  request<TokenResponse>("/v1/auth/register", { method: "POST", body: JSON.stringify({ email, password, name, role, organisation }) });

// Funder
export const getFunderProfile = () => request<FunderProfile>("/v1/funders/me");

export const updateFunderProfile = (data: Partial<Pick<FunderProfile, "total_csr_budget_inr" | "deployed_budget_inr" | "company_name" | "designation" | "sector" | "financial_year">>) =>
  request<FunderProfile>("/v1/funders/me", { method: "PATCH", body: JSON.stringify(data) });

// NGO
export const listNGOs = () => request<NGOProfile[]>("/v1/ngos/");
export const getNGOProfile = () => request<NGODetail>("/v1/ngos/me");

// Projects
export const generateProject = (brief: ProjectBrief) =>
  request<ProjectDetail>("/v1/projects/generate", { method: "POST", body: JSON.stringify(brief) });

export const listProjects = () => request<Project[]>("/v1/projects/");

export const getProject = (id: number) => request<ProjectDetail>(`/v1/projects/${id}`);

export const awardProject = (projectId: number, ngoId: number) =>
  request<Record<string, unknown>>(`/v1/projects/${projectId}/award/${ngoId}`, { method: "POST" });

export const deleteProject = async (projectId: number): Promise<void> => {
  const res = await fetch(`/v1/projects/${projectId}`, { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Delete failed: ${res.status}`);
  }
};
