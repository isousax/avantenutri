import { useCallback, useEffect, useState } from 'react';
import { API } from '../config/api';
import { useAuth } from '../contexts/useAuth';

export interface Consultation {
  id: string;
  type: string;
  status: string;
  scheduled_at: string;
  duration_min: number;
  urgency?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

interface ListResponse { ok?: boolean; results?: Consultation[] }
interface CreateResponse { ok?: boolean; id?: string; status?: string; error?: string }

export function useConsultations() {
  const { getAccessToken } = useAuth();
  const [items, setItems] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useCallback(async () => {
  const accessToken = await getAccessToken();
  if (!accessToken) return;
    setLoading(true); setError(null);
    try {
  const res = await fetch(API.CONSULTATIONS, { headers: { Authorization: `Bearer ${accessToken}` } });
      const data: ListResponse = await res.json();
      if (!res.ok) throw new Error((data as any)?.error || 'erro');
      setItems(data.results || []);
    } catch (e:any) {
      setError(e.message || 'erro');
    } finally { setLoading(false); }
  }, [getAccessToken]);

  const create = useCallback(async (input: { scheduledAt: string; type: string; durationMin?: number; notes?: string; urgency?: string; }) => {
  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error('no-auth');
  const res = await fetch(API.CONSULTATIONS, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(input) });
    const data: CreateResponse = await res.json();
    if (!res.ok) throw new Error(data.error || 'erro');
    await list();
    return data;
  }, [getAccessToken, list]);

  const cancel = useCallback(async (id: string, reason?: string) => {
  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error('no-auth');
  const res = await fetch(API.consultationCancel(id), { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ reason }) });
    if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'erro'); }
    await list();
  }, [getAccessToken, list]);

  useEffect(() => { list(); }, [list]);

  return { items, loading, error, list, create, cancel };
}
