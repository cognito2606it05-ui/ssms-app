import { apiFetch, API_BASE } from '../rbac/api';

export const sApi = <T = any,>(path: string, opts: { method?: string; body?: any } = {}, token?: string | null) =>
  apiFetch<T>('/students' + path, { ...opts, token });

// multipart upload (local-disk storage on the server; S3 not wired)
export async function uploadFile(path: string, file: File, fields: Record<string, string>, token?: string | null) {
  const fd = new FormData();
  fd.append('file', file);
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  const res = await fetch(API_BASE + '/students' + path, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Upload failed');
  return data;
}

export const fileUrl = (url: string) => API_BASE.replace(/\/api$/, '') + url;
