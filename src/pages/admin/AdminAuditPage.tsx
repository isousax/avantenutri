import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

interface AuditRow { [k: string]: any }

type Tab = 'password' | 'revoked' | 'role';

const AdminAuditPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('password');
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const pageSize = 20;
  const [userIdFilter, setUserIdFilter] = useState('');

  // Caso deseje proteger com x-api-key, pode-se usar variável env pública + proxy. Aqui assumo não exposta no front -> preferir Authorization admin e backend poderia aceitar, mas atual design requer x-api-key.
  const apiKey = (import.meta as any).env.VITE_ADMIN_AUDIT_KEY || '';

  const load = async () => {
    setLoading(true); setError(null);
    try {
  const params = new URLSearchParams({ type: tab, page: String(page), pageSize: String(pageSize) });
  if (userIdFilter.trim()) params.set('user_id', userIdFilter.trim());
      const r = await fetch(`/api/admin/audit?${params.toString()}`, { headers: apiKey ? { 'x-api-key': apiKey } : {} });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setRows(data.results || []);
    } catch (err:any) { setError(err.message || 'Erro ao carregar auditoria'); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ void load(); /* eslint-disable-next-line */ }, [tab, page]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Auditoria</h1>
      <div className="flex gap-2">
        {(['password','revoked','role'] as Tab[]).map(t => (
          <button key={t} onClick={()=>{ setPage(1); setTab(t); }} className={`px-3 py-1 rounded text-sm border ${tab===t ? 'bg-green-600 text-white border-green-600':'border-gray-300 hover:bg-gray-100'}`}>{t}</button>
        ))}
      </div>
      <form onSubmit={e=>{ e.preventDefault(); setPage(1); void load(); }} className="flex gap-2 items-center">
        <input value={userIdFilter} onChange={e=>setUserIdFilter(e.target.value)} placeholder="Filtrar por user_id" className="border px-2 py-1 rounded text-sm" />
        <Button type="submit" variant="secondary">Filtrar</Button>
        {userIdFilter && <button type="button" className="text-xs text-gray-600 hover:underline" onClick={()=>{ setUserIdFilter(''); setPage(1); void load(); }}>Limpar</button>}
      </form>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-100 text-left">
              {tab === 'password' && (<>
                <th className="p-2">User</th>
                <th className="p-2">IP</th>
                <th className="p-2">Data</th>
              </>)}
              {tab === 'revoked' && (<>
                <th className="p-2">JTI</th>
                <th className="p-2">User</th>
                <th className="p-2">Reason</th>
                <th className="p-2">Revoked</th>
                <th className="p-2">Expires</th>
              </>)}
              {tab === 'role' && (<>
                <th className="p-2">User</th>
                <th className="p-2">Old</th>
                <th className="p-2">New</th>
                <th className="p-2">By</th>
                <th className="p-2">Reason</th>
                <th className="p-2">Data</th>
              </>)}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="p-4">Carregando...</td></tr>}
            {!loading && rows.map((r,i) => (
              <tr key={i} className="border-b last:border-none hover:bg-gray-50">
                {tab==='password' && (<>
                  <td className="p-2">{r.user_id}</td>
                  <td className="p-2">{r.ip}</td>
                  <td className="p-2">{r.changed_at}</td>
                </>)}
                {tab==='revoked' && (<>
                  <td className="p-2 max-w-[120px] truncate" title={r.jti}>{r.jti}</td>
                  <td className="p-2">{r.user_id}</td>
                  <td className="p-2">{r.reason}</td>
                  <td className="p-2">{r.revoked_at}</td>
                  <td className="p-2">{r.expires_at}</td>
                </>)}
                {tab==='role' && (<>
                  <td className="p-2">{r.user_id}</td>
                  <td className="p-2">{r.old_role}</td>
                  <td className="p-2">{r.new_role}</td>
                  <td className="p-2">{r.changed_by}</td>
                  <td className="p-2">{r.reason}</td>
                  <td className="p-2">{r.changed_at}</td>
                </>)}
              </tr>
            ))}
            {!loading && rows.length===0 && <tr><td colSpan={8} className="p-4">Sem registros</td></tr>}
          </tbody>
        </table>
      </Card>
      <div className="flex gap-2 items-center">
        <Button type="button" variant="secondary" disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Anterior</Button>
        <span>Página {page}</span>
        <Button type="button" variant="secondary" onClick={()=>setPage(p=>p+1)}>Próxima</Button>
      </div>
    </div>
  );
};

export default AdminAuditPage;
