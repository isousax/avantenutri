import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import StatsCard from "../components/StatsCard";
import NotificationBell from "../components/NotificationBell";
import Progress from "../components/ui/Progress";
import LogoCroped from "../components/ui/LogoCroped";
import { SEO } from "../components/comum/SEO";
import Perfil from "../components/dashboard/Perfil";
import Consultas from "../components/dashboard/Consultas";
import Suporte from "../components/dashboard/Suporte";

// Componentes novos que vamos criar
type DietPlan = {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  duration: string;
  results?: string;
  isCurrent?: boolean;
};

const DietPlanCard: React.FC<{ diet: DietPlan; isCurrent?: boolean }> = ({
  diet,
  isCurrent = false,
}) => (
  <Card
    className={`p-6 hover:shadow-lg transition-all duration-300 ${
      isCurrent ? "border-l-4 border-l-green-500" : ""
    }`}
  >
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{diet.name}</h3>
        <p className="text-sm text-gray-500">{diet.description}</p>
      </div>
      <span
        className={`px-3 py-1 text-xs font-medium rounded-full ${
          isCurrent
            ? "bg-green-100 text-green-800"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        {isCurrent ? "Ativa" : "Concluída"}
      </span>
    </div>

    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
      <div>
        <span className="text-gray-500">Início:</span>
        <p className="font-medium">{diet.startDate}</p>
      </div>
      <div>
        <span className="text-gray-500">
          {isCurrent ? "Término:" : "Duração:"}
        </span>
        <p className="font-medium">
          {isCurrent ? diet.endDate : diet.duration}
        </p>
      </div>
    </div>

    {diet.results && (
      <div className="mb-4 p-3 bg-green-50 rounded-lg">
        <p className="text-sm font-medium text-green-800">
          Resultados: {diet.results}
        </p>
      </div>
    )}

    <div className="flex gap-2">
      <Button className="flex-1">Ver Detalhes</Button>
      <Button variant="secondary" className="px-3">
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
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
      </Button>
    </div>
  </Card>
);

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
}) => (
  <div onClick={onClick}>
    <Card className="p-4 cursor-pointer hover:shadow-md transition-all duration-200">
      <div className="flex items-center">
        <div
          className={`p-3 rounded-lg bg-${color}-100 text-${color}-600 mr-4`}
        >
          {icon}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{label}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </Card>
  </div>
);

const DashboardPage: React.FC = () => {
  const { user = { name: "", email: "", photoUrl: "" }, logout } = useAuth();
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

  // Dados de exemplo
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
    {
      id: "3",
      title: "Dica de Nutrição",
      message: "Confira novas receitas saudáveis para esta semana",
      time: "Há 1 dia",
      read: true,
      type: "tip",
    },
  ];

  const dietPlans = [
    {
      id: "1",
      name: "Plano de Emagrecimento",
      description: "Foco em perda de peso saudável",
      startDate: "01/09/2025",
      endDate: "01/10/2025",
      duration: "30 dias",
      results: "-2.3kg conquistados",
      isCurrent: true,
    },
    {
      id: "2",
      name: "Plano de Manutenção",
      description: "Manutenção do peso ideal",
      startDate: "01/08/2025",
      duration: "30 dias",
      results: "-1.5kg no período",
      isCurrent: false,
    },
  ];

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
    }, 60000); // Atualiza a cada minuto

    return () => clearInterval(timer);
  }, []);

  const handleNotificationClick = (id: string) => {
    console.log(`Notification ${id} clicked`);
  };

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
  ];

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SEO
        title="Dashboard | Avante Nutri"
        description="Acompanhe seu progresso, visualize seu plano alimentar e gerencie suas consultas na sua área personalizada da Avante Nutri."
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
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center">
              <div className="flex items-center pr-4 border-r border-gray-300">
                <LogoCroped />
              </div>
              <div className="pl-4">
                <p className="text-xs text-gray-500">Área do Paciente</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center">
              <img
                src={
                  user?.photoUrl ||
                  `https://ui-avatars.com/api/?name=${
                    user?.name || "User"
                  }&background=22c55e&color=fff`
                }
                alt={user?.name}
                className="h-16 w-16 rounded-full border-4 border-green-100"
              />
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">{user?.name}</h3>
                <p className="text-xs text-green-600 font-medium">
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
                className={`w-full flex items-center px-4 py-3 rounded-lg mb-2 transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-green-50 text-green-700 border-l-4 border-l-green-500"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="text-xl mr-3">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 ">
            <Button
              variant="secondary"
              className="w-full flex justify-center text-center"
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
      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-100">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  className="md:hidden p-2 mr-2 rounded-lg hover:bg-gray-100"
                  onClick={() => setSidebarOpen(true)}
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
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 capitalize">
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
        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Ações Rápidas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickActions.map((action, index) => (
                    <QuickAction key={index} {...action} />
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid gap-6 md:grid-cols-3">
                <StatsCard
                  title="Dias de Dieta"
                  value="15"
                  trend={{ value: 12, isPositive: true }}
                  icon="📅"
                />
                <StatsCard
                  title="Peso Atual"
                  value="72.5 kg"
                  trend={{ value: 2.3, isPositive: false }}
                  description="Meta: 70kg"
                  icon="⚖️"
                />
                <StatsCard
                  title="Calorias Diárias"
                  value="1850 kcal"
                  description="Meta: 2000 kcal"
                  icon="🔥"
                />
              </div>

              {/* Progress and Diet Plans */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Progresso dos Objetivos
                  </h3>
                  <div className="space-y-4">
                    <Progress
                      current={72.5}
                      target={70}
                      label="Meta de Peso"
                      unit="kg"
                    />
                    <Progress
                      current={1850}
                      target={2000}
                      label="Meta de Calorias"
                      unit="kcal"
                    />
                    <Progress
                      current={7}
                      target={8}
                      label="Copos de Água"
                      unit=""
                    />
                    <Progress
                      current={85}
                      target={100}
                      label="Adesão à Dieta"
                      unit="%"
                    />
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Dietas Recentes
                    </h3>
                    <Button variant="secondary">Ver Todas</Button>
                  </div>
                  <div className="space-y-4">
                    {dietPlans.map((diet) => (
                      <DietPlanCard
                        key={diet.id}
                        diet={diet}
                        isCurrent={diet.isCurrent}
                      />
                    ))}
                  </div>
                </Card>
              </div>

              {/* Upcoming Appointments */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Próximas Consultas
                </h3>
                <div className="space-y-3">
                  {upcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {appointment.type}
                        </p>
                        <p className="text-sm text-gray-600">
                          {appointment.date} às {appointment.time}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
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
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  Minhas Dietas
                </h2>
                <Button>Nova Dieta</Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {dietPlans.map((diet) => (
                  <DietPlanCard
                    key={diet.id}
                    diet={diet}
                    isCurrent={diet.isCurrent}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === "consultas" && (
            <Consultas />
          )}

          {activeTab === "perfil" && (
            <Perfil />
          )}

          {activeTab === "suporte" && (
            <Suporte />
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
