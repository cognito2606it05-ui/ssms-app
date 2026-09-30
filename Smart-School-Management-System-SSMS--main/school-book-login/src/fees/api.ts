import { apiFetch, API_BASE } from '../rbac/api';

export const fApi = <T = any,>(path: string, opts: { method?: string; body?: any } = {}, token?: string | null) =>
  apiFetch<T>(path, { ...opts, token });

export const money = (n: any) => '₹' + Number(n || 0).toLocaleString('en-IN');

// Payment with an Idempotency-Key header (safe to retry).
export async function payInvoice(body: any, idemKey: string, token?: string | null) {
  const res = await fetch(API_BASE + '/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idemKey, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.message || 'Payment failed');
  return j;
}
