import React, { useEffect, useState, type FormEvent } from "react";
import Skeleton from "../../components/ui/Skeleton";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { API } from "../../config/api";
import { SEO } from "../../components/comum/SEO";
import { useI18n, formatDate as fmtDate } from "../../i18n";
import { useToast } from "../../components/ui/ToastProvider";
import {
  Search,
  Filter,
  RefreshCw,
  Download,
  Shield,
  Key,
  UserX,
  UserCheck,
  Coins,
  Calendar,
} from "lucide-react";

interface PasswordAuditRow {
  user_id: string;
  ip: string;
  changed_at: string;
}

interface RevokedAuditRow {
  jti: string;
  user_id: string;
  reason: string;
  revoked_at: string;
  expires_at: string;
}

interface RoleAuditRow {
  user_id: string;
  old_role: string;
  new_role: string;
  changed_by: string;
  reason: string;
  changed_at: string;
}

interface CreditsAuditRow {
  id: number;
  admin_id: string;
  user_id: string;
  type: string;
  delta: number;
  reason?: string | null;
  consumed_ids_json?: string | null;
  created_at: string;
}

type AuditRow = PasswordAuditRow | RevokedAuditRow | RoleAuditRow | CreditsAuditRow;

type Tab = "password" | "revoked" | "role" | "credits";

interface AuditApiResponse {
  results: AuditRow[];
}

const AdminAuditPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>("password");
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 20;
  const [userIdFilter, setUserIdFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const { push } = useToast();

  const apiKey: string =
    (import.meta as { env: { VITE_ADMIN_AUDIT_KEY?: string } }).env
      .VITE_ADMIN_AUDIT_KEY || "";

  const load = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        type: tab === 'credits' ? 'credits_adjust' : tab,
        page: String(page),
        pageSize: String(pageSize),
      });
      if (userIdFilter.trim()) params.set("user_id", userIdFilter.trim());
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo + "T23:59:59Z");
      const r = await fetch(`${API.ADMIN_AUDIT}?${params.toString()}`, {
        headers: apiKey ? { "x-api-key": apiKey } : {},
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data: AuditApiResponse = await r.json();
      setRows(data.results || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar auditoria";
      setError(message);
      push({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [tab, page]);

  const handleFilterSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    void load();
  };

  const clearFilters = () => {
    setUserIdFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const exportCsv = () => {
    const headerMap: Record<Tab, string[]> = {
      password: ["user_id", "ip", "changed_at"],
      revoked: ["jti", "user_id", "reason", "revoked_at", "expires_at"],
      role: [
        "user_id",
        "old_role",
        "new_role",
        "changed_by",
        "reason",
        "changed_at",
      ],
      credits: ["admin_id", "user_id", "type", "delta", "reason", "created_at"],
    };
    const cols = headerMap[tab];
    const csv = [cols.join(",")]
      .concat(
        rows.map((r) =>
          cols
            .map((c) => {
              const v: any = (r as any)[c];
              if (v == null) return "";
              return '"' + String(v).replace(/"/g, '""') + '"';
            })
            .join(",")
        )
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${tab}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    push({ type: "success", message: "CSV exportado com sucesso" });
  };

  const { t, locale } = useI18n();

  const tabConfig = [
    { code: "password" as Tab, label: "Trocas de Senha", icon: Key, color: "blue" },
    { code: "revoked" as Tab, label: "Tokens Revogados", icon: UserX, color: "red" },
    { code: "role" as Tab, label: "Mudanças de Acesso", icon: UserCheck, color: "green" },
    { code: "credits" as Tab, label: "Ajuste de Créditos", icon: Coins, color: "purple" },
  ];

  const getStatusColor = (type: string) => {
    const colors: Record<string, string> = {
      password: "bg-blue-100 text-blue-700 border-blue-200",
      revoked: "bg-red-100 text-red-700 border-red-200",
      role: "bg-green-100 text-green-700 border-green-200",
      credits: "bg-purple-100 text-purple-700 border-purple-200",
    };
    return colors[type] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getTabIcon = (tabCode: Tab) => {
    const tab = tabConfig.find(t => t.code === tabCode);
    return tab ? tab.icon : Shield;
  };

  return (
    <div className="min-h-screen bg-gray-50/30 safe-area-bottom">
      <SEO
        title={t("admin.audit.seo.title")}
        description={t("admin.audit.seo.desc")}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 backdrop-blur-lg bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative">
          {/* Refresh Button - Mobile */}
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

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Auditoria do Sistema
                </h1>
                <p className="text-xs text-gray-600 mt-0.5">
                  Logs de eventos de segurança e mudanças de acesso
                </p>
              </div>
            </div>

            {/* Refresh Button - Desktop */}
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
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 overflow-x-auto p-2">
              {tabConfig.map(({ code, label, icon: Icon }) => (
                <Button
                  key={code}
                  type="button"
                  noFocus
                  variant={tab === code ? "primary" : "secondary"}
                  onClick={() => {
                    setPage(1);
                    setTab(code);
                  }}
                  className="flex items-center gap-2 whitespace-nowrap"
                  noBorder={tab !== code}
                  noBackground={tab !== code}
                >
                  <Icon size={14} />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Filters */}
        <Card className="p-4 sm:p-6 mb-6">
          <form onSubmit={handleFilterSubmit}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Search size={14} />
                  User ID
                </label>
                <input
                  value={userIdFilter}
                  onChange={(e) => setUserIdFilter(e.target.value)}
                  placeholder="Filtrar por user_id"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar size={14} />
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Data Final
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-end gap-2">
                <Button type="submit" className="flex items-center gap-2 flex-1">
                  <Filter size={14} />
                  Filtrar
                </Button>
                {(userIdFilter || dateFrom || dateTo) && (
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
          </form>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="p-4 border-l-4 border-red-500 bg-red-50 mb-6">
            <div className="flex items-start gap-3">
              <Shield size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 mb-1">
                  Erro ao carregar auditoria
                </h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Export Button */}
        {rows.length > 0 && (
          <div className="flex justify-end mb-4">
            <Button
              type="button"
              variant="secondary"
              onClick={exportCsv}
              className="flex items-center gap-2"
            >
              <Download size={14} />
              Exportar CSV
            </Button>
          </div>
        )}

        {/* Desktop Table */}
        <Card className="p-0 overflow-hidden hidden lg:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {tab === "password" && (
                    <>
                      <th className="p-4 text-left font-semibold text-gray-700">Usuário</th>
                      <th className="p-4 text-left font-semibold text-gray-700">IP Origem</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Data / Hora</th>
                    </>
                  )}
                  {tab === "revoked" && (
                    <>
                      <th className="p-4 text-left font-semibold text-gray-700" title="Identificador do token de acesso">
                        ID Token (JTI)
                      </th>
                      <th className="p-4 text-left font-semibold text-gray-700">Usuário</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Motivo</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Revogado Em</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Expira Em</th>
                    </>
                  )}
                  {tab === "role" && (
                    <>
                      <th className="p-4 text-left font-semibold text-gray-700">Usuário</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Acesso Anterior</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Acesso Novo</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Alterado Por</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Motivo</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Data / Hora</th>
                    </>
                  )}
                  {tab === "credits" && (
                    <>
                      <th className="p-4 text-left font-semibold text-gray-700">Admin</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Usuário</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Tipo</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Delta</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Motivo</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Data / Hora</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="p-4">
                      <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} lines={1} className="h-12" />
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && rows.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 last:border-none hover:bg-gray-50/50 transition-colors"
                  >
                    {tab === "password" && "ip" in r && "changed_at" in r && (
                      <>
                        <td className="p-4">
                          <div className="font-medium text-gray-900">
                            {(r as PasswordAuditRow).user_id}
                          </div>
                        </td>
                        <td className="p-4">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {(r as PasswordAuditRow).ip}
                          </code>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {fmtDate((r as PasswordAuditRow).changed_at, locale, {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                      </>
                    )}
                    {tab === "revoked" &&
                      "jti" in r &&
                      "reason" in r &&
                      "revoked_at" in r &&
                      "expires_at" in r && (
                        <>
                          <td className="p-4">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all max-w-[200px]">
                              {(r as RevokedAuditRow).jti}
                            </code>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-gray-900">
                              {(r as RevokedAuditRow).user_id}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-gray-600">
                              {(r as RevokedAuditRow).reason}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {fmtDate((r as RevokedAuditRow).revoked_at, locale, {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {fmtDate((r as RevokedAuditRow).expires_at, locale, {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </td>
                        </>
                      )}
                    {tab === "role" &&
                      "old_role" in r &&
                      "new_role" in r &&
                      "changed_by" in r &&
                      "reason" in r &&
                      "changed_at" in r && (
                        <>
                          <td className="p-4">
                            <div className="font-medium text-gray-900">
                              {(r as RoleAuditRow).user_id}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor((r as RoleAuditRow).old_role)}`}>
                              {(r as RoleAuditRow).old_role}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor((r as RoleAuditRow).new_role)}`}>
                              {(r as RoleAuditRow).new_role}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-gray-600">
                              {(r as RoleAuditRow).changed_by}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-gray-600">
                              {(r as RoleAuditRow).reason}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {fmtDate((r as RoleAuditRow).changed_at, locale, {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </td>
                        </>
                      )}
                    {tab === "credits" &&
                      "admin_id" in r &&
                      "user_id" in r &&
                      "delta" in r &&
                      "type" in r && (
                        <>
                          <td className="p-4">
                            <div className="font-medium text-gray-900">
                              {(r as CreditsAuditRow).admin_id}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-gray-900">
                              {(r as CreditsAuditRow).user_id}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor((r as CreditsAuditRow).type)}`}>
                              {(r as CreditsAuditRow).type}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`text-sm font-medium ${
                              (r as CreditsAuditRow).delta >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {(r as CreditsAuditRow).delta >= 0 ? '+' : ''}{(r as CreditsAuditRow).delta}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-gray-600">
                              {(r as CreditsAuditRow).reason || '—'}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {fmtDate((r as CreditsAuditRow).created_at, locale, {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </td>
                        </>
                      )}
                  </tr>
                ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-500">
                        {React.createElement(getTabIcon(tab), { size: 48, className: "text-gray-300" })}
                        <div>
                          <div className="font-medium text-gray-900 mb-1">
                            Nenhum registro encontrado
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

        {/* Mobile List */}
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
          {!loading && rows.length === 0 && (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-3 text-gray-500">
                {React.createElement(getTabIcon(tab), { size: 48, className: "text-gray-300" })}
                <div>
                  <div className="font-medium text-gray-900 mb-1">
                    Nenhum registro encontrado
                  </div>
                  <div className="text-sm">
                    Tente ajustar os filtros de busca
                  </div>
                </div>
              </div>
            </Card>
          )}
          {!loading && rows.map((r, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm mb-1">
                    {"user_id" in r && (r as any).user_id}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className={`px-2 py-0.5 rounded-full ${getStatusColor(tab)}`}>
                      {tabConfig.find(t => t.code === tab)?.label}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {fmtDate(
                    "changed_at" in r ? (r as any).changed_at : 
                    "revoked_at" in r ? (r as any).revoked_at : 
                    "created_at" in r ? (r as any).created_at : "",
                    locale,
                    { dateStyle: "short" }
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {tab === "password" && "ip" in r && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">IP:</span>
                    <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                      {(r as PasswordAuditRow).ip}
                    </code>
                  </div>
                )}

                {tab === "revoked" && "jti" in r && (
                  <>
                    <div className="text-xs font-mono break-all bg-gray-50 p-2 rounded">
                      {(r as RevokedAuditRow).jti}
                    </div>
                    <div className="text-gray-600">
                      {(r as RevokedAuditRow).reason}
                    </div>
                  </>
                )}

                {tab === "role" && "old_role" in r && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor((r as RoleAuditRow).old_role)}`}>
                        {(r as RoleAuditRow).old_role}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor((r as RoleAuditRow).new_role)}`}>
                        {(r as RoleAuditRow).new_role}
                      </span>
                    </div>
                    <div className="text-gray-600">
                      Por: {(r as RoleAuditRow).changed_by}
                    </div>
                    <div className="text-gray-600">
                      {(r as RoleAuditRow).reason}
                    </div>
                  </>
                )}

                {tab === "credits" && "delta" in r && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Admin:</span>
                      <span className="font-medium">{(r as CreditsAuditRow).admin_id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Tipo:</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor((r as CreditsAuditRow).type)}`}>
                        {(r as CreditsAuditRow).type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Delta:</span>
                      <span className={`font-medium ${
                        (r as CreditsAuditRow).delta >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(r as CreditsAuditRow).delta >= 0 ? '+' : ''}{(r as CreditsAuditRow).delta}
                      </span>
                    </div>
                    <div className="text-gray-600">
                      {(r as CreditsAuditRow).reason || 'Sem motivo'}
                    </div>
                  </>
                )}
              </div>

              <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                {fmtDate(
                  "changed_at" in r ? (r as any).changed_at : 
                  "revoked_at" in r ? (r as any).revoked_at : 
                  "created_at" in r ? (r as any).created_at : "",
                  locale,
                  { dateStyle: "short", timeStyle: "short" }
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {rows.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Mostrando <span className="font-semibold">{rows.length}</span> registros
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

export default AdminAuditPage;