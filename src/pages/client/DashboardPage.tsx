import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import StatsCard from "../../components/StatsCard";
import StructuredDietBuilder from "../../components/diet/StructuredDietBuilder";
import DietPlanDetailContent from "../../components/diet/DietPlanDetailContent";
// export minimal apenas PDF
// import { downloadDietJson, printDiet, copyDietJson, copyDietHtml } from "../../utils/structuredDietExport";
import ErrorBoundary from "../../components/ui/ErrorBoundary";
import Tooltip from "../../components/ui/Tooltip";
import NotificationBellReal from "../../components/NotificationBellReal";
import Progress from "../../components/ui/Progress";
import LogoCroped from "../../components/ui/LogoCroped";
import { SEO } from "../../components/comum/SEO";
import { exportDietPdf } from "../../utils/structuredDietPdf";
import { useAuthenticatedFetch } from "../../hooks/useApi";
import { API as Routes } from "../../config/api";
import Perfil from "../../components/dashboard/Perfil";
import Consultas from "../../components/dashboard/Consultas";
import Suporte from "../../components/dashboard/Suporte";
import { useConsultations } from "../../hooks/useConsultations"; // integração real de consultas
import Sparkline from "../../components/ui/Sparkline";
import { useI18n, formatDate as fmtDate } from "../../i18n";
import type { Locale } from "../../i18n";
import { useQuestionario } from "../../contexts/useQuestionario";
import { QuestionnaireBanner } from "../../components/dashboard/QuestionnaireBanner";
import {
  MealIcon,
  WeightIcon,
  WaterIcon,
  CalendarIcon,
  BillingIcon,
} from "../../components/dashboard/icon";
import { SkeletonCard } from "../../components/ui/Loading";
import DataSection from "../../components/ui/DataSection";
import { useWeightData } from "../../hooks/useWeightData"; // mantido para WeightSection isolada
import type { StructuredDietData } from "../../types/structuredDiet";
import {
  colorForWeightDiff,
  inferWeightObjective,
  WEIGHT_TOLERANCE_KG,
} from "../../utils/weightObjective";
import { useDietPlans } from "../../hooks/useDietPlans";
import type { DietPlanDetail } from "../../hooks/useDietPlans";
import { useDashboardData } from "../../hooks/useDashboardData";
import { useQueryClient } from "@tanstack/react-query";
import Prefetch, { logPrefetchMetrics } from "../../utils/prefetch";
import { lockDetail, unlockDetail } from "../../utils/prefetch";
import { shouldShowSkeleton } from "../../utils/loadingHelpers";
import { useIntersectionPrefetch } from "../../hooks/useIntersectionPrefetch";
import { useWaterLogsInteligente } from "../../hooks/useWaterLogsInteligente";
import { Download, LoaderCircle } from "lucide-react";

// Modern Diet Plan Card
interface DietPlanCardProps {
  id: string;
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  results_summary?: string | null;
  status: "active" | "archived";
  isCurrent?: boolean;
  format?: string;
}

