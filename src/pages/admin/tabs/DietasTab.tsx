import React, { useEffect, useState } from "react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import { useAuth } from "../../../contexts";
import { API } from "../../../config/api";
import StructuredDietBuilder from "../../../components/diet/StructuredDietBuilder";
import { dietHasItems } from "../../../utils/structuredDietExport";
import AdminVersionsSelector from "./AdminVersionsSelector";
import type { PlanDetail as _PlanDetail } from "./AdminVersionsSelector";
import type { StructuredDietData } from "../../../types/structuredDiet";
import { parseSQLDateTimeAssumingUTC } from "../../../utils/date";

interface AdminUser {
  id: string;
  email: string;
  role: string;
  display_name?: string;
}

interface PlanListItem {
  id: string;
  name: string;
  description?: string;
  status?: string;
  format?: string;
  start_date?: string;
  user_id?: string;
  user_display_name?: string;
  user_email?: string;
}

type PlanDetail = _PlanDetail & { start_date?: string; end_date?: string };

function isStructured(x: unknown): x is StructuredDietData {
  if (!x || typeof x !== "object") return false;
  const d = x as { versao?: unknown; meals?: unknown };
  return d.versao === 1 && Array.isArray(d.meals);
}

// Snapshot flexível do questionário
interface QuestionnaireSnapshot {
  category?: string | null;
  answers?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

const DietasTab: React.FC = () => {
  const { getAccessToken } = useAuth();
  const [plans, setPlans] = useState<PlanListItem[]>([]);
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
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<PlanDetail | null>(null);
  const [questionnaire, setQuestionnaire] =
    useState<QuestionnaireSnapshot | null>(null);
  const [revNotes, setRevNotes] = useState("");
  const [revMode] = useState<"json" | "structured">("structured");
  const [revStructuredData, setRevStructuredData] =
    useState<StructuredDietData | null>(null);
  const [revPatchJson, setRevPatchJson] = useState("{}");
  const [revising, setRevising] = useState(false);
  const [exportShowAlternatives, setExportShowAlternatives] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showQuestionnairePreview, setShowQuestionnairePreview] =
    useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >(() => {
    try {
      const raw = localStorage.getItem("admin.diets.groupCollapsed");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(
        "admin.diets.groupCollapsed",
        JSON.stringify(collapsedGroups)
      );
    } catch {
      // ignore persist error
    }
  }, [collapsedGroups]);
  // Validade (criação)
  const [showCreateValidity, setShowCreateValidity] = useState(false);
  const [creatingStartDate, setCreatingStartDate] = useState<string>("");
  const [creatingEndDate, setCreatingEndDate] = useState<string>("");
  // Validade (revisão)
  const [showRevValidity, setShowRevValidity] = useState(false);
  const [revStartDate, setRevStartDate] = useState<string>("");
  const [revEndDate, setRevEndDate] = useState<string>("");

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

  // Bloqueia o scroll do body quando algum modal estiver aberto
  useEffect(() => {
    const isModalOpen = showCreate || !!detailId;
    const body = document.body;
    const html = document.documentElement;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOverflow = html.style.overflow;
    const prevPaddingRight = body.style.paddingRight;

    if (isModalOpen) {
      const scrollbarWidth = window.innerWidth - html.clientWidth;
      body.style.overflow = "hidden";
      html.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      body.style.overflow = prevBodyOverflow || "";
      html.style.overflow = prevHtmlOverflow || "";
      body.style.paddingRight = prevPaddingRight || "";
    }

    return () => {
      body.style.overflow = prevBodyOverflow;
      html.style.overflow = prevHtmlOverflow;
      body.style.paddingRight = prevPaddingRight;
    };
  }, [showCreate, detailId]);

  // Helpers de data (YYYY-MM-DD)
  const fmtYmd = (d: Date) => d.toISOString().slice(0, 10);
  const addMonths = (d: Date, months: number) => {
    const nd = new Date(d);
    nd.setMonth(nd.getMonth() + months);
    return nd;
  };

