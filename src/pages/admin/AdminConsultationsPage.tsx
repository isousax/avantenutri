import React, { useEffect, useState } from 'react';
import Skeleton from '../../components/ui/Skeleton';
import type { FormEvent, ChangeEvent } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { API } from '../../config/api';
import { useAuth } from '../../contexts';
import { useI18n, formatDate as fmtDate } from '../../i18n';
import { SEO } from '../../components/comum/SEO';

interface Consultation {
  id: string;
  user_id: string;
  type: string;
  status: string;
  scheduled_at: string;
  duration_min: number;
  urgency?: string;
  notes?: string;
}

interface AvailabilityRule {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_duration_min: number;
  max_parallel: number;
  active: number;
}

interface DaySlots {
  date: string;
  slots: { start: string; end: string; taken: boolean }[];
}

const weekdayNames = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

const AdminConsultationsPage: React.FC = () => {
  const { authenticatedFetch } = useAuth();
  const { locale, t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Consultation[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [status, setStatus] = useState('');
  const [userId, setUserId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState<string|null>(null);
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [ruleForm, setRuleForm] = useState({ weekday: 1, start_time: '09:00', end_time: '12:00', slot_duration_min: 40 });
  const [slotsRangeFrom, setSlotsRangeFrom] = useState('');
  const [slotsRangeTo, setSlotsRangeTo] = useState('');
  const [slots, setSlots] = useState<DaySlots[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const loadConsultations = async () => {
    try {
      setLoading(true); setError(null);
      const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (status) qs.set('status', status);
      if (userId) qs.set('user_id', userId);
      if (from) qs.set('from', from);
      if (to) qs.set('to', to);
      const r = await authenticatedFetch(`${API.ADMIN_CONSULTATIONS}?${qs.toString()}`);
      if (!r.ok) throw new Error('Falha ao carregar');
      const data = await r.json();
      setItems(data.results || []);
    } catch (e:any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const loadRules = async () => {
    const r = await authenticatedFetch(API.ADMIN_CONSULTATION_AVAILABILITY);
    if (r.ok) { const data = await r.json(); setRules(data.results || []); }
  };

  useEffect(() => { void loadConsultations(); /* eslint-disable-next-line */ }, [page, pageSize]);
  useEffect(() => { void loadRules(); }, []);

  const submitFilters = (e: FormEvent) => { e.preventDefault(); setPage(1); void loadConsultations(); };

  const createRule = async (e: FormEvent) => {
    e.preventDefault();
    const r = await authenticatedFetch(API.ADMIN_CONSULTATION_AVAILABILITY, { method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify(ruleForm) });
    if (r.ok) { setRuleForm({ weekday: 1, start_time: '09:00', end_time: '12:00', slot_duration_min: 40 }); void loadRules(); }
  };

  const toggleRule = async (id: string, active: number) => {
    await authenticatedFetch(`${API.ADMIN_CONSULTATION_AVAILABILITY}/${id}`, { method: 'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ active: active ? 0 : 1 }) });
    void loadRules();
  };

  const loadSlots = async () => {
    if (!slotsRangeFrom || !slotsRangeTo) return;
    try {
      setLoadingSlots(true);
      const qs = new URLSearchParams({ from: slotsRangeFrom, to: slotsRangeTo });
      const r = await authenticatedFetch(`${API.CONSULTATION_AVAILABLE_SLOTS}?${qs.toString()}`);
      if (r.ok) { const data = await r.json(); setSlots(data.days || []); }
    } finally { setLoadingSlots(false); }
  };

  return <div className="p-4 space-y-6">
    <SEO title={t('admin.consultations.seo.title')} description={t('admin.consultations.seo.desc')} />
    <div className="flex items-start justify-between flex-wrap gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Consultas</h1>
        <p className="text-xs text-gray-500 mt-1">Gerencie agenda, regras e slots de atendimento.</p>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={()=> { void loadConsultations(); void loadRules(); }} disabled={loading}>Recarregar</Button>
      </div>
    </div>
    <Card className="p-4 space-y-3">
      <form onSubmit={submitFilters} className="flex flex-wrap gap-3">
        <select value={status} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setStatus(e.target.value)} className="border px-2 py-1 rounded">
          <option value="">Status</option>
          <option value="scheduled">scheduled</option>
          <option value="canceled">canceled</option>
          <option value="completed">completed</option>
        </select>
        <input value={userId} onChange={(e)=>setUserId(e.target.value)} placeholder="user_id" className="border px-2 py-1 rounded" />
        <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="border px-2 py-1 rounded" />
        <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="border px-2 py-1 rounded" />
        <Button type="submit">Filtrar</Button>
        {(status||userId||from||to) && <Button type="button" variant="secondary" onClick={()=>{ setStatus(''); setUserId(''); setFrom(''); setTo(''); setPage(1); void loadConsultations(); }}>Limpar</Button>}
      </form>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Data/Hora</th>
              <th className="p-2">Usuário</th>
              <th className="p-2">Tipo</th>
              <th className="p-2">Urgência</th>
              <th className="p-2">Status</th>
              <th className="p-2">Notas</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="p-4"><Skeleton lines={3} /></td></tr>}
            {!loading && items.map(c => <tr key={c.id} className="border-b last:border-none hover:bg-gray-50">
              <td className="p-2">{fmtDate(c.scheduled_at, locale, { dateStyle: 'short', timeStyle: 'short'})}</td>
              <td className="p-2 font-mono text-xs">{c.user_id}</td>
              <td className="p-2">{c.type}</td>
              <td className="p-2">{c.urgency||'-'}</td>
              <td className="p-2">{c.status}</td>
              <td className="p-2 truncate max-w-xs" title={c.notes}>{c.notes||'-'}</td>
            </tr>)}
            {!loading && !items.length && <tr><td colSpan={6} className="p-4">Nenhuma consulta</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 items-center">
        <Button type="button" variant="secondary" disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Anterior</Button>
        <span className="text-sm">Página {page}</span>
        <Button type="button" variant="secondary" onClick={()=>setPage(p=>p+1)}>Próxima</Button>
      </div>
    </Card>

    <Card className="p-4 space-y-4">
      <h2 className="font-semibold">Regras de Disponibilidade</h2>
      <form onSubmit={createRule} className="flex flex-wrap gap-2 items-end">
        <label className="flex flex-col text-xs">Dia
          <select value={ruleForm.weekday} onChange={(e)=>setRuleForm(r=>({...r, weekday: Number(e.target.value)}))} className="border px-2 py-1 rounded">
            {weekdayNames.map((n,i)=><option key={i} value={i}>{i}-{n}</option>)}
          </select>
        </label>
        <label className="flex flex-col text-xs">Início
          <input value={ruleForm.start_time} onChange={(e)=>setRuleForm(r=>({...r,start_time:e.target.value}))} className="border px-2 py-1 rounded" />
        </label>
        <label className="flex flex-col text-xs">Fim
          <input value={ruleForm.end_time} onChange={(e)=>setRuleForm(r=>({...r,end_time:e.target.value}))} className="border px-2 py-1 rounded" />
        </label>
        <label className="flex flex-col text-xs">Duração (min)
          <input type="number" value={ruleForm.slot_duration_min} onChange={(e)=>setRuleForm(r=>({...r,slot_duration_min:Number(e.target.value)}))} className="border px-2 py-1 rounded w-24" />
        </label>
        <Button type="submit">Adicionar</Button>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-100 text-left"><th className="p-2">Dia</th><th className="p-2">Janela</th><th className="p-2">Slot</th><th className="p-2">Ativo</th><th className="p-2">Ação</th></tr></thead>
          <tbody>
            {rules.map(r=> <tr key={r.id} className="border-b last:border-none">
              <td className="p-2">{weekdayNames[r.weekday]}</td>
              <td className="p-2">{r.start_time} - {r.end_time}</td>
              <td className="p-2">{r.slot_duration_min} min</td>
              <td className="p-2">{r.active? 'Sim':'Não'}</td>
              <td className="p-2"><button onClick={()=>toggleRule(r.id, r.active)} className="text-xs text-green-700 hover:underline">{r.active?'Desativar':'Ativar'}</button></td>
            </tr>)}
            {!rules.length && <tr><td colSpan={5} className="p-4">Sem regras</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>

    <Card className="p-4 space-y-4">
      <h2 className="font-semibold">Slots Gerados</h2>
      <div className="flex flex-wrap gap-2 items-end">
        <label className="flex flex-col text-xs">De
          <input type="date" value={slotsRangeFrom} onChange={(e)=>setSlotsRangeFrom(e.target.value)} className="border px-2 py-1 rounded" />
        </label>
        <label className="flex flex-col text-xs">Até
          <input type="date" value={slotsRangeTo} onChange={(e)=>setSlotsRangeTo(e.target.value)} className="border px-2 py-1 rounded" />
        </label>
        <Button type="button" onClick={loadSlots}>Carregar</Button>
      </div>
      {loadingSlots && (
        <div className="space-y-2">
          <Skeleton lines={1} className="w-40" />
          <Skeleton lines={2} />
          <Skeleton lines={2} />
        </div>
      )}
      {!loadingSlots && slots.map(d => <div key={d.date} className="border rounded p-2">
        <h3 className="font-medium mb-2">{d.date}</h3>
        <div className="flex flex-wrap gap-2">
          {d.slots.map(s => <div key={s.start} className={`px-2 py-1 rounded text-xs border ${s.taken? 'bg-red-100 border-red-300':'bg-green-100 border-green-300'}`}>{new Date(s.start).toISOString().substring(11,16)}{s.taken?' (ocupado)':''}</div>)}
          {!d.slots.length && <span className="text-xs text-gray-500">Sem slots</span>}
        </div>
      </div>)}
    </Card>
  </div>;
};

export default AdminConsultationsPage;
