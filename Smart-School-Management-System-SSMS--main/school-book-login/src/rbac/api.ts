// Thin client for the SSMS RBAC API (Express + Postgres + JWT).
const BASE = (import.meta as any).env?.VITE_RBAC_API || 'http://localhost:4000/api';

export interface ApiError extends Error {
  status: number;
  data: any;
}

export async function apiFetch<T = any>(
  path: string,
  opts: { method?: string; body?: any; token?: string | null } = {},
): Promise<T> {
  const { method = 'GET', body, token } = opts;
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.message || `Request failed (${res.status})`) as ApiError;
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

export const API_BASE = BASE;
