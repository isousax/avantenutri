import React, {
  useEffect,
  useState,
  useCallback,
  type ChangeEvent,
} from "react";
import { useAuth } from "../../contexts";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { API } from "../../config/api";
import { useI18n, formatDate as fmtDate } from "../../i18n/utils";
import { SEO } from "../../components/comum/SEO";
import Skeleton from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/ToastProvider";
import {
  Search,
  Filter,
  RefreshCw,
  User,
  Shield,
  Calendar,
  LogOut,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatDate } from "../../utils/formatDate";

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
  total: number;
  hasMore: boolean;
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
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [userIdFilter, setUserIdFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const { push } = useToast();
  const { locale, t } = useI18n();

  const load = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const qs = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search) qs.set("q", search);
      if (userIdFilter) qs.set("user_id", userIdFilter);
      const r = await authenticatedFetch(
        `${API.ADMIN_USERS}?${qs.toString()}`,
        {
          method: "GET",
          autoLogout: true,
        }
      );
      if (!r.ok && (r.status === 401 || r.status === 403)) { try { console.warn('[AdminUsersPage] list users ->', r.status, 'autoLogout path'); } catch { /* noop */ } }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data: ApiResponse = await r.json();
      setUsers(data.results || []);
      setHasNextPage(data.hasMore ?? false);
      
      // If we got no results and we're not on the first page, go back one page
      if (data.results.length === 0 && page > 1) {
        setPage(p => p - 1);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro ao carregar usuários");
      }
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, page, pageSize, search, userIdFilter]);

  useEffect(() => {
    void load();
  }, [page, pageSize, load]);

  const applyRole = async (id: string, newRole: string): Promise<void> => {
    try {
      setChanging(id);
      const r = await authenticatedFetch(API.adminUserRole(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_role: newRole, reason: "UI change" }),
      });
      if (!r.ok && (r.status === 401 || r.status === 403)) { try { console.warn('[AdminUsersPage] change role ->', r.status, 'autoLogout path'); } catch { /* noop */ } }
      if (!r.ok) throw new Error("Falha ao mudar role");
      await load();
      push({ type: "success", message: "Role alterada com sucesso" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao mudar role";
      setError(msg);
      push({ type: "error", message: msg });
    } finally {
      setChanging(null);
    }
  };

  const handleForceLogout = async (userId: string): Promise<void> => {
    try {
      setChanging(userId);
      const r = await authenticatedFetch(API.adminUserForceLogout(userId), {
        method: "POST",
      });
      if (!r.ok && (r.status === 401 || r.status === 403)) { try { console.warn('[AdminUsersPage] force-logout ->', r.status, 'autoLogout path'); } catch { /* noop */ } }
      if (!r.ok) throw new Error("Falha ao forçar logout");
      push({ type: "success", message: "Logout forçado com sucesso" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao forçar logout";
      setError(msg);
      push({ type: "error", message: msg });
    } finally {
      setChanging(null);
    }
  };

  const clearFilters = (): void => {
    setSearch("");
    setUserIdFilter("");
    setPage(1);
    void load();
  };

  return (
    <div className="min-h-screen bg-gray-50/30 safe-area-bottom">
      <SEO
        title={t("admin.users.seo.title")}
        description={t("admin.users.seo.desc")}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 backdrop-blur-lg bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative">
          {/* 🔁 Botão no canto superior direito (aparece só no mobile) */}
          <div className="absolute top-4 right-4 sm:hidden">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void load()}
              disabled={loading}
              className="flex items-center gap-2"
              noBorder
              noFocus
              noBackground
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {t("admin.users.title")}
                </h1>
                <p className="text-xs text-gray-600 mt-0.5">
                  Gerencie contas e permissões de usuários
                </p>
              </div>
            </div>

            {/* 🔁 Botão visível só no desktop */}
            <div className="hidden sm:flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => void load()}
                disabled={loading}
                className="flex items-center gap-2"
                noBorder
                noFocus
                noBackground
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-6">
        {/* Filtros e Busca */}
        <Card className="p-4 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Busca por Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Search size={14} />
                  Buscar por email
                </label>
                <input
                  value={search}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Digite o email..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Filtro por User ID */}
              <div className="space-y-2 hidden md:block">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Filter size={14} />
                  Filtrar por ID
                </label>
                <div className="relative">
                  <input
                    value={userIdFilter}
                    list="user-id-options"
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setUserIdFilter(e.target.value)
                    }
                    placeholder="Digite o user_id..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <datalist id="user-id-options">
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.display_name || u.email}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-end gap-2">
                <Button
                  type="submit"
                  onClick={() => {
                    setPage(1);
                    void load();
                  }}
                  className="flex items-center gap-2 flex-1"
                >
                  <Search size={14} />
                  Buscar
                </Button>

                {(search || userIdFilter) && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Mensagem de Erro */}
        {error && (
          <Card className="p-4 border-l-4 border-red-500 bg-red-50 mb-6">
            <div className="flex items-start gap-3">
              <XCircle
                size={20}
                className="text-red-500 mt-0.5 flex-shrink-0"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 mb-1">
                  Erro ao carregar usuários
                </h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Tabela Desktop */}
        <Card className="p-0 overflow-hidden hidden lg:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-left font-semibold text-gray-700">
                    Usuário
                  </th>
                  <th className="p-4 text-left font-semibold text-gray-700">
                    Tipo de Acesso
                  </th>
                  <th className="p-4 text-left font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="p-4 text-left font-semibold text-gray-700">
                    Criação
                  </th>
                  <th className="p-4 text-left font-semibold text-gray-700">
                    Último Acesso
                  </th>
                  <th className="p-4 text-left font-semibold text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="p-4">
                      <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} lines={1} className="h-12" />
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
                {!loading &&
                  users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-gray-100 last:border-none hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            <User size={14} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {u.display_name || "Sem nome"}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {u.email}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                              ID: {u.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <select
                          disabled={changing === u.id || u.id === user?.id}
                          value={u.role}
                          onChange={(e) => applyRole(u.id, e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {roles.map((r) => (
                            <option key={r} value={r}>
                              {r === "admin" ? "Administrador" : "Paciente"}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            {u.email_confirmed ? (
                              <CheckCircle
                                size={14}
                                className="text-green-500"
                              />
                            ) : (
                              <XCircle size={14} className="text-gray-400" />
                            )}
                            <span
                              className={`text-xs font-medium ${
                                u.email_confirmed
                                  ? "text-green-700"
                                  : "text-gray-600"
                              }`}
                            >
                              {u.email_confirmed
                                ? "Verificado"
                                : "Não verificado"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Sessão: v{u.session_version}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {fmtDate(u.created_at, locale, { dateStyle: "short" })}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {u.last_login_at
                          ? formatDate(u.last_login_at, locale) 
                          : "-"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleForceLogout(u.id)}
                            disabled={changing === u.id}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Forçar logout"
                          >
                            <LogOut size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-500">
                        <User size={48} className="text-gray-300" />
                        <div>
                          <div className="font-medium text-gray-900">
                            Nenhum usuário encontrado
                          </div>
                          <div className="text-sm">
                            Tente ajustar os filtros de busca
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Lista Mobile */}
        <div className="space-y-3 lg:hidden">
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton lines={3} />
                </Card>
              ))}
            </div>
          )}
          {!loading &&
            users.map((u) => (
              <Card key={u.id} className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                      <User size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate text-sm">
                        {u.display_name || "Sem nome"}
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {u.email}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                        ID: {u.id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleForceLogout(u.id)}
                      disabled={changing === u.id}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <LogOut size={14} />
                    </button>
                  </div>
                </div>

                {/* Detalhes */}
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      Tipo de Acesso
                    </div>
                    <select
                      disabled={changing === u.id || u.id === user?.id}
                      value={u.role}
                      onChange={(e) => applyRole(u.id, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {r === "admin" ? "Administrador" : "Paciente"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Status</div>
                    <div className="flex items-center gap-1">
                      {u.email_confirmed ? (
                        <CheckCircle size={12} className="text-green-500" />
                      ) : (
                        <XCircle size={12} className="text-gray-400" />
                      )}
                      <span className="text-xs font-medium">
                        {u.email_confirmed ? "Verificado" : "Não verificado"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metadados */}
                <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    {fmtDate(u.created_at, locale, { dateStyle: "short" })}
                  </div>
                  <div>Sessão: v{u.session_version}</div>
                </div>

                {u.last_login_at && (
                  <div className="text-xs text-gray-500 mt-2">
                    Último acesso:{" "}
                    {fmtDate(u.last_login_at, locale, {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </div>
                )}
              </Card>
            ))}

          {!loading && users.length === 0 && (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <User size={48} className="text-gray-300" />
                <div>
                  <div className="font-medium text-gray-900 mb-1">
                    Nenhum usuário encontrado
                  </div>
                  <div className="text-sm">
                    Tente ajustar os filtros de busca
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Paginação */}
        {users.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Mostrando <span className="font-semibold">{users.length}</span>{" "}
              usuários
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-2"
              >
                Anterior
              </Button>
              <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium">
                Página {page}
              </span>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNextPage}
                className="flex items-center gap-2"
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;
