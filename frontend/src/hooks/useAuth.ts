import { useState, useCallback } from "react";
import type { UserRole } from "../types/api";
import { login as apiLogin, register as apiRegister } from "../services/api";

interface AuthState {
  token: string | null;
  role: UserRole | null;
  userId: number | null;
}

function loadState(): AuthState {
  return {
    token: localStorage.getItem("token"),
    role: localStorage.getItem("role") as UserRole | null,
    userId: Number(localStorage.getItem("userId")) || null,
  };
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(loadState);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    localStorage.setItem("token", res.access_token);
    localStorage.setItem("role", res.role);
    localStorage.setItem("userId", String(res.user_id));
    setState({ token: res.access_token, role: res.role as UserRole, userId: res.user_id });
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, role: string, organisation: string) => {
    const res = await apiRegister(email, password, name, role, organisation);
    localStorage.setItem("token", res.access_token);
    localStorage.setItem("role", res.role);
    localStorage.setItem("userId", String(res.user_id));
    setState({ token: res.access_token, role: res.role as UserRole, userId: res.user_id });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    setState({ token: null, role: null, userId: null });
  }, []);

  return { ...state, isAuthenticated: !!state.token, login, register, logout };
}