  // Defaults ao abrir modal de criação
  useEffect(() => {
    if (showCreate) {
      const today = new Date();
      if (!creatingStartDate) setCreatingStartDate(fmtYmd(today));
      if (!creatingEndDate) setCreatingEndDate(fmtYmd(addMonths(today, 3)));
    }
  }, [showCreate, creatingStartDate, creatingEndDate]);

  // Prefill datas da revisão quando detalhe carregar
  useEffect(() => {
    if (detailId && detail) {
      const today = new Date();
      const start = detail.start_date ? new Date(detail.start_date) : today;
      const end = detail.end_date
        ? new Date(detail.end_date)
        : addMonths(today, 3);
      setRevStartDate(fmtYmd(start));
      setRevEndDate(fmtYmd(end));
    }
  }, [detailId, detail]);

  // Busca de pacientes (debounced)
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

  // Carregar questionário do paciente ao selecionar no modal de criação
  useEffect(() => {
    let cancelled = false;
    const fetchQuestionnaire = async () => {
      if (!showCreate || !targetUserId) return;
      try {
        const access = await getAccessToken();
        if (!access) return;
        const r = await fetch(API.adminUserQuestionnaire(targetUserId), {
          headers: { authorization: `Bearer ${access}` },
        });
        const data: Record<string, unknown> = (await r
          .json()
          .catch(() => ({}))) as Record<string, unknown>;
        // Backend retorna direto: { category, answers, created_at, updated_at }
        const cat = (data["category"] as string | undefined) ?? null;
        const answers =
          (data["answers"] as Record<string, unknown> | undefined) || undefined;
        const createdAt =
          (data["created_at"] as string | undefined) ?? undefined;
        const updatedAt =
          (data["updated_at"] as string | undefined) ?? undefined;
        setQuestionnaire({
          category: cat,
          answers,
          created_at: createdAt,
          updated_at: updatedAt,
        });
        // Nada adicional a derivar: todo conteúdo está em answers
      } catch {
        if (!cancelled) setQuestionnaire(null);
      }
    };
    fetchQuestionnaire();
    return () => {
      cancelled = true;
    };
  }, [showCreate, targetUserId, getAccessToken]);

