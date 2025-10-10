/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import Skeleton from "../../components/ui/Skeleton";
import { useI18n, formatDate as fmtDate } from "../../i18n";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useAuth } from "../../contexts";
import { RoleRoute } from "../../components/RoleRoute";
import { SEO } from "../../components/comum/SEO";
import { API } from "../../config/api";
import AdminNotificationSender from "../../components/admin/AdminNotificationSender";
import AdminCreditsPanel from "../../components/admin/AdminCreditsPanel";
import StructuredDietBuilder from "../../components/diet/StructuredDietBuilder";
import StructuredDietView from "../../components/diet/StructuredDietView";
import type { StructuredDietData } from "../../types/structuredDiet";
import { dietHasItems, copyDietJson } from "../../utils/structuredDietExport";
import { User } from "lucide-react";

/* --- Types --- */
interface AdminUser {
  id: string;
  email: string;
  role: string;
  display_name?: string;
  created_at?: string;
  last_login_at?: string;
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

/* --- Diet types --- */
interface PlanDetail {
  id: string;
  name: string;
  description?: string;
  versions: any[];
  created_at: string;
}

/* --- Component: AdminVersionsSelector --- */
const AdminVersionsSelector: React.FC<{
  detail: PlanDetail;
}> = ({ detail }) => {
  const [selectedId, setSelectedId] = useState<string | null>(
    detail.versions.length
      ? detail.versions[detail.versions.length - 1].id
      : null
  );

  // Atualiza seleção quando mudar o detalhe
  useEffect(() => {
    setSelectedId(
      detail.versions.length
        ? detail.versions[detail.versions.length - 1].id
        : null
    );
  }, [detail.id, detail.versions]);

  const sel =
    detail.versions.find((v) => v.id === selectedId) ||
    detail.versions[detail.versions.length - 1];

  return (
    <div>
      {/* Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {detail.versions.map((v: any, idx: number) => {
          const lastId = detail.versions[detail.versions.length - 1]?.id;
          const active = (selectedId ?? lastId) === v.id;
          const isTemp = String(v.id).startsWith("temp-rev-");
          return (
            <button
              key={v.id}
              onClick={() => setSelectedId(v.id)}
              className={`flex-none px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap ${
                active
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
              }`}
              title={fmtDate(v.created_at, "pt", { dateStyle: "short" })}
            >
              v{v.version_number}
              {idx === detail.versions.length - 1 && (
                <span className="ml-2 text-[10px] font-bold">•</span>
              )}
              {isTemp && <span className="ml-2 text-[10px]">(sync)</span>}
            </button>
          );
        })}
      </div>
      {/* Conteúdo da versão selecionada */}
      {sel && (
        <div className="mt-2 p-3 border rounded-lg bg-white/70">
          <div className="flex items-center justify-between text-xs mb-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">v{sel.version_number}</span>
              {String(sel.id).startsWith("temp-rev-") && (
                <span className="text-[10px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded">
                  Sincronizando...
                </span>
              )}
            </div>
            <span>{fmtDate(sel.created_at, "pt", { dateStyle: "short" })}</span>
          </div>
          {sel.notes && (
            <div className="italic text-gray-600 text-xs mb-2">{sel.notes}</div>
          )}
          {sel.data &&
            sel.data.versao === 1 &&
            Array.isArray(sel.data.meals) && (
              <div className="space-y-1">
                <StructuredDietView data={sel.data} compact />
                <div className="flex gap-2 flex-wrap text-[10px] items-center">
                  <button
                    type="button"
                    className="px-2 py-1 bg-blue-600 text-white rounded"
                    onClick={() =>
                      console.log("Baixar PDF", {
                        alert: "Função desabilitada temporariamente",
                      })
                    }
                  >
                    Baixar PDF
                  </button>
                  <button
                    type="button"
                    className="px-2 py-1 bg-amber-600 text-white rounded"
                    onClick={() => copyDietJson(sel.data)}
                  >
                    Copiar JSON
                  </button>
                </div>
              </div>
            )}
          {sel.data && sel.data.versao !== 1 && (
            <pre className="bg-gray-900 text-gray-100 p-2 rounded overflow-x-auto text-[10px] max-h-40">
              {JSON.stringify(sel.data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

/* ---------------------------
   DietManagement component
   (integrated from the older file)
   --------------------------- */
const DietManagement: React.FC = () => {
  const { getAccessToken } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [creatingName, setCreatingName] = useState("");
  const [creatingDesc, setCreatingDesc] = useState("");
  const [planFormat, setPlanFormat] = useState<"structured">("structured");
  const [structuredCreateData, setStructuredCreateData] =
    useState<StructuredDietData | null>(null);
  const [targetUserQuery, setTargetUserQuery] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [targetUserLabel, setTargetUserLabel] = useState("");
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [userOptions, setUserOptions] = useState<AdminUser[]>([]);
  const [filterUserId, setFilterUserId] = useState("");
  const [filterUserLabel, setFilterUserLabel] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  // Sempre incluir dados completos
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<PlanDetail | null>(null);
  const [revNotes, setRevNotes] = useState("");
  const [revMode, setRevMode] = useState<"json" | "structured">("json");
  const [revStructuredData, setRevStructuredData] =
    useState<StructuredDietData | null>(null);
  const [revPatchJson, setRevPatchJson] = useState("{}");
  const [revising, setRevising] = useState(false);
  const [exportShowAlternatives, setExportShowAlternatives] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);

  // Evita que botões internos do StructuredDietBuilder (sem type explícito)
  // submetam o formulário pai acidentalmente
  const preventFormSubmitFromBuilder = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const btn = target?.closest?.("button");
    if (btn) {
      const type = (btn.getAttribute("type") || "").toLowerCase();
      if (!type || type === "submit") {
        e.preventDefault();
      }
    }
  };

  // Search patients (debounced)
  useEffect(() => {
    if (!targetUserQuery) {
      setUserOptions([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const access = await getAccessToken();
        if (!access) return;
        const url = `${
          API.ADMIN_USERS
        }?page=1&pageSize=6&q=${encodeURIComponent(targetUserQuery)}`;
        const r = await fetch(url, {
          headers: { authorization: `Bearer ${access}` },
          signal: ctrl.signal,
        });
        const data = await r.json().catch(() => ({}));
        setUserOptions(r.ok ? data.results || [] : []);
      } catch {
        if (!ctrl.signal.aborted) setUserOptions([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 1000);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [targetUserQuery, getAccessToken]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const access = await getAccessToken();
      if (!access) return;
      const qs = new URLSearchParams();
      if (filterUserId) qs.set("user_id", filterUserId);
      const r = await fetch(
        `${API.DIET_PLANS}${qs.toString() ? `?${qs.toString()}` : ""}`,
        { headers: { authorization: `Bearer ${access}` } }
      );
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Falha");
      setPlans(data.results || []);
    } catch (e: any) {
      setError(e.message || "Erro");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterUserId]);

  const openDetail = async (id: string) => {
    setDetailId(id);
    setDetailLoading(true);
    setDetail(null);
    try {
      const access = await getAccessToken();
      if (!access) return;
      const r = await fetch(`${API.dietPlan(id)}?includeData=1`, {
        headers: { authorization: `Bearer ${access}` },
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Falha");
      setDetail(data.plan);
    } catch (e: any) {
      setError(e.message || "Erro detalhe");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (planFormat === "structured" && !dietHasItems(structuredCreateData)) {
      alert("Dieta estruturada vazia.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const access = await getAccessToken();
      if (!access) return;
      let dataObj: any;
      if (planFormat === "structured" && structuredCreateData) {
        dataObj = structuredCreateData;
      }
      const finalDesc = creatingDesc;
      const body = {
        name: creatingName,
        description: finalDesc,
        data: dataObj,
        user_id: targetUserId || undefined,
      };
      const r = await fetch(API.DIET_PLANS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${access}`,
        },
        body: JSON.stringify(body),
      });
      const resp = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(resp.error || "Falha");
      await load();
      setShowCreate(false);
      setCreatingName("");
      setCreatingDesc("");
      setPlanFormat("structured");
      setStructuredCreateData(null);
      try {
        localStorage.removeItem("structuredDietDraft");
      } catch {
        // ignore cleanup error
      }
      setTargetUserId("");
      setTargetUserLabel("");
    } catch (e: any) {
      setError(e.message || "Erro criar");
    } finally {
      setCreating(false);
    }
  };

  const handleRevise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailId) return;
    if (revMode === "structured" && !dietHasItems(revStructuredData)) {
      alert("Dieta estruturada vazia.");
      return;
    }
    setRevising(true);
    setError(null);
    try {
      const access = await getAccessToken();
      if (!access) return;
      let dataPatch: any;
      if (revMode === "json") {
        try {
          dataPatch = JSON.parse(revPatchJson || "{}");
        } catch {
          alert("JSON inválido");
          setRevising(false);
          return;
        }
      }
      const payload = { notes: revNotes || undefined, dataPatch };
      const r = await fetch(API.dietPlanRevise(detailId), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${access}`,
        },
        body: JSON.stringify(payload),
      });
      const resp = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(resp.error || "Falha revisão");
      await openDetail(detailId);
      await load();
      setRevNotes("");
      setRevPatchJson("{}");
    } catch (e: any) {
      setError(e.message || "Erro revisão");
    } finally {
      setRevising(false);
    }
  };

  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const totalPlans = plans.length;
  const activePlans = plans.filter(p => p.status === 'active').length;

  return (
    <Card className="p-0 overflow-hidden" padding="p-3 sm:p-6">
      <div className="min-h-screen bg-gray-50">
      {/* Header Principal */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg font-bold text-gray-900">Gerenciar Dietas</h1>
                <p className="text-xs text-gray-600">
                  {totalPlans} plano{totalPlans !== 1 ? 's' : ''} • {activePlans} ativo{activePlans !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setShowCreate(true)}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center text-sm"
              noBorder
              noFocus
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nova
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Busca de Pacientes */}
            <div className="flex-1 w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  value={targetUserQuery}
                  onChange={(e) => setTargetUserQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  placeholder="Buscar paciente por nome ou email..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                
                {/* Resultados da Busca */}
                {(searchFocused || targetUserQuery) && targetUserQuery && (
                  <div className="absolute z-20 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-full max-h-60 overflow-y-auto">
                    {searchingUsers ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4 animate-spin text-green-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Buscando pacientes...
                        </div>
                      </div>
                    ) : userOptions.length > 0 ? (
                      userOptions.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setFilterUserId(u.id);
                            setFilterUserLabel(u.display_name || u.email);
                            setTargetUserQuery("");
                            setSearchFocused(false);
                          }}
                          className="flex items-center gap-3 w-full p-3 hover:bg-green-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {u.display_name?.charAt(0).toUpperCase() || u.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate text-sm">
                              {u.display_name || "Sem nome"}
                            </div>
                            <div className="text-xs text-gray-500 truncate">{u.email}</div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm">Nenhum paciente encontrado</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                
              </div>
            </div>

            {/* Filtro Ativo e Ações */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {filterUserId && (
                <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {filterUserLabel.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-green-800 font-medium truncate max-w-32">
                    {filterUserLabel}
                  </span>
                  <button
                    onClick={() => {
                      setFilterUserId("");
                      setFilterUserLabel("");
                    }}
                    className="text-green-600 hover:text-green-800 p-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="font-medium text-red-800">Erro</div>
                <div className="text-sm text-red-600 mt-1">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Grid de Planos */}
        {loading && plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <svg className="w-12 h-12 animate-spin text-green-600 mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Carregando planos...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md mx-auto">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum plano de dieta</h3>
              <p className="text-gray-600 mb-6">Comece criando seu primeiro plano nutricional.</p>
              <Button 
                onClick={() => setShowCreate(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Criar Primeira Dieta
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg truncate">{p.name}</h3>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                      {p.description || "Plano nutricional personalizado"}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    p.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {p.status === "active" ? "Ativo" : "Inativo"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {p.format && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-medium">
                      {p.format}
                    </span>
                  )}
                  {p.start_date && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs">
                      Início: {new Date(p.start_date).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  {p.user_id && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs">
                      Paciente: {p.user_id.slice(0, 6)}...
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1 text-sm flex items-center justify-center"
                    noFocus
                    onClick={() => openDetail(p.id)}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Detalhes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-1 md:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-2 max-h-[98vh] overflow-hidden flex flex-col">
            {/* Header Fixo */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-2 sm:p-3 text-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Criar Nova Dieta</h2>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreate(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <form onSubmit={handleCreate} className="space-y-6">
                {/* Seção Paciente */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-blue-900">Paciente</h3>
                  </div>

                  {/* Paciente Selecionado */}
                  {targetUserId ? (
                    <div className="bg-white rounded-lg border border-blue-300 p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {targetUserLabel.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {targetUserLabel}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {targetUserId.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setTargetUserId("");
                            setTargetUserLabel("");
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg
                            className="h-4 w-4 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>
                        <input
                          value={targetUserQuery}
                          onChange={(e) => setTargetUserQuery(e.target.value)}
                          placeholder="Buscar paciente por nome ou email..."
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Resultados da Busca */}
                      {targetUserQuery && (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {searchingUsers ? (
                            <div className="p-4 text-center text-gray-500">
                              <div className="flex items-center justify-center gap-2">
                                <svg
                                  className="w-4 h-4 animate-spin text-blue-600"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Buscando pacientes...
                              </div>
                            </div>
                          ) : userOptions.length > 0 ? (
                            userOptions.map((u) => (
                              <button
                                type="button"
                                key={u.id}
                                onClick={() => {
                                  setTargetUserId(u.id);
                                  setTargetUserLabel(u.display_name || u.email);
                                  setTargetUserQuery("");
                                }}
                                className="flex items-center gap-3 w-full p-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                              >
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                  {u.display_name?.charAt(0).toUpperCase() ||
                                    u.email.charAt(0).toUpperCase()}
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">
                                    {u.display_name || "Sem nome"}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {u.email}
                                  </div>
                                </div>
                                <svg
                                  className="w-4 h-4 text-green-500 flex-shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center text-gray-500">
                              <div className="flex flex-col items-center gap-2">
                                <svg
                                  className="w-8 h-8 text-gray-300"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1}
                                    d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                                <span className="text-sm">
                                  Nenhum paciente encontrado
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Informações Básicas */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gray-100 rounded-lg">
                      <svg
                        className="w-4 h-4 text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      Informações da Dieta
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome da Dieta *
                      </label>
                      <input
                        value={creatingName}
                        onChange={(e) => setCreatingName(e.target.value)}
                        required
                        placeholder="Ex: Dieta Low Carb - Fase 1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição
                      </label>
                      <textarea
                        value={creatingDesc}
                        onChange={(e) => setCreatingDesc(e.target.value)}
                        placeholder="Descreva os objetivos desta dieta..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Construtor de Dieta Estruturada */}
                {planFormat === "structured" && (
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-4 text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-white/20 rounded-lg">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                              />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold">Montar Dieta</h3>
                            <p className="text-emerald-100 text-sm">
                              Adicione refeições e alimentos
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div onClickCapture={preventFormSubmitFromBuilder}>
                        <StructuredDietBuilder
                          value={structuredCreateData}
                          onChange={setStructuredCreateData}
                          showAlternatives={exportShowAlternatives}
                          onToggleAlternatives={setExportShowAlternatives}
                          compact={true}
                        />
                      </div>

                      {!structuredCreateData && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                          <svg
                            className="w-8 h-8 text-amber-500 mx-auto mb-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                          </svg>
                          <p className="text-amber-800 font-medium text-sm">
                            Adicione pelo menos uma refeição
                          </p>
                          <p className="text-amber-600 text-xs mt-1">
                            Clique em "+ Adicionar Refeição" para começar
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Footer Fixo */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 sticky bottom-0">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  onClick={handleCreate}
                  disabled={
                    creating ||
                    !targetUserId ||
                    !creatingName ||
                    (planFormat === "structured" && !structuredCreateData)
                  }
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Criando...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Criar Dieta
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diet Detail modal */}
      {detailId && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-2 md:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-2 max-h-[98vh] overflow-hidden flex flex-col">
            {/* Header Fixo */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-2 sm:p-3 text-white sticky top-0 z-20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Detalhes do Plano</h2>
                    <p className="text-emerald-100 text-xs">
                      Visualizar e gerenciar versões
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setDetailId(null);
                    setDetail(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {detailLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <svg
                    className="w-8 h-8 animate-spin text-green-600 mb-3"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <p className="text-sm text-gray-600">
                    Carregando detalhes...
                  </p>
                </div>
              )}

              {!detailLoading && detail && (
                <div className="space-y-6">
                  {/* Informações Principais */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-2">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4 mt-2 text-xs text-blue-700">
                          <span className="flex items-center gap-1">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            Criado em{" "}
                            {new Date(detail.created_at).toLocaleDateString(
                              "pt-BR"
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {detail.versions.length} versão
                            {detail.versions.length !== 1 ? "es" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seletor de Versões */}
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {/* Header Cliqueável */}
                    <button
                      onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
                      className="flex items-center justify-between w-full p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg transition-colors ${
                            mostrarDetalhes
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d={
                                mostrarDetalhes
                                  ? "M5 15l7-7 7 7"
                                  : "M19 9l-7 7-7-7"
                              }
                            />
                          </svg>
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              Histórico de Versões
                            </h3>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Conteúdo Expandido */}
                    {mostrarDetalhes && (
                      <div className="border-t border-gray-200">
                        {/* Componente de Versões */}
                        <div className="max-h-96 overflow-y-auto p-1">
                          <AdminVersionsSelector detail={detail} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Nova Revisão - Accordion */}
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-50 to-amber-100 border-b border-amber-200 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-amber-100 rounded-lg">
                            <svg
                              className="w-5 h-5 text-amber-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-amber-900">
                              Nova Revisão
                            </h3>
                            <p className="text-amber-700 text-sm">
                              Atualizar plano nutricional
                            </p>
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-medium">
                          Opcional
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      <form onSubmit={handleRevise} className="space-y-4">
                        {/* Campo de Notas */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            📝 Notas da Revisão
                          </label>
                          <textarea
                            value={revNotes}
                            onChange={(e) => setRevNotes(e.target.value)}
                            placeholder="Descreva as alterações realizadas nesta revisão..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>

                        {/* Seletor de Modo */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            🛠️ Método de Edição
                          </label>
                          <div className="grid grid-cols-1 gap-2">
                            <label className="flex items-center gap-3 p-3 bg-white border-2 border-orange-200 rounded-lg cursor-pointer hover:border-orange-300 transition-colors">
                              <input
                                type="radio"
                                value="structured"
                                checked={revMode === "structured"}
                                onChange={() => {
                                  setRevMode("structured");
                                  if (detail?.versions?.[0]?.data?.versao === 1)
                                    setRevStructuredData(
                                      detail.versions[0].data
                                    );
                                }}
                                className="text-orange-600 focus:ring-orange-500"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  Editor Visual
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  Modifique a dieta usando o construtor visual
                                  (recomendado)
                                </div>
                              </div>
                              <div className="p-2 bg-orange-100 rounded-lg">
                                <svg
                                  className="w-4 h-4 text-orange-600"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                                  />
                                </svg>
                              </div>
                            </label>

                            <label className="flex items-center gap-3 p-3 bg-white border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                              <input
                                type="radio"
                                value="json"
                                checked={revMode === "json"}
                                onChange={() => setRevMode("json")}
                                className="text-gray-600 focus:ring-gray-500"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  JSON (Avançado)
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  Edite manualmente o JSON
                                </div>
                              </div>
                              <div className="p-2 bg-gray-100 rounded-lg">
                                <svg
                                  className="w-4 h-4 text-gray-600"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                                  />
                                </svg>
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* Editor JSON */}
                        {revMode === "json" && (
                          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                              <label className="text-sm font-medium text-gray-700">
                                📄 JSON de Modificação
                              </label>
                              <button
                                type="button"
                                onClick={() => setRevPatchJson("{}")}
                                className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                              >
                                Limpar
                              </button>
                            </div>
                            <textarea
                              value={revPatchJson}
                              onChange={(e) => setRevPatchJson(e.target.value)}
                              placeholder='{"key": "value"} - Insira as modificações em formato JSON'
                              rows={6}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                            <div className="text-xs text-gray-500 mt-2">
                              💡 Use apenas se souber manipular JSON
                            </div>
                          </div>
                        )}

                        {/* Editor Estruturado */}
                        {revMode === "structured" && (
                          <div
                            className="border border-gray-200 rounded-lg bg-white overflow-hidden"
                            onClickCapture={preventFormSubmitFromBuilder}
                          >
                            <div className="bg-gradient-to-r from-green-50 to-emerald-100 border-b border-emerald-200 p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <svg
                                    className="w-5 h-5 text-emerald-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                                    />
                                  </svg>
                                  <span className="font-semibold text-emerald-900">
                                    Editor de Dieta
                                  </span>
                                </div>
                                {detail?.versions?.[detail.versions.length - 1]
                                  ?.data?.versao === 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setRevStructuredData(
                                        detail.versions[
                                          detail.versions.length - 1
                                        ].data
                                      )
                                    }
                                    className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 transition-colors"
                                  >
                                    Carregar Atual
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="p-4 max-h-96 overflow-y-auto">
                              <StructuredDietBuilder
                                value={revStructuredData}
                                onChange={setRevStructuredData}
                                compact={true}
                              />
                            </div>
                          </div>
                        )}

                        {/* Ações */}
                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => {
                              setRevNotes("");
                              setRevPatchJson("{}");
                              setRevStructuredData(null);
                            }}
                            className="flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                          >
                            Limpar
                          </button>
                          <button
                            type="submit"
                            disabled={
                              revising ||
                              (!revNotes.trim() &&
                                revMode === "structured" &&
                                !revStructuredData)
                            }
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-orange-700 hover:to-amber-700 transition-all flex items-center justify-center gap-2"
                          >
                            {revising ? (
                              <>
                                <svg
                                  className="w-4 h-4 animate-spin"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Aplicando...
                              </>
                            ) : (
                              <>
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Aplicar Revisão
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

/* ---------------------------
   AdminPage (main)
   - original new UI merged with DietManagement as a tab
   --------------------------- */
const AdminPage: React.FC = () => {
  const { getAccessToken } = useAuth();
  const [tab, setTab] = useState<
    | "pacientes"
    | "consultas"
    | "relatorios"
    | "dietas"
    | "notificacoes"
    | "creditos"
  >("pacientes");
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersHasMore, setUsersHasMore] = useState(false);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [consultLoading, setConsultLoading] = useState(false);
  const [consultFilters, setConsultFilters] = useState<{ status?: string }>({});
  const pageSize = 20;

  // Fetch users (patients). API supports pagination + q filter.
  useEffect(() => {
    if (tab !== "pacientes") return;
    let ignore = false;
    async function load() {
      setUsersLoading(true);
      try {
        const access = await getAccessToken();
        if (!access) {
          if (!ignore) {
            setUsers([]);
          }
          return;
        }
        const params = new URLSearchParams({
          page: String(usersPage),
          pageSize: String(pageSize),
        });
        if (searchTerm) params.set("q", searchTerm);
        const r = await fetch(`${API.ADMIN_USERS}?${params.toString()}`, {
          headers: { authorization: `Bearer ${access}` },
        });
        if (!r.ok) throw new Error("fail");
        const data = await r.json();
        if (ignore) return;
        setUsers(data.results || []);
        setUsersHasMore((data.results || []).length === pageSize);
      } catch {
        if (!ignore) setUsers([]);
      } finally {
        if (!ignore) setUsersLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [tab, usersPage, searchTerm, getAccessToken]);

  // Fetch consultations
  useEffect(() => {
    if (tab !== "consultas") return;
    let ignore = false;
    async function load() {
      setConsultLoading(true);
      try {
        const access = await getAccessToken();
        if (!access) {
          if (!ignore) {
            setConsultations([]);
          }
          return;
        }
        const params = new URLSearchParams({ page: "1", pageSize: "50" });
        if (consultFilters.status) params.set("status", consultFilters.status);
        const r = await fetch(
          `${API.ADMIN_CONSULTATIONS}?${params.toString()}`,
          { headers: { authorization: `Bearer ${access}` } }
        );
        if (!r.ok) throw new Error("fail");
        const data = await r.json();
        if (ignore) return;
        setConsultations(data.results || []);
      } catch {
        if (!ignore) setConsultations([]);
      } finally {
        if (!ignore) setConsultLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [tab, consultFilters, getAccessToken]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const s = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        (u.display_name || "").toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s)
    );
  }, [users, searchTerm]);

  const stats = useMemo(
    () => ({
      totalPacientes: users.length,
      pendentes: 0, // backend ainda não fornece pagamento aqui
      emAndamento: 0,
      atrasados: 0,
    }),
    [users]
  );

  const { t } = useI18n();

  return (
    <RoleRoute role="admin">
      <div className="w-full space-y-6">
        <SEO
          title={t("admin.dashboard.seo.title")}
          description={t("admin.dashboard.seo.desc")}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-green-700">
              {t("admin.dashboard.title")}
            </h2>
            <p className="text-gray-600 text-sm">Bem-vinda, Dra. Cawanne</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Pacientes</p>
                <p className="text-2xl font-bold text-green-700">
                  {stats.totalPacientes}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg
                  className="w-6 h-6 text-green-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 md:gap-3">
          {[
            { key: "pacientes", label: "Pacientes" },
            { key: "consultas", label: "Consultas" },
            { key: "dietas", label: "Dietas" },
            { key: "notificacoes", label: "Notificações" },
            { key: "creditos", label: "Créditos" },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`flex-1 min-w-[120px] sm:basis-[48%] md:basis-[30%] lg:basis-[18%] px-3 py-1 font-medium rounded-lg transition-colors text-sm text-center ${
                tab === key
                  ? "bg-green-600 text-white"
                  : "text-green-600 hover:bg-green-50"
              }`}
              onClick={() => setTab(key as any)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* --- PACIENTES --- */}
        {tab === "pacientes" && (
          <Card className="p-0 overflow-hidden">
            <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  className="w-full px-3 sm:px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg
                  className="absolute right-3 top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="py-3 px-4 font-medium">Paciente</th>
                    <th className="py-3 px-4 font-medium">Role</th>
                    <th className="py-3 px-4 font-medium">Criado</th>
                    <th className="py-3 px-4 font-medium">Último Login</th>
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
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-gray-500"
                      >
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  )}
                  {!usersLoading &&
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="border-t hover:bg-green-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                              <User size={14} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 leading-tight">
                                {u.display_name || "—"}
                              </p>
                              <p className="text-gray-500 text-xs">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700 uppercase tracking-wide">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-xs">
                          {u.created_at
                            ? fmtDate(u.created_at, "pt", {
                                dateStyle: "short",
                              })
                            : "—"}
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-xs">
                          {u.last_login_at
                            ? fmtDate(u.last_login_at, "pt", {
                                dateStyle: "short",
                              })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t flex items-center justify-between text-sm bg-gray-50">
              <span>Página {usersPage}</span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  disabled={usersPage === 1 || usersLoading}
                  onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  disabled={!usersHasMore || usersLoading}
                  onClick={() => setUsersPage((p) => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* --- CONSULTAS --- */}
        {tab === "consultas" && (
          <Card className="p-0 overflow-hidden">
            <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
              <div className="flex flex-wrap gap-2 items-center text-sm">
                <label className="text-gray-600 whitespace-nowrap">
                  Status:
                </label>
                <select
                  onChange={(e) =>
                    setConsultFilters({ status: e.target.value || undefined })
                  }
                  value={consultFilters.status || ""}
                  className="border rounded px-2 py-1 text-sm focus:ring-green-500 focus:border-green-500 min-w-0"
                >
                  <option value="">Todos</option>
                  <option value="scheduled">Programadas</option>
                  <option value="completed">Concluídas</option>
                  <option value="canceled">Canceladas</option>
                </select>
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
                  {!consultLoading && consultations.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-10 text-center text-gray-500"
                      >
                        Nenhuma consulta encontrada.
                      </td>
                    </tr>
                  )}
                  {!consultLoading &&
                    consultations.map((c) => {
                      const dt = new Date(c.scheduled_at);
                      const dateStr =
                        fmtDate(dt.toISOString(), "pt", {
                          dateStyle: "short",
                        }) +
                        " " +
                        dt.toISOString().slice(11, 16);
                      return (
                        <tr key={c.id} className="border-t hover:bg-green-50">
                          <td className="py-3 px-4 text-gray-800 whitespace-nowrap">
                            {dateStr}
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            {c.user_id.slice(0, 8)}...
                          </td>
                          <td className="py-3 px-4 capitalize">{c.type}</td>
                          <td className="py-3 px-4 text-gray-600">
                            {c.duration_min} min
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wide ${
                                c.status === "scheduled"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {c.urgency || "—"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="secondary" className="text-xs">
                              Detalhes
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* --- DIETAS (nova aba com DietManagement) --- */}
        {tab === "dietas" && (
          <div>
            <DietManagement />
          </div>
        )}

        {/* --- NOTIFICAÇÕES --- */}
        {tab === "notificacoes" && (
          <div className="space-y-6">
            <AdminNotificationSender />
          </div>
        )}

        {/* --- RELATÓRIOS --- */}
        {tab === "relatorios" && (
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Relatórios e Análises</h3>
            <p className="text-gray-600">Em desenvolvimento...</p>
          </Card>
        )}
        {tab === "creditos" && (
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">
              Créditos de Consultas
            </h3>
            <AdminCreditsPanel />
          </Card>
        )}
      </div>
    </RoleRoute>
  );
};

export default AdminPage;
