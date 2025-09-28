import React, { useEffect, useState, useCallback } from 'react';
import { API } from '../../config/api';
import { useAuth } from '../../contexts';
import { useI18n } from '../../i18n';

interface LogItem { id:number; override_id:string|null; user_id:string; action:string; snapshot:any; created_by:string|null; created_at:string; }

interface Props { userId: string; }

const OverrideLogs: React.FC<Props> = ({ userId }) => {
  const { authenticatedFetch } = useAuth();
  const { t } = useI18n();
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [actionFilter, setActionFilter] = useState<'all'|'create'|'update'|'delete'>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 100;

  const load = useCallback(async ()=> {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ user_id: userId, page: String(page), pageSize: String(pageSize) });
      if (actionFilter !== 'all') params.set('action', actionFilter);
      const r = await authenticatedFetch(`${API.ADMIN_OVERRIDES_LOGS}?${params.toString()}`, { method:'GET', autoLogout:true });
      if(!r.ok) throw new Error('HTTP '+r.status);
      const data = await r.json();
      setLogs(data.results || []); setTotal(data.total||0);
    } catch(e:any){ setError(e.message||'Erro'); } finally { setLoading(false); }
  }, [userId, authenticatedFetch, actionFilter, page]);

  function exportCSV(){
    const headers = ['id','action','override_id','key','type','value','expires_at','reason','created_at'];
    const lines = logs.map(l => {
      const s = l.snapshot || {};
      const row = [l.id, l.action, l.override_id||'', s.key||'', s.type||'', s.type==='limit-set'? (s.value??''): '', s.expires_at||'', s.reason||'', l.created_at];
      return row.map(v=> '"'+String(v).replace(/"/g,'""')+'"').join(',');
    });
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `override_logs_${userId}.csv`; a.click();
    setTimeout(()=> URL.revokeObjectURL(url), 2000);
  }
  useEffect(()=> { load(); }, [load]);

  return (
    <div className="space-y-2 mt-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h5 className="text-[11px] font-semibold">Logs</h5>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={actionFilter} onChange={e=> setActionFilter(e.target.value as any)} className="border rounded px-1 py-1 text-[10px]">
            <option value="all">{t('overrides.filters.statusAll')}</option>
            <option value="create">create</option>
            <option value="update">update</option>
            <option value="delete">delete</option>
          </select>
          <button onClick={()=> { setPage(1); load(); }} className="text-[10px] px-2 py-1 rounded bg-slate-200">{t('overrides.reload')}</button>
          <button onClick={exportCSV} className="text-[10px] px-2 py-1 rounded bg-emerald-600 text-white">CSV</button>
        </div>
      </div>
      {loading && <div className="text-[10px] text-gray-500">Carregando...</div>}
      {error && <div className="text-[10px] text-red-600">{error}</div>}
      <div className="max-h-60 overflow-auto border rounded bg-white">
        <table className="w-full text-[10px]">
          <thead className="sticky top-0 bg-slate-100">
            <tr>
              <th className="p-1 text-left">ID</th>
              <th className="p-1 text-left">Action</th>
              <th className="p-1 text-left">Override</th>
              <th className="p-1 text-left">Key/Value</th>
              <th className="p-1 text-left">Expires</th>
              <th className="p-1 text-left">Reason</th>
              <th className="p-1 text-left">At</th>
            </tr>
          </thead>
          <tbody>
            {logs.length===0 && <tr><td colSpan={7} className="p-2 text-center text-gray-500">—</td></tr>}
            {logs.map(l => {
              const snap = l.snapshot || {};
              const exp = snap.expires_at ? new Date(snap.expires_at) : null;
              return (
                <tr key={l.id} className="odd:bg-white even:bg-slate-50">
                  <td className="p-1 font-mono">{l.id}</td>
                  <td className="p-1">{l.action}</td>
                  <td className="p-1 font-mono truncate max-w-[90px]" title={l.override_id||undefined}>{l.override_id||'-'}</td>
                  <td className="p-1 font-mono">{snap.key}{snap.type==='limit-set' ? '='+ (snap.value ?? t('overrides.infinity')) : ''}</td>
                  <td className="p-1">{snap.expires_at ? exp?.toLocaleDateString() : '—'}</td>
                  <td className="p-1 truncate max-w-[120px]" title={snap.reason||undefined}>{snap.reason || '—'}</td>
                  <td className="p-1">{new Date(l.created_at).toLocaleTimeString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between pt-1 text-[10px]">
        <div>Total: {total}</div>
        <div className="flex gap-2 items-center">
          <button disabled={page<=1} onClick={()=> setPage(p=> Math.max(1,p-1))} className="px-2 py-1 border rounded disabled:opacity-40">&lt;</button>
          <span>Página {page} / {Math.max(1, Math.ceil(total / pageSize))}</span>
          <button disabled={page>= Math.ceil(total / pageSize)} onClick={()=> setPage(p=> p+1)} className="px-2 py-1 border rounded disabled:opacity-40">&gt;</button>
        </div>
      </div>
    </div>
  );
};

export default OverrideLogs;