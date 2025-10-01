import React, { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Painel leve de desenvolvimento para inspecionar queries e tempos restantes de stale
const DevQueryPanel: React.FC = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(()=> setTick(t=> t+1), 1000);
    return () => clearInterval(id);
  }, [open]);

  const queries = qc.getQueryCache().getAll();
  const now = Date.now();
  const rows = useMemo(() => queries.map(q => {
      const updatedAt = q.state.dataUpdatedAt || 0;
      const opts: any = (q as any).options || {};
      const staleTime = opts.staleTime ?? 0;
      const age = now - updatedAt;
      const remaining = staleTime ? Math.max(0, staleTime - age) : 0;
      const isFetching = qc.isFetching({ queryKey: q.queryKey }) > 0;
      const isStale = q.isStale();
      return {
        instance: q,
        key: JSON.stringify(q.queryKey),
        queryKey: q.queryKey,
        status: q.state.status,
        hasData: q.state.data != null,
        ageSec: Math.round(age/1000),
        remainingSec: Math.round(remaining/1000),
        observers: q.getObserversCount(),
        isFetching,
        isStale,
      };
    }), [queries, now, tick]);

  const invalidateAll = () => {
    qc.getQueryCache().getAll().forEach(q => qc.invalidateQueries({ queryKey: q.queryKey }));
  };
  const refetchActive = () => {
    qc.getQueryCache().getAll().forEach(q => {
      if (q.getObserversCount() > 0) qc.refetchQueries({ queryKey: q.queryKey });
    });
  };

  if (!import.meta.env.DEV) return null;
  return (
    <div style={{ position:'fixed', bottom:10, right:10, zIndex:9999, fontFamily:'ui-monospace', fontSize:12 }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ background:'#111827', color:'white', padding:'6px 10px', borderRadius:8, boxShadow:'0 2px 6px rgba(0,0,0,0.3)', display:'flex', alignItems:'center', gap:6 }}>
        {open ? 'Fechar' : 'Queries'} ({rows.length})
        {rows.some(r=>r.isFetching) && (
          <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:'#3b82f6', boxShadow:'0 0 0 2px #1e3a8a55' }} />
        )}
      </button>
      {open && (
        <div style={{ marginTop:6, background:'white', border:'1px solid #e5e7eb', borderRadius:8, width:380, maxHeight:360, overflow:'auto', padding:8 }}>
          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
            <button onClick={invalidateAll} style={{ background:'#f59e0b', color:'#fff', padding:'4px 8px', borderRadius:6, fontSize:11 }}>Invalidate All</button>
            <button onClick={refetchActive} style={{ background:'#2563eb', color:'#fff', padding:'4px 8px', borderRadius:6, fontSize:11 }}>Refetch Active</button>
            <button onClick={()=> qc.clear()} style={{ background:'#dc2626', color:'#fff', padding:'4px 8px', borderRadius:6, fontSize:11 }}>Clear</button>
          </div>
          {rows.length === 0 && <div style={{ padding:8, color:'#6b7280' }}>Nenhuma query</div>}
          {rows.map(r => {
            const tone = r.isFetching ? '#3b82f6' : r.status === 'error' ? '#dc2626' : r.isStale ? '#f59e0b' : '#16a34a';
            return (
              <div key={r.key} style={{ border:'1px solid #f1f5f9', padding:'6px 6px', borderRadius:6, marginBottom:6, background:'#f8fafc' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:6 }}>
                  <div style={{ fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:1 }}>{r.key}</div>
                  <div style={{ display:'flex', gap:4 }}>
                    <button onClick={()=> qc.invalidateQueries({ queryKey: r.queryKey })} title='Invalidate' style={{ background:'#f59e0b', color:'#fff', borderRadius:4, padding:'2px 6px', fontSize:10 }}>Inv</button>
                    <button onClick={()=> qc.refetchQueries({ queryKey: r.queryKey })} title='Refetch' style={{ background:'#2563eb', color:'#fff', borderRadius:4, padding:'2px 6px', fontSize:10 }}>Ref</button>
                    <button onClick={()=> qc.removeQueries({ queryKey: r.queryKey })} title='Remove' style={{ background:'#64748b', color:'#fff', borderRadius:4, padding:'2px 6px', fontSize:10 }}>Del</button>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', color:'#475569', marginTop:4, fontSize:11 }}>
                  <span>Status: <span style={{ color:tone }}>{r.status}</span></span>
                  <span>Obs: {r.observers}</span>
                  <span>Age: {r.ageSec}s</span>
                  <span>TTL: {r.remainingSec}s</span>
                  <span>Data: {r.hasData ? '✓' : '—'}</span>
                  <span>Fetching: {r.isFetching ? '●' : '—'}</span>
                  <span>Stale: {r.isStale ? 'sim' : 'não'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DevQueryPanel;
