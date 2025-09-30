import React, { useEffect, useState, type FormEvent } from "react";
import Skeleton from '../../components/ui/Skeleton';
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { API } from "../../config/api";
import { SEO } from "../../components/comum/SEO";
import { useI18n } from "../../i18n";

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

type AuditRow = PasswordAuditRow | RevokedAuditRow | RoleAuditRow;

type Tab = "password" | "revoked" | "role";

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

  // Caso deseje proteger com x-api-key, pode-se usar variável env pública + proxy. Aqui assumo não exposta no front -> preferir Authorization admin e backend poderia aceitar, mas atual design requer x-api-key.
  const apiKey: string =
    (import.meta as { env: { VITE_ADMIN_AUDIT_KEY?: string } }).env
      .VITE_ADMIN_AUDIT_KEY || "";

  const load = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        type: tab,
        page: String(page),
        pageSize: String(pageSize),
      });
      if (userIdFilter.trim()) params.set("user_id", userIdFilter.trim());
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo + 'T23:59:59Z');
      const r = await fetch(`${API.ADMIN_AUDIT}?${params.toString()}`, {
        headers: apiKey ? { "x-api-key": apiKey } : {},
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data: AuditApiResponse = await r.json();
      setRows(data.results || []);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro ao carregar auditoria");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(); /* eslint-disable-next-line */
  }, [tab, page]);

  const handleFilterSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    void load();
  };

  const exportCsv = () => {
    const headerMap: Record<Tab, string[]> = {
      password: ['user_id','ip','changed_at'],
      revoked: ['jti','user_id','reason','revoked_at','expires_at'],
      role: ['user_id','old_role','new_role','changed_by','reason','changed_at']
    };
    const cols = headerMap[tab];
    const csv = [cols.join(',')].concat(rows.map(r => cols.map(c => {
      const v: any = (r as any)[c];
      if (v == null) return '';
      return '"' + String(v).replace(/"/g,'""') + '"';
    }).join(','))).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-${tab}-page${page}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const { t } = useI18n();
  return (
    <div className="p-4 space-y-4">
      <SEO title={t('admin.audit.seo.title')} description={t('admin.audit.seo.desc')} />
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Auditoria</h1>
          <p className="text-xs text-gray-500 mt-1">Logs de eventos de segurança e mudanças de acesso.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={()=> { setPage(1); void load(); }} disabled={loading}>Recarregar</Button>
        </div>
      </div>
      <div className="flex gap-2">
        {(
          [
            ["password", "Trocas de Senha"],
            ["revoked", "Tokens Revogados"],
            ["role", "Mudanças de Acesso"],
          ] as [Tab, string][]
        ).map(([code, label]) => (
          <button
            key={code}
            onClick={() => {
              setPage(1);
              setTab(code);
            }}
            className={`px-3 py-1 rounded text-sm border ${
              tab === code
                ? "bg-green-600 text-white border-green-600"
                : "border-gray-300 hover:bg-gray-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-2 items-center text-xs">
        <input
          value={userIdFilter}
          onChange={(e) => setUserIdFilter(e.target.value)}
          placeholder="Filtrar por user_id"
          className="border px-2 py-1 rounded text-sm"
        />
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="border px-2 py-1 rounded"
          title="Data inicial"
        />
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="border px-2 py-1 rounded"
          title="Data final"
        />
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
        {userIdFilter && (
          <button
            type="button"
            className="text-xs text-gray-600 hover:underline"
            onClick={() => {
              setUserIdFilter("");
              setPage(1);
              void load();
            }}
          >
            Limpar
          </button>
        )}
        <button
          type="button"
          onClick={exportCsv}
          className="text-xs text-blue-600 hover:underline"
        >CSV</button>
      </form>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-100 text-left">
              {tab === "password" && (
                <>
                  <th className="p-2">Usuário</th>
                  <th className="p-2">IP Origem</th>
                  <th className="p-2">Data / Hora</th>
                </>
              )}
              {tab === "revoked" && (
                <>
                  <th className="p-2" title="Identificador do token de acesso">
                    ID Token (JTI)
                  </th>
                  <th className="p-2">Usuário</th>
                  <th className="p-2">Motivo</th>
                  <th className="p-2">Revogado Em</th>
                  <th className="p-2">Expira Em</th>
                </>
              )}
              {tab === "role" && (
                <>
                  <th className="p-2">Usuário</th>
                  <th className="p-2">Acesso Anterior</th>
                  <th className="p-2">Acesso Novo</th>
                  <th className="p-2">Alterado Por</th>
                  <th className="p-2">Motivo</th>
                  <th className="p-2">Data / Hora</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="p-4"><Skeleton lines={5} /></td>
              </tr>
            )}
            {!loading &&
              rows.map((r, i) => (
                <tr
                  key={i}
                  className="border-b last:border-none hover:bg-gray-50"
                >
                  {tab === "password" && "ip" in r && "changed_at" in r && (
                    <>
                      <td className="p-2">{(r as PasswordAuditRow).user_id}</td>
                      <td className="p-2">{(r as PasswordAuditRow).ip}</td>
                      <td className="p-2">
                        {(r as PasswordAuditRow).changed_at}
                      </td>
                    </>
                  )}
                  {tab === "revoked" &&
                    "jti" in r &&
                    "reason" in r &&
                    "revoked_at" in r &&
                    "expires_at" in r && (
                      <>
                        <td
                          className="p-2 max-w-[120px] truncate"
                          title={(r as RevokedAuditRow).jti}
                        >
                          {(r as RevokedAuditRow).jti}
                        </td>
                        <td className="p-2">
                          {(r as RevokedAuditRow).user_id}
                        </td>
                        <td className="p-2">{(r as RevokedAuditRow).reason}</td>
                        <td className="p-2">
                          {(r as RevokedAuditRow).revoked_at}
                        </td>
                        <td className="p-2">
                          {(r as RevokedAuditRow).expires_at}
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
                        <td className="p-2">{(r as RoleAuditRow).user_id}</td>
                        <td className="p-2">{(r as RoleAuditRow).old_role}</td>
                        <td className="p-2">{(r as RoleAuditRow).new_role}</td>
                        <td className="p-2">
                          {(r as RoleAuditRow).changed_by}
                        </td>
                        <td className="p-2">{(r as RoleAuditRow).reason}</td>
                        <td className="p-2">
                          {(r as RoleAuditRow).changed_at}
                        </td>
                      </>
                    )}
                </tr>
              ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="p-4">
                  Sem registros
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
          Anterior
        </Button>
        <span>Página {page}</span>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setPage((p) => p + 1)}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
};

export default AdminAuditPage;
