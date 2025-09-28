import React, {
  useEffect,
  useState,
  type FormEvent,
  type ChangeEvent,
  useMemo,
} from "react";
import { useAuth } from "../../contexts";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { API } from "../../config/api";
import { useI18n, formatDate as fmtDate } from "../../i18n";
import { SEO } from "../../components/comum/SEO";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
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
  plan_id?: string;
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
  const [plans, setPlans] = useState<{ id: string; name: string; capabilities?: string[] }[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [planEditUser, setPlanEditUser] = useState<string | null>(null);
  const [planChanging, setPlanChanging] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");

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

  // Lazy load plans when first opening a plan edit
  const ensurePlans = async () => {
    if (plans.length || loadingPlans) return;
    try {
      setLoadingPlans(true);
      const r = await authenticatedFetch(API.PLANS, { method: 'GET', autoLogout: true });
      if (!r.ok) throw new Error('Falha ao carregar planos');
      const data = await r.json();
      const list = (data.plans || []).map((p: any) => ({ id: p.id, name: p.name, capabilities: p.capabilities || [] }));
      setPlans(list);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar planos');
    } finally {
      setLoadingPlans(false);
    }
  };

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

  const submitPlanChange = async (userId: string) => {
    if (!selectedPlan) return;
    try {
      setPlanChanging(true);
      const r = await authenticatedFetch(API.adminUserPlan(userId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_plan_id: selectedPlan, reason: 'UI plan change' })
      });
      if (!r.ok) throw new Error('Falha ao mudar plano');
      setPlanEditUser(null);
      setSelectedPlan('');
      try { await load(); } catch {}
      push({ type: 'success', message: 'Plano alterado com sucesso' });
    } catch (e: any) {
      const msg = e?.message || 'Erro ao mudar plano';
      setError(msg);
      push({ type: 'error', message: msg });
    } finally {
      setPlanChanging(false);
    }
  };

  // Modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const currentPlanObj = useMemo(()=> {
    if(!pendingUserId) return null;
    const target = users.find(u=> u.id === pendingUserId);
    if(!target?.plan_id) return null;
    return plans.find(p=> p.id === target.plan_id) || null;
  }, [pendingUserId, users, plans]);

  const newPlanObj = useMemo(()=> plans.find(p=> p.id === selectedPlan) || null, [selectedPlan, plans]);

  const removedCapabilities = useMemo(()=> {
    if(!currentPlanObj || !newPlanObj) return [];
    const cur = new Set(currentPlanObj.capabilities || []);
    const next = new Set(newPlanObj.capabilities || []);
    return Array.from(cur).filter(c => !next.has(c)).sort();
  }, [currentPlanObj, newPlanObj]);

  const isDowngrade = useMemo(()=> {
    if(!currentPlanObj || !newPlanObj) return false;
    // Heurística: menos capabilities => downgrade
    const curCount = currentPlanObj.capabilities?.length || 0;
    const nextCount = newPlanObj.capabilities?.length || 0;
    return nextCount < curCount || removedCapabilities.length > 0;
  }, [currentPlanObj, newPlanObj, removedCapabilities]);

  const { locale, t } = useI18n();
  return (
    <div className="p-4 space-y-4">
  <SEO title={t('admin.users.seo.title')} description={t('admin.users.seo.desc')} />
  <div className="flex items-start justify-between flex-wrap gap-3">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{t('admin.users.title')}</h1>
      <p className="text-xs text-gray-500 mt-0.5">Gerencie contas, planos e roles.</p>
    </div>
    <div className="flex gap-2">
      <Button type="button" variant="secondary" onClick={()=> void load()} disabled={loading}>
        {loading ? '...' : 'Recarregar'}
      </Button>
    </div>
  </div>
      <form onSubmit={onSearch} className="flex flex-wrap gap-2 items-center">
        <input
          value={search}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
          placeholder={t('common.search') || 'Buscar email'}
          className="border px-3 py-2 rounded w-64"
        />
        <input
          value={userIdFilter}
          list="user-id-options"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setUserIdFilter(e.target.value)
          }
          placeholder={t('admin.user.filter.userId') || 'Filtrar por user_id'}
          className="border px-3 py-2 rounded w-56"
        />
        <datalist id="user-id-options">
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.display_name || u.email}
            </option>
          ))}
        </datalist>
  <Button type="submit">{t('common.search') || 'Buscar'}</Button>
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
          >
            {t('common.clear') || 'Limpar'}
          </Button>
        )}
      </form>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">E-mail</th>
              <th className="p-2">{t('admin.user.displayName') || 'Nome de Exibição'}</th>
              <th className="p-2">{t('admin.user.role') || 'Tipo de Acesso'}</th>
              <th className="p-2">{t('admin.user.emailVerified') || 'E-mail Verificado'}</th>
              <th className="p-2">{t('admin.userPlan.column.plan')}</th>
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
                  <td className="p-2">{u.plan_id || '-'}</td>
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
                      <button
                        type="button"
                        onClick={() => {
                          if (planEditUser === u.id) {
                            setPlanEditUser(null);
                          } else {
                            setPlanEditUser(u.id);
                            setSelectedPlan('');
                            void ensurePlans();
                          }
                        }}
                        className="text-[10px] text-blue-600 hover:underline"
                      >
                        {planEditUser === u.id ? (t('common.cancel') || 'Cancelar Plano') : (t('admin.userPlan.change') || 'Alterar Plano')}
                      </button>
                      {planEditUser === u.id && (
                        <div className="mt-1 p-2 border rounded bg-white shadow-sm space-y-1">
                          {loadingPlans && (
                            <div className="space-y-1">
                              <Skeleton lines={1} className="w-24 h-3" />
                              <Skeleton lines={1} className="w-32 h-3" />
                            </div>
                          )}
                          {!loadingPlans && (
                            <>
                              <select
                                value={selectedPlan}
                                onChange={e => setSelectedPlan(e.target.value)}
                                className="border px-1 py-0.5 rounded text-[11px] w-full"
                              >
                                <option value="">-- selecione --</option>
                                {plans.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                              </select>
                              {selectedPlan && currentPlanObj && newPlanObj && (
                                <div className="text-[10px] space-y-1 bg-slate-50 border rounded p-1">
                                  <div><strong>{t('common.current') || 'Atual'}:</strong> {currentPlanObj.name} ({currentPlanObj.id})</div>
                                  <div><strong>{t('common.new') || 'Novo'}:</strong> {newPlanObj.name} ({newPlanObj.id})</div>
                                  {removedCapabilities.length > 0 && (
                                    <div className="text-rose-600">
                                      <div className="font-semibold">{t('admin.userPlan.change.capabilities.lost.title', { count: removedCapabilities.length })}</div>
                                      <ul className="list-disc ml-4">
                                        {removedCapabilities.map(c => <li key={c} className="break-all">{c}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="flex gap-1">
                                <button
                                  disabled={!selectedPlan || planChanging}
                                  onClick={() => { setPendingUserId(u.id); setConfirmOpen(true); }}
                                  className="flex-1 text-[10px] bg-green-600 text-white rounded px-2 py-1 disabled:opacity-50"
                                >{t('common.apply') || 'Aplicar'}</button>
                                <button
                                  type="button"
                                  disabled={planChanging}
                                  onClick={() => { setPlanEditUser(null); setSelectedPlan(''); }}
                                  className="text-[10px] px-2 py-1 rounded border"
                                >{t('common.close') || 'Fechar'}</button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
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
      <ConfirmDialog
        open={confirmOpen}
  title={isDowngrade ? t('admin.userPlan.change.title.downgrade') : t('admin.userPlan.change.title')}
        description={(() => {
          if (!pendingUserId || !newPlanObj) return '';
            const target = users.find(u => u.id === pendingUserId);
            const curName = currentPlanObj?.name || target?.plan_id || t('common.current') || 'atual';
            const nextName = newPlanObj.name;
            let base = isDowngrade ? t('admin.userPlan.change.desc.downgrade', { current: curName, next: nextName }) : t('admin.userPlan.change.desc', { current: curName, next: nextName });
            if (isDowngrade) {
              // extra line already in desc.downgrade
              if (removedCapabilities.length) {
                base += `\n${t('admin.userPlan.change.capabilities.lost.title', { count: removedCapabilities.length })}:\n- ${removedCapabilities.join('\n- ')}`;
              }
            }
            return base;
        })()}
  confirmLabel={planChanging ? '...' : t('admin.userPlan.change.confirm')}
  cancelLabel={t('admin.userPlan.change.cancel')}
        danger={isDowngrade}
        onConfirm={() => {
          if (!pendingUserId) return;
          void submitPlanChange(pendingUserId);
          setConfirmOpen(false);
          setPendingUserId(null);
        }}
        onClose={() => { if(!planChanging){ setConfirmOpen(false); setPendingUserId(null);} }}
      />
    </div>
  );
};

export default AdminUsersPage;

// Render confirmation dialog at end (portal handled by component itself)
// We append after export default physically, but logical render inside component above; alternate approach: place inside return tree.
