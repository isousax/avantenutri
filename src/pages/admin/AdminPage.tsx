import React, { useState } from "react";
import {
  Users,
  CalendarClock,
  UtensilsCrossed,
  BellRing,
  CreditCard,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
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

type AdminTabDefinition = {
  id: AdminTab;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
};

const ADMIN_TABS: readonly AdminTabDefinition[] = [
  {
    id: "pacientes",
    label: "Pacientes",
    description: "Gerenciar pacientes",
    icon: Users,
  },
  {
    id: "consultas",
    label: "Consultas",
    description: "Agendamentos e consultas",
    icon: CalendarClock,
  },
  {
    id: "dietas",
    label: "Dietas",
    description: "Planos alimentares",
    icon: UtensilsCrossed,
  },
  {
    id: "notificacoes",
    label: "Notificações",
    description: "Enviar notificações",
    icon: BellRing,
  },
  {
    id: "creditos",
    label: "Créditos",
    description: "Gestão de créditos",
    icon: CreditCard,
  },
  {
    id: "relatorios",
    label: "Relatórios",
    description: "Relatórios e análises",
    icon: BarChart3,
  },
] as const;

const AdminPage: React.FC = () => {
  const [tab, setTab] = useState<AdminTab>("pacientes");
  const activeTab =
    ADMIN_TABS.find((candidate) => candidate.id === tab) ?? ADMIN_TABS[0];
  const ActiveTabIcon = activeTab.icon;

  return (
    <RoleRoute role="admin">
      <SEO
        title="Painel Administrativo"
        description="Gestão completa da plataforma AvanteNutri"
      />

  <div className="min-h-screen bg-slate-50/30 safe-area-bottom overflow-x-hidden">
        <header className="bg-white/90 backdrop-blur border-b border-gray-200 supports-[backdrop-filter]:bg-white/75">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 items-center justify-center text-white">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                    Painel Administrativo
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Organização central das operações AvanteNutri
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          <div className="grid gap-6 lg:grid-cols-[260px,minmax(0,1fr)]">
            <Card
              padding="p-0"
              className="hidden lg:block border border-gray-200/80 bg-white/90"
            >
              <nav className="flex flex-col gap-1 p-3" aria-label="Seções do painel">
                {ADMIN_TABS.map((tabItem) => {
                  const Icon = tabItem.icon;
                  const isActive = tabItem.id === tab;
                  return (
                    <button
                      key={tabItem.id}
                      type="button"
                      onClick={() => setTab(tabItem.id)}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition-all ${
                          isActive
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-gray-200 bg-gray-100 text-gray-500 group-hover:border-emerald-200 group-hover:text-emerald-600"
                        }`}
                      >
                        <Icon size={18} />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-medium">
                          {tabItem.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-gray-500">
                          {tabItem.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </nav>
            </Card>
            <div className="space-y-6 min-w-0">
              <div className="lg:hidden">
                <div className="flex gap-3 overflow-x-auto overscroll-x-contain touch-pan-x pb-4 scrollbar-hide">
                  {ADMIN_TABS.map((tabItem) => {
                    const Icon = tabItem.icon;
                    const isActive = tabItem.id === tab;
                    return (
                      <button
                        key={tabItem.id}
                        type="button"
                        onClick={() => setTab(tabItem.id)}
                        className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-3 text-xs font-medium transition-all flex-shrink-0 min-w-[88px] ${
                          isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm ${
                            isActive
                              ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                              : "border-gray-200 bg-gray-50 text-gray-500"
                          }`}
                        >
                          <Icon size={18} />
                        </span>
                        <span className="whitespace-nowrap">{tabItem.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-emerald-100/70 bg-white/90 overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-hide">
                <div className="flex items-start gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <ActiveTabIcon size={24} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">
                      Área selecionada
                    </p>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {activeTab.label}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {activeTab.description}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="space-y-6">
                {tab === "pacientes" && (
                  <div className="overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-hide">
                    <PacientesTab />
                  </div>
                )}

                {tab === "consultas" && (
                  <div className="overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-hide">
                    <ConsultasTab />
                  </div>
                )}

                {tab === "dietas" && (
                  <div className="overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-hide">
                    <DietasTab />
                  </div>
                )}

                {tab === "notificacoes" && (
                  <div className="overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-hide">
                    <div className="space-y-6">
                      <AdminNotificationSender />
                    </div>
                  </div>
                )}

                {tab === "creditos" && (
                  <div className="overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-hide">
                    <AdminCreditsPanel />
                  </div>
                )}

                {tab === "relatorios" && (
                  <div className="overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-hide">
                    <Card className="p-8 text-center border border-gray-200/80 overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-hide">
                      <div className="max-w-md mx-auto">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                          <BarChart3 className="h-10 w-10 text-gray-400" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                          Relatórios e Análises
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Em breve você terá acesso a relatórios detalhados e análises
                          avançadas da plataforma.
                        </p>
                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-left">
                          <h4 className="font-semibold text-blue-900 mb-2">
                            Próximas funcionalidades planejadas
                          </h4>
                          <ul className="space-y-1 text-sm text-blue-800">
                            <li className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                              Relatórios de crescimento da base de usuários
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                              Análise de engajamento e retenção
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                              Métricas de utilização das funcionalidades
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                              Exportação de dados em múltiplos formatos
                            </li>
                          </ul>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </RoleRoute>
  );
};

export default AdminPage;
