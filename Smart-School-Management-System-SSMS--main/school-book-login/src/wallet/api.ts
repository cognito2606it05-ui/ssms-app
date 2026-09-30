import { apiFetch, API_BASE } from '../rbac/api';

// Wallet endpoints live under several /api prefixes (/wallet, /pos, /cards, …)
// so we pass the full sub-path straight through apiFetch.
export const wApi = <T = any,>(path: string, opts: { method?: string; body?: any } = {}, token?: string | null) =>
  apiFetch<T>(path, { ...opts, token });

export const money = (n: any) => '₹' + Number(n || 0).toLocaleString('en-IN');
export const fileUrl = (url: string) => (url?.startsWith('/api') ? API_BASE.replace(/\/api$/, '') + url : url);
