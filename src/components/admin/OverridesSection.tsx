import React, { useState, useEffect, useCallback } from 'react';
import { API } from '../../config/api';
import { useAuth } from '../../contexts';
import { useI18n } from '../../i18n';

export interface OverrideItem {
  id: string; user_id: string; type: 'capability-grant'|'capability-revoke'|'limit-set'; key: string; value: number|null; expires_at: string|null; reason: string|null; created_at: string; expired?: boolean;
}

interface Props { userId: string; }

const OverridesSection: React.FC<Props> = ({ userId }) => {
  const { authenticatedFetch } = useAuth();
  const { t } = useI18n();
  const [list, setList] = useState<OverrideItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [filter, setFilter] = useState('');
  const [advFilters, setAdvFilters] = useState<{ status:'all'|'active'|'expired'; type:''|'capability-grant'|'capability-revoke'|'limit-set' }>({ status:'all', type:'' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 50;
  const [form, setForm] = useState<{ type:'capability-grant'|'capability-revoke'|'limit-set'; key:string; value?: string; days?: string; reason?: string }>({ type:'capability-grant', key:'', value:'', days:'', reason:'' });
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editDraft, setEditDraft] = useState<{ value?: string; days?: string; reason?: string }>({});
  const filtered = list.filter(o => !filter || o.key.toLowerCase().includes(filter.toLowerCase()));

  const load = useCallback(async ()=> {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ user_id: userId });
      if (advFilters.status !== 'all') params.set('status', advFilters.status);
      if (advFilters.type) params.set('type', advFilters.type);
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      const r = await authenticatedFetch(`${API.ADMIN_OVERRIDES}?${params.toString()}`, { method:'GET', autoLogout:true });
      if(!r.ok) throw new Error('HTTP '+r.status);
      const data = await r.json();
      setList(data.results || []); setTotal(data.total||0);
    } catch(e:any){ setError(e.message||'Erro'); } finally { setLoading(false); }
  }, [userId, authenticatedFetch, advFilters, page]);

  useEffect(()=> { load(); }, [load]);


  async function add(){
    const daysNum = form.days ? parseInt(form.days,10) : NaN;
    let expires_at: string | undefined = undefined;
    if(!isNaN(daysNum) && daysNum>0) expires_at = new Date(Date.now()+daysNum*86400000).toISOString();
    const payload:any = { user_id: userId, type: form.type, key: form.key.trim(), reason: form.reason?.trim() || undefined };
    if(form.type==='limit-set') payload.value = form.value===''? null : Number(form.value);
    if(expires_at) payload.expires_at = expires_at;
    const r = await authenticatedFetch(API.ADMIN_OVERRIDES, { method:'POST', body: JSON.stringify(payload), headers:{'Content-Type':'application/json'}, autoLogout:true });
    if(!r.ok) { console.error(await r.text()); return; }
    setForm({ type:'capability-grant', key:'', value:'', days:'', reason:'' });
  await load();
  }
  async function remove(id:string){
    const r = await authenticatedFetch(API.adminOverrideId(id), { method:'DELETE', autoLogout:true });
  if(r.ok) { setList(prev => prev.filter(o=> o.id!==id)); }
  }

  async function startEdit(o: OverrideItem){
    setEditingId(o.id);
    setEditDraft({ value: o.type==='limit-set' && o.value!=null ? String(o.value) : '', days: o.expires_at ? '' : '', reason: o.reason || '' });
  }
  async function cancelEdit(){ setEditingId(null); setEditDraft({}); }
  async function saveEdit(o: OverrideItem){
    const payload: any = {};
    if (o.type==='limit-set') payload.value = editDraft.value===''? null : Number(editDraft.value);
    if (editDraft.days && editDraft.days!== '') {
      const d = parseInt(editDraft.days,10); if (d>0) payload.expires_at = new Date(Date.now()+d*86400000).toISOString();
    }
    if (editDraft.reason !== undefined) payload.reason = editDraft.reason || null;
    const r = await authenticatedFetch(API.adminOverrideId(o.id), { method:'PATCH', body: JSON.stringify(payload), headers:{'Content-Type':'application/json'}, autoLogout:true });
    if(r.ok){
  await load(); setEditingId(null); setEditDraft({});
    }
  }

  return (
    <div className="pt-4 mt-6 border-t space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="font-medium text-xs">{t('overrides.title')}</h4>
        <div className="flex items-center gap-2 flex-wrap">
          <input value={filter} onChange={e=> setFilter(e.target.value)} placeholder={t('overrides.filter.placeholder')} className="border rounded px-2 py-1 text-[11px]" />
          <select value={advFilters.status} onChange={e=> setAdvFilters(f=> ({...f, status: e.target.value as any}))} className="border rounded px-1 py-1 text-[11px]">
            <option value="all">{t('overrides.filters.statusAll')}</option>
            <option value="active">{t('overrides.filters.statusActive')}</option>
            <option value="expired">{t('overrides.filters.statusExpired')}</option>
          </select>
          <select value={advFilters.type} onChange={e=> setAdvFilters(f=> ({...f, type: e.target.value as any}))} className="border rounded px-1 py-1 text-[11px]">
            <option value="">{t('overrides.filters.typeAll')}</option>
            <option value="capability-grant">capability-grant</option>
            <option value="capability-revoke">capability-revoke</option>
            <option value="limit-set">limit-set</option>
          </select>
          <button onClick={()=> { setPage(1); load(); }} className="text-[10px] px-2 py-1 rounded bg-slate-200">{t('overrides.reload')}</button>
        </div>
      </div>
      {loading && <div className="text-[11px] text-gray-500">Carregando...</div>}
      {error && <div className="text-[11px] text-red-600">{error}</div>}
      <p className="text-[11px] text-gray-500">{t('overrides.note')}</p>
      <div className="border rounded p-3 bg-slate-50 space-y-2">
        <div className="grid md:grid-cols-5 gap-2 items-end">
          <div className="flex flex-col">
            <label className="text-[10px] font-medium mb-0.5">{t('overrides.form.type')}</label>
            <select value={form.type} onChange={e=> setForm(f=> ({...f, type:e.target.value as any}))} className="border rounded px-2 py-1 text-[11px]">
              <option value="capability-grant">capability-grant</option>
              <option value="capability-revoke">capability-revoke</option>
              <option value="limit-set">limit-set</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-medium mb-0.5">{t('overrides.form.key')}</label>
            <input value={form.key} onChange={e=> setForm(f=> ({...f, key:e.target.value}))} placeholder={form.type.startsWith('capability')? 'capability code':'limit key'} className="border rounded px-2 py-1 text-[11px] w-full" />
          </div>
          {form.type==='limit-set' && (
            <div className="flex flex-col">
              <label className="text-[10px] font-medium mb-0.5">{t('overrides.form.value')}</label>
              <input value={form.value} onChange={e=> setForm(f=> ({...f, value:e.target.value}))} placeholder="ex: 50" className="border rounded px-2 py-1 text-[11px]" />
            </div>
          )}
          <div className="flex flex-col">
            <label className="text-[10px] font-medium mb-0.5">{t('overrides.form.expiresDays')}</label>
            <input value={form.days} onChange={e=> setForm(f=> ({...f, days:e.target.value}))} placeholder="opcional" className="border rounded px-2 py-1 text-[11px]" />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-medium mb-0.5">{t('overrides.form.reason')}</label>
            <input value={form.reason} onChange={e=> setForm(f=> ({...f, reason:e.target.value}))} placeholder="motivo" className="border rounded px-2 py-1 text-[11px]" />
          </div>
          <div className="md:col-span-5 flex justify-end">
            <button type="button" onClick={add} disabled={!form.key} className="px-3 py-1.5 rounded bg-blue-600 text-white text-[11px] disabled:opacity-50">{t('overrides.form.add')}</button>
          </div>
        </div>
  <table className="w-full text-[11px] border">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="p-1">{t('overrides.col.id')}</th>
              <th className="p-1">{t('overrides.col.type')}</th>
              <th className="p-1">{t('overrides.col.keyValue')}</th>
              <th className="p-1">{t('overrides.col.expires')}</th>
              <th className="p-1">{t('overrides.col.reason')}</th>
              <th className="p-1">{t('overrides.col.created')}</th>
              <th className="p-1">{t('overrides.col.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7} className="p-2 text-center text-[11px] text-gray-500">{t('overrides.empty')}</td></tr>}
            {filtered.map(o => {
              const exp = o.expires_at ? new Date(o.expires_at) : null;
              const isExpired = o.expired || (exp ? exp.getTime() < Date.now(): false);
              return (
                <tr key={o.id} className={`odd:bg-white even:bg-slate-100/60 ${isExpired ? 'opacity-60' : ''}`}>
                  <td className="p-1 font-mono select-all max-w-[110px] truncate" title={o.id}>{o.id}</td>
                  <td className="p-1">{o.type}</td>
                  <td className="p-1 font-mono text-[10px]">
                    {o.key}{' '}
                    {editingId===o.id && o.type==='limit-set' ? (
                      <input className="border rounded px-1 w-14 text-[10px]" value={editDraft.value||''} onChange={e=> setEditDraft(d=> ({...d, value:e.target.value}))} />
                    ) : o.type==='limit-set' ? ' = '+(o.value ?? t('overrides.infinity')) : ''}
                  </td>
                  <td className="p-1 text-[10px] flex items-center gap-1">
                    {editingId===o.id ? (
                      <input className="border rounded px-1 w-16 text-[10px]" placeholder={t('overrides.form.expiresDays')} value={editDraft.days||''} onChange={e=> setEditDraft(d=> ({...d, days:e.target.value}))} />
                    ) : (o.expires_at ? exp?.toLocaleDateString() : '—')}
                    {isExpired && <span className="px-1 rounded bg-red-100 text-red-600 text-[9px]">{t('overrides.expired.badge')}</span>}
                  </td>
                  <td className="p-1 text-[10px] max-w-[140px] truncate" title={o.reason||undefined}>
                    {editingId===o.id ? (
                      <input className="border rounded px-1 w-full text-[10px]" value={editDraft.reason||''} onChange={e=> setEditDraft(d=> ({...d, reason:e.target.value}))} />
                    ) : (o.reason || '—')}
                  </td>
                  <td className="p-1 text-[10px]">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="p-1">
                    {editingId===o.id ? (
                      <div className="flex gap-1">
                        <button type="button" onClick={()=> saveEdit(o)} className="text-[10px] text-green-700 hover:underline">Salvar</button>
                        <button type="button" onClick={cancelEdit} className="text-[10px] text-gray-600 hover:underline">Cancelar</button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button type="button" onClick={()=> startEdit(o)} className="text-[10px] text-blue-600 hover:underline">Editar</button>
                        <button type="button" onClick={()=> remove(o.id)} className="text-[10px] text-red-600 hover:underline">{t('overrides.action.remove')}</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-between pt-2 text-[10px]">
          <div>Total: {total}</div>
          <div className="flex gap-2 items-center">
            <button disabled={page<=1} onClick={()=> setPage(p=> Math.max(1,p-1))} className="px-2 py-1 border rounded disabled:opacity-40">&lt;</button>
            <span>Página {page} / {Math.max(1, Math.ceil(total / pageSize))}</span>
            <button disabled={page>= Math.ceil(total / pageSize)} onClick={()=> setPage(p=> p+1)} className="px-2 py-1 border rounded disabled:opacity-40">&gt;</button>
          </div>
        </div>
        <p className="text-[10px] text-gray-400">{t('overrides.note')}</p>
      </div>
    </div>
  );
};

export default OverridesSection;