import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { SEO } from "../../../components/comum/SEO";
import { useWaterLogsInteligente } from "../../../hooks/useWaterLogsInteligente";
import { ProgressoHidratacao } from "../../../components/dashboard/ProgressoHidratacao";
import { useI18n, formatNumber } from "../../../i18n";
import { useToast } from "../../../components/ui/ToastProvider";
import type { Toast } from "../../../components/ui/ToastProvider";
import { parseYMDToLocalDate } from "../../../utils/date";
import {
  ChevronDown,
  ArrowLeft,
  Plus,
  Minus,
  Target,
  Droplets,
  GlassWater,
  Settings,
  Check,
  X,
  Zap,
  Edit3,
  BarChart3,
  History,
} from "../../../components/icons";

const AguaRegistroPage: React.FC = () => {
  const { t } = useI18n();
  const { push } = useToast();
  // Observação: datas 'YYYY-MM-DD' devem ser interpretadas como locais (ver util date.ts)
  const navigate = useNavigate();
  const {
    logs,
    add,
    summaryDays,
    metasFinais,
    progressoHoje,
    setMetaManual,
    resetarParaAutomatica,
    updateCupSize,
  } = useWaterLogsInteligente(7);

  const [activeTab, setActiveTab] = useState<
    "registrar" | "analise" | "historico"
  >("registrar");
  const [pendingCops, setPendingCops] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const mlPorCopo = metasFinais.cupSize;
  const coposHoje = progressoHoje.consumidoCopos;
  const metaDiaria = metasFinais.metaCopos;

  const historico = useMemo(() => {
    if (summaryDays) {
      return summaryDays.map((d) => ({
        data: d.date,
        copos: Math.round(d.total_ml / mlPorCopo),
        meta: metaDiaria,
      }));
    }
    const byDate: { date: string; amount: number }[] = [];
    const map = logs.reduce<Record<string, number>>((acc, l) => {
      acc[l.log_date] = (acc[l.log_date] || 0) + l.amount_ml;
      return acc;
    }, {});
    Object.entries(map).forEach(([date, amount]) =>
      byDate.push({ date, amount })
    );
    return byDate
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        data: d.date,
        copos: Math.round(d.amount / mlPorCopo),
        meta: metaDiaria,
      }));
  }, [logs, metaDiaria, summaryDays, mlPorCopo]);

  const adicionarCopo = () => {
    const limiteInteligente = metaDiaria * 3;
    if (pendingCops + coposHoje < limiteInteligente) {
      setPendingCops((p) => p + 1);
    }
  };

  const removerCopo = () => {
    if (pendingCops > 0) setPendingCops((p) => p - 1);
  };

  const handleSubmit = async () => {
    if (pendingCops <= 0) {
      navigate("/dashboard");
      return;
    }
    try {
      setIsSaving(true);
      const totalMl = pendingCops * mlPorCopo;
      const ok = await add(totalMl);
      if (ok) {
        push({ type: "success", message: t("water.toast.saved") });
        setPendingCops(0);
        setActiveTab("historico"); // Vai para a aba de histórico após salvar
      } else {
        push({ type: "error", message: t("water.toast.partial") });
      }
    } catch (err) {
      console.error("Erro ao registrar água", err);
      push({ type: "error", message: t("water.toast.error") });
    } finally {
      setIsSaving(false);
    }
  };

  const progressoPercentual = Math.min(
    ((coposHoje + pendingCops) / metaDiaria) * 100,
    100
  );

  // Conteúdo da aba Registrar
  const renderRegistrar = () => (
    <div className="space-y-6">
      {/* Card Principal de Registro */}
      <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
        <div className="">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Plus size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Registrar Água
              </h2>
              <p className="text-sm text-gray-500">
                Adicione seu consumo atual
              </p>
            </div>
          </div>

          {/* Contador Visual Grande */}
          <div className="text-center mb-6">
            <div className="relative inline-block mb-4">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-2xl">
                <span className="text-4xl font-bold text-white">
                  {coposHoje + pendingCops}
                </span>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg border border-blue-100">
                <GlassWater size={16} className="text-blue-600" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-lg font-semibold text-gray-900">
                {(coposHoje + pendingCops) * mlPorCopo}ml
              </p>
              <p className="text-sm text-gray-600">
                {coposHoje + pendingCops} de {metaDiaria} copos
              </p>
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="mb-6">
            <div className="flex justify-end items-center mb-2">
              <span className="text-sm font-bold text-blue-600">
                {progressoPercentual.toFixed(0)}%
              </span>
            </div>
            <div className="relative w-full bg-blue-100 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${progressoPercentual}%` }}
              >
                <div className="absolute inset-0 bg-white bg-opacity-20 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Controles de Ação */}
          <div className="flex gap-3 mb-6">
            <Button
              onClick={removerCopo}
              variant="secondary"
              className="flex-1 h-12 flex items-center justify-center border-2 border-red-200 hover:border-red-400 hover:bg-red-50 transition-all rounded-xl"
              disabled={pendingCops === 0}
            >
              <Minus size={24} className="text-red-500" />
            </Button>

            <Button
              onClick={adicionarCopo}
              className="flex-1 h-12 flex items-center justify-center bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all rounded-xl"
              disabled={coposHoje + pendingCops >= metaDiaria * 3}
            >
              <Plus size={24} className="text-white" />
            </Button>
          </div>

          {/* Botão Salvar */}
          <Button
            onClick={handleSubmit}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all rounded-xl"
            disabled={isSaving || pendingCops === 0}
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Salvando...
              </div>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Check size={20} />
                Confirmar {pendingCops > 0 && `(+${pendingCops})`}
              </span>
            )}
          </Button>

          {/* Configurações Rápidas */}
          <div className="rounded-xl mt-6">
            <MetaEditor
              metaDiaria={metaDiaria}
              mlPorCopo={mlPorCopo}
              metasFinais={metasFinais}
              onSetMetaManual={setMetaManual}
              onResetMetaAutomatica={resetarParaAutomatica}
              onUpdateCupSize={updateCupSize}
              push={push}
              t={t}
            />
          </div>
        </div>
      </Card>
    </div>
  );

  // Conteúdo da aba Progresso
  const renderProgresso = () => (
    <div className="space-y-6">
      <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
        <div className="">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <BarChart3 size={20} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Seu Progresso
              </h2>
              <p className="text-sm text-gray-500">Análise do seu consumo</p>
            </div>
          </div>
          <ProgressoHidratacao />
        </div>
      </Card>
    </div>
  );

  // Conteúdo da aba Histórico
  const renderHistorico = () => (
    <div className="space-y-6">
      <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
        <div className="">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <History size={20} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Histórico</h2>
              <p className="text-sm text-gray-500">Seus registros anteriores</p>
            </div>
            <span className="text-sm bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
              {historico.length}
            </span>
          </div>

          {historico.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Droplets size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-1">
                Nenhum registro encontrado
              </p>
              <p className="text-sm text-gray-500">
                Comece registrando seu consumo acima
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {historico.map((registro, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-blue-600">
                        {parseYMDToLocalDate(registro.data)
                          .toLocaleDateString("pt-BR", { weekday: "short" })
                          .slice(0, 3)}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <p className="sm:text-lg font-semibold text-gray-900">
                          {formatNumber(registro.copos, "pt")} copos
                        </p>
                        <span
                          className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                            registro.copos >= registro.meta
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {registro.copos >= registro.meta ? "✓" : "↓"}{" "}
                          {Math.abs(registro.meta - registro.copos)} copos
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {parseYMDToLocalDate(registro.data).toLocaleDateString("pt-BR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          registro.copos >= registro.meta
                            ? "bg-green-500"
                            : "bg-orange-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            (registro.copos / registro.meta) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 safe-area-bottom">
      <SEO
        title={t("water.log.seo.title")}
        description={t("water.log.seo.desc")}
      />

      {/* Header compacto e moderno */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 backdrop-blur-lg bg-white/95">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 active:scale-95"
              aria-label="Voltar"
            >
              <ArrowLeft size={18} className="text-gray-700" />
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                Hidratação
              </h1>
            </div>

            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Droplets size={18} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-1 py-6">
        {/* Tabs de Navegação */}
        <Card className="bg-white border-0 shadow-lg rounded-2xl mb-6">
          <div className="flex p-1">
            <button
              onClick={() => setActiveTab("registrar")}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                activeTab === "registrar"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Plus size={16} />
                Registrar
              </div>
            </button>

            <button
              onClick={() => setActiveTab("analise")}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                activeTab === "analise"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <BarChart3 size={16} />
                Análise
              </div>
            </button>

            <button
              onClick={() => setActiveTab("historico")}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                activeTab === "historico"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <History size={16} />
                Histórico
              </div>
            </button>
          </div>
        </Card>

        {/* Conteúdo das Tabs */}
        <div className="animate-fade-in">
          {activeTab === "registrar" && renderRegistrar()}
          {activeTab === "analise" && renderProgresso()}
          {activeTab === "historico" && renderHistorico()}
        </div>
      </div>
    </div>
  );
};

// Tipos auxiliares para o editor de metas e copo
type ToastPushFn = (toast: Omit<Toast, "id">) => string | void;
import type { TranslationKey } from "../../../types/i18n.d";
type TranslateFn = (key: TranslationKey, vars?: Record<string, string | number>) => string;

interface MetaEditorProps {
  metaDiaria: number;
  mlPorCopo: number;
  metasFinais: { fonte?: string };
  onSetMetaManual: (copos: number) => Promise<void> | void;
  onResetMetaAutomatica: () => Promise<void> | void;
  onUpdateCupSize: (ml: number) => Promise<void> | void;
  push: ToastPushFn;
  t: TranslateFn;
}

// Componente de Edição de Meta (mantido igual)
const MetaEditor = ({
  metaDiaria,
  mlPorCopo,
  metasFinais,
  onSetMetaManual,
  onResetMetaAutomatica,
  onUpdateCupSize,
  push,
  t,
}: MetaEditorProps) => {
  const [open, setOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(metaDiaria?.toString() ?? "");

  const handleSaveGoal = async () => {
    const v = Math.max(1, Math.min(20, Number(goalInput || "0")));
    if (v === metaDiaria) {
      setEditingGoal(false);
      return;
    }
    await onSetMetaManual(v);
    push({ type: "success", message: t("water.goal.updated") });
    setEditingGoal(false);
  };

  return (
    <div className="space-y-4">
      {/* Toggle Header - Mais clean */}
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100 hover:border-blue-200 transition-all duration-200 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-blue-100 group-hover:border-blue-200 transition-colors">
            <Settings size={18} className="text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-900">
              Configurações
            </h3>
            <p className="text-xs text-gray-500">
              Meta, capacidade e preferências
            </p>
          </div>
        </div>

        <div
          className={`transform transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        >
          <ChevronDown size={18} className="text-gray-500" />
        </div>
      </button>

      {/* Collapsible Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-4 pl-2">
          {/* Meta Diária */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  Meta diária
                </span>
              </div>

              {!editingGoal ? (
                <button
                  onClick={() => setEditingGoal(true)}
                  className="flex items-center gap-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg transition-colors border border-blue-200"
                >
                  <Edit3 size={12} />
                  Editar
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleSaveGoal}
                    className="w-8 h-8 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
                    title="Salvar"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingGoal(false);
                      setGoalInput(metaDiaria?.toString() ?? "");
                    }}
                    className="w-8 h-8 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                    title="Cancelar"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {!editingGoal ? (
              <div className="text-center py-2">
                <p className="text-2xl font-bold text-blue-600">{metaDiaria}</p>
                <p className="text-sm text-gray-500">copos por dia</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <input
                    value={goalInput}
                    onChange={(e) =>
                      setGoalInput(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    className="w-20 border-2 border-blue-300 rounded-xl px-3 py-2 text-lg font-bold text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="8"
                    inputMode="numeric"
                    autoFocus
                  />
                  <span className="text-gray-600 font-medium">copos</span>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Equivale a{" "}
                  <strong>{(metaDiaria * mlPorCopo).toLocaleString()}ml</strong>
                </p>
              </div>
            )}
          </div>

          {/* Tamanho do Copo */}
          <CupSizeEditor
            current={mlPorCopo}
            onSave={onUpdateCupSize}
            push={push}
            t={t}
          />

          {/* Meta Inteligente - Apenas se estiver em modo manual */}
          {metasFinais.fonte === "manual" && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Zap size={16} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-green-800 text-sm">
                    Meta Inteligente
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Baseada no seu perfil
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await onResetMetaAutomatica();
                    push({
                      type: "success",
                      message:
                        "Meta automática ativada com base no seu perfil!",
                    });
                  }}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium shadow-sm hover:shadow-md"
                >
                  Ativar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente CupSizeEditor também atualizado
interface CupSizeEditorProps {
  current: number;
  onSave: (ml: number) => Promise<void> | void;
  push: ToastPushFn;
  t: TranslateFn;
}

const CupSizeEditor = ({ current, onSave, push, t }: CupSizeEditorProps) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(current));

  const handleSave = async () => {
    const n = Math.max(50, Math.min(1000, Number(value || "0")));
    if (!n || n === current) {
      setEditing(false);
      return;
    }
    await onSave(n);
    push({
      type: "success",
      message: t("water.cup.updated").replace("{ml}", String(n)),
    });
    setEditing(false);
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GlassWater size={16} className="text-blue-600" />
          <span className="text-sm font-medium text-gray-700">
            Capacidade do copo
          </span>
        </div>

        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg transition-colors border border-blue-200"
          >
            <Edit3 size={12} />
            Editar
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              className="w-8 h-8 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
              title="Salvar"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setValue(String(current));
              }}
              className="w-8 h-8 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
              title="Cancelar"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {!editing ? (
        <div className="text-center py-2">
          <p className="text-2xl font-bold text-blue-600">{current}ml</p>
          <p className="text-sm text-gray-500">por copo</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-24 border-2 border-blue-300 rounded-xl px-3 py-2 text-lg font-bold text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="250"
              inputMode="numeric"
              autoFocus
            />
            <span className="text-gray-600 font-medium">ml</span>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Tamanhos comuns: 200ml, 250ml, 300ml
          </p>
        </div>
      )}
    </div>
  );
};

export default AguaRegistroPage;