  // Carregamento inicial automático (evita exigir clique em "Listar dietas")
  useEffect(() => {
    if (hasLoaded) return;
    if (showCreate || detailId) return; // evita refetch enquanto modal aberto
    const t = setTimeout(() => {
      void load();
    }, 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLoaded, showCreate, detailId]);

  // Refetch automático ao alterar filtro de paciente (com debounce)
  useEffect(() => {
    if (!hasLoaded) return; // se ainda não carregou, deixa o hook acima cuidar
    if (showCreate || detailId) return; // não refetcha com modal aberto
    const t = setTimeout(() => {
      void load();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterUserId, showCreate, detailId, hasLoaded]);

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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro";
      setError(msg);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro detalhe";
      setError(msg);
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
    // Validação simples de datas
    if (creatingStartDate && creatingEndDate) {
      const sd = new Date(creatingStartDate).getTime();
      const ed = new Date(creatingEndDate).getTime();
      if (!isNaN(sd) && !isNaN(ed) && ed < sd) {
        alert("Data de término não pode ser anterior ao início.");
        return;
      }
    }
    setCreating(true);
    setError(null);
    try {
      const access = await getAccessToken();
      if (!access) return;
      const dataObj: StructuredDietData | undefined =
        planFormat === "structured" && structuredCreateData
          ? structuredCreateData
          : undefined;
      // Anexar dados do paciente oriundos do questionário (quando disponíveis)
      const dataWithQuestionnaire: StructuredDietData | undefined = dataObj
        ? { ...dataObj, questionnaire: questionnaire || undefined }
        : undefined;
      const finalDesc = creatingDesc;
      const body = {
        name: creatingName,
        description: finalDesc,
        data: dataWithQuestionnaire,
        user_id: targetUserId || undefined,
        start_date: creatingStartDate || undefined,
        end_date: creatingEndDate || undefined,
      };
      const r = await fetch(API.DIET_PLANS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${access}`,
        },
        body: JSON.stringify(body),
      });
      const resp: unknown = await r.json().catch(() => ({}));
      if (!r.ok) {
        const msg = (resp as Record<string, unknown>)?.error;
        throw new Error(typeof msg === "string" ? msg : "Falha");
      }
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
      setQuestionnaire(null);
      setCreatingStartDate("");
      setCreatingEndDate("");
      setShowCreateValidity(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro criar";
      setError(msg);
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
    // Validação simples de datas (se usuário optou por editar validade)
    if (showRevValidity && revStartDate && revEndDate) {
      const sd = new Date(revStartDate).getTime();
      const ed = new Date(revEndDate).getTime();
      if (!isNaN(sd) && !isNaN(ed) && ed < sd) {
        alert("Data de término não pode ser anterior ao início.");
        return;
      }
    }
    setRevising(true);
    setError(null);
    try {
      const access = await getAccessToken();
      if (!access) return;
      let dataPatch: unknown;
      if (revMode === "json") {
        try {
          dataPatch = JSON.parse(revPatchJson || "{}");
        } catch {
          alert("JSON inválido");
          setRevising(false);
          return;
        }
      }
      // Opcionalmente aplicar update de validade antes da revisão
      if (showRevValidity && detail) {
        const metaPayload: Record<string, unknown> = {};
        if (
          revStartDate &&
          revStartDate !==
            (detail.start_date ? detail.start_date.slice(0, 10) : "")
        ) {
          metaPayload.start_date = revStartDate;
        }
        if (
          revEndDate &&
          revEndDate !== (detail.end_date ? detail.end_date.slice(0, 10) : "")
        ) {
          metaPayload.end_date = revEndDate;
        }
        if (Object.keys(metaPayload).length > 0) {
          const pr = await fetch(API.dietPlan(detailId), {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${access}`,
            },
            body: JSON.stringify(metaPayload),
          });
          const presp: Record<string, unknown> = await pr
            .json()
            .catch(() => ({} as Record<string, unknown>));
          if (!pr.ok) {
            const msg =
              typeof presp?.error === "string"
                ? presp.error
                : "Falha ao atualizar validade";
            throw new Error(msg);
          }
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
      const resp: unknown = await r.json().catch(() => ({}));
      if (!r.ok) {
        const msg = (resp as Record<string, unknown>)?.error;
        throw new Error(typeof msg === "string" ? msg : "Falha revisão");
      }
      await openDetail(detailId);
      await load();
      setRevNotes("");
      setRevPatchJson("{}");
      // manter revStartDate/revEndDate preenchidos com o que foi salvo
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro revisão";
      setError(msg);
    } finally {
      setRevising(false);
    }
  };

  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);

  return (
    <Card className="p-0 overflow-hidden" padding="p-3 sm:p-6">
      <div className="min-h-screen">
        {/* Header Principal */}
        <div className="bg-white border-b border-gray-200 sticky top-0">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-lg font-bold text-gray-900">
                    Gerenciar Dietas
                  </h1>
                </div>
              </div>
              <Button
                onClick={() => setShowCreate(true)}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center text-sm"
                noBorder
                noFocus
              >
                <svg
                  className="w-4 h-4 mr-2"
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
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() =>
                      setTimeout(() => setSearchFocused(false), 200)
                    }
                    placeholder="Buscar paciente por nome ou email..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />

                  {/* Resultados da Busca */}
                  {(searchFocused || targetUserQuery) && targetUserQuery && (
                    <div className="absolute z-20 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-full max-h-60 overflow-y-auto">
                      {searchingUsers ? (
                        <div className="p-4 text-center text-gray-500">
                          <div className="flex items-center justify-center gap-2">
                            <svg
                              className="w-4 h-4 animate-spin text-green-600"
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
                              {u.display_name?.charAt(0).toUpperCase() ||
                                u.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate text-sm">
                                {u.display_name || "Sem nome"}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {u.email}
                              </div>
                            </div>
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="max-w-7xl mx-auto px-1 sm:px-4 lg:px-6 py-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
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
              <svg
                className="w-12 h-12 animate-spin text-green-600 mb-4"
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
              <p className="text-gray-600">Carregando planos...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md mx-auto">
                <svg
                  className="w-16 h-16 text-gray-300 mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum plano de dieta
                </h3>
                <p className="text-gray-600 mb-6">
                  Comece criando seu primeiro plano nutricional.
                </p>
                <Button
                  onClick={() => setShowCreate(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Criar Primeira Dieta
                </Button>
              </div>
            </div>
          ) : (
            (() => {
              // Agrupar por usuário
              type Group = {
                id: string;
                label: string;
                subtitle?: string;
                plans: PlanListItem[];
              };
              const userLabelCache = new Map<string, string>();
              if (targetUserId && targetUserLabel)
                userLabelCache.set(targetUserId, targetUserLabel);
              const groupsMap = new Map<string, Group>();
              const unknownKey = "__none__";
              for (const p of plans) {
                const uid = p.user_id || unknownKey;
                const labelFromApi =
                  p.user_display_name || p.user_email || null;
                const label =
                  uid === unknownKey
                    ? "Sem paciente"
                    : labelFromApi ||
                      userLabelCache.get(uid) ||
                      `${uid.slice(0, 6)}...`;
                const subtitle =
                  p.user_email && p.user_display_name
                    ? p.user_email
                    : undefined;
                const g = groupsMap.get(uid) || {
                  id: uid,
                  label,
                  subtitle,
                  plans: [],
                };
                g.plans.push(p);
                groupsMap.set(uid, g);
              }
              const groups = Array.from(groupsMap.values()).sort((a, b) => {
                if (a.id === unknownKey) return 1;
                if (b.id === unknownKey) return -1;
                return a.label.localeCompare(b.label, "pt-BR");
              });

              return (
                <div className="space-y-6">
                  {groups.map((g) => (
                    <div
                      key={g.id}
                      className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
                    >
                      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {g.label.charAt(0).toUpperCase()}
                          </div>
                          <div className="grid grid-cols items-start">
                            <div className="font-semibold text-gray-900">
                              {g.label}
                            </div>

                            <div className="text-xs text-gray-500">
                              {g.subtitle ? (
                                <span>{g.subtitle}</span>
                              ) : (
                                <span>-</span> // ou null, se preferir omitir
                              )}
                            </div>

                            <div className="text-xs text-gray-500">
                              {g.plans.length} plano
                              {g.plans.length !== 1 ? "s" : ""}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="px-3 py-1 text-xs rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
                            onClick={() =>
                              setCollapsedGroups((m) => ({
                                ...m,
                                [g.id]: !m[g.id],
                              }))
                            }
                          >
                            {collapsedGroups[g.id] ? "Expandir" : "Recolher"}
                          </button>
                        </div>
                      </div>
                      {!collapsedGroups[g.id] && (
                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {g.plans.map((p) => (
                              <div
                                key={p.id}
                                className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 text-lg truncate">
                                      {p.name}
                                    </h3>
                                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                      {p.description ||
                                        "Plano nutricional personalizado"}
                                    </p>
                                  </div>
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                      p.status === "active"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    {p.status === "active"
                                      ? "Ativo"
                                      : "Inativo"}
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
                                      Início:{" "}
                                      {new Date(
                                        p.start_date
                                      ).toLocaleDateString("pt-BR")}
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
                                    <svg
                                      className="w-4 h-4 mr-2"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                      />
                                    </svg>
                                    Detalhes
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()
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
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Configurar validade"
                    onClick={() => setShowCreateValidity((v) => !v)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
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
                        d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
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
                        <div className="flex items-center gap-1">
                          {questionnaire && (
                            <button
                              type="button"
                              onClick={() => setShowQuestionnairePreview(true)}
                              title="Ver questionário"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setTargetUserId("");
                              setTargetUserLabel("");
                              setQuestionnaire(null);
                            }}
                            title="Limpar paciente"
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

                {/* Validade (opcional) */}
                {showCreateValidity && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-amber-100 rounded-lg">
                        <svg
                          className="w-4 h-4 text-amber-700"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-amber-900">
                        Validade do Plano
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-amber-900 mb-1">
                          Início
                        </label>
                        <input
                          type="date"
                          value={creatingStartDate}
                          onChange={(e) => setCreatingStartDate(e.target.value)}
                          className="w-full border border-amber-300 rounded-lg p-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-amber-900 mb-1">
                          Fim
                        </label>
                        <input
                          type="date"
                          value={creatingEndDate}
                          onChange={(e) => setCreatingEndDate(e.target.value)}
                          className="w-full border border-amber-300 rounded-lg p-2 text-sm"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-amber-700 mt-2">
                      Se preferir, deixe em branco para não definir validade.
                    </p>
                  </div>
                )}

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

                {/* Preview do Questionário (overlay sobre o modal) */}
                {showCreate && showQuestionnairePreview && questionnaire && (
                  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-2">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
                      <div className="flex items-center justify-between px-4 py-3 border-b">
                        <div className="flex items-center gap-2">
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </div>
                          <h3 className="font-semibold text-gray-900">
                            Questionário do Paciente
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowQuestionnairePreview(false)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg"
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-3">
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">Categoria:</span>{" "}
                            <span className="font-bold">
                              {questionnaire.category || "—"}
                            </span>
                          </div>
                          <div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                              {questionnaire.answers &&
                              Object.keys(questionnaire.answers).length > 0 ? (
                                <div className="space-y-2">
                                  {Object.entries(questionnaire.answers).map(
                                    ([k, v]) => (
                                      <div
                                        key={k}
                                        className="flex items-start justify-between gap-4"
                                      >
                                        <div className="text-gray-600">{k}</div>
                                        <div className="text-gray-900 break-words max-w-[60%]">
                                          {typeof v === "string" ||
                                          typeof v === "number"
                                            ? String(v)
                                            : JSON.stringify(v)}
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              ) : (
                                <div className="text-gray-500">
                                  Sem respostas.
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-[11px] text-gray-500">
                            <div>
                              Criado em:{" "}
                              {parseSQLDateTimeAssumingUTC(
                                questionnaire.created_at as string
                              )?.toLocaleString?.("pt-BR") ?? "—"}
                            </div>
                            <div>
                              Atualizado em:{" "}
                              {parseSQLDateTimeAssumingUTC(
                                questionnaire.updated_at as string
                              )?.toLocaleString?.("pt-BR") ?? "—"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
                        <div className="flex items-center justify-between">
                          <div className="text-gray-700 font-medium">
                            Nova Revisão
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              title="Editar validade (início/fim)"
                              onClick={() => setShowRevValidity((v) => !v)}
                              className="px-3 py-1 text-xs rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200"
                            >
                              Validade
                            </button>
                          </div>
                        </div>
                        {showRevValidity && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                            <div>
                              <label className="block text-xs font-medium text-amber-900 mb-1">
                                Início
                              </label>
                              <input
                                type="date"
                                value={revStartDate}
                                onChange={(e) =>
                                  setRevStartDate(e.target.value)
                                }
                                className="w-full border border-amber-300 rounded-lg p-2 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-amber-900 mb-1">
                                Fim
                              </label>
                              <input
                                type="date"
                                value={revEndDate}
                                onChange={(e) => setRevEndDate(e.target.value)}
                                className="w-full border border-amber-300 rounded-lg p-2 text-sm"
                              />
                            </div>
                          </div>
                        )}
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
                                {(() => {
                                  const dv = detail?.versions?.[
                                    detail.versions.length - 1
                                  ]?.data as unknown;
                                  return isStructured(dv);
                                })() && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const dv = detail!.versions[
                                        detail!.versions.length - 1
                                      ].data as unknown;
                                      if (isStructured(dv))
                                        setRevStructuredData(dv);
                                    }}
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

export default DietasTab;