const DietPlanCard: React.FC<{
  diet: DietPlanCardProps;
  onView: (id: string) => void;
  onRevise?: (id: string) => void;
  canEdit: boolean;
  locale: Locale;
  onDownloadLatest: (id: string) => void;
  downloading?: boolean;
}> = ({
  diet,
  onView,
  onRevise,
  canEdit,
  locale,
  onDownloadLatest,
  downloading,
}) => {
  const isCurrent = diet.status === "active";

  // Detectar formato da dieta (não exibido por enquanto)

  return (
    <Card className="p-5 hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50 rounded-2xl">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isCurrent ? "bg-green-500 animate-pulse" : "bg-gray-300"
              }`}
            />
            <h3 className="text-lg font-bold text-gray-900 truncate">
              {diet.name}
            </h3>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed truncate">
            {diet.description || "Sem descrição"}
          </p>
        </div>
        <div className="flex items-start gap-2 ml-3">
          <button
            className={`p-2 rounded-xl border border-gray-200/80 bg-white/80 backdrop-blur-sm text-sm font-medium transition-all duration-200 ${
              downloading
                ? "bg-gray-100/50 text-gray-400 cursor-wait shadow-inner"
                : "text-gray-600 hover:bg-gray-50/80 hover:text-gray-800 hover:shadow-md hover:border-gray-300/80 shadow-sm"
            }`}
            title="Baixar versão mais recente"
            onClick={(e) => {
              e.stopPropagation();
              onDownloadLatest(diet.id);
            }}
            disabled={!!downloading}
          >
            {downloading ? (
              <LoaderCircle className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="space-y-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Início
          </span>
          <p className="font-semibold text-gray-900">
            {diet.start_date
              ? fmtDate(diet.start_date, locale, { dateStyle: "short" })
              : "-"}
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {isCurrent ? "Término" : "Fim"}
          </span>
          <p className="font-semibold text-gray-900">
            {diet.end_date
              ? fmtDate(diet.end_date, locale, { dateStyle: "short" })
              : "-"}
          </p>
        </div>
      </div>

      {diet.results_summary && (
        <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
          <p className="text-sm font-medium text-green-800 line-clamp-2 flex items-center gap-2">
            <span className="text-green-600">📈</span>
            {diet.results_summary}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          className="flex-1 text-sm py-3 rounded-xl font-medium bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 text-white shadow-lg shadow-green-500/25"
          onClick={() => onView(diet.id)}
        >
          Ver Detalhes
        </Button>
        {canEdit && (
          <Button
            variant="secondary"
            className="px-4 py-3 min-w-[52px] rounded-xl border-gray-200 hover:border-gray-300 bg-white/80 backdrop-blur-sm"
            onClick={() => onRevise && onRevise(diet.id)}
            title="Nova Revisão"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-7-4l4-4m0 0l4 4m-4-4v12"
              />
            </svg>
          </Button>
        )}
      </div>
    </Card>
  );
};

// (removido) DietVersionExportControls agora está no componente extraído

// Modern Bottom Navigation
type BottomTabId = "overview" | "dietas" | "consultas" | "perfil" | "suporte";
interface BottomTab {
  id: BottomTabId;
  label: string;
  icon: string;
  navigate?: string;
}
const BottomNav: React.FC<{
  activeTab: BottomTabId;
  onTabChange: (tab: BottomTabId) => void;
}> = ({ activeTab, onTabChange }) => {
  const navigate = useNavigate();
  const tabs: BottomTab[] = [
    { id: "overview", label: "Visão", icon: "📊" },
    { id: "dietas", label: "Dietas", icon: "🍽️" },
    { id: "consultas", label: "Consultas", icon: "📅" },
    { id: "perfil", label: "Perfil", icon: "👤" },
    { id: "suporte", label: "Suporte", icon: "💬" },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-2xl shadow-black/10 z-40 md:hidden">
      <div className="flex justify-around p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() =>
              tab.navigate ? navigate(tab.navigate) : onTabChange(tab.id)
            }
            className={`flex flex-col items-center py-2 px-1 flex-1 min-w-0 rounded-xl transition-all duration-300 ${
              activeTab === tab.id
                ? "text-green-600 bg-green-50/80"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50"
            }`}
          >
            <span className="text-lg mb-1 transition-transform duration-300">
              {tab.icon}
            </span>
            <span className="text-xs font-semibold truncate">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

// Components com Loading States
const WeightSection: React.FC<{
  heightCm?: number;
}> = ({ heightCm }) => {
  // Substituído para novo hook baseado em React Query (cache compartilhado entre páginas)
  const {
    latest: latestWeight,
    diff_kg: weightDiff,
    diff_percent: weightDiffPct,
    setGoal,
    goal,
    series,
    loading,
    error,
  } = useWeightData(30); // antes: useWeightLogs(30)

  const [editingGoal, setEditingGoal] = React.useState(false);
  const [goalInput, setGoalInput] = React.useState<string>(
    goal ? goal.toString() : ""
  );

  useEffect(() => {
    setGoalInput(goal != null ? goal.toString() : "");
  }, [goal]);

  const saveGoal = async () => {
    const v = parseFloat(goalInput.replace(",", "."));
    if (!isFinite(v) || v <= 0) return;
    await setGoal(v);
    setEditingGoal(false);
  };

  // Só calcula IMC se tiver peso E altura válidos
  const bmi =
    latestWeight?.weight_kg && heightCm && heightCm > 50 && heightCm < 250
      ? latestWeight.weight_kg / Math.pow(heightCm / 100, 2)
      : undefined;

  const bmiClass = bmi
    ? bmi < 18.5
      ? "Baixo peso"
      : bmi < 25
      ? "Normal"
      : bmi < 30
      ? "Sobrepeso"
      : bmi < 35
      ? "Obesidade I"
      : bmi < 40
      ? "Obesidade II"
      : "Obesidade III"
    : undefined;

  // Cor da variação baseada no objetivo de peso do usuário
  const objective = React.useMemo(
    () =>
      inferWeightObjective(goal, latestWeight?.weight_kg, WEIGHT_TOLERANCE_KG),
    [goal, latestWeight?.weight_kg]
  );
  const weightDiffClass = React.useMemo(
    () => colorForWeightDiff(objective, weightDiff, WEIGHT_TOLERANCE_KG),
    [objective, weightDiff]
  );

  return (
    <DataSection
      isLoading={loading}
      error={error ? (error as Error) : null}
      skeletonLines={3}
      skeletonClassName="h-32"
    >
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <WeightIcon />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Peso Atual</h3>
              <p className="text-2xl font-bold text-gray-900">
                {latestWeight?.weight_kg
                  ? `${latestWeight.weight_kg.toFixed(1)} kg`
                  : "--"}
              </p>
              {weightDiff != null && (
                <div className={`${weightDiffClass} text-xs`}>
                  {weightDiff >= 0 ? "+" : ""}
                  {weightDiff.toFixed(1)} kg
                  {weightDiffPct != null &&
                    ` (${weightDiffPct >= 0 ? "+" : ""}${weightDiffPct.toFixed(
                      1
                    )}%)`}
                </div>
              )}
              {bmi && bmiClass && (
                <p className="text-sm text-gray-600 mt-1">
                  IMC: {bmi.toFixed(1)} - {bmiClass}
                </p>
              )}
            </div>
          </div>

          <div className="text-right">
            <p className="text-[11px] sm:text-xs text-gray-600">Meta:</p>
            {editingGoal ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="kg"
                  className="w-16 px-2 py-1 text-sm border rounded"
                />
                <button
                  onClick={saveGoal}
                  className="text-green-500 hover:text-green-600 p-1"
                >
                  ✓
                </button>
                <button
                  onClick={() => {
                    setEditingGoal(false);
                    setGoalInput(goal != null ? goal.toString() : "");
                  }}
                  className="text-red-500 hover:text-red-600 p-1"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => setEditingGoal(true)}
                  className="text-blue-500 hover:text-blue-600 p-1"
                >
                  {/* SVG substituindo o ícone ✏️ */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
                    <polyline points="16 17 22 17 22 11" />
                  </svg>
                </button>
                <span className="font-medium text-sm sm:text-base">
                  {goal != null ? `${goal.toFixed(1)} kg` : "Não definida"}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <Sparkline
            data={series.slice(-20)}
            height={50}
            gradient={["#10b981", "#059669"]}
          />
        </div>
      </Card>
    </DataSection>
  );
};

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Handle body scroll lock when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [sidebarOpen]);

  // Hover timers for deep (includeData) diet plan prefetch
  const dietHoverTimers = useRef<Record<string, number>>({});

  // Cleanup any pending timers on unmount
  useEffect(() => {
    return () => {
      Object.values(dietHoverTimers.current).forEach((t) => clearTimeout(t));
      dietHoverTimers.current = {};
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const [activeTab, setActiveTab] = useState<BottomTabId>("overview");

  // Prefetch baseado em visibilidade para dietas (mobile support)
  useIntersectionPrefetch("[data-plan-id]", {
    rootMargin: "200px 0px",
    deepDelayMs: 700,
  });

  // Log métricas de prefetch ao trocar aba em dev
  useEffect(() => {
    if (import.meta.env?.DEV) {
      logPrefetchMetrics();
    }
  }, [activeTab]);

  // Diet Plans integration
  const {
    plans,
    create,
    creating,
    getDetail,
    revise,
    revising,
    error: dietError,
    load: reloadDietPlans,
  } = useDietPlans();

  // Ao entrar na aba "dietas": refetch imediato e polling leve (30s)
  useEffect(() => {
    if (activeTab !== "dietas") return;
    // Refetch imediato
    void reloadDietPlans();
    // Polling leve enquanto a aba estiver ativa
    const id = setInterval(() => {
      void reloadDietPlans();
    }, 30_000);
    return () => clearInterval(id);
  }, [activeTab, reloadDietPlans]);
  const {
    meals,
    water,
    weight: weightAgg,
    adherence,
    loading: dashLoading,
    error: dashError,
  } = useDashboardData();
  const mealProgress = meals.progress;
  const mealGoals = meals.goals;
  // Calorias consumidas hoje (não o percentual)
  const todayStrForMeals = (() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  })();
  type MealDay = { date: string; calories: number };
  const summaryDays = (meals.summary?.days || []) as MealDay[];
  const todayMealsAgg = summaryDays.find((d) => d.date === todayStrForMeals);
  const caloriesToday = todayMealsAgg?.calories ?? 0;
  const waterToday = water.totalToday; // ml consumidos hoje
  const dailyGoalCups = water.dailyGoalCups; // meta em copos (base legado)
  const cupSize = water.cupSize || 250;
  // Meta inteligente de água (clima/histórico/IMC + arredondamento por copo)
  // Usa o mesmo hook da tela de registro para manter consistência
  const { metasFinais: waterIntelGoal } = useWaterLogsInteligente(7);
  const waterTargetMl =
    waterIntelGoal?.metaML ?? (dailyGoalCups ? dailyGoalCups * cupSize : null);
  const latestWeight = weightAgg.latest;
  const goal = weightAgg.goal;
  // progressPercent era usado para trend visual; removido ao padronizar LoadingState

  // Altura para IMC - usar perfil como prioridade, questionário como fallback
  const { questionarioData } = useQuestionario();
  const heightCmRaw = questionarioData?.respostas?.["Altura (cm)"];
  const heightCm =
    user?.height || // Prioridade: perfil do usuário
    (heightCmRaw ? parseFloat(heightCmRaw.replace(",", ".")) : undefined); // Fallback: questionário

  const canEditDiets = false; // Pacientes não editam dietas, apenas admin

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingName, setCreatingName] = useState("");
  const [creatingDesc, setCreatingDesc] = useState("");
  // Campos para criação estruturada
  // Suporte a PDF and Structured Diet Builder
  const [planFormat, setPlanFormat] = useState<"structured" | "pdf">(
    "structured"
  );
  const [pdfBase64, setPdfBase64] = useState<string>("");
  const [pdfName, setPdfName] = useState<string>("");
  const [structuredData, setStructuredData] =
    useState<StructuredDietData | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailJson, setDetailJson] = useState<DietPlanDetail | null>(null);
  const [downloadingMap, setDownloadingMap] = useState<Record<string, boolean>>(
    {}
  );
  const authenticatedFetch = useAuthenticatedFetch();
  // Wrapper compatível com assinatura de fetch(RequestInfo, RequestInit)
  const authFetchCompat: (
    input: RequestInfo,
    init?: RequestInit
  ) => Promise<Response> = (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.toString()
        : (input as Request).url;
    return authenticatedFetch(url, init);
  };

  // Fetch automático via React Query – sem efeito manual.

  const openDetail = async (id: string) => {
    setSelectedPlanId(id);
    setShowDetail(true);
    lockDetail(id);
  };

  const isStructuredDietData = (d: unknown): d is StructuredDietData => {
    if (!d || typeof d !== "object") return false;
    const obj = d as Record<string, unknown>;
    const versao = obj["versao"];
    const meals = obj["meals"];
    return versao === 1 && Array.isArray(meals);
  };

  const handleDownloadLatest = async (planId: string) => {
    console.log("[DietPDF] start handleDownloadLatest", { planId });
    setDownloadingMap((m) => ({ ...m, [planId]: true }));
    try {
      // Garante dados atualizados do plano (includeData=1 já é padrão)
      await qc.invalidateQueries({ queryKey: ["diet-plan-detail", planId] });
      const d = await getDetail(planId);
      if (!d || !d.versions?.length) throw new Error("Plano sem versões");
      const v = d.versions[d.versions.length - 1];

      // Se for estruturada, gerar PDF no cliente com dados dinâmicos
      if (isStructuredDietData(v.data)) {
        try {
          // Coleta dados dinâmicos mínimos (nome do /me)
          // Observação: o questionário já está embutido no snapshot da dieta (v.data.questionnaire)
          // O peso deve ser exatamente o mesmo exibido em "Peso Atual" na UI,
          // então usamos weightAgg.latest?.weight_kg já carregado pelo Dashboard.
          const [meRes] = await Promise.all([
            authenticatedFetch(Routes.ME, { method: "GET" }),
          ]);

          // Extrai snapshot do questionário da própria dieta
          const qSnap = v.data?.questionnaire as
            | {
                category?: string | null;
                answers?: Record<string, unknown>;
                created_at?: string;
                updated_at?: string;
              }
            | undefined;
          const qCategory = (qSnap?.category || "").toString().toLowerCase();
          const qAnswers: Record<string, unknown> =
            (qSnap?.answers as Record<string, unknown>) || {};
          console.log("[DietPDF] questionnaire snapshot", { qCategory, answerKeys: Object.keys(qAnswers || {}) });

          let meObj: Record<string, unknown> = {};
          try {
            const meJson: unknown = await meRes.json();
            const meData =
              typeof meJson === "object" && meJson !== null && "data" in meJson
                ? (meJson as Record<string, unknown>)["data"]
                : meJson;
            meObj =
              typeof meData === "object" && meData !== null
                ? (meData as Record<string, unknown>)
                : {};
          } catch (err) {
            void err;
          }

          const latestWeightKg: number | undefined = weightAgg?.latest?.weight_kg;
          console.log("[DietPDF] latestWeightAgg", weightAgg?.latest);

          const pick = (
            obj: Record<string, unknown>,
            ...keys: string[]
          ): unknown => {
            for (const k of keys) {
              const v = obj[k];
              if (v !== undefined && v !== null && v !== "") return v;
            }
            return undefined;
          };
          const pickString = (
            obj: Record<string, unknown>,
            ...keys: string[]
          ): string | undefined => {
            const v = pick(obj, ...keys);
            return typeof v === "string" && v.trim() !== "" ? v : undefined;
          };
          const getNum = (v: unknown): number | undefined => {
            if (v == null || v === "") return undefined;
            const n =
              typeof v === "number"
                ? v
                : parseFloat(String(v).replace(",", "."));
            return Number.isFinite(n) ? n : undefined;
          };

          // Campos com mapeamento flexível, compatíveis com adulto/infantil
          const hasChildKeys =
            Object.prototype.hasOwnProperty.call(qAnswers, "nome_crianca") ||
            Object.prototype.hasOwnProperty.call(qAnswers, "peso_atual") ||
            Object.prototype.hasOwnProperty.call(qAnswers, "altura");
          const isInfantil =
            qCategory === "infantil" ||
            qCategory === "criança" ||
            qCategory === "crianca" ||
            hasChildKeys;
          console.log("[DietPDF] isInfantil?", { isInfantil, hasChildKeys, qCategory });

          const gender = pickString(
            qAnswers,
            // infantil (prioridade)
            "sexo",
            // adulto (fallbacks)
            "gênero",
            "genero",
            // variações menos prováveis
            "sexo_crianca",
            "sexo_da_crianca"
          );

          const age = getNum(
            pick(
              qAnswers,
              // infantil (prioridade)
              "idade",
              // adulto e variações
              "idade_anos",
              "idade_crianca",
              "idade_da_crianca"
            )
          );

          const height = getNum(
            pick(
              qAnswers,
              // infantil (prioridade)
              "altura",
              // adulto e variações
              "altura_cm",
              "altura_crianca",
              "altura_da_crianca"
            )
          );

          const weight: number | undefined = isInfantil
            ? getNum(
                pick(
                  qAnswers,
                  // infantil (prioridade)
                  "peso_atual"
                )
              )
            : latestWeightKg != null
            ? latestWeightKg
            : getNum(
                pick(
                  qAnswers,
                  // adulto e variações
                  "peso",
                  "peso_kg",
                  "peso_atual",
                  "peso_crianca",
                  "peso_da_crianca"
                )
              );
          console.log("[DietPDF] weight computed", { isInfantil, latestWeightKg, finalWeight: weight });

          const goal =
            pickString(
              qAnswers,
              // chaves padrão adulto/infantil (idênticas no infantil informado)
              "objetivo_nutricional",
              // variações
              "objetivo",
              "objetivo_da_dieta",
              "objetivo_crianca",
              "objetivo_nutricional_crianca"
            ) ?? undefined;

          // Para clientes infantis, tentar extrair nome da criança (fallback ao nome do perfil)
          const childName = isInfantil
            ? pickString(
                qAnswers,
                "nome_crianca",
                "nome da criança",
                "nome_da_crianca",
                "crianca_nome"
              )
            : undefined;

          console.log("[DietPDF] clientInfo preview", {
            age,
            gender,
            height,
            goal,
            weight,
          });
          await exportDietPdf(v.data, {
            filename: `${d.name}_v${v.version_number}.pdf`.replace(
              /[^a-z0-9]/gi,
              "_"
            ),
            title: `${d.name} - v${v.version_number}`,
            showAlternatives: true,
            headerText: "Plano Nutricional Personalizado",
            footerText: "Avante Nutri - Nutrindo hábitos, transformando vidas",
            showPageNumbers: true,
            watermarkText: "Avante Nutri",
            watermarkRepeat: true,
            watermarkOpacity: 0.05,
            cover: {
              title: `${d.name}`,
              subtitle: `Versão ${v.version_number}`,
              showTotals: true,
              notes:
                v.notes ??
                "Seguir o plano alimentar conforme orientado, com boa hidratação e prática regular de exercícios.",
              date: new Date(),
              clientInfo: {
                name:
                  childName ||
                  pickString(meObj, "display_name", "full_name") ||
                  "Paciente",
                age,
                gender,
                weight,
                height,
                goal,
                nutritionist: "Dra. Andreina Cawanne",
                crn: "43669/P",
              },
              showMacronutrientChart: true,
              signature: {
                name: "Avante Nutri",
                role: "Nutricionista",
                license: "CRN-PE 43669",
              },
            },
            company: {
              logoUrl: "/logoName.png",
              logoheader: "/logoHeader.png",
              name: "Avante Nutri",
              contact: "souzacawanne@gmail.com",
              address: "Online",
            },
          });
        } catch (err) {
          console.error(err);
          alert("Falha ao gerar PDF");
        }
        return;
      }

      alert("Formato de dieta não suportado para download");
    } catch (e) {
      console.error(e);
      alert("Não foi possível baixar a dieta");
    } finally {
      setDownloadingMap((m) => ({ ...m, [planId]: false }));
    }
  };

  // Busca detalhes quando a modal abre (ou muda de plano)
  useEffect(() => {
    (async () => {
      if (!showDetail || !selectedPlanId) return;
      // Evitar refetch se dado estiver fresco (<60s)
      const st = qc.getQueryState(["diet-plan-detail", selectedPlanId]);
      const isFresh = !!(
        st?.dataUpdatedAt && Date.now() - st.dataUpdatedAt < 60_000
      );
      if (isFresh && detailJson) return;
      setDetailLoading(true);
      try {
        const d = await getDetail(selectedPlanId);
        if (d) setDetailJson(d as DietPlanDetail);
      } finally {
        setDetailLoading(false);
      }
    })();
  }, [showDetail, selectedPlanId, getDetail, qc, detailJson]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalDesc = creatingDesc;
    if (planFormat === "pdf" && finalDesc && !/^\s*\[PDF\]/i.test(finalDesc)) {
      finalDesc = `[PDF] ${finalDesc}`;
    }
    const id = await create({
      name: creatingName.trim(),
      description: finalDesc.trim() || undefined,
      format: planFormat,
      structured_data:
        planFormat === "structured" ? structuredData || undefined : undefined,
      meta_kcal: undefined,
      meta_protein_g: undefined,
      meta_carbs_g: undefined,
      meta_fat_g: undefined,
      pdf_base64: planFormat === "pdf" ? pdfBase64 || undefined : undefined,
      pdf_filename: planFormat === "pdf" ? pdfName || undefined : undefined,
    } as unknown as Parameters<typeof create>[0]);
    if (id) {
      setShowCreateModal(false);
      setCreatingName("");
      setCreatingDesc("");
      setStructuredData(null);
      setPlanFormat("structured");
      setPdfBase64("");
      setPdfName("");
    }
  };

  const handleRevise = async (planId: string) => {
    setSelectedPlanId(planId);
    void openDetail(planId);
  };

  // Consultas (integração real) – usamos hook existente que já faz fetch + cancel etc.
  const {
    items: consultations,
    loading: consultationsLoading,
    error: consultationsError,
  } = useConsultations();
  const upcomingAppointments = consultations
    .filter(
      (c) => c.status === "scheduled" && new Date(c.scheduled_at) > new Date()
    )
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    .slice(0, 5);

  const { locale, t } = useI18n();

  const quickActions = [
    {
      icon: (
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
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      iconComponent: CalendarIcon,
      label: "Agendar Consulta",
      description: "Marque nova consulta",
      onClick: () => navigate("/agendar-consulta"),
      color: "purple",
    },
    {
      icon: (
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
            d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l-3-3m3 3l3-3"
          />
        </svg>
      ),
      iconComponent: WeightIcon,
      label: "Registrar Peso",
      description: "Atualize seu peso atual",
      onClick: () => navigate("/registro-peso"),
      color: "green",
    },
    {
      icon: (
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
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
      iconComponent: MealIcon,
      label: "Registrar Refeição",
      description: "Adicione o que comeu hoje",
      onClick: () => navigate("/registro-refeicao"),
      color: "blue",
    },
    {
      icon: (
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
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
      ),
      iconComponent: WaterIcon,
      label: "Registrar Água",
      description: "Controle sua hidratação",
      onClick: () => navigate("/registro-agua"),
      color: "cyan",
    },
    {
      icon: (
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
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
      iconComponent: BillingIcon,
      label: "Extrato",
      description: "Histórico de pagamentos",
      onClick: () => navigate("/billing/historico"),
      color: "amber",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30 flex">
      <SEO
        title={t("dashboard.seo.title")}
        description={t("dashboard.seo.desc")}
      />

      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modern Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50 w-80 bg-white/90 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ease-in-out border-r border-gray-200/60 flex flex-col
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        <div className="flex flex-col min-h-0 h-full">
          {/* Logo */}
          <div className="flex-shrink-0 p-6 border-b border-gray-200/60">
            <div className="flex items-center">
              <div className="flex items-center pr-4 border-r border-gray-300/60">
                <LogoCroped />
              </div>
              <div className="pl-4">
                <p className="text-xs text-gray-500 mt-1">Área do Paciente</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-gray-200/60">
            <div className="flex items-center">
              <img
                src={
                  user?.photoUrl ||
                  `https://ui-avatars.com/api/?name=${
                    user?.full_name || "User"
                  }&background=22c55e&color=fff`
                }
                alt={user?.full_name}
                className="h-14 w-14 rounded-full border-2 border-green-200 shadow-lg"
              />
              <div className="ml-4 min-w-0 flex-1">
                <h3 className="font-bold text-gray-900 text-base truncate">
                  {user?.display_name || user?.full_name || "Usuário"}
                </h3>
                <p className="text-green-600 font-semibold text-xs truncate flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Ativo
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            {[
              { id: "overview", label: "Visão Geral", icon: "📊" },
              { id: "perfil", label: "Meu Perfil", icon: "👤" },
              { id: "consultas", label: "Consultas", icon: "📅" },
              { id: "dietas", label: "Minhas Dietas", icon: "🍽️" },
              {
                id: "exercicios",
                label: "Exercícios",
                icon: "💪",
                navigate: "/exercicios",
              },
              { id: "questionario", label: "Questionário", icon: "📝" },
              {
                id: "notificacoes",
                label: "Notificações",
                icon: "🔔",
                navigate: "/notificacoes",
              },
              { id: "suporte", label: "Suporte", icon: "💬" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.navigate) {
                    navigate(item.navigate);
                  } else if (item.id === "questionario") {
                    navigate("/questionario");
                  } else {
                    setActiveTab(item.id as BottomTabId);
                  }
                  setSidebarOpen(false);
                }}
                onMouseEnter={() => {
                  const ctx = { qc, fetcher: authFetchCompat } as const;
                  if (item.id === "overview") Prefetch.overview(ctx);
                  else if (item.id === "exercicios") Prefetch.exercicios(ctx);
                  else if (item.id === "dietas") Prefetch.dietas(ctx);
                  else if (item.id === "notificacoes")
                    Prefetch.notificacoes(ctx);
                }}
                className={`w-full flex items-center px-4 py-3.5 rounded-2xl mb-2 transition-all duration-300 ${
                  activeTab === item.id
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25"
                    : "text-gray-700 hover:bg-gray-50/80 hover:text-gray-900"
                }`}
              >
                <span className="text-xl mr-3">{item.icon}</span>
                <span className="font-semibold text-sm">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200/60 mt-auto">
            <Button
              variant="secondary"
              className="w-full flex justify-center text-center py-3.5 text-sm rounded-2xl border-gray-200 hover:border-gray-300 bg-white/80 backdrop-blur-sm font-semibold"
              onClick={handleLogout}
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pb-24 md:pb-0">
        {/* Modern Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-30">
          <div className="px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  className="md:hidden p-2.5 mr-3 rounded-2xl hover:bg-gray-100/80 touch-manipulation transition-colors"
                  onClick={() => setSidebarOpen(true)}
                >
                  <svg
                    className="w-6 h-6 text-gray-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-gray-900 truncate capitalize">
                    {activeTab === "overview" && "Visão Geral"}
                    {activeTab === "dietas" && "Minhas Dietas"}
                    {activeTab === "consultas" && "Minhas Consultas"}
                    {activeTab === "perfil" && "Meu Perfil"}
                    {activeTab === "suporte" && "Suporte"}
                  </h1>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <NotificationBellReal />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-5">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Questionnaire Banner */}
              <QuestionnaireBanner />

              {/* Quick Actions */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4 px-1">
                  <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-3">
                    <div className="p-1.5 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
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
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    Ações Rápidas
                  </h2>
                </div>

                {/* Layout horizontal scroll para mobile */}
                <div className="md:hidden">
                  <div className="flex space-x-4 pb-4 overflow-x-auto scrollbar-hide -mx-1 px-1">
                    {quickActions.map((action, index) => (
                      <div
                        key={index}
                        onClick={action.onClick}
                        onMouseEnter={() =>
                          Prefetch.quickAction(
                            { qc, fetcher: fetch },
                            action.label
                          )
                        }
                        className="flex-none w-40 touch-manipulation active:scale-95 transition-transform"
                      >
                        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col group">
                          <div
                            className={`p-3 rounded-xl border-2 w-12 h-12 flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110 ${
                              action.color === "blue"
                                ? "bg-blue-50 border-blue-200 text-blue-600 group-hover:bg-blue-100"
                                : action.color === "green"
                                ? "bg-green-50 border-green-200 text-green-600 group-hover:bg-green-100"
                                : action.color === "cyan"
                                ? "bg-cyan-50 border-cyan-200 text-cyan-600 group-hover:bg-cyan-100"
                                : action.color === "purple"
                                ? "bg-purple-50 border-purple-200 text-purple-600 group-hover:bg-purple-100"
                                : action.color === "amber"
                                ? "bg-amber-50 border-amber-200 text-amber-600 group-hover:bg-amber-100"
                                : "bg-amber-50 border-amber-200 text-amber-600 group-hover:bg-amber-100"
                            }`}
                          >
                            {action.iconComponent ? (
                              <action.iconComponent className="w-6 h-6" />
                            ) : (
                              <span className="text-xl">{action.icon}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">
                              {action.label}
                            </h4>
                            <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                              {action.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Layout grid para desktop */}
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {quickActions.map((action, index) => (
                    <div
                      key={index}
                      onClick={action.onClick}
                      onMouseEnter={() =>
                        Prefetch.quickAction(
                          { qc, fetcher: authFetchCompat },
                          action.label
                        )
                      }
                      className="touch-manipulation active:scale-95 transition-transform"
                    >
                      <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col group">
                        <div className="flex items-start justify-between mb-4">
                          <div
                            className={`p-3 rounded-xl border-2 transition-all duration-300 group-hover:scale-110 ${
                              action.color === "blue"
                                ? "bg-blue-50 border-blue-200 text-blue-600 group-hover:bg-blue-100"
                                : action.color === "green"
                                ? "bg-green-50 border-green-200 text-green-600 group-hover:bg-green-100"
                                : action.color === "cyan"
                                ? "bg-cyan-50 border-cyan-200 text-cyan-600 group-hover:bg-cyan-100"
                                : action.color === "purple"
                                ? "bg-purple-50 border-purple-200 text-purple-600 group-hover:bg-purple-100"
                                : action.color === "amber"
                                ? "bg-amber-50 border-amber-200 text-amber-600 group-hover:bg-amber-100"
                                : "bg-amber-50 border-amber-200 text-amber-600 group-hover:bg-amber-100"
                            }`}
                          >
                            {action.iconComponent ? (
                              <action.iconComponent className="w-6 h-6" />
                            ) : (
                              <span className="text-xl">{action.icon}</span>
                            )}
                          </div>
                          <div
                            className={`w-2 h-2 rounded-full animate-pulse ${
                              action.color === "blue"
                                ? "bg-blue-400"
                                : action.color === "green"
                                ? "bg-green-400"
                                : action.color === "cyan"
                                ? "bg-cyan-400"
                                : action.color === "purple"
                                ? "bg-purple-400"
                                : action.color === "amber"
                                ? "bg-amber-400"
                                : "bg-amber-400"
                            }`}
                          ></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-base leading-tight mb-2">
                            {action.label}
                          </h4>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {action.description}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <button className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-800 transition-colors">
                            Acessar
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Métricas Principais */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <ErrorBoundary>
                  <WeightSection heightCm={heightCm} />
                </ErrorBoundary>
                <DataSection
                  isLoading={shouldShowSkeleton(
                    dashLoading,
                    waterToday,
                    dailyGoalCups
                  )}
                  error={dashError ? (dashError as Error) : null}
                  skeletonLines={3}
                  skeletonClassName="h-32"
                >
                  {(() => {
                    const parts: string[] = [];
                    if (water.avgPerDay) {
                      parts.push(
                        `Média: ${Math.round(water.avgPerDay)} ml/dia`
                      );
                    }
                    if (water.bestDay) {
                      parts.push(
                        `Melhor: ${Math.round(water.bestDay.amount)} ml`
                      );
                    }
                    return (
                      <ErrorBoundary>
                        <StatsCard
                          title="Hidratação"
                          valuePrimary={
                            <>
                              {waterToday}{" "}
                              <span className="text-base font-semibold text-blue-600">
                                ml
                              </span>
                            </>
                          }
                          description={
                            parts.length ? parts.join(" • ") : "Sem meta"
                          }
                          icon="water"
                          gradient="to-blue-400 from-emerald-300"
                        />
                      </ErrorBoundary>
                    );
                  })()}
                </DataSection>
                <DataSection
                  isLoading={shouldShowSkeleton(dashLoading, adherence)}
                  error={dashError ? (dashError as Error) : null}
                  skeletonLines={3}
                  skeletonClassName="h-32"
                >
                  <ErrorBoundary>
                    <StatsCard
                      title="Adesão à Dieta"
                      value={adherence ? `${adherence.percentage}%` : "-"}
                      description={
                        adherence ? (
                          <span className="inline-flex items-center gap-1">
                            {adherence.daysCovered}/{adherence.totalDays} dias
                            com registros
                            <Tooltip
                              content={
                                <div className="text-left leading-snug">
                                  <div className="font-semibold mb-1">
                                    Fórmula
                                  </div>
                                  <div>
                                    60% Refeições (cobertura + consistência)
                                  </div>
                                  <div>+ 25% Hidratação (meta de água)</div>
                                  <div>+ 15% Engajamento (pesagens)</div>
                                  {adherence?.components && (
                                    <div className="mt-2 text-[10px] text-gray-300 space-y-1">
                                      <div>
                                        Refeições: {adherence.components.meals}%
                                      </div>
                                      <div>
                                        Hidratação: {adherence.components.water}
                                        %
                                      </div>
                                      <div>
                                        Engajamento:{" "}
                                        {adherence.components.consistency}%
                                      </div>
                                    </div>
                                  )}
                                </div>
                              }
                            >
                              <span
                                role="img"
                                aria-label="Fórmula de cálculo"
                                className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold border border-purple-200 cursor-help hover:bg-purple-200"
                              >
                                ?
                              </span>
                            </Tooltip>
                          </span>
                        ) : (
                          "Registre suas refeições"
                        )
                      }
                      icon="stats"
                      gradient="from-purple-300 to-indigo-600"
                    />
                  </ErrorBoundary>
                </DataSection>
              </div>

              {/* Progress and Diet Plans */}
              <div className="grid gap-6 lg:grid-cols-2">
                <DataSection
                  isLoading={shouldShowSkeleton(
                    dashLoading,
                    latestWeight,
                    mealProgress,
                    waterToday
                  )}
                  error={dashError ? (dashError as Error) : null}
                  skeletonLines={6}
                  skeletonClassName="h-64"
                >
                  <Card className="p-5 bg-gradient-to-br from-white to-gray-50/50 border-0 rounded-2xl">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span>🎯</span>
                      Progresso dos Objetivos
                    </h3>
                    <div className="space-y-4">
                      <Progress
                        current={latestWeight?.weight_kg || 0}
                        target={goal || 70}
                        label="Meta de Peso"
                        unit="kg"
                        size="sm"
                        gradient="from-green-500 to-emerald-600"
                      />
                      <Progress
                        current={caloriesToday}
                        target={mealGoals?.calories || 2000}
                        label="Meta de Calorias"
                        unit="kcal"
                        size="sm"
                        gradient="from-amber-500 to-orange-600"
                      />
                      <Progress
                        current={waterToday}
                        target={waterTargetMl || 2000}
                        label="Hidratação"
                        unit="ml"
                        size="sm"
                        gradient="from-blue-500 to-cyan-600"
                      />
                      <Progress
                        current={adherence?.percentage || 0}
                        target={100}
                        label="Adesão à Dieta"
                        unit="%"
                        size="sm"
                        gradient="from-purple-500 to-indigo-600"
                      />
                    </div>
                  </Card>
                </DataSection>

                <Card className="p-5 bg-gradient-to-br from-white to-gray-50/50 border-0 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <span>🍽️</span>
                      Dietas Recentes
                    </h3>
                    <Button
                      variant="secondary"
                      onClick={() => setActiveTab("dietas")}
                      className="text-sm py-2 px-4 rounded-xl border-gray-200 hover:border-gray-300 bg-white/80 backdrop-blur-sm font-semibold"
                    >
                      Ver Todas
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {plans.slice(0, 2).map((p) => (
                      <div
                        key={p.id}
                        data-plan-id={p.id}
                        onMouseEnter={() => {
                          const ctx = { qc, fetcher: fetch } as const;
                          // Sempre prefetch com includeData=1
                          Prefetch.dietPlanDetail(ctx, p.id);
                        }}
                        onMouseLeave={() => {
                          if (dietHoverTimers.current[p.id]) {
                            clearTimeout(dietHoverTimers.current[p.id]);
                            delete dietHoverTimers.current[p.id];
                          }
                        }}
                      >
                        <DietPlanCard
                          diet={{ ...p, isCurrent: p.status === "active" }}
                          onView={openDetail}
                          onRevise={handleRevise}
                          canEdit={canEditDiets}
                          locale={locale}
                          onDownloadLatest={handleDownloadLatest}
                          downloading={!!downloadingMap[p.id]}
                        />
                      </div>
                    ))}
                    {plans.length === 0 && (
                      <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl">
                        <div className="text-4xl mb-3">🍽️</div>
                        <p className="text-gray-600 font-medium">
                          Nenhuma dieta ainda. Agende uma consulta!
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Próximas Consultas (dados reais) */}
              <Card className="p-5 bg-gradient-to-br from-white to-gray-50/50 border-0 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span>📅</span>
                    Próximas Consultas
                  </h3>
                  <button
                    onClick={() =>
                      navigate("/consultas") || setActiveTab("consultas")
                    }
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Ver todas
                  </button>
                </div>
                {consultationsLoading && (
                  <div className="text-sm text-gray-500 py-6 text-center">
                    Carregando...
                  </div>
                )}
                {consultationsError && !consultationsLoading && (
                  <div className="text-sm text-red-600 py-4 text-center bg-red-50 rounded-lg border border-red-200">
                    Erro ao carregar consultas
                  </div>
                )}
                {!consultationsLoading &&
                  !consultationsError &&
                  upcomingAppointments.length === 0 && (
                    <div className="py-8 text-center bg-white/60 rounded-xl border border-dashed border-gray-300">
                      <p className="text-sm text-gray-600 font-medium">
                        Nenhuma consulta futura
                      </p>
                      <button
                        onClick={() => navigate("/agendar-consulta")}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700"
                      >
                        Agendar agora
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                <div className="space-y-3">
                  {upcomingAppointments.map((app) => {
                    const d = new Date(app.scheduled_at);
                    const dateStr = d.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    });
                    const timeStr = d.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const statusClass =
                      app.status === "scheduled"
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : app.status === "completed"
                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200";
                    return (
                      <div
                        key={app.id}
                        className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 hover:border-green-200 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate capitalize">
                            {app.type}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {dateStr} às {timeStr}
                          </p>
                        </div>
                        <span
                          className={`ml-3 px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap ${statusClass}`}
                        >
                          {app.status === "scheduled" ? "agendada" : app.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {activeTab === "dietas" && (
            <div className="space-y-5">
              {dietError && (
                <div className="text-sm text-red-600 p-3 bg-red-50 rounded-lg">
                  {dietError}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mt-4">
                {creating &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonCard key={i} lines={4} className="h-48" />
                  ))}
                {!creating &&
                  plans.map((diet) => (
                    <div
                      key={diet.id}
                      data-plan-id={diet.id}
                      onMouseEnter={() => {
                        const ctx = { qc, fetcher: authFetchCompat } as const;
                        Prefetch.dietPlanDetail(ctx, diet.id);
                      }}
                      onMouseLeave={() => {
                        if (dietHoverTimers.current[diet.id]) {
                          clearTimeout(dietHoverTimers.current[diet.id]);
                          delete dietHoverTimers.current[diet.id];
                        }
                      }}
                    >
                      <DietPlanCard
                        diet={{ ...diet, isCurrent: diet.status === "active" }}
                        onView={openDetail}
                        onRevise={handleRevise}
                        canEdit={canEditDiets}
                        locale={locale}
                        onDownloadLatest={handleDownloadLatest}
                        downloading={!!downloadingMap[diet.id]}
                      />
                    </div>
                  ))}
                {!creating && plans.length === 0 && (
                  <div className="col-span-full text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                    Nenhum plano de dieta ainda. Agende uma consulta para
                    receber sua primeira dieta!
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "consultas" && <Consultas />}
          {activeTab === "perfil" && <Perfil />}
          {activeTab === "suporte" && <Suporte />}
        </div>

        {/* Bottom Navigation for Mobile */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Create Diet Modal - apenas para admin */}
        {canEditDiets && showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-5 space-y-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold">Criar Nova Dieta</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome</label>
                  <input
                    value={creatingName}
                    onChange={(e) => setCreatingName(e.target.value)}
                    required
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={creatingDesc}
                    onChange={(e) => setCreatingDesc(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm h-24 resize-none"
                  />
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="planFormat"
                      value="structured"
                      checked={planFormat === "structured"}
                      onChange={() => setPlanFormat("structured")}
                    />{" "}
                    Estruturado
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="planFormat"
                      value="pdf"
                      checked={planFormat === "pdf"}
                      onChange={() => setPlanFormat("pdf")}
                    />{" "}
                    PDF
                  </label>
                </div>

                {planFormat === "pdf" && (
                  <div className="space-y-2 text-sm">
                    <label className="block text-sm font-medium mb-1">
                      Arquivo PDF
                    </label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) {
                          setPdfBase64("");
                          setPdfName("");
                          return;
                        }
                        if (f.size > 5 * 1024 * 1024) {
                          alert("Limite de 5MB");
                          return;
                        }
                        setPdfName(f.name);
                        const reader = new FileReader();
                        reader.onload = () => {
                          const res = reader.result as string;
                          const base64 = res.split(",")[1] || "";
                          setPdfBase64(base64);
                        };
                        reader.readAsDataURL(f);
                      }}
                    />
                    {pdfName && (
                      <p className="text-xs text-gray-600">
                        Selecionado: {pdfName}
                      </p>
                    )}
                  </div>
                )}

                {planFormat === "structured" && (
                  <div className="mt-2 border rounded p-2 bg-white/60">
                    <h5 className="text-xs font-semibold mb-2">
                      Montar Dieta Estruturada
                    </h5>
                    <p className="text-[11px] text-gray-600 mb-2">
                      Adicione alimentos por refeição. Totais são calculados
                      automaticamente.
                    </p>
                    <StructuredDietBuilder
                      value={structuredData}
                      onChange={setStructuredData}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowCreateModal(false)}
                    className="text-sm"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={creating} className="text-sm">
                    {creating ? "Criando..." : "Criar"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetail && selectedPlanId && (
          <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/50 p-3 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-2 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-4">
                <h2 className="text-lg font-semibold">Plano de Dieta</h2>
                <button
                  onClick={() => {
                    if (selectedPlanId) unlockDetail(selectedPlanId);
                    setShowDetail(false);
                    setSelectedPlanId(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  ✕
                </button>
              </div>
              {/* Controles removidos: sempre buscamos com includeData=1 */}
              {detailLoading && (
                <div className="text-sm text-gray-500 text-center py-4">
                  Carregando detalhes...
                </div>
              )}
              {!detailLoading && selectedPlanId && (
                <DietPlanDetailContent
                  detailJson={detailJson}
                  canEdit={canEditDiets}
                  onRevise={async (notes) => {
                    try {
                      await revise({ planId: selectedPlanId, notes });
                      await openDetail(selectedPlanId);
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  revising={revising === selectedPlanId}
                  locale={locale}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
