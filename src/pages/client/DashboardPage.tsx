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
import { useWeightLogs } from "../../hooks/useWeightLogs";
import Sparkline from "../../components/ui/Sparkline";
import { useI18n, formatDate as fmtDate } from "../../i18n";

// Diet plan types derive from hook summaries (simplified view mapping)
interface DietPlanCardProps {
  id: string;
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  results_summary?: string | null;
  status: "active" | "archived";
  isCurrent?: boolean;
}

const DietPlanCard: React.FC<{
  diet: DietPlanCardProps;
  onView: (id: string) => void;
  onRevise?: (id: string) => void;
  canEdit: boolean;
  locale: string;
}> = ({ diet, onView, onRevise, canEdit, locale }) => {
  const isCurrent = diet.status === "active";

  return (
    <Card
      className={`p-4 hover:shadow-lg transition-all duration-300 border-l-4 ${
        isCurrent ? "border-l-green-500" : "border-l-gray-300"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {diet.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {diet.description || "Sem descrição"}
          </p>
        </div>
        <span
          className={`ml-2 px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
            isCurrent
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {isCurrent
            ? "Ativa"
            : diet.status === "archived"
            ? "Arquivada"
            : "Inativa"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div>
          <span className="text-gray-500 text-xs">Início:</span>
          <p className="font-medium text-sm">
            {diet.start_date
              ? fmtDate(diet.start_date, locale as any, { dateStyle: "short" })
              : "-"}
          </p>
        </div>
        <div>
          <span className="text-gray-500 text-xs">
            {isCurrent ? "Término:" : "Fim:"}
          </span>
          <p className="font-medium text-sm">
            {diet.end_date
              ? fmtDate(diet.end_date, locale as any, { dateStyle: "short" })
              : "-"}
          </p>
        </div>
      </div>

      {diet.results_summary && (
        <div className="mb-3 p-2 bg-green-50 rounded-lg">
          <p className="text-xs font-medium text-green-800 line-clamp-2">
            Resultados: {diet.results_summary}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <Button className="flex-1 text-sm py-2" onClick={() => onView(diet.id)}>
          Ver Detalhes
        </Button>
        {canEdit && (
          <Button
            variant="secondary"
            className="px-3 py-2 min-w-[44px]"
            onClick={() => onRevise && onRevise(diet.id)}
            title="Nova Revisão"
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-7-4l4-4m0 0l4 4m-4-4v12"
              />
            </svg>
          </Button>
        )}
      </div>
    </Card>
  );
};

interface QuickActionProps {
  icon: string;
  label: string;
  description: string;
  onClick: () => void;
  color?: string;
}

const QuickAction: React.FC<QuickActionProps> = ({
  icon,
  label,
  description,
  onClick,
  color = "green",
}) => {
  const colorClasses = {
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    cyan: "bg-cyan-100 text-cyan-600",
    purple: "bg-purple-100 text-purple-600",
    amber: "bg-amber-100 text-amber-600",
  };

  return (
    <div onClick={onClick} className="touch-manipulation">
      <Card className="p-3 cursor-pointer hover:shadow-md transition-all duration-200 active:scale-95">
        <div className="flex items-center">
          <div
            className={`p-2 rounded-lg ${
              colorClasses[color as keyof typeof colorClasses]
            } mr-3`}
          >
            <span className="text-lg">{icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-sm truncate">
              {label}
            </h4>
            <p className="text-xs text-gray-600 truncate">{description}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Bottom Navigation Component for Mobile
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden">
      <div className="flex justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center py-2 px-1 flex-1 min-w-0 ${
              activeTab === tab.id ? "text-green-600" : "text-gray-600"
            }`}
          >
            <span className="text-lg mb-1">{tab.icon}</span>
            <span className="text-xs font-medium truncate">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

const DashboardPage: React.FC = () => {
  const { user = { full_name: "", email: "", photoUrl: "" }, logout } =
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
  const canEditDiets = can(CAPABILITIES.DIETA_EDIT);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingName, setCreatingName] = useState("");
  const [creatingDesc, setCreatingDesc] = useState("");
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
    const id = await create({ name: creatingName, description: creatingDesc });
    if (id) {
      setShowCreateModal(false);
      setCreatingName("");
      setCreatingDesc("");
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const handleNotificationClick = (id: string) => {
    console.log(`Notification ${id} clicked`);
  };

  const { locale, t } = useI18n();
  const quickActions = [
    {
      icon: "📋",
      label: "Registrar Refeição",
      description: "Adicione o que comeu hoje",
      onClick: () => navigate("/registro-refeicao"),
      color: "blue",
    },
    {
      icon: "⚖️",
      label: "Registrar Peso",
      description: "Atualize seu peso atual",
      onClick: () => navigate("/registro-peso"),
      color: "green",
    },
    {
      icon: "💧",
      label: "Registrar Água",
      description: "Controle sua hidratação",
      onClick: () => navigate("/registro-agua"),
      color: "cyan",
    },
    {
      icon: "📅",
      label: "Agendar Consulta",
      description: "Marque nova consulta",
      onClick: () => navigate("/agendar-consulta"),
      color: "purple",
    },
    {
      icon: "💳",
      label: locale === "pt" ? "Faturamento / Plano" : "Billing / Plan",
      description:
        locale === "pt" ? "Histórico de pagamentos" : "Payment history",
      onClick: () => navigate("/billing/historico"),
      color: "amber",
    },
  ];

  const formatDate = (date: Date): string =>
    fmtDate(date, locale, { dateStyle: "full" });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SEO
        title={t("dashboard.seo.title")}
        description={t("dashboard.seo.desc")}
      />

      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center">
              <div className="flex items-center pr-3 border-r border-gray-300">
                <LogoCroped />
              </div>
              <div className="pl-3">
                <p className="text-xs text-gray-500">Área do Paciente</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center">
              <img
                src={
                  user?.photoUrl ||
                  `https://ui-avatars.com/api/?name=${
                    user?.full_name || "User"
                  }&background=22c55e&color=fff`
                }
                alt={user?.full_name}
                className="h-12 w-12 rounded-full border-2 border-green-100"
              />
              <div className="ml-3 min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 text-sm truncate">
                  {user?.full_name}
                </h3>
                <p className="text-xs text-green-600 font-medium truncate">
                  Plano Ativo
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3">
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
                  setActiveTab(
                    item.id as
                      | "overview"
                      | "dietas"
                      | "perfil"
                      | "suporte"
                      | "consultas"
                  );
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg mb-1 transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-green-50 text-green-700 border-l-4 border-l-green-500"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="text-lg mr-3">{item.icon}</span>
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-gray-100">
            <Button
              variant="secondary"
              className="w-full flex justify-center text-center py-2 text-sm"
              onClick={handleLogout}
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pb-16 md:pb-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-30">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  className="md:hidden p-2 mr-2 rounded-lg hover:bg-gray-100 touch-manipulation"
                  onClick={() => setSidebarOpen(true)}
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
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-gray-900 truncate capitalize">
                    {activeTab === "overview" && "Visão Geral"}
                    {activeTab === "dietas" && "Minhas Dietas"}
                    {activeTab === "consultas" && "Minhas Consultas"}
                    {activeTab === "perfil" && "Meu Perfil"}
                    {activeTab === "suporte" && "Suporte"}
                  </h1>
                  <p className="text-gray-600 text-xs truncate">
                    {formatDate(currentTime)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <NotificationBell
                  notifications={notifications}
                  onNotificationClick={handleNotificationClick}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4">
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Quick Actions */}
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-3">
                  Ações Rápidas
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                  {quickActions.map((action, index) => (
                    <QuickAction key={index} {...action} />
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid gap-4 md:grid-cols-3">
                <StatsCard
                  title="Revisões (mês)"
                  value={(usage?.DIETA_REVISOES_MES?.used ?? 0).toString()}
                  description={
                    usage?.DIETA_REVISOES_MES?.limit != null
                      ? `Limite: ${usage.DIETA_REVISOES_MES.limit}`
                      : ""
                  }
                  icon="📝"
                />
                <Card className="p-4 flex flex-col justify-between">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-600">
                        Peso Atual
                      </h4>
                      <div className="text-xl font-semibold text-gray-900 mt-1">
                        {latestWeight
                          ? `${latestWeight.weight_kg.toFixed(1)} kg`
                          : "-"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {weightDiffPct != null
                          ? `Δ ${weightDiff?.toFixed(
                              1
                            )} kg (${weightDiffPct.toFixed(1)}%)`
                          : "Sem variação"}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {!editingGoal && (
                        <button
                          onClick={() => setEditingGoal(true)}
                          className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                        >
                          Meta:{" "}
                          {goal != null ? `${goal.toFixed(1)} kg` : "definir"}
                        </button>
                      )}
                      {editingGoal && (
                        <div className="flex items-center gap-1">
                          <input
                            value={goalInput}
                            onChange={(e) => setGoalInput(e.target.value)}
                            className="w-16 border rounded px-1 py-0.5 text-xs"
                            type="number"
                            step="0.1"
                          />
                          <button
                            onClick={saveGoal}
                            className="text-xs text-green-600"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => {
                              setEditingGoal(false);
                              setGoalInput(goal != null ? goal.toString() : "");
                            }}
                            className="text-xs text-red-500"
                          >
                            X
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2">
                    <Sparkline data={series.slice(-20)} height={40} />
                  </div>
                </Card>
                <StatsCard
                  title="Água Hoje"
                  value={
                    usage?.WATER_ML_DIA
                      ? `${(usage.WATER_ML_DIA.used / 1000).toFixed(1)} L`
                      : "-"
                  }
                  description={
                    usage?.WATER_ML_DIA?.limit
                      ? `Limite ${(usage.WATER_ML_DIA.limit / 1000).toFixed(
                          1
                        )} L`
                      : ""
                  }
                  icon="💧"
                />
              </div>

              {/* Progress and Diet Plans */}
              <div className="grid gap-5 lg:grid-cols-2">
                <Card className="p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">
                    Progresso dos Objetivos
                  </h3>
                  <div className="space-y-3">
                    <Progress
                      current={72.5}
                      target={70}
                      label="Meta de Peso"
                      unit="kg"
                      size="sm"
                    />
                    <Progress
                      current={1850}
                      target={2000}
                      label="Meta de Calorias"
                      unit="kcal"
                      size="sm"
                    />
                    <Progress
                      current={7}
                      target={8}
                      label="Copos de Água"
                      unit=""
                      size="sm"
                    />
                    <Progress
                      current={85}
                      target={100}
                      label="Adesão à Dieta"
                      unit="%"
                      size="sm"
                    />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-base font-semibold text-gray-900">
                      Dietas Recentes
                    </h3>
                    {canViewDiets && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setActiveTab("dietas");
                        }}
                        className="text-sm py-1 px-3"
                      >
                        Ver Todas
                      </Button>
                    )}
                  </div>
                  <div className="space-y-3">
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
                      <div className="text-sm text-gray-500 text-center py-4">
                        Seu plano não permite visualizar dietas.
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Upcoming Appointments */}
              <Card className="p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  Próximas Consultas
                </h3>
                <div className="space-y-2">
                  {upcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {appointment.type}
                        </p>
                        <p className="text-xs text-gray-600">
                          {appointment.date} às {appointment.time}
                        </p>
                      </div>
                      <span
                        className={`ml-2 px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                          appointment.status === "confirmada"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
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
                <h2 className="text-xl font-bold text-gray-900">
                  Minhas Dietas
                </h2>
                {canEditDiets && (
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="text-sm py-2"
                  >
                    Nova Dieta
                  </Button>
                )}
              </div>
              {dietError && (
                <div className="text-sm text-red-600 p-3 bg-red-50 rounded-lg">
                  {dietError}
                </div>
              )}
              {!canViewDiets && (
                <div className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                  Seu plano não inclui acesso a dietas.
                </div>
              )}
              {canViewDiets && usage?.DIETA_REVISOES_MES && (
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
              {canViewDiets && (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
              )}
            </div>
          )}

          {activeTab === "consultas" && <Consultas />}
          {activeTab === "perfil" && <Perfil />}
          {activeTab === "suporte" && <Suporte />}
        </div>

        {/* Bottom Navigation for Mobile */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Create Diet Modal */}
        {showCreateModal && (
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
  // We rely on data passed via props (detailJson) for simplicity. Could be extended to accept cache map.
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
