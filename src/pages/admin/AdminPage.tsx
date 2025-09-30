import React, { useEffect, useMemo, useState } from 'react';
import Skeleton from '../../components/ui/Skeleton';
import { useI18n, formatDate as fmtDate } from '../../i18n';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts';
import { RoleRoute } from '../../components/RoleRoute';
import { SEO } from '../../components/comum/SEO';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  display_name?: string;
  created_at?: string;
  last_login_at?: string;
  plan_id?: string;
  email_confirmed?: number;
}

interface Consultation {
  id: string;
  user_id: string;
  type: string;
  status: string;
  scheduled_at: string;
  duration_min: number;
  urgency?: string;
}

const AdminPage: React.FC = () => {
  const { logout, getAccessToken } = useAuth();
  const [tab, setTab] = useState<'pacientes' | 'consultas' | 'relatorios'>('pacientes');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersHasMore, setUsersHasMore] = useState(false);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [consultLoading, setConsultLoading] = useState(false);
  const [consultFilters, setConsultFilters] = useState<{status?: string}>({});
  const pageSize = 20;

  // Fetch users (patients). API supports pagination + q filter.
  useEffect(()=> {
    if (tab !== 'pacientes') return;
    let ignore = false;
    async function load(){
      setUsersLoading(true);
      try {
        const access = await getAccessToken();
        if(!access){ if(!ignore){ setUsers([]);} return; }
        const base = import.meta.env.VITE_API_AUTH_BASE || 'https://login-service.avantenutri.workers.dev';
        const params = new URLSearchParams({ page: String(usersPage), pageSize: String(pageSize) });
        if (searchTerm) params.set('q', searchTerm);
        const r = await fetch(`${base}/admin/users?${params.toString()}`, { headers: { authorization: `Bearer ${access}` }});
        if(!r.ok) throw new Error('fail');
        const data = await r.json();
        if(ignore) return;
        setUsers(data.results || []);
        setUsersHasMore((data.results||[]).length === pageSize);
      } catch { if(!ignore) setUsers([]); }
      finally { if(!ignore) setUsersLoading(false); }
    }
    load();
    return () => { ignore = true; };
  }, [tab, usersPage, searchTerm, getAccessToken]);

  // Fetch consultations
  useEffect(()=> {
    if (tab !== 'consultas') return;
    let ignore = false;
    async function load(){
      setConsultLoading(true);
      try {
        const access = await getAccessToken();
        if(!access){ if(!ignore){ setConsultations([]);} return; }
        const base = import.meta.env.VITE_API_AUTH_BASE || 'https://login-service.avantenutri.workers.dev';
        const params = new URLSearchParams({ page: '1', pageSize: '50' });
        if (consultFilters.status) params.set('status', consultFilters.status);
        const r = await fetch(`${base}/admin/consultations?${params.toString()}`, { headers: { authorization: `Bearer ${access}` }});
        if(!r.ok) throw new Error('fail');
        const data = await r.json();
        if(ignore) return;
        setConsultations(data.results || []);
      } catch { if(!ignore) setConsultations([]); }
      finally { if(!ignore) setConsultLoading(false); }
    }
    load();
    return () => { ignore = true; };
  }, [tab, consultFilters, getAccessToken]);

  const filteredUsers = useMemo(()=> {
    if (!searchTerm) return users;
    const s = searchTerm.toLowerCase();
    return users.filter(u => (u.display_name || '').toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
  }, [users, searchTerm]);

  const stats = useMemo(()=> ({
    totalPacientes: users.length,
    pendentes: 0, // backend ainda não fornece pagamento aqui
    emAndamento: 0,
    atrasados: 0
  }), [users]);

  const { t } = useI18n();
  return (
    <RoleRoute role="admin">
      <div className="min-h-screen flex flex-col bg-gray-50 p-4">
        <SEO title={t('admin.dashboard.seo.title')} description={t('admin.dashboard.seo.desc')} />
        <div className="max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-green-700">{t('admin.dashboard.title')}</h2>
              <p className="text-gray-600 text-sm">Bem-vinda, Dra. Cawanne</p>
            </div>
            <div className="flex gap-3 items-center text-sm">
              <Link to="/admin/usuarios" className="text-green-700 hover:underline">{t('admin.users.title')}</Link>
              <Link to="/admin/audit" className="text-green-700 hover:underline">Auditoria</Link>
              <Link to="/admin/entitlements" className="text-green-700 hover:underline">Entitlements</Link>
              <Button variant="secondary" onClick={logout}>Sair</Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Pacientes</p>
                  <p className="text-2xl font-bold text-green-700">{stats.totalPacientes}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="w-6 h-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </Card>
            <Card className="bg-white p-4 flex flex-col justify-center"><p className="text-sm text-gray-600 mb-1">Planos (indicativo)</p><p className="text-xl font-semibold text-green-700">-</p></Card>
            <Card className="bg-white p-4 flex flex-col justify-center"><p className="text-sm text-gray-600 mb-1">Atividade (mês)</p><p className="text-xl font-semibold text-green-700">-</p></Card>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mb-6">
            <button
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                tab === 'pacientes'
                  ? 'bg-green-600 text-white'
                  : 'text-green-600 hover:bg-green-50'
              }`}
              onClick={() => setTab('pacientes')}
            >
              Pacientes
            </button>
            <button
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                tab === 'consultas'
                  ? 'bg-green-600 text-white'
                  : 'text-green-600 hover:bg-green-50'
              }`}
              onClick={() => setTab('consultas')}
            >
              Consultas
            </button>
            <button
              className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                tab === 'relatorios'
                  ? 'bg-green-600 text-white'
                  : 'text-green-600 hover:bg-green-50'
              }`}
              onClick={() => setTab('relatorios')}
            >
              Relatórios
            </button>
          </div>

          {tab === 'pacientes' && (
            <Card className="p-0 overflow-hidden">
              <div className="p-4 border-b flex flex-col md:flex-row gap-4 md:items-center">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <svg className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" className="text-sm">Exportar</Button>
                  <Button className="text-sm">Novo Paciente</Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="py-3 px-4 font-medium">Paciente</th>
                      <th className="py-3 px-4 font-medium">Plano</th>
                      <th className="py-3 px-4 font-medium">Role</th>
                      <th className="py-3 px-4 font-medium">Criado</th>
                      <th className="py-3 px-4 font-medium">Último Login</th>
                      <th className="py-3 px-4 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading && (
                      <tr>
                        <td colSpan={6} className="py-6 px-4">
                          <div className="space-y-4">
                            <Skeleton lines={3} />
                            <Skeleton lines={3} />
                            <Skeleton lines={3} />
                          </div>
                        </td>
                      </tr>
                    )}
                    {!usersLoading && filteredUsers.length === 0 && (
                      <tr><td colSpan={6} className="py-10 text-center text-gray-500">Nenhum usuário encontrado.</td></tr>
                    )}
                    {!usersLoading && filteredUsers.map(u => (
                      <tr key={u.id} className="border-t hover:bg-green-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-semibold">
                              {(u.display_name || u.email).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 leading-tight">{u.display_name || '—'}</p>
                              <p className="text-gray-500 text-xs">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{u.plan_id || '—'}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700 uppercase tracking-wide">{u.role}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-xs">{u.created_at ? fmtDate(u.created_at,'pt',{ dateStyle:'short'}) : '—'}</td>
                        <td className="py-3 px-4 text-gray-600 text-xs">{u.last_login_at ? fmtDate(u.last_login_at,'pt',{ dateStyle:'short'}) : '—'}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button variant="secondary" className="text-xs">Perfil</Button>
                            <Button variant="secondary" className="text-xs">Planos</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t flex items-center justify-between text-sm bg-gray-50">
                <span>Página {usersPage}</span>
                <div className="flex gap-2">
                  <Button variant="secondary" disabled={usersPage===1 || usersLoading} onClick={()=> setUsersPage(p=> Math.max(1,p-1))}>Anterior</Button>
                  <Button variant="secondary" disabled={!usersHasMore || usersLoading} onClick={()=> setUsersPage(p=> p+1)}>Próxima</Button>
                </div>
              </div>
            </Card>
          )}

          {tab === 'consultas' && (
            <Card className="p-0 overflow-hidden">
              <div className="p-4 border-b flex flex-col md:flex-row gap-4 md:items-center">
                <div className="flex gap-2 items-center text-sm">
                  <label className="text-gray-600">Status:</label>
                  <select onChange={(e)=> setConsultFilters({ status: e.target.value || undefined })} value={consultFilters.status || ''} className="border rounded px-2 py-1 text-sm focus:ring-green-500 focus:border-green-500">
                    <option value="">Todos</option>
                    <option value="scheduled">Programadas</option>
                    <option value="completed">Concluídas</option>
                    <option value="canceled">Canceladas</option>
                  </select>
                </div>
                <div className="flex gap-2 ml-auto">
                  <Button variant="secondary" className="text-sm">Exportar</Button>
                  <Button className="text-sm">Criar Consulta</Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="py-3 px-4 font-medium">Data/Hora</th>
                      <th className="py-3 px-4 font-medium">Paciente</th>
                      <th className="py-3 px-4 font-medium">Tipo</th>
                      <th className="py-3 px-4 font-medium">Duração</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium">Urgência</th>
                      <th className="py-3 px-4 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultLoading && (
                      <tr>
                        <td colSpan={7} className="py-6 px-4">
                          <div className="space-y-4">
                            <Skeleton lines={3} />
                            <Skeleton lines={3} />
                            <Skeleton lines={3} />
                          </div>
                        </td>
                      </tr>
                    )}
                    {!consultLoading && consultations.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-gray-500">Nenhuma consulta encontrada.</td></tr>}
                    {!consultLoading && consultations.map(c => {
                      const dt = new Date(c.scheduled_at);
                      const dateStr = fmtDate(dt.toISOString(),'pt',{ dateStyle:'short'}) + ' ' + dt.toISOString().slice(11,16);
                      return (
                        <tr key={c.id} className="border-t hover:bg-green-50">
                          <td className="py-3 px-4 text-gray-800 whitespace-nowrap">{dateStr}</td>
                          <td className="py-3 px-4 text-gray-700">{c.user_id.slice(0,8)}...</td>
                          <td className="py-3 px-4 capitalize">{c.type}</td>
                          <td className="py-3 px-4 text-gray-600">{c.duration_min} min</td>
                          <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wide ${c.status === 'scheduled' ? 'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-600'}`}>{c.status}</span></td>
                          <td className="py-3 px-4 text-xs">{c.urgency || '—'}</td>
                          <td className="py-3 px-4 text-right"><Button variant="secondary" className="text-xs">Detalhes</Button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {tab === 'relatorios' && (
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Relatórios e Análises</h3>
              <p className="text-gray-600">Em desenvolvimento...</p>
            </Card>
          )}
        </div>
      </div>
    </RoleRoute>
  );
};

export default AdminPage;
