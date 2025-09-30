import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import StatsCard from "../../components/StatsCard";
// NotificationBell & Progress removidos (mocks serão substituídos futuramente)
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

// Diet plan types derive from hook summaries (simplified view mapping)
interface DietPlanCardProps {
  id: string;
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  results_summary?: string | null;
  status: 'active' | 'archived';
  isCurrent?: boolean; // convenience flag (status === active)
}

const DietPlanCard: React.FC<{ diet: DietPlanCardProps; onView: (id: string) => void; onRevise?: (id: string) => void; canEdit: boolean; locale: string; }> = ({
  diet,
  onView,
  onRevise,
  canEdit,
  locale,
}) => {
  const isCurrent = diet.status === 'active';
  const formatLabel = diet && (diet as any).format ? ((diet as any).format === 'pdf' ? 'PDF' : (diet as any).format === 'structured' ? 'Estruturado' : (diet as any).format) : (() => {
    if (/^\s*\[PDF\]/i.test(diet.description || '')) return 'PDF';
    if (/^\s*\[(STR|STRUCT)\]/i.test(diet.description || '')) return 'Estruturado';
    return null;
  })();
  return (
  <Card
    className={`p-6 hover:shadow-lg transition-all duration-300 ${
      isCurrent ? "border-l-4 border-l-green-500" : ""
    }`}
  >
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{diet.name}</h3>
        <p className="text-sm text-gray-500">{diet.description || "Sem descrição"}</p>
      </div>
      <span
        className={`px-3 py-1 text-xs font-medium rounded-full ${
          isCurrent
            ? "bg-green-100 text-green-800"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        {isCurrent ? "Ativa" : diet.status === 'archived' ? 'Arquivada' : 'Inativa'}
      </span>
    </div>
    {formatLabel && (
      <div className="mb-3 -mt-2">
        <span className="inline-block text-[10px] tracking-wide font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
          {formatLabel}
        </span>
      </div>
    )}

    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
      <div>
        <span className="text-gray-500">Início:</span>
  <p className="font-medium">{diet.start_date ? fmtDate(diet.start_date, locale as any, { dateStyle: 'short'}) : '-'}</p>
      </div>
      <div>
        <span className="text-gray-500">
          {isCurrent ? "Término:" : "Fim:"}
        </span>
  <p className="font-medium">{diet.end_date ? fmtDate(diet.end_date, locale as any, { dateStyle: 'short'}) : '-'}</p>
      </div>
    </div>

    {diet.results_summary && (
      <div className="mb-4 p-3 bg-green-50 rounded-lg">
        <p className="text-sm font-medium text-green-800">
          Resultados: {diet.results_summary}
        </p>
      </div>
    )}

    <div className="flex gap-2">
      <Button className="flex-1" onClick={() => onView(diet.id)}>Ver Detalhes</Button>
      {canEdit && (
        <Button variant="secondary" className="px-3" onClick={() => onRevise && onRevise(diet.id)} title="Nova Revisão">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-7-4l4-4m0 0l4 4m-4-4v12" />
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
  const { user = { full_name: "", email: "", photoUrl: "" }, logout } = useAuth();
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

  // Notificações mock removidas (serão integradas via backend posteriormente)

  // Diet Plans integration
  const { plans, load, create, creating, getDetail, revise, revising, error: dietError } = useDietPlans();
  const { can, usage } = usePermissions();
  const { latest: latestWeight, diff_kg: weightDiff, diff_percent: weightDiffPct, setGoal, goal, series } = useWeightLogs(30);
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
  const [goalInput, setGoalInput] = React.useState<string>(goal ? goal.toString() : '');
  useEffect(()=> { setGoalInput(goal != null ? goal.toString() : ''); }, [goal]);
  const saveGoal = async () => {
    const v = parseFloat(goalInput.replace(',','.'));
    if (!isFinite(v) || v <= 0) return;
    await setGoal(v);
    setEditingGoal(false);
  };
  const canViewDiets = can(CAPABILITIES.DIETA_VIEW);
  const canEditDiets = false; // Regra de negócio: paciente não cria/revisa dietas; somente admin (UI force disable)

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingName, setCreatingName] = useState("");
  const [creatingDesc, setCreatingDesc] = useState("");
  // Campos estruturados opcionais (C)
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

  useEffect(() => { if (canViewDiets) { void load(); } }, [canViewDiets, load]);

  const openDetail = async (id: string) => {
    setSelectedPlanId(id); setShowDetail(true); setDetailLoading(true);
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

  // Próximas consultas mock removidas (placeholder)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Atualiza a cada minuto

    return () => clearInterval(timer);
  }, []);

  // handleNotificationClick removido (sem notificações ativas)

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
      label: locale === 'pt' ? 'Billing / Plano' : 'Billing / Plan', // fallback if translations not loaded early
      description: locale === 'pt' ? 'Histórico de pagamentos' : 'Payment history',
      onClick: () => navigate('/billing/historico'),
      color: 'amber',
    },
  ];
  
  const formatDate = (date: Date): string => fmtDate(date, locale, { dateStyle: 'full' });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SEO
        title={t('dashboard.seo.title')}
        description={t('dashboard.seo.desc')}
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
                    user?.full_name || "User"
                  }&background=22c55e&color=fff`
                }
                alt={user?.full_name}
                className="h-16 w-16 rounded-full border-4 border-green-100"
              />
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">{user?.full_name}</h3>
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

              {/* Área de notificações removida */}
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
                  title="Revisões (mês)"
                  value={(usage?.DIETA_REVISOES_MES?.used ?? 0).toString()}
                  description={usage?.DIETA_REVISOES_MES?.limit != null ? `Limite: ${usage.DIETA_REVISOES_MES.limit}` : ''}
                  icon="�"
                />
                <Card className="p-4 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-600">Peso Atual</h4>
                      <div className="text-2xl font-semibold text-gray-900">{latestWeight ? `${latestWeight.weight_kg.toFixed(1)} kg` : '-'}</div>
                      <div className="text-xs text-gray-500 mt-1">{weightDiffPct != null ? `Δ ${weightDiff?.toFixed(1)} kg (${weightDiffPct.toFixed(1)}%)` : 'Sem variação'}</div>
                      {bmi && (
                        <div className="text-xs text-gray-600 mt-1">IMC: {bmi.toFixed(1)}{bmiClass ? ` (${bmiClass})` : ''}</div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {!editingGoal && (
                        <button onClick={()=> setEditingGoal(true)} className="text-xs text-blue-600 hover:underline">Meta: {goal != null ? `${goal.toFixed(1)} kg` : 'definir'}</button>
                      )}
                      {editingGoal && (
                        <div className="flex items-center gap-1">
                          <input value={goalInput} onChange={e=> setGoalInput(e.target.value)} className="w-16 border rounded px-1 py-0.5 text-xs" />
                          <button onClick={saveGoal} className="text-xs text-green-600">OK</button>
                          <button onClick={()=> { setEditingGoal(false); setGoalInput(goal!=null?goal.toString():''); }} className="text-xs text-red-500">X</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <Sparkline data={series.slice(-20)} />
                  </div>
                </Card>
                <StatsCard
                  title="Água Hoje"
                  value={usage?.WATER_ML_DIA ? `${(usage.WATER_ML_DIA.used/1000).toFixed(1)} L` : '-'}
                  description={usage?.WATER_ML_DIA?.limit ? `Limite ${(usage.WATER_ML_DIA.limit/1000).toFixed(1)} L` : ''}
                  icon="�"
                />
              </div>

              {/* Adesão e Dietas */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Adesão à Dieta</h3>
                  {(() => {
                    const active = plans.find(p => p.status === 'active');
                    if (!active) return <div className="text-sm text-gray-500">Nenhuma dieta ativa.</div>;
                    let adherencePct = 100; // Placeholder: progresso temporal
                    if (active.start_date && active.end_date) {
                      const start = new Date(active.start_date).getTime();
                      const end = new Date(active.end_date).getTime();
                      const now = Date.now();
                      if (end > start) {
                        const prog = Math.min(1, Math.max(0, (now - start)/(end-start)));
                        adherencePct = +(prog * 100).toFixed(1);
                      }
                    }
                    return (
                      <div>
                        <div className="text-3xl font-semibold text-gray-900">{adherencePct.toFixed(1)}%</div>
                        <p className="text-xs text-gray-500 mt-1">Estimativa inicial baseada no tempo do plano.</p>
                      </div>
                    );
                  })()}
                </Card>

                <CapabilitySection
                  title="Dietas Recentes"
                  anyOf={[CAPABILITIES.DIETA_VIEW]}
                  toolbar={canViewDiets ? (
                    <Button variant="secondary" onClick={() => { setActiveTab('dietas'); }}>Ver Todas</Button>
                  ) : null}
                  loadingFallback={<div className="text-xs text-gray-400">Carregando permissões...</div>}
                  reloadingFallback={<div className="text-xs text-gray-400">Atualizando...</div>}
                  fallback={<div className="text-sm text-gray-500">Seu plano não permite visualizar dietas.</div>}
                >
                  <div className="space-y-4">
                    {plans.slice(0,3).map(p => (
                      <DietPlanCard key={p.id} diet={{ ...p, isCurrent: p.status === 'active' }} onView={openDetail} onRevise={handleRevise} canEdit={canEditDiets} locale={locale} />
                    ))}
                    {plans.length === 0 && <div className="text-sm text-gray-500">Nenhuma dieta ainda.</div>}
                  </div>
                </CapabilitySection>
              </div>

              {/* Próximas consultas removidas (placeholder para futura integração) */}
            </div>
          )}

          {activeTab === "dietas" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Minhas Dietas</h2>
                {/* Botão de criação removido para pacientes (somente admin cria). */}
                {canEditDiets ? (
                  <Button onClick={() => setShowCreateModal(true)}>Nova Dieta</Button>
                ) : (
                  <div className="text-xs text-gray-500 max-w-xs text-right">As dietas são definidas pela nutricionista. Você poderá apenas visualizar e baixar PDFs.</div>
                )}
              </div>
              {dietError && <div className="text-sm text-red-600">{dietError}</div>}
              <PermissionGate
                anyOf={[CAPABILITIES.DIETA_VIEW]}
                fallback={<div className="text-sm text-gray-500">Seu plano não inclui acesso a dietas.</div>}
                loadingFallback={<div className="text-sm text-gray-400">Carregando permissões...</div>}
                reloadingFallback={<div className="text-sm text-gray-400">Atualizando...</div>}
              >
                {usage?.DIETA_REVISOES_MES && (
                  <div className="text-xs text-gray-600 bg-gray-50 border rounded p-3 flex flex-wrap gap-4">
                    <div><span className="font-semibold">Revisões usadas:</span> {usage.DIETA_REVISOES_MES.used}</div>
                    {usage.DIETA_REVISOES_MES.limit != null && (
                      <div><span className="font-semibold">Limite:</span> {usage.DIETA_REVISOES_MES.limit}</div>
                    )}
                    {usage.DIETA_REVISOES_MES.limit != null && (
                      <div><span className="font-semibold">Restantes:</span> {usage.DIETA_REVISOES_MES.remaining}</div>
                    )}
                  </div>
                )}
                <div className="grid gap-6 md:grid-cols-2 mt-4">
                  {plans.map(diet => (
                    <DietPlanCard key={diet.id} diet={{ ...diet, isCurrent: diet.status === 'active' }} onView={openDetail} onRevise={handleRevise} canEdit={canEditDiets} locale={locale} />
                  ))}
                  {plans.length === 0 && <div className="text-sm text-gray-500 col-span-2">Nenhum plano de dieta ainda.</div>}
                </div>
              </PermissionGate>
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

        {/* Create Diet Modal */}
  {canEditDiets && showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold">Criar Nova Dieta</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome</label>
                  <input value={creatingName} onChange={e=>setCreatingName(e.target.value)} required className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Descrição</label>
                  <textarea value={creatingDesc} onChange={e=>setCreatingDesc(e.target.value)} className="w-full border rounded px-3 py-2 h-24 resize-none" />
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="planFormat" value="structured" checked={planFormat==='structured'} onChange={()=> setPlanFormat('structured')} /> Estruturado
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="planFormat" value="pdf" checked={planFormat==='pdf'} onChange={()=> setPlanFormat('pdf')} /> PDF
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
                    <p className="text-[11px] text-gray-500">O arquivo será enviado como base64 em "data.file.base64" (backend precisa suportar persistência).</p>
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
                  <Button type="button" variant="secondary" onClick={()=> setShowCreateModal(false)}>Cancelar</Button>
                  <Button type="submit" disabled={creating}>{creating ? 'Criando...' : 'Criar'}</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetail && selectedPlanId && (
          <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Plano de Dieta</h2>
                <button onClick={() => { setShowDetail(false); setSelectedPlanId(null); }} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={includeData} onChange={async e => { setIncludeData(e.target.checked); if (selectedPlanId) { setDetailLoading(true); const d = await getDetail(selectedPlanId, e.target.checked); if (d && e.target.checked) setDetailJson(d); setDetailLoading(false);} }} /> Incluir dados completos</label>
                <button className="text-green-700 text-xs underline" onClick={async ()=> selectedPlanId && openDetail(selectedPlanId)}>Recarregar</button>
              </div>
              {detailLoading && <div className="text-sm text-gray-500">Carregando detalhes...</div>}
              {!detailLoading && selectedPlanId && (
                <DetailContent includeData={includeData} detailJson={detailJson} canEdit={canEditDiets} onRevise={async (notes, patch) => { try { let patchObj:any = {}; try { patchObj = JSON.parse(patch || '{}'); } catch { /* ignore */ } await revise(selectedPlanId, { notes, dataPatch: patchObj }); await openDetail(selectedPlanId); } catch (err) { console.error(err); } }} revising={revising === selectedPlanId} locale={locale} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

interface DetailContentProps { includeData: boolean; detailJson: any; canEdit: boolean; onRevise: (notes: string, patch: string) => Promise<void>; revising: boolean; locale: string; }
const DetailContent: React.FC<DetailContentProps> = ({ includeData, detailJson, canEdit, onRevise, revising, locale }) => {
  // We rely on data passed via props (detailJson) for simplicity. Could be extended to accept cache map.
  const cached = detailJson;
  if (!cached) return <div className="text-sm text-gray-500">Sem dados.</div>;
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg">{cached.name}</h3>
        <p className="text-sm text-gray-600">{cached.description || 'Sem descrição'}</p>
  <p className="text-xs text-gray-400">Criado em {fmtDate(cached.created_at, locale as any, { dateStyle: 'short', timeStyle: 'short'})}</p>
      </div>
      <div>
        <h4 className="font-semibold mb-2">Versões</h4>
        <div className="max-h-64 overflow-y-auto border rounded divide-y">
          {cached.versions.map((v:any) => (
            <div key={v.id} className="p-2 text-xs">
              <div className="flex justify-between"><span>v{v.version_number}</span><span>{fmtDate(v.created_at, locale as any, { dateStyle: 'short'})}</span></div>
              {v.notes && <div className="text-gray-500 italic">{v.notes}</div>}
              {includeData && v.data?.format === 'pdf' && (v.data?.file?.base64 || v.data?.file?.key) && (
                <div className="mt-1">
                  <button
                    type="button"
                    className="text-[11px] text-blue-600 underline"
                    onClick={() => {
                      // Prefer backend streaming when key presente
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
              {includeData && v.data && <pre className="mt-1 bg-gray-900 text-gray-100 p-2 rounded overflow-x-auto text-[10px]">{JSON.stringify(v.data, null, 2)}</pre>}
            </div>
          ))}
        </div>
      </div>
      {/* Revisão desabilitada para pacientes */}
      {canEdit && (
        <RevisionForm revising={revising} onSubmit={onRevise} />
      )}
    </div>
  );
};

const RevisionForm: React.FC<{ revising: boolean; onSubmit: (notes: string, patch: string) => Promise<void>; }> = ({ revising, onSubmit }) => {
  const [notes, setNotes] = useState("");
  const [patch, setPatch] = useState("{\n  \"meals\": []\n}");
  return (
    <form className="space-y-2 border-t pt-4" onSubmit={async e => { e.preventDefault(); await onSubmit(notes, patch); setNotes(""); }}>
      <h4 className="font-semibold">Nova Revisão</h4>
      <div>
        <label className="block text-xs font-medium mb-1">Notas</label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} className="w-full border rounded px-2 py-1 text-xs h-16 resize-none" placeholder="Notas da revisão" />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Patch de Dados (JSON)</label>
        <textarea value={patch} onChange={e=>setPatch(e.target.value)} className="w-full border rounded px-2 py-1 text-xs h-32 font-mono resize-none" />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={revising}>{revising ? 'Salvando...' : 'Aplicar Revisão'}</Button>
      </div>
    </form>
  );
};

export default DashboardPage;
