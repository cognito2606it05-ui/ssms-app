import { apiFetch, API_BASE } from '../rbac/api';

export const aApi = <T = any,>(path: string, opts: { method?: string; body?: any } = {}, token?: string | null) =>
  apiFetch<T>('/attendance' + path, { ...opts, token });

export const WS_URL = API_BASE.replace(/^http/, 'ws').replace(/\/api$/, '') + '/ws/attendance';
export { API_BASE };

export async function uploadForm(path: string, fields: Record<string, string>, file: File | null, token?: string | null) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  if (file) fd.append('image', file);
  const res = await fetch(API_BASE + '/attendance' + path, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Upload failed');
  return data;
}
