import React, { useState } from "react";
import { RoleRoute } from "../../components/RoleRoute";
import { SEO } from "../../components/comum/SEO";
import Card from "../../components/ui/Card";
import AdminNotificationSender from "../../components/admin/AdminNotificationSender";
import AdminCreditsPanel from "../../components/admin/AdminCreditsPanel";
import PacientesTab from "./tabs/PacientesTab";
import ConsultasTab from "./tabs/ConsultasTab";
import DietasTab from "./tabs/DietasTab";

export type AdminTab =
  | "pacientes"
  | "consultas"
  | "relatorios"
  | "dietas"
  | "notificacoes"
  | "creditos";

const AdminPage: React.FC = () => {
  const [tab, setTab] = useState<AdminTab>("pacientes");

  const tabs = [
    {
      id: "pacientes" as AdminTab,
      label: "Pacientes",
      icon: "👥",
      description: "Gerenciar pacientes",
    },
    {
      id: "consultas" as AdminTab,
      label: "Consultas",
      icon: "📅",
      description: "Agendamentos e consultas",
    },
    {
      id: "dietas" as AdminTab,
      label: "Dietas",
      icon: "🍽️",
      description: "Planos alimentares",
    },
    {
      id: "notificacoes" as AdminTab,
      label: "Notificações",
      icon: "🔔",
      description: "Enviar notificações",
    },
    {
      id: "creditos" as AdminTab,
      label: "Créditos",
      icon: "💳",
      description: "Gestão de créditos",
    },
    {
      id: "relatorios" as AdminTab,
      label: "Relatórios",
      icon: "📊",
      description: "Relatórios e análises",
    },
  ] as const;

  const getTabIcon = (tabId: AdminTab) => {
    return tabs.find((t) => t.id === tabId)?.icon || "📋";
  };

  const getTabDescription = (tabId: AdminTab) => {
    return (
      tabs.find((t) => t.id === tabId)?.description || "Painel administrativo"
    );
  };

  return (
    <RoleRoute role="admin">
      <SEO
        title="Painel Administrativo"
        description="Gestão completa da plataforma AvanteNutri"
      />

      <div className="min-h-screen bg-gray-50">
        {/* Conteúdo Principal */}
        <main className="max-w-7xl mx-auto p-4 pb-20 lg:pb-6">
          {/* Header do Tab Atual - Mobile */}
          <div className=" mb-6">
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="p-2 bg-green-100 rounded-xl">
                <span className="text-xl">{getTabIcon(tab)}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {tabs.find((t) => t.id === tab)?.label}
                </h2>
                <p className="text-sm text-gray-600">
                  {getTabDescription(tab)}
                </p>
              </div>
            </div>
          </div>

          {/* Abas - Mobile (Horizontal Scroll) */}
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
              {tabs.map((tabItem) => (
                <button
                  key={tabItem.id}
                  onClick={() => setTab(tabItem.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 min-w-[80px] transition-all flex-shrink-0 ${
                    tab === tabItem.id
                      ? "bg-green-50 border-green-200 shadow-sm"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-lg">{tabItem.icon}</span>
                  <span
                    className={`text-xs font-medium ${
                      tab === tabItem.id ? "text-green-700" : "text-gray-600"
                    }`}
                  >
                    {tabItem.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Conteúdo das Tabs */}
          <div className="space-y-6">
            {tab === "pacientes" && <PacientesTab />}
            {tab === "consultas" && <ConsultasTab />}
            {tab === "dietas" && <DietasTab />}

            {tab === "notificacoes" && (
              <div className="space-y-6">
                <AdminNotificationSender />
              </div>
            )}

            {tab === "creditos" && <AdminCreditsPanel />}

            {tab === "relatorios" && (
              <Card className="p-8 text-center bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-10 h-10 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Relatórios e Análises
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Em breve você terá acesso a relatórios detalhados e análises
                    avançadas da plataforma.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Próximas funcionalidades:
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                        Relatórios de crescimento da base de usuários
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                        Análise de engajamento e retenção
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                        Métricas de utilização das funcionalidades
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                        Exportação de dados em múltiplos formatos
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </RoleRoute>
  );
};

export default AdminPage;
