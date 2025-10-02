import React, {
  useEffect,
  useState,
  type FormEvent,
  type ChangeEvent,
} from "react";
import { useAuth } from "../../contexts";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { API } from "../../config/api";
import { useI18n, formatDate as fmtDate } from "../../i18n";
import { SEO } from "../../components/comum/SEO";
import Skeleton from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/ToastProvider";

interface ListedUser {
  id: string;
  email: string;
  role: string;
  email_confirmed: number;
  session_version: number;
  created_at: string;
  display_name?: string;
  last_login_at?: string;
}

interface ApiResponse {
  results: ListedUser[];
}

const roles = ["patient", "admin"];

const AdminUsersPage: React.FC = () => {
  const { authenticatedFetch, user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [users, setUsers] = useState<ListedUser[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [search, setSearch] = useState<string>("");
  const [changing, setChanging] = useState<string | null>(null);
  const [userIdFilter, setUserIdFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  // Plan system removed

  const { push } = useToast();

  const load = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const qs = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search) qs.set("q", search);
      if (userIdFilter) qs.set("user_id", userIdFilter);
      const r = await authenticatedFetch(`${API.ADMIN_USERS}?${qs.toString()}`, {
        method: "GET",
        autoLogout: true,
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data: ApiResponse = await r.json();
      setUsers(data.results || []);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro ao carregar usuários");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line
  }, [page, pageSize]);

  // legacy plan functions removed

  const onSearch = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setPage(1);
    void load();
  };

  const applyRole = async (id: string, newRole: string): Promise<void> => {
    try {
      setChanging(id);
      const r = await authenticatedFetch(API.adminUserRole(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_role: newRole, reason: "UI change" }),
      });
      if (!r.ok) throw new Error("Falha ao mudar role");
      await load();
      push({ type: 'success', message: 'Role alterada com sucesso' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao mudar role';
      setError(msg);
      push({ type: 'error', message: msg });
    } finally {
      setChanging(null);
    }
  };

  // submitPlanChange removed

  // Modal state
  // plan confirmation state removed

  // removed legacy derived states

  const { locale, t } = useI18n();
  return (
    <div className="p-3 sm:p-4 space-y-4">
  <SEO title={t('admin.users.seo.title')} description={t('admin.users.seo.desc')} />
  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
    <div>
      <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{t('admin.users.title')}</h1>
  <p className="text-xs text-gray-500 mt-0.5">Gerencie contas e roles.</p>
    </div>
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" onClick={()=> void load()} disabled={loading} className="text-sm px-3 py-2">
        {loading ? '...' : 'Recarregar'}
      </Button>
    </div>
  </div>
      <form onSubmit={onSearch} className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
        <input
          value={search}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
          placeholder={t('common.search') || 'Buscar email'}
          className="border px-3 py-2 rounded w-full sm:w-64 text-sm"
        />
        <input
          value={userIdFilter}
          list="user-id-options"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setUserIdFilter(e.target.value)
          }
          placeholder={t('admin.user.filter.userId') || 'Filtrar por user_id'}
          className="border px-3 py-2 rounded w-full sm:w-56 text-sm"
        />
        <datalist id="user-id-options">
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.display_name || u.email}
            </option>
          ))}
        </datalist>
  <Button type="submit" className="text-sm px-4 py-2">{t('common.search') || 'Buscar'}</Button>
        {(search || userIdFilter) && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setSearch("");
              setUserIdFilter("");
              setPage(1);
              void load();
            }}
            className="text-sm px-4 py-2"
          >
            {t('common.clear') || 'Limpar'}
          </Button>
        )}
      </form>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {/* Desktop table */}
      <Card className="p-0 overflow-x-auto hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">E-mail</th>
              <th className="p-2">{t('admin.user.displayName') || 'Nome de Exibição'}</th>
              <th className="p-2">{t('admin.user.role') || 'Tipo de Acesso'}</th>
              <th className="p-2">{t('admin.user.emailVerified') || 'E-mail Verificado'}</th>
              {/* Plan column removed */}
              <th
                className="p-2"
                title="Versão de sessão (muda após eventos de segurança)"
              >
                Versão Sessão
              </th>
              <th className="p-2">{t('admin.user.createdAt') || 'Data de Criação'}</th>
              <th className="p-2">{t('admin.user.lastLogin') || 'Último Acesso'}</th>
              <th className="p-2">{t('common.actions') || 'Ações'}</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className="p-4">
                  <div className="space-y-2">
                    <Skeleton lines={3} />
                    <Skeleton lines={3} />
                    <Skeleton lines={3} />
                  </div>
                </td>
              </tr>
            )}
            {!loading &&
              users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b last:border-none hover:bg-gray-50"
                >
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.display_name || "-"}</td>
                  <td className="p-2">
                    <select
                      disabled={changing === u.id || u.id === user?.id}
                      value={u.role}
                      onChange={(e) => applyRole(u.id, e.target.value)}
                      className="border px-2 py-1 rounded"
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">{u.email_confirmed ? (t('common.yes') || 'Sim') : (t('common.no') || 'Não')}</td>
                  {/* Plan cell removed */}
                  <td className="p-2">{u.session_version}</td>
                  <td className="p-2">
                    {fmtDate(u.created_at, locale, { dateStyle: 'short'})}
                  </td>
                  <td className="p-2">
                    {u.last_login_at
                      ? fmtDate(u.last_login_at, locale, { dateStyle: 'short', timeStyle: 'short'})
                      : "-"}
                  </td>
                  <td className="p-2">
                    <div className="flex flex-col gap-1">
                      {changing === u.id && (
                        <span className="text-xs text-gray-500">
                          Atualizando...
                        </span>
                      )}
                      <button
                        disabled={changing === u.id}
                        onClick={async () => {
                          try {
                            setChanging(u.id);
                            const r = await authenticatedFetch(API.adminUserForceLogout(u.id), { method: "POST" });
                            if (!r.ok) throw new Error("Falha ao forçar logout");
                            push({ type: 'success', message: 'Logout forçado' });
                          } catch (err) {
                            const msg = err instanceof Error ? err.message : 'Erro ao forçar logout';
                            setError(msg);
                            push({ type: 'error', message: msg });
                          } finally {
                            setChanging(null);
                          }
                        }}
                        className="text-[10px] text-red-600 hover:underline disabled:opacity-50"
                      >
                        {t('admin.user.forceLogout') || 'Forçar Logout'}
                      </button>
                      {/* Plan editing removed */}
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={8} className="p-4">
                  {t('admin.users.empty') || 'Nenhum usuário'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
      {/* Mobile list */}
      <div className="space-y-3 md:hidden">
        {loading && (
          <Card className="p-4"><Skeleton lines={3} /></Card>
        )}
        {!loading && users.map(u => (
          <Card key={u.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium text-sm break-all">{u.email}</div>
                <div className="text-[11px] text-gray-500 mt-0.5 flex flex-wrap gap-2">
                  {/* Plan info removed */}
                  <span>{t('admin.user.emailVerified')}: {u.email_confirmed ? (t('common.yes')||'Sim') : (t('common.no')||'Não')}</span>
                </div>
              </div>
              <div className="text-[10px] text-gray-400 font-mono select-all">{u.id.slice(0,8)}</div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-medium">{t('admin.user.role')}</label>
              <select
                disabled={changing === u.id || u.id === user?.id}
                value={u.role}
                onChange={(e) => applyRole(u.id, e.target.value)}
                className="border px-2 py-1 rounded text-sm"
              >
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
              <div>
                <span className="block text-gray-400">{t('admin.user.createdAt')}</span>
                {fmtDate(u.created_at, locale, { dateStyle:'short'})}
              </div>
              <div>
                <span className="block text-gray-400">{t('admin.user.lastLogin')}</span>
                {u.last_login_at ? fmtDate(u.last_login_at, locale, { dateStyle:'short'}) : '-'}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                disabled={changing === u.id}
                onClick={async () => {
                  try {
                    setChanging(u.id);
                    const r = await authenticatedFetch(API.adminUserForceLogout(u.id), { method: 'POST' });
                    if(!r.ok) throw new Error('Falha ao forçar logout');
                    push({ type:'success', message:'Logout forçado' });
                  } catch(err){
                    const msg = err instanceof Error ? err.message : 'Erro ao forçar logout';
                    setError(msg); push({ type:'error', message: msg });
                  } finally { setChanging(null); }
                }}
                className="text-[11px] text-red-600 hover:underline disabled:opacity-50"
              >{t('admin.user.forceLogout')}</button>
            </div>
            {/* Plan edit UI removed */}
          </Card>
        ))}
        {!loading && users.length===0 && <Card className="p-4 text-center text-xs text-gray-500">{t('admin.users.empty')}</Card>}
      </div>
      <div className="flex gap-2 items-center">
        <Button
          type="button"
          variant="secondary"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          {t('common.prev') || 'Anterior'}
        </Button>
        <span>Página {page}</span>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setPage((p) => p + 1)}
        >
          {t('common.next') || 'Próxima'}
        </Button>
      </div>
      {/* Plan change confirmation removed */}
    </div>
  );
};

export default AdminUsersPage;

// Render confirmation dialog at end (portal handled by component itself)
// We append after export default physically, but logical render inside component above; alternate approach: place inside return tree.
