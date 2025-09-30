import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import StatsCard from "../../components/StatsCard";
import NotificationBell from "../../components/NotificationBell";
import Progress from "../../components/ui/Progress";
import LogoCroped from "../../components/ui/LogoCroped";
import { SEO } from "../../components/comum/SEO";
import Perfil from "../../components/dashboard/Perfil";
import Consultas from "../../components/dashboard/Consultas";
import Suporte from "../../components/dashboard/Suporte";
import { useDietPlans } from "../../hooks/useDietPlans";
import { usePermissions } from "../../hooks/usePermissions";
import { CAPABILITIES } from "../../types/capabilities";
import CapabilitySection from "../../components/auth/CapabilitySection";
import PermissionGate from "../../components/auth/PermissionGate";
import { useWeightLogs } from "../../hooks/useWeightLogs";
import Sparkline from "../../components/ui/Sparkline";
import { useI18n, formatDate as fmtDate } from "../../i18n";
import { useQuestionario } from "../../contexts/useQuestionario";
import { MealIcon, WeightIcon, WaterIcon, CalendarIcon, BillingIcon } from "../../components/dashboard/icon";

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
  locale: string;
}> = ({ diet, onView, onRevise, canEdit, locale }) => {
  const isCurrent = diet.status === "active";
  
  // Detectar formato da dieta
  const formatLabel = diet.format ? 
    (diet.format === 'pdf' ? 'PDF' : 
     diet.format === 'structured' ? 'Estruturado' : diet.format) : 
    (() => {
      if (/^\s*\[PDF\]/i.test(diet.description || '')) return 'PDF';
      if (/^\s*\[(STR|STRUCT)\]/i.test(diet.description || '')) return 'Estruturado';
      return null;
    })();

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
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {diet.description || "Sem descrição"}
          </p>
        </div>
      </div>

      {/* Badge de formato */}
      {formatLabel && (
        <div className="mb-3 -mt-1">
          <span className="inline-block text-[10px] tracking-wide font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
            {formatLabel}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="space-y-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Início
          </span>
          <p className="font-semibold text-gray-900">
            {diet.start_date
              ? fmtDate(diet.start_date, locale as any, { dateStyle: "short" })
              : "-"}
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {isCurrent ? "Término" : "Fim"}
          </span>
          <p className="font-semibold text-gray-900">
            {diet.end_date
              ? fmtDate(diet.end_date, locale as any, { dateStyle: "short" })
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

// Modern Bottom Navigation
const BottomNav: React.FC<{
  activeTab: string;
  onTabChange: (tab: any) => void;
}> = ({ activeTab, onTabChange }) => {
  const tabs = [
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
            onClick={() => onTabChange(tab.id)}
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

// Modern Weight Goal Component com IMC
const WeightGoal: React.FC<{
  latestWeight: number | null | undefined;
  weightDiff: number | null;
  weightDiffPct: number | null;
  goal: number | null;
  editingGoal: boolean;
  goalInput: string;
  setEditingGoal: (editing: boolean) => void;
  setGoalInput: (goal: string) => void;
  saveGoal: () => void;
  series: any[];
  gradient?: string;
  bmi?: number;
  bmiClass?: string;
}> = ({
  latestWeight,
  weightDiff,
  weightDiffPct,
  goal,
  editingGoal,
  goalInput,
  setEditingGoal,
  setGoalInput,
  saveGoal,
  series,
  gradient,
  bmi,
  bmiClass,
}) => {
  return (
    <Card className="p-5 bg-gradient-to-br from-white to-gray-50/50 border-0 rounded-2xl">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div
              className={`p-4 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
            >
              <span className="text-xl">
                <WeightIcon className="w-8 h-8" />
              </span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">
                Peso Atual
              </h4>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {latestWeight ? `${latestWeight.toFixed(1)} kg` : "-"}
              </div>
            </div>
          </div>

          {weightDiffPct != null && (
            <div
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                weightDiffPct < 0
                  ? "bg-green-100 text-green-800"
                  : weightDiffPct > 0
                  ? "bg-amber-100 text-amber-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {weightDiffPct < 0 ? "↘️" : weightDiffPct > 0 ? "↗️" : "➡️"}Δ{" "}
              {weightDiff?.toFixed(1)} kg ({weightDiffPct.toFixed(1)}%)
            </div>
          )}

          {/* Informações de IMC */}
          {bmi && (
            <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    IMC: {bmi.toFixed(1)}
                  </p>
                  {bmiClass && (
                    <p className="text-xs text-blue-600 mt-1">
                      Classificação: {bmiClass}
                    </p>
                  )}
                </div>
                <div className="text-blue-600 text-lg">⚖️</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {!editingGoal ? (
            <button
              onClick={() => setEditingGoal(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition-colors"
            >
              Meta: {goal != null ? `${goal.toFixed(1)} kg` : "🎯 Definir"}
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-2">
              <input
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="w-16 border-0 bg-transparent px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                type="number"
                step="0.1"
                placeholder="Meta"
              />
              <button
                onClick={saveGoal}
                className="text-green-600 hover:text-green-700 p-1"
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
  );
};

const DashboardPage: React.FC = () => {
  const { user = { full_name: "", email: "", photoUrl: "", display_name: ""}, logout } =
    useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const [activeTab, setActiveTab] = useState<
    "overview" | "dietas" | "perfil" | "suporte" | "consultas"
  >("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Notifications data
  const notifications = [
    {
      id: "1",
      title: "Nova Dieta Disponível",
      message: "Sua dieta foi atualizada com base na última consulta",
      time: "Há 1 hora",
      read: false,
      type: "diet",
    },
    {
      id: "2",
      title: "Lembrete de Consulta",
      message: "Você tem uma consulta marcada para amanhã às 14h",
      time: "Há 2 horas",
      read: true,
      type: "appointment",
    },
  ];

  // Diet Plans integration
  const {
    plans,
    load,
    create,
    creating,
    getDetail,
    revise,
    revising,
    error: dietError,
  } = useDietPlans();
  const { can, usage } = usePermissions();
  const {
    latest: latestWeight,
    diff_kg: weightDiff,
    diff_percent: weightDiffPct,
    setGoal,
    goal,
    series,
  } = useWeightLogs(30);
  
  // Questionário para altura e IMC
  const { questionarioData } = useQuestionario();
  const heightCmRaw = questionarioData?.respostas?.['Altura (cm)'];
  const heightCm = heightCmRaw ? parseFloat(heightCmRaw.replace(',','.')) : undefined;
  const bmi = (latestWeight && heightCm && heightCm > 0) ? latestWeight.weight_kg / Math.pow(heightCm/100, 2) : undefined;
  const bmiClass = bmi ? (
    bmi < 18.5 ? 'Baixo peso' :
    bmi < 25 ? 'Normal' :
    bmi < 30 ? 'Sobrepeso' :
    bmi < 35 ? 'Obesidade I' :
    bmi < 40 ? 'Obesidade II' : 'Obesidade III'
  ) : undefined;

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

  const canViewDiets = can(CAPABILITIES.DIETA_VIEW);
  const canEditDiets = false; // Pacientes não editam dietas, apenas admin

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingName, setCreatingName] = useState("");
  const [creatingDesc, setCreatingDesc] = useState("");
  // Campos para criação estruturada
  const [metaKcal, setMetaKcal] = useState("");
  const [metaProt, setMetaProt] = useState("");
  const [metaCarb, setMetaCarb] = useState("");
  const [metaFat, setMetaFat] = useState("");
  // Suporte a PDF
  const [planFormat, setPlanFormat] = useState<'structured'|'pdf'>('structured');
  const [pdfBase64, setPdfBase64] = useState<string>('');
  const [pdfName, setPdfName] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [includeData, setIncludeData] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailJson, setDetailJson] = useState<any>(null);

  useEffect(() => {
    if (canViewDiets) {
      void load();
    }
  }, [canViewDiets, load]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Atualiza a cada minuto

    return () => clearInterval(timer);
  }, []);

  const openDetail = async (id: string) => {
    setSelectedPlanId(id);
    setShowDetail(true);
    setDetailLoading(true);
    const d = await getDetail(id, includeData);
    if (d && includeData) {
      setDetailJson(d);
    }
    setDetailLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    let data: any = undefined;
    if (planFormat === 'pdf') {
      if (pdfBase64) {
        data = {
          format: 'pdf',
          file: {
            name: pdfName,
            mime: 'application/pdf',
            base64: pdfBase64,
          },
          observacoes: creatingDesc || null,
        };
      }
    } else {
      if (metaKcal || metaProt || metaCarb || metaFat) {
        data = {
          metas: {
            kcal_dia: metaKcal ? +metaKcal : null,
            proteina_g: metaProt ? +metaProt : null,
            carbo_g: metaCarb ? +metaCarb : null,
            gordura_g: metaFat ? +metaFat : null,
          },
          refeicoes: [],
          observacoes: creatingDesc || null,
          format: 'structured'
        };
      }
    }
    let finalDesc = creatingDesc;
    if (planFormat === 'pdf' && finalDesc && !/^\s*\[PDF\]/i.test(finalDesc)) {
      finalDesc = `[PDF] ${finalDesc}`;
    }
    const id = await create({ name: creatingName, description: finalDesc, data });
    if (id) {
      setShowCreateModal(false);
      setCreatingName(""); setCreatingDesc("");
      setMetaKcal(""); setMetaProt(""); setMetaCarb(""); setMetaFat("");
      setPlanFormat('structured');
      setPdfBase64(''); setPdfName('');
    }
  };

  const handleRevise = async (planId: string) => {
    setSelectedPlanId(planId);
    void openDetail(planId);
  };

  const upcomingAppointments = [
    {
      id: "1",
      date: "15/09/2025",
      time: "14:00",
      type: "Consulta de Acompanhamento",
      status: "confirmada",
    },
    {
      id: "2",
      date: "01/10/2025",
      time: "10:30",
      type: "Reavaliação Completa",
      status: "agendada",
    },
  ];

  const handleNotificationClick = (id: string) => {
    console.log(`Notification ${id} clicked`);
  };

  const { locale, t } = useI18n();
  
  const quickActions = [
    {
      icon: "📅",
      iconComponent: CalendarIcon,
      label: "Agendar Consulta",
      description: "Marque nova consulta",
      onClick: () => navigate("/agendar-consulta"),
      color: "purple",
    },
    {
      icon: "⚖️",
      iconComponent: WeightIcon,
      label: "Registrar Peso",
      description: "Atualize seu peso atual",
      onClick: () => navigate("/registro-peso"),
      color: "green",
    },
    {
      icon: "📋",
      iconComponent: MealIcon,
      label: "Registrar Refeição",
      description: "Adicione o que comeu hoje",
      onClick: () => navigate("/registro-refeicao"),
      color: "blue",
    },
    {
      icon: "💧",
      iconComponent: WaterIcon,
      label: "Registrar Água",
      description: "Controle sua hidratação",
      onClick: () => navigate("/registro-agua"),
      color: "cyan",
    },
    {
      icon: "💳",
      iconComponent: BillingIcon,
      label: "Billing / Plano",
      description: "Histórico de pagamentos",
      onClick: () => navigate('/billing/historico'),
      color: "amber",
    },
  ];

  const formatDate = (date: Date): string => fmtDate(date, locale, { dateStyle: 'full' });

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
          fixed md:static inset-y-0 left-0 z-50 w-80 bg-white/90 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ease-in-out border-r border-gray-200/60
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200/60">
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
                  {user?.display_name}
                </h3>
                <p className="text-green-600 font-semibold text-sm truncate flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Plano Ativo
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            {[
              { id: "overview", label: "Visão Geral", icon: "📊" },
              { id: "dietas", label: "Minhas Dietas", icon: "🍽️" },
              { id: "consultas", label: "Consultas", icon: "📅" },
              { id: "perfil", label: "Meu Perfil", icon: "👤" },
              { id: "suporte", label: "Suporte", icon: "💬" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setSidebarOpen(false);
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
          <div className="p-4 border-t border-gray-200/60">
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
                  <p className="text-gray-600 text-xs sm:text-sm">
                    {formatDate(currentTime)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <NotificationBell
                  notifications={notifications}
                  onNotificationClick={handleNotificationClick}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-5">
          {activeTab === "overview" && (
            <div className="space-y-6">
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
                              <span className="text-lg">{action.icon}</span>
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

              {/* Stats */}
              <div className="grid gap-5 md:grid-cols-3">
                <WeightGoal
                  latestWeight={latestWeight?.weight_kg}
                  weightDiff={weightDiff}
                  weightDiffPct={weightDiffPct}
                  goal={goal}
                  editingGoal={editingGoal}
                  goalInput={goalInput}
                  setEditingGoal={setEditingGoal}
                  setGoalInput={setGoalInput}
                  saveGoal={saveGoal}
                  series={series}
                  gradient="from-green-300 to-emerald-600"
                  bmi={bmi}
                  bmiClass={bmiClass}
                />

                <StatsCard
                  title="Água Hoje"
                  value={
                    usage?.WATER_ML_DIA
                      ? `${(usage.WATER_ML_DIA.used / 1000).toFixed(1)} L`
                      : "-"
                  }
                  description={usage?.WATER_ML_DIA?.limit ? `Limite ${(usage.WATER_ML_DIA.limit/1000).toFixed(1)} L` : ''}
                  icon="water"
                  gradient="from-blue-300 to-cyan-600 "
                />

                <StatsCard
                  title="Revisões (mês)"
                  value={(usage?.DIETA_REVISOES_MES?.used ?? 0).toString()}
                  description={usage?.DIETA_REVISOES_MES?.limit != null ? `Limite: ${usage.DIETA_REVISOES_MES.limit}` : ''}
                  icon="stats"
                  gradient="from-purple-300 to-indigo-600"
                />
              </div>

              {/* Progress and Diet Plans */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="p-5 bg-gradient-to-br from-white to-gray-50/50 border-0 rounded-2xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>🎯</span>
                    Progresso dos Objetivos
                  </h3>
                  <div className="space-y-4">
                    <Progress
                      current={72.5}
                      target={70}
                      label="Meta de Peso"
                      unit="kg"
                      size="sm"
                      gradient="from-green-500 to-emerald-600"
                    />
                    <Progress
                      current={1850}
                      target={2000}
                      label="Meta de Calorias"
                      unit="kcal"
                      size="sm"
                      gradient="from-amber-500 to-orange-600"
                    />
                    <Progress
                      current={7}
                      target={8}
                      label="Copos de Água"
                      unit=""
                      size="sm"
                      gradient="from-blue-500 to-cyan-600"
                    />
                    <Progress
                      current={85}
                      target={100}
                      label="Adesão à Dieta"
                      unit="%"
                      size="sm"
                      gradient="from-purple-500 to-indigo-600"
                    />
                  </div>
                </Card>

                <CapabilitySection
                  title="Dietas Recentes"
                  anyOf={[CAPABILITIES.DIETA_VIEW]}
                  toolbar={canViewDiets ? (
                    <Button
                      variant="secondary"
                      onClick={() => setActiveTab("dietas")}
                      className="text-sm py-2 px-4 rounded-xl border-gray-200 hover:border-gray-300 bg-white/80 backdrop-blur-sm font-semibold"
                    >
                      Ver Todas
                    </Button>
                  ) : null}
                  loadingFallback={<div className="text-xs text-gray-400">Carregando permissões...</div>}
                  reloadingFallback={<div className="text-xs text-gray-400">Atualizando...</div>}
                  fallback={<div className="text-center py-8 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl">
                    <div className="text-4xl mb-3">🔒</div>
                    <p className="text-gray-600 font-medium">
                      Seu plano não permite visualizar dietas.
                    </p>
                  </div>}
                >
                  <div className="space-y-4">
                    {canViewDiets &&
                      plans
                        .slice(0, 3)
                        .map((p) => (
                          <DietPlanCard
                            key={p.id}
                            diet={{ ...p, isCurrent: p.status === "active" }}
                            onView={openDetail}
                            onRevise={handleRevise}
                            canEdit={canEditDiets}
                            locale={locale}
                          />
                        ))}
                    {!canViewDiets && (
                      <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl">
                        <div className="text-4xl mb-3">🔒</div>
                        <p className="text-gray-600 font-medium">
                          Seu plano não permite visualizar dietas.
                        </p>
                      </div>
                    )}
                  </div>
                </CapabilitySection>
              </div>

              {/* Upcoming Appointments */}
              <Card className="p-5 bg-gradient-to-br from-white to-gray-50/50 border-0 rounded-2xl">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📅</span>
                  Próximas Consultas
                </h3>
                <div className="space-y-3">
                  {upcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/60 hover:border-green-200 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">
                          {appointment.type}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {appointment.date} às {appointment.time}
                        </p>
                      </div>
                      <span
                        className={`ml-3 px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap ${
                          appointment.status === "confirmada"
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === "dietas" && (
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Minhas Dietas</h2>
                {canEditDiets ? (
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="text-sm py-2"
                  >
                    Nova Dieta
                  </Button>
                ) : (
                  <div className="text-xs text-gray-500 max-w-xs text-right">
                    As dietas são definidas pela nutricionista. Você poderá apenas visualizar e baixar PDFs.
                  </div>
                )}
              </div>
              
              {dietError && (
                <div className="text-sm text-red-600 p-3 bg-red-50 rounded-lg">
                  {dietError}
                </div>
              )}
              
              <PermissionGate
                anyOf={[CAPABILITIES.DIETA_VIEW]}
                fallback={<div className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">Seu plano não inclui acesso a dietas.</div>}
                loadingFallback={<div className="text-sm text-gray-400">Carregando permissões...</div>}
                reloadingFallback={<div className="text-sm text-gray-400">Atualizando...</div>}
              >
                {usage?.DIETA_REVISOES_MES && (
                  <Card className="p-3 bg-gray-50">
                    <div className="text-xs text-gray-600 flex flex-wrap gap-3 justify-between">
                      <div>
                        <span className="font-semibold">Revisões usadas:</span>{" "}
                        {usage.DIETA_REVISOES_MES.used}
                      </div>
                      {usage.DIETA_REVISOES_MES.limit != null && (
                        <div>
                          <span className="font-semibold">Limite:</span>{" "}
                          {usage.DIETA_REVISOES_MES.limit}
                        </div>
                      )}
                      {usage.DIETA_REVISOES_MES.limit != null && (
                        <div>
                          <span className="font-semibold">Restantes:</span>{" "}
                          {usage.DIETA_REVISOES_MES.remaining}
                        </div>
                      )}
                    </div>
                  </Card>
                )}
                
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mt-4">
                  {plans.map((diet) => (
                    <DietPlanCard
                      key={diet.id}
                      diet={{ ...diet, isCurrent: diet.status === "active" }}
                      onView={openDetail}
                      onRevise={handleRevise}
                      canEdit={canEditDiets}
                      locale={locale}
                    />
                  ))}
                  {plans.length === 0 && (
                    <div className="col-span-full text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                      Nenhum plano de dieta ainda.
                    </div>
                  )}
                </div>
              </PermissionGate>
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
                      checked={planFormat==='structured'} 
                      onChange={()=> setPlanFormat('structured')} 
                    /> Estruturado
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input 
                      type="radio" 
                      name="planFormat" 
                      value="pdf" 
                      checked={planFormat==='pdf'} 
                      onChange={()=> setPlanFormat('pdf')} 
                    /> PDF
                  </label>
                </div>

                {planFormat === 'pdf' && (
                  <div className="space-y-2 text-sm">
                    <label className="block text-sm font-medium mb-1">Arquivo PDF</label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={e=> {
                        const f = e.target.files?.[0];
                        if (!f) { setPdfBase64(''); setPdfName(''); return; }
                        if (f.size > 5*1024*1024) { alert('Limite de 5MB'); return; }
                        setPdfName(f.name);
                        const reader = new FileReader();
                        reader.onload = () => {
                          const res = reader.result as string;
                          const base64 = res.split(',')[1] || '';
                          setPdfBase64(base64);
                        };
                        reader.readAsDataURL(f);
                      }}
                    />
                    {pdfName && <p className="text-xs text-gray-600">Selecionado: {pdfName}</p>}
                  </div>
                )}

                {planFormat === 'structured' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Kcal/dia</label>
                      <input value={metaKcal} onChange={e=> setMetaKcal(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Ex: 2000" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Proteína (g)</label>
                      <input value={metaProt} onChange={e=> setMetaProt(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Ex: 120" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Carbo (g)</label>
                      <input value={metaCarb} onChange={e=> setMetaCarb(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Ex: 180" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Gordura (g)</label>
                      <input value={metaFat} onChange={e=> setMetaFat(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Ex: 60" />
                    </div>
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
          <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Plano de Dieta</h2>
                <button
                  onClick={() => {
                    setShowDetail(false);
                    setSelectedPlanId(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeData}
                    onChange={async (e) => {
                      setIncludeData(e.target.checked);
                      if (selectedPlanId) {
                        setDetailLoading(true);
                        const d = await getDetail(
                          selectedPlanId,
                          e.target.checked
                        );
                        if (d && e.target.checked) setDetailJson(d);
                        setDetailLoading(false);
                      }
                    }}
                  />
                  Incluir dados completos
                </label>
                <button
                  className="text-green-700 text-xs underline"
                  onClick={async () =>
                    selectedPlanId && openDetail(selectedPlanId)
                  }
                >
                  Recarregar
                </button>
              </div>
              {detailLoading && (
                <div className="text-sm text-gray-500 text-center py-4">
                  Carregando detalhes...
                </div>
              )}
              {!detailLoading && selectedPlanId && (
                <DetailContent
                  includeData={includeData}
                  detailJson={detailJson}
                  canEdit={canEditDiets}
                  onRevise={async (notes, patch) => {
                    try {
                      let patchObj: any = {};
                      try {
                        patchObj = JSON.parse(patch || "{}");
                      } catch {
                        /* ignore */
                      }
                      await revise(selectedPlanId, {
                        notes,
                        dataPatch: patchObj,
                      });
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

interface DetailContentProps {
  includeData: boolean;
  detailJson: any;
  canEdit: boolean;
  onRevise: (notes: string, patch: string) => Promise<void>;
  revising: boolean;
  locale: string;
}
const DetailContent: React.FC<DetailContentProps> = ({
  includeData,
  detailJson,
  canEdit,
  onRevise,
  revising,
  locale,
}) => {
  const cached = detailJson;
  if (!cached) return <div className="text-sm text-gray-500">Sem dados.</div>;
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg">{cached.name}</h3>
        <p className="text-sm text-gray-600">
          {cached.description || "Sem descrição"}
        </p>
        <p className="text-xs text-gray-400">
          Criado em{" "}
          {fmtDate(cached.created_at, locale as any, {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </p>
      </div>
      <div>
        <h4 className="font-semibold mb-2">Versões</h4>
        <div className="max-h-64 overflow-y-auto border rounded divide-y">
          {cached.versions.map((v: any) => (
            <div key={v.id} className="p-2 text-xs">
              <div className="flex justify-between">
                <span>v{v.version_number}</span>
                <span>
                  {fmtDate(v.created_at, locale as any, { dateStyle: "short" })}
                </span>
              </div>
              {v.notes && <div className="text-gray-500 italic">{v.notes}</div>}
              
              {/* Suporte a PDF */}
              {includeData && v.data?.format === 'pdf' && (v.data?.file?.base64 || v.data?.file?.key) && (
                <div className="mt-1">
                  <button
                    type="button"
                    className="text-[11px] text-blue-600 underline"
                    onClick={() => {
                      // Prefer backend streaming quando key presente
                      if (v.data.file?.key && cached?.id) {
                        const url = `${location.origin}/diet/plans/${cached.id}/version/${v.id}/file`;
                        fetch(url, { headers: { 'authorization': localStorage.getItem('access_token') ? `Bearer ${localStorage.getItem('access_token')}` : '' } })
                          .then(async r => {
                            if (!r.ok) throw new Error('HTTP '+r.status);
                            const blob = await r.blob();
                            const dlUrl = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = dlUrl;
                            a.download = v.data.file.name || `plano_v${v.version_number}.pdf`;
                            document.body.appendChild(a); a.click(); a.remove();
                            setTimeout(()=> URL.revokeObjectURL(dlUrl), 2000);
                          })
                          .catch(err => { console.error(err); alert('Falha ao baixar PDF'); });
                        return;
                      }
                      // Fallback para base64
                      if (v.data.file?.base64) {
                        try {
                          const base64 = v.data.file.base64 as string;
                          const byteStr = atob(base64);
                          const bytes = new Uint8Array(byteStr.length);
                          for (let i=0;i<byteStr.length;i++) bytes[i] = byteStr.charCodeAt(i);
                          const blob = new Blob([bytes], { type: 'application/pdf' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = v.data.file.name || `plano_v${v.version_number}.pdf`;
                          document.body.appendChild(a); a.click(); a.remove();
                          setTimeout(()=> URL.revokeObjectURL(url), 2000);
                        } catch (err) { console.error(err); alert('Falha ao gerar download do PDF'); }
                      }
                    }}
                  >Baixar PDF</button>
                </div>
              )}
              
              {includeData && v.data && (
                <pre className="mt-1 bg-gray-900 text-gray-100 p-2 rounded overflow-x-auto text-[10px]">
                  {JSON.stringify(v.data, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
      {canEdit && <RevisionForm revising={revising} onSubmit={onRevise} />}
    </div>
  );
};

const RevisionForm: React.FC<{
  revising: boolean;
  onSubmit: (notes: string, patch: string) => Promise<void>;
}> = ({ revising, onSubmit }) => {
  const [notes, setNotes] = useState("");
  const [patch, setPatch] = useState('{\n  "meals": []\n}');
  return (
    <form
      className="space-y-2 border-t pt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit(notes, patch);
        setNotes("");
      }}
    >
      <h4 className="font-semibold">Nova Revisão</h4>
      <div>
        <label className="block text-xs font-medium mb-1">Notas</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border rounded px-2 py-1 text-xs h-16 resize-none"
          placeholder="Notas da revisão"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">
          Patch de Dados (JSON)
        </label>
        <textarea
          value={patch}
          onChange={(e) => setPatch(e.target.value)}
          className="w-full border rounded px-2 py-1 text-xs h-32 font-mono resize-none"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={revising}>
          {revising ? "Salvando..." : "Aplicar Revisão"}
        </Button>
      </div>
    </form>
  );
};

export default DashboardPage;