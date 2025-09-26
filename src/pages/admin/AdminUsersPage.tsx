import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

interface ListedUser { id: string; email: string; role: string; email_confirmed: number; session_version: number; created_at: string; display_name?: string; last_login_at?: string; }

const roles = ['patient','admin'];

const AdminUsersPage: React.FC = () => {
  const { authenticatedFetch, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<ListedUser[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [changing, setChanging] = useState<string | null>(null);
  const [userIdFilter, setUserIdFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true); setError(null);
      // reutiliza authenticatedFetch para anexar bearer
  const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) qs.set('q', search);
  if (userIdFilter) qs.set('user_id', userIdFilter);
  const r = await authenticatedFetch(`/api/admin/users?${qs.toString()}`, { method: 'GET', autoLogout: true });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setUsers(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar usuários');
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [page, pageSize]);

  const onSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); void load(); };

  const applyRole = async (id: string, newRole: string) => {
    try {
      setChanging(id);
      const r = await authenticatedFetch(`/api/admin/users/${id}/role`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ new_role: newRole, reason: 'UI change' }) });
      if (!r.ok) throw new Error('Falha ao mudar role');
      await load();
    } catch (err: any) { setError(err.message); } finally { setChanging(null); }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Gerenciar Usuários</h1>
      <form onSubmit={onSearch} className="flex flex-wrap gap-2 items-center">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar email" className="border px-3 py-2 rounded w-64" />
        <input value={userIdFilter} list="user-id-options" onChange={e=>setUserIdFilter(e.target.value)} placeholder="Filtrar por user_id" className="border px-3 py-2 rounded w-56" />
        <datalist id="user-id-options">
          {users.map(u => <option key={u.id} value={u.id}>{u.display_name || u.email}</option>)}
        </datalist>
        <Button type="submit">Buscar</Button>
        {(search || userIdFilter) && <Button type="button" variant="secondary" onClick={()=>{ setSearch(''); setUserIdFilter(''); setPage(1); void load(); }}>Limpar</Button>}
      </form>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Email</th>
              <th className="p-2">Display</th>
              <th className="p-2">Role</th>
              <th className="p-2">Confirmado</th>
              <th className="p-2">Session Ver</th>
              <th className="p-2">Criado</th>
              <th className="p-2">Último Login</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="p-4">Carregando...</td></tr>}
            {!loading && users.map(u => (
              <tr key={u.id} className="border-b last:border-none hover:bg-gray-50">
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.display_name || '-'}</td>
                <td className="p-2">
                  <select disabled={changing===u.id || u.id===user?.id} value={u.role} onChange={(e)=>applyRole(u.id, e.target.value)} className="border px-2 py-1 rounded">
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="p-2">{u.email_confirmed ? 'Sim':'Não'}</td>
                <td className="p-2">{u.session_version}</td>
                <td className="p-2">{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                <td className="p-2">{u.last_login_at ? new Date(u.last_login_at).toLocaleString('pt-BR') : '-'}</td>
                <td className="p-2">
                  <div className="flex flex-col gap-1">
                    {changing===u.id && <span className="text-xs text-gray-500">Atualizando...</span>}
                    <button
                      disabled={changing===u.id}
                      onClick={async ()=>{
                        try {
                          setChanging(u.id);
                          const r = await authenticatedFetch(`/api/admin/users/${u.id}/force-logout`, { method: 'POST' });
                          if (!r.ok) throw new Error('Falha ao forçar logout');
                        } catch (err:any) { setError(err.message); } finally { setChanging(null); }
                      }}
                      className="text-[10px] text-red-600 hover:underline disabled:opacity-50"
                    >Forçar Logout</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && users.length===0 && <tr><td colSpan={6} className="p-4">Nenhum usuário</td></tr>}
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

export default AdminUsersPage;
