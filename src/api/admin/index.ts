// Admin API wrappers

const BASE = '/api'; // proxy prefix

async function authGet(path: string, access?: string) {
  const headers: Record<string,string> = { 'Accept': 'application/json' };
  if (access) headers['Authorization'] = `Bearer ${access}`;
  const r = await fetch(`${BASE}${path}`, { headers });
  if (!r.ok) throw new Error(`GET ${path} ${r.status}`);
  return r.json();
}

async function authPatch(path: string, body: unknown, access?: string) {
  const headers: Record<string,string> = { 'Content-Type': 'application/json' };
  if (access) headers['Authorization'] = `Bearer ${access}`;
  const r = await fetch(`${BASE}${path}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`PATCH ${path} ${r.status}`);
  return r.json();
}

export async function listUsers({ page=1, pageSize=20, q='' }: { page?: number; pageSize?: number; q?: string }, access?: string) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (q) params.set('q', q);
  return authGet(`/admin/users?${params.toString()}`, access);
}

export async function changeUserRole(userId: string, newRole: string, reason: string|undefined, access?: string) {
  return authPatch(`/admin/users/${userId}/role`, { new_role: newRole, reason }, access);
}

export async function listAudit(type: 'password'|'revoked'|'role', { page=1, pageSize=20 }: { page?: number; pageSize?: number }, apiKey?: string) {
  const params = new URLSearchParams({ type, page: String(page), pageSize: String(pageSize) });
  const headers: Record<string,string> = { 'Accept': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;
  const r = await fetch(`${BASE}/admin/audit?${params.toString()}`, { headers });
  if (!r.ok) throw new Error(`audit ${type} ${r.status}`);
  return r.json();
}
