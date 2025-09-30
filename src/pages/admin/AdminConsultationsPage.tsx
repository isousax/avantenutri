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

interface AvailabilityLogEntry {
  rule_id: string;
  action: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_duration_min: number;
  max_parallel: number;
  active: number;
  created_at: string;
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
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [status, setStatus] = useState('');
  const [userId, setUserId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState<string|null>(null);
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [ruleForm, setRuleForm] = useState({ weekday: 1, start_time: '09:00', end_time: '12:00', slot_duration_min: 40, max_parallel: 1 });
  const [ruleError, setRuleError] = useState<string|null>(null);
  const [slotsRangeFrom, setSlotsRangeFrom] = useState('');
  const [slotsRangeTo, setSlotsRangeTo] = useState('');
  const [slots, setSlots] = useState<DaySlots[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [logEntries, setLogEntries] = useState<AvailabilityLogEntry[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logLoading, setLogLoading] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [logRuleFilter, setLogRuleFilter] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('');
  const [logSort, setLogSort] = useState<'created_at'|'action'|'weekday'>('created_at');
  const [logDir, setLogDir] = useState<'asc'|'desc'>('desc');
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editDraft, setEditDraft] = useState<{ weekday:number; start_time:string; end_time:string; slot_duration_min:number; max_parallel:number }>({ weekday:1, start_time:'', end_time:'', slot_duration_min:40, max_parallel:1 });

  const loadConsultations = async () => {
    try {
      setLoading(true); setError(null);
      const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (status) qs.set('status', status);
      if (userId) qs.set('user_id', userId);
      if (from) qs.set('from', from);
      if (to) qs.set('to', to);
      const r = await authenticatedFetch(`${API.ADMIN_CONSULTATIONS}?${qs.toString()}`);
  if (!r.ok) throw new Error(t('admin.consultations.error.load'));
      const data = await r.json();
      setItems(data.results || []);
      if (typeof data.total === 'number') setTotal(data.total);
    } catch (e:any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const loadRules = async () => {
    const r = await authenticatedFetch(API.ADMIN_CONSULTATION_AVAILABILITY);
    if (r.ok) { const data = await r.json(); setRules(data.results || []); }
  };

  useEffect(() => { void loadConsultations(); /* eslint-disable-next-line */ }, [page, pageSize]);
  useEffect(() => { void loadRules(); void loadLog(); }, []);
  useEffect(() => { if(page!==1) return; const h=setTimeout(()=>{ void loadConsultations(); },450); return ()=>clearTimeout(h); }, [status,userId,from,to]);

  const submitFilters = (e: FormEvent) => { e.preventDefault(); setPage(1); void loadConsultations(); };

  const createRule = async (e: FormEvent) => {
    e.preventDefault();
    setRuleError(null);
    // Client-side validation
  const timeErr = validateTimes(ruleForm.start_time, ruleForm.end_time);
  if (timeErr) { setRuleError(timeErr === 'TIME_INVALID' ? t('admin.consultations.availability.time.invalid') : t('admin.consultations.availability.time.rangeInvalid')); return; }
    const r = await authenticatedFetch(API.ADMIN_CONSULTATION_AVAILABILITY, { method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify(ruleForm) });
  if (r.ok) { setRuleForm({ weekday: 1, start_time: '09:00', end_time: '12:00', slot_duration_min: 40, max_parallel:1 }); void loadRules(); void loadLog(); }
    else {
      try { const data = await r.json(); if(data.error === 'overlap') {
        const c = data.conflict; setRuleError(t('admin.consultations.availability.conflict').replace('{weekday}', weekdayNames[c.weekday]).replace('{start}', c.start_time).replace('{end}', c.end_time));
  } else setRuleError(t('admin.consultations.error.create')); }
  catch { setRuleError(t('admin.consultations.error.create')); }
    }
  };

  const toggleRule = async (id: string, active: number) => {
    setRuleError(null);
    const r = await authenticatedFetch(`${API.ADMIN_CONSULTATION_AVAILABILITY}/${id}`, { method: 'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ active: active ? 0 : 1 }) });
    if (r.ok) void loadRules();
    else {
      try { const data = await r.json(); if(data.error==='overlap') {
        const c = data.conflict; setRuleError(t('admin.consultations.availability.conflict').replace('{weekday}', weekdayNames[c.weekday]).replace('{start}', c.start_time).replace('{end}', c.end_time));
  } else setRuleError(t('admin.consultations.error.update')); } catch { setRuleError(t('admin.consultations.error.update')); }
    }
  };

  const deleteRule = async (id: string) => {
    if(!confirm(t('admin.consultations.availability.confirmDelete'))) return;
    setRuleError(null);
    const r = await authenticatedFetch(`${API.ADMIN_CONSULTATION_AVAILABILITY}/${id}`, { method: 'DELETE' });
    if (r.ok) { void loadRules(); void loadLog(); } else setRuleError(t('admin.consultations.error.delete'));
  };

  const loadLog = async () => {
    try {
      setLogLoading(true);
  const qs = new URLSearchParams({ page: String(logPage), pageSize: '50', sort: logSort, direction: logDir });
      if (logRuleFilter) qs.set('rule_id', logRuleFilter);
      if (logActionFilter) qs.set('action', logActionFilter);
      const r = await authenticatedFetch(`${API.ADMIN_CONSULTATION_AVAILABILITY_LOG}?${qs.toString()}`);
  if (r.ok) { const data = await r.json(); setLogEntries(data.results||[]); if (typeof data.total === 'number') setLogTotal(data.total); }
    } finally { setLogLoading(false); }
  };

  const startEdit = (rule: AvailabilityRule) => {
    setEditingId(rule.id);
    setEditDraft({ weekday: rule.weekday, start_time: rule.start_time, end_time: rule.end_time, slot_duration_min: rule.slot_duration_min, max_parallel: rule.max_parallel });
  };
  const cancelEdit = () => { setEditingId(null); };
  const saveEdit = async (id: string) => {
    setRuleError(null);
    const body:any = { ...editDraft };
    const timeErr = validateTimes(body.start_time, body.end_time);
  if (timeErr) { setRuleError(timeErr === 'TIME_INVALID' ? t('admin.consultations.availability.time.invalid') : t('admin.consultations.availability.time.rangeInvalid')); return; }
    const r = await authenticatedFetch(`${API.ADMIN_CONSULTATION_AVAILABILITY}/${id}`, { method: 'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (r.ok) { setEditingId(null); void loadRules(); void loadLog(); }
    else {
      try { const data = await r.json(); if(data.error==='overlap') { const c=data.conflict; setRuleError(t('admin.consultations.availability.conflict').replace('{weekday}', weekdayNames[c.weekday]).replace('{start}', c.start_time).replace('{end}', c.end_time)); } else setRuleError(t('admin.consultations.error.update')); } catch { setRuleError(t('admin.consultations.error.update')); }
    }
  };

  const duplicateRule = async (r: AvailabilityRule) => {
    setRuleError(null);
    const payload = { weekday: r.weekday, start_time: r.start_time, end_time: r.end_time, slot_duration_min: r.slot_duration_min, max_parallel: r.max_parallel };
    const resp = await authenticatedFetch(API.ADMIN_CONSULTATION_AVAILABILITY, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
    if (resp.ok) { void loadRules(); void loadLog(); }
    else {
      try { const data = await resp.json(); if(data.error==='overlap') { const c=data.conflict; setRuleError(t('admin.consultations.availability.conflict').replace('{weekday}', weekdayNames[c.weekday]).replace('{start}', c.start_time).replace('{end}', c.end_time)); } else setRuleError(t('admin.consultations.error.create')); } catch { setRuleError(t('admin.consultations.error.create')); }
    }
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
        <h1 className="text-2xl font-semibold tracking-tight">{t('admin.consultations.heading')}</h1>
        <p className="text-xs text-gray-500 mt-1">{t('admin.consultations.subtitle')}</p>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={()=> { void loadConsultations(); void loadRules(); void loadLog(); }} disabled={loading}>{t('admin.consultations.reload')}</Button>
      </div>
    </div>
    <Card className="p-4 space-y-3">
      <form onSubmit={submitFilters} className="flex flex-wrap gap-3" aria-label={t('admin.consultations.a11y.consultationsTable')}>
        <select value={status} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setStatus(e.target.value)} className="border px-2 py-1 rounded">
          <option value="">{t('admin.consultations.table.col.status')}</option>
          <option value="scheduled">{t('admin.consultations.status.scheduled')}</option>
          <option value="canceled">{t('admin.consultations.status.canceled')}</option>
          <option value="completed">{t('admin.consultations.status.completed')}</option>
        </select>
        <input value={userId} onChange={(e)=>setUserId(e.target.value)} placeholder="user_id" className="border px-2 py-1 rounded" />
        <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="border px-2 py-1 rounded" />
        <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="border px-2 py-1 rounded" />
        <Button type="submit">{t('admin.consultations.filter')}</Button>
        {(status||userId||from||to) && <Button type="button" variant="secondary" onClick={()=>{ setStatus(''); setUserId(''); setFrom(''); setTo(''); setPage(1); void loadConsultations(); }}>{t('admin.consultations.clear')}</Button>}
        <Button type="button" variant="secondary" onClick={exportCsv}>{t('admin.consultations.export.csv')}</Button>
        <span className="text-[10px] text-gray-400" title={t('admin.consultations.filter.autoApplied')}>⟳</span>
      </form>
      <div className="flex flex-wrap gap-2 text-[11px] items-center">
        {[{v:'',k:'admin.consultations.filter.status.all'},{v:'scheduled',k:'admin.consultations.filter.status.scheduled'},{v:'canceled',k:'admin.consultations.filter.status.canceled'},{v:'completed',k:'admin.consultations.filter.status.completed'}].map(s => (
          <button type="button" key={s.v||'all'} onClick={()=>{ setStatus(s.v); setPage(1); }} className={`px-2 py-0.5 rounded border ${status===s.v? 'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 hover:bg-gray-50'}`}>{t(s.k as any)}</button>
        ))}
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {/* Desktop table */}
      <div className="overflow-x-auto hidden md:block" aria-label={t('admin.consultations.a11y.consultationsTable')}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">{t('admin.consultations.table.col.datetime')}</th>
              <th className="p-2">{t('admin.consultations.table.col.user')}</th>
              <th className="p-2">{t('admin.consultations.table.col.type')}</th>
              <th className="p-2">{t('admin.consultations.table.col.urgency')}</th>
              <th className="p-2">{t('admin.consultations.table.col.status')}</th>
              <th className="p-2">{t('admin.consultations.table.col.notes')}</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="p-4"><Skeleton lines={3} /></td></tr>}
            {!loading && items.map(c => <tr key={c.id} className="border-b last:border-none hover:bg-gray-50">
              <td className="p-2">{fmtDate(c.scheduled_at, locale, { dateStyle: 'short', timeStyle: 'short'})}</td>
              <td className="p-2 font-mono text-xs">{c.user_id}</td>
              <td className="p-2">{c.type}</td>
              <td className="p-2">{c.urgency||'-'}</td>
              <td className="p-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium border
                  ${c.status==='scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                  ${c.status==='canceled' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                  ${c.status==='completed' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                `}>{c.status==='scheduled'? t('admin.consultations.status.scheduled') : c.status==='canceled'? t('admin.consultations.status.canceled') : c.status==='completed'? t('admin.consultations.status.completed'): c.status}</span>
              </td>
              <td className="p-2 truncate max-w-xs" title={c.notes}>{c.notes||'-'}</td>
            </tr>)}
            {!loading && !items.length && <tr><td colSpan={6} className="p-4">{t('admin.consultations.table.empty')}</td></tr>}
          </tbody>
        </table>
      </div>
      {/* Mobile list */}
      <div className="md:hidden space-y-3">
        {loading && <Card className="p-4"><Skeleton lines={3} /></Card>}
        {!loading && items.map(c => (
          <Card key={c.id} className="p-4 space-y-2">
            <div className="flex justify-between items-start gap-2">
              <div className="text-sm font-medium">{fmtDate(c.scheduled_at, locale, { dateStyle:'short', timeStyle:'short'})}</div>
              <span className="text-[10px] text-gray-500 font-mono select-all">{c.id.slice(0,8)}</span>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-gray-600">
              <span>{c.type}</span>
              {c.urgency && <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px]">{c.urgency}</span>}
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium border
                ${c.status==='scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                ${c.status==='canceled' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                ${c.status==='completed' ? 'bg-green-50 text-green-700 border-green-200' : ''}
              `}>{c.status==='scheduled'? t('admin.consultations.status.scheduled') : c.status==='canceled'? t('admin.consultations.status.canceled') : c.status==='completed'? t('admin.consultations.status.completed'): c.status}</span>
            </div>
            <div className="text-[11px] font-mono break-all">{t('admin.consultations.table.mobile.userLabel')}: {c.user_id}</div>
            {c.notes && <div className="text-[11px] text-gray-500 line-clamp-3">{c.notes}</div>}
          </Card>
        ))}
  {!loading && !items.length && <Card className="p-4 text-center text-xs text-gray-500">{t('admin.consultations.table.empty')}</Card>}
      </div>
      <div className="flex gap-2 items-center">
        <Button type="button" variant="secondary" disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>{t('admin.consultations.pagination.prev')}</Button>
        <span className="text-sm">{`${page} ${t('admin.consultations.pagination.of')} ${Math.max(1, Math.ceil(total / pageSize))}`} <span className="text-xs text-gray-500">({total})</span></span>
        <Button type="button" variant="secondary" disabled={page * pageSize >= total} onClick={()=>setPage(p=>p+1)}>{t('admin.consultations.pagination.next')}</Button>
      </div>
    </Card>

    <Card className="p-4 space-y-4">
      <h2 className="font-semibold flex items-center gap-2">{t('admin.consultations.availability.heading')}
        <span className="text-[10px] text-gray-500 font-normal" title={t('admin.consultations.availability.tooltip')}>?</span>
      </h2>
      <form onSubmit={createRule} className="flex flex-wrap gap-2 items-end">
  <label className="flex flex-col text-xs">{t('admin.consultations.availability.form.day')}
          <select value={ruleForm.weekday} onChange={(e)=>setRuleForm(r=>({...r, weekday: Number(e.target.value)}))} className="border px-2 py-1 rounded">
            {weekdayNames.map((n,i)=><option key={i} value={i}>{i}-{n}</option>)}
          </select>
        </label>
  <label className="flex flex-col text-xs">{t('admin.consultations.availability.form.start')}
          <input value={ruleForm.start_time} onChange={(e)=>setRuleForm(r=>({...r,start_time:e.target.value}))} className="border px-2 py-1 rounded" />
        </label>
  <label className="flex flex-col text-xs">{t('admin.consultations.availability.form.end')}
          <input value={ruleForm.end_time} onChange={(e)=>setRuleForm(r=>({...r,end_time:e.target.value}))} className="border px-2 py-1 rounded" />
        </label>
  <label className="flex flex-col text-xs">{t('admin.consultations.availability.form.duration')}
          <input type="number" value={ruleForm.slot_duration_min} onChange={(e)=>setRuleForm(r=>({...r,slot_duration_min:Number(e.target.value)}))} className="border px-2 py-1 rounded w-24" />
        </label>
  <label className="flex flex-col text-xs">{t('admin.consultations.availability.form.parallel')}
          <input type="number" value={ruleForm.max_parallel} onChange={(e)=>setRuleForm(r=>({...r,max_parallel:Number(e.target.value)}))} className="border px-2 py-1 rounded w-20" />
        </label>
  <Button type="submit">{t('admin.consultations.availability.form.add')}</Button>
      </form>
      {ruleError && <div className="text-xs text-red-600">{ruleError}</div>}
      <div className="overflow-x-auto hidden md:block" aria-label={t('admin.consultations.a11y.availabilityTable')}>
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-100 text-left"><th className="p-2">{t('admin.consultations.availability.table.day')}</th><th className="p-2">{t('admin.consultations.availability.table.window')}</th><th className="p-2">{t('admin.consultations.availability.table.slot')}</th><th className="p-2">{t('admin.consultations.availability.table.active')}</th><th className="p-2">{t('admin.consultations.availability.table.actions')}</th></tr></thead>
          <tbody>
            {rules
              .slice()
              .sort((a,b)=> a.weekday===b.weekday ? a.start_time.localeCompare(b.start_time) : a.weekday - b.weekday)
              .map(r=> {
              const editing = editingId === r.id;
              return <tr key={r.id} className="border-b last:border-none">
                <td className="p-2 align-top">{editing ? (
                  <select value={editDraft.weekday} onChange={(e)=>setEditDraft(d=>({...d, weekday:Number(e.target.value)}))} className="border px-1 py-0.5 rounded text-xs">
                    {weekdayNames.map((n,i)=><option key={i} value={i}>{i}-{n}</option>)}
                  </select>
                ): weekdayNames[r.weekday]}</td>
                <td className="p-2 align-top">{editing ? (
                  <div className="flex gap-1">
                    <input value={editDraft.start_time} onChange={(e)=>setEditDraft(d=>({...d,start_time:e.target.value}))} className="border px-1 py-0.5 rounded w-16 text-xs" />
                    <span className="text-xs">-</span>
                    <input value={editDraft.end_time} onChange={(e)=>setEditDraft(d=>({...d,end_time:e.target.value}))} className="border px-1 py-0.5 rounded w-16 text-xs" />
                  </div>
                ) : `${r.start_time} - ${r.end_time}`}</td>
                <td className="p-2 align-top">{editing ? (
                  <div className="flex gap-1 items-center">
                    <input type="number" value={editDraft.slot_duration_min} onChange={(e)=>setEditDraft(d=>({...d,slot_duration_min:Number(e.target.value)}))} className="border px-1 py-0.5 rounded w-16 text-xs" />
                    <input type="number" value={editDraft.max_parallel} onChange={(e)=>setEditDraft(d=>({...d,max_parallel:Number(e.target.value)}))} className="border px-1 py-0.5 rounded w-14 text-xs" title="max paralelo" />
                  </div>
                ) : `${r.slot_duration_min} min`}</td>
                <td className="p-2 align-top">{r.active? t('admin.consultations.availability.status.active'):t('admin.consultations.availability.status.inactive')}</td>
                <td className="p-2 space-x-3">
                  {!editing && <>
                    <button onClick={()=>toggleRule(r.id, r.active)} className="text-xs text-green-700 hover:underline" aria-label={r.active? t('admin.consultations.availability.actions.deactivate'):t('admin.consultations.availability.actions.activate')}>{r.active? t('admin.consultations.availability.actions.deactivate'):t('admin.consultations.availability.actions.activate')}</button>
                    <button onClick={()=>startEdit(r)} className="text-xs text-blue-700 hover:underline" aria-label={t('admin.consultations.availability.actions.edit')}>{t('admin.consultations.availability.actions.edit')}</button>
                    <button onClick={()=>duplicateRule(r)} className="text-xs text-purple-700 hover:underline" aria-label={t('admin.consultations.availability.actions.duplicate')}>{t('admin.consultations.availability.actions.duplicate')}</button>
                    <button onClick={()=>deleteRule(r.id)} className="text-xs text-red-600 hover:underline" aria-label={t('admin.consultations.availability.actions.delete')}>{t('admin.consultations.availability.actions.delete')}</button>
                  </>}
                  {editing && <>
                    <button onClick={()=>saveEdit(r.id)} className="text-xs text-green-700 hover:underline" aria-label={t('admin.consultations.availability.actions.save')}>{t('admin.consultations.availability.actions.save')}</button>
                    <button onClick={cancelEdit} className="text-xs text-gray-600 hover:underline" aria-label={t('admin.consultations.availability.actions.cancel')}>{t('admin.consultations.availability.actions.cancel')}</button>
                  </>}
                </td>
              </tr>})}
            {!rules.length && <tr><td colSpan={5} className="p-4">{t('admin.consultations.availability.empty')}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="md:hidden space-y-2">
            {rules
              .slice()
              .sort((a,b)=> a.weekday===b.weekday ? a.start_time.localeCompare(b.start_time) : a.weekday - b.weekday)
              .map(r => (
          <Card key={r.id} className="p-3 space-y-1">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">{weekdayNames[r.weekday]} {r.start_time}-{r.end_time}</div>
              <div className="flex items-center gap-2">
                <button onClick={()=>toggleRule(r.id, r.active)} className="text-[11px] text-green-700 hover:underline" aria-label={r.active? t('admin.consultations.availability.actions.deactivate'):t('admin.consultations.availability.actions.activate')}>{r.active ? t('admin.consultations.availability.actions.deactivate'):t('admin.consultations.availability.actions.activate')}</button>
                <button onClick={()=>duplicateRule(r)} className="text-[11px] text-purple-700 hover:underline" aria-label={t('admin.consultations.availability.actions.duplicate')}>{t('admin.consultations.availability.actions.duplicate')}</button>
                <button onClick={()=>deleteRule(r.id)} className="text-[11px] text-red-600 hover:underline" aria-label={t('admin.consultations.availability.actions.delete')}>{t('admin.consultations.availability.actions.delete')}</button>
              </div>
            </div>
            <div className="text-[11px] text-gray-600 flex gap-3 flex-wrap">
              <span>{t('admin.consultations.availability.slot.prefix')}: {r.slot_duration_min}m</span>
              <span>{r.active? t('admin.consultations.availability.status.active'):t('admin.consultations.availability.status.inactive')}</span>
            </div>
          </Card>
        ))}
        {!rules.length && <Card className="p-4 text-center text-xs text-gray-500">{t('admin.consultations.availability.empty')}</Card>}
      </div>
    </Card>

    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-semibold text-sm">{t('admin.consultations.availability.log.heading')}</h2>
        <div className="flex items-end gap-2 flex-wrap">
          <label className="text-[11px] flex flex-col">
            {t('admin.consultations.availability.log.filter.rule')}
            <select value={logRuleFilter} onChange={(e)=>{ setLogRuleFilter(e.target.value); setLogPage(1); }} className="border px-1 py-0.5 rounded text-[11px] min-w-[120px]">
              <option value="">—</option>
              {rules.map(r => <option key={r.id} value={r.id}>{weekdayNames[r.weekday]} {r.start_time}-{r.end_time}</option>)}
            </select>
          </label>
          <label className="text-[11px] flex flex-col">
            {t('admin.consultations.log.filter.action')}
            <select value={logActionFilter} onChange={(e)=>{ setLogActionFilter(e.target.value); setLogPage(1); }} className="border px-1 py-0.5 rounded text-[11px] min-w-[100px]">
              <option value="">{t('admin.consultations.log.filter.action.all')}</option>
              <option value="create">{t('admin.consultations.availability.log.action.create')}</option>
              <option value="update">{t('admin.consultations.availability.log.action.update')}</option>
              <option value="activate">{t('admin.consultations.availability.log.action.activate')}</option>
              <option value="deactivate">{t('admin.consultations.availability.log.action.deactivate')}</option>
              <option value="delete">{t('admin.consultations.availability.log.action.delete')}</option>
            </select>
          </label>
          <Button type="button" variant="secondary" onClick={()=>{ setLogPage(1); void loadLog(); }} disabled={logLoading}>{t('admin.consultations.availability.log.update')}</Button>
          <label className="text-[11px] flex flex-col">
            {t('admin.consultations.log.sort.label')}
            <div className="flex gap-1">
              <select value={logSort} onChange={(e)=>{ setLogSort(e.target.value as any); setLogPage(1); }} className="border px-1 py-0.5 rounded text-[11px]">
                <option value="created_at">{t('admin.consultations.log.sort.created_at')}</option>
                <option value="action">{t('admin.consultations.log.sort.action')}</option>
                <option value="weekday">{t('admin.consultations.log.sort.weekday')}</option>
              </select>
              <select value={logDir} onChange={(e)=>{ setLogDir(e.target.value as any); setLogPage(1); }} className="border px-1 py-0.5 rounded text-[11px]">
                <option value="desc">{t('admin.consultations.log.sort.direction.desc')}</option>
                <option value="asc">{t('admin.consultations.log.sort.direction.asc')}</option>
              </select>
            </div>
          </label>
        </div>
      </div>
      <div className="overflow-x-auto max-h-64 border rounded" aria-label={t('admin.consultations.a11y.logTable')}>
        <table className="w-full text-[11px]">
          <thead className="bg-gray-100"><tr><th className="p-1">{t('admin.consultations.availability.log.col.when')}</th><th className="p-1">{t('admin.consultations.availability.log.col.action')}</th><th className="p-1">{t('admin.consultations.availability.log.col.day')}</th><th className="p-1">{t('admin.consultations.availability.log.col.window')}</th><th className="p-1">{t('admin.consultations.availability.log.col.slot')}</th><th className="p-1">{t('admin.consultations.availability.log.col.active')}</th></tr></thead>
          <tbody>
            {logLoading && <tr><td colSpan={6} className="p-2">⏳</td></tr>}
            {!logLoading && logEntries.map(l => {
              const actionMap: Record<string, { key: any; color: string }> = {
                create: { key: 'admin.consultations.availability.log.action.create', color: 'bg-green-100 text-green-700' },
                update: { key: 'admin.consultations.availability.log.action.update', color: 'bg-blue-100 text-blue-700' },
                activate: { key: 'admin.consultations.availability.log.action.activate', color: 'bg-emerald-100 text-emerald-700' },
                deactivate: { key: 'admin.consultations.availability.log.action.deactivate', color: 'bg-amber-100 text-amber-700' },
                delete: { key: 'admin.consultations.availability.log.action.delete', color: 'bg-red-100 text-red-700' }
              };
              const mapped = actionMap[l.action] || { key: 'admin.consultations.availability.log.action.update', color: 'bg-slate-100 text-slate-700' };
              return <tr key={l.rule_id + l.created_at + l.action} className="border-b last:border-none">
                <td className="p-1 whitespace-nowrap" title={l.created_at}>{new Date(l.created_at).toISOString().substring(11,19)}</td>
                <td className="p-1"><span title={t(mapped.key.replace('.action.', '.actionTip.') as any)} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${mapped.color}`}>{t(mapped.key)}</span></td>
                <td className="p-1">{weekdayNames[l.weekday]}</td>
                <td className="p-1">{l.start_time}-{l.end_time}</td>
                <td className="p-1">{l.slot_duration_min}m/{l.max_parallel}x</td>
                <td className="p-1">{l.active? '1':'0'}</td>
              </tr>})}
            {!logLoading && !logEntries.length && <tr><td colSpan={6} className="p-2 text-center text-gray-500">{t('admin.consultations.availability.log.empty')}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" disabled={logPage===1 || logLoading} onClick={()=>{ setLogPage(p=>Math.max(1,p-1)); setTimeout(()=>void loadLog(),0); }}>{t('admin.consultations.availability.log.pagination.prev')}</Button>
        <span className="text-[11px]">{`${logPage} / ${Math.max(1, Math.ceil(logTotal/50))}`} <span className="text-gray-400">({logTotal})</span></span>
        <Button type="button" variant="secondary" disabled={logLoading || logPage*50 >= logTotal} onClick={()=>{ setLogPage(p=>p+1); setTimeout(()=>void loadLog(),0); }}>{t('admin.consultations.availability.log.pagination.next')}</Button>
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

function exportCsv() {
  try {
    const table = document.querySelector('[aria-label="'+ 'Consultations table' +'"] table');
    if (!table) return;
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    const header = ['datetime','user_id','type','status','urgency','notes'];
    const csv: string[] = [header.join(',')];
    rows.forEach(tr => {
      const cols = tr.querySelectorAll('td');
      if (!cols.length || cols.length < 6) return; // skip placeholder rows
      const line = [0,1,2,3,4,5].map(i => '"'+(cols[i] as HTMLElement).innerText.replace(/"/g,'""')+'"').join(',');
      csv.push(line);
    });
    const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'consultations.csv'; a.click(); URL.revokeObjectURL(url);
  } catch {}
}

// Helpers (placed after export to avoid re-render changes; could be moved above component)
function validateTimes(start: string, end: string): string | null {
  const re = /^\d{2}:\d{2}$/;
  if (!re.test(start) || !re.test(end)) {
    // We cannot use t() here because outside hook; return key marker for caller to translate earlier but we already translate before usage.
    // Simpler: map keys inside component before calling; here just return special tokens.
    return 'TIME_INVALID';
  }
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if (sh>23 || eh>23 || sm>59 || em>59) return 'TIME_INVALID';
  const sMin = sh*60+sm; const eMin = eh*60+em;
  if (eMin <= sMin) return 'TIME_RANGE_INVALID';
  return null;
}
