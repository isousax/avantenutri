import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { SEO } from "../../../components/comum/SEO";
import { useWaterLogsInteligente } from "../../../hooks/useWaterLogsInteligente";
import { ProgressoHidratacao } from "../../../components/dashboard/ProgressoHidratacao";
import { useI18n, formatNumber } from "../../../i18n";
import { useToast } from "../../../components/ui/ToastProvider";
import {
  ArrowLeft,
  Plus,
  Minus,
  Target,
  Trophy,
  TrendingUp,
  Calendar,
  ChevronDown,
  Droplets,
  GlassWater,
  Settings,
  Check,
  X,
  Zap,
  Flame,
  Clock,
  Activity
} from 'lucide-react';

const AguaRegistroPage: React.FC = () => {
  const { t } = useI18n();
  const { push } = useToast();
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

  const [pendingCops, setPendingCops] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'progresso' | 'meta' | 'historico'>('progresso');

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
        navigate("/dashboard");
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

  const progressoPercentual = Math.min(((coposHoje + pendingCops) / metaDiaria) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 safe-area-bottom">
      <SEO
        title={t("water.log.seo.title")}
        description={t("water.log.seo.desc")}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 backdrop-blur-lg bg-white/95">
        <div className="max-w-2xl mx-auto px-4 py-3">
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
              <p className="text-xs text-gray-500 truncate">
                {logs.length} registros • {new Date().toLocaleDateString("pt-BR")}
              </p>
            </div>

            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Droplets size={18} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Card Principal de Registro */}
        <Card className="bg-white border-0 shadow-xl rounded-2xl overflow-hidden">
          <div className="p-6">
            {/* Cabeçalho Simples */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Quantos copos você bebeu?
              </h2>
              <p className="text-gray-600">
                {new Date().toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
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
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Progresso diário</span>
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

            {/* Controles de Ação Simplificados */}
            <div className="flex gap-3 mb-6">
              <Button
                onClick={removerCopo}
                variant="secondary"
                className="flex-1 h-14 flex items-center justify-center border-2 border-red-200 hover:border-red-400 hover:bg-red-50 transition-all"
                disabled={pendingCops === 0}
              >
                <Minus size={24} className="text-red-500" />
              </Button>

              <Button
                onClick={adicionarCopo}
                className="flex-1 h-14 flex items-center justify-center bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all"
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
          </div>
        </Card>

        {/* Navegação por Seções */}
        <div className="flex bg-white rounded-2xl shadow-lg p-1 border border-gray-200">
          <button
            onClick={() => setActiveSection('progresso')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
              activeSection === 'progresso'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Activity size={16} />
              Progresso
            </div>
          </button>
          
          <button
            onClick={() => setActiveSection('meta')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
              activeSection === 'meta'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Target size={16} />
              Meta
            </div>
          </button>
          
          <button
            onClick={() => setActiveSection('historico')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
              activeSection === 'historico'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Calendar size={16} />
              Histórico
            </div>
          </button>
        </div>

        {/* Conteúdo das Seções */}
        <div className="animate-fade-in">
          {activeSection === 'progresso' && (
            <div className="space-y-4">
              <ProgressoHidratacao />
              
              {/* Stats Rápidos */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="text-center p-4 bg-blue-50 border-0">
                  <Target size={20} className="text-blue-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Meta Diária</div>
                  <div className="text-lg font-bold text-blue-700">{metaDiaria} copos</div>
                </Card>
                <Card className="text-center p-4 bg-green-50 border-0">
                  <TrendingUp size={20} className="text-green-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Dias na Meta</div>
                  <div className="text-lg font-bold text-green-700">
                    {historico.filter((h) => h.copos >= metaDiaria).length}/{historico.length}
                  </div>
                </Card>
                <Card className="text-center p-4 bg-purple-50 border-0">
                  <Trophy size={20} className="text-purple-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Melhor Dia</div>
                  <div className="text-lg font-bold text-purple-700">
                    {Math.max(...historico.map(h => h.copos))} copos
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeSection === 'meta' && (
            <div className="space-y-4">
              <Card className="bg-white border-0 shadow-lg rounded-2xl p-5">
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
              </Card>
            </div>
          )}

          {activeSection === 'historico' && (
            <div className="space-y-4">
              <Card className="bg-white border-0 shadow-lg rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar size={20} className="text-purple-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Histórico da Semana</h3>
                    <p className="text-sm text-gray-500">Seu consumo nos últimos dias</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {historico.map((registro, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">
                            {new Date(registro.data)
                              .toLocaleDateString("pt-BR", { weekday: "short" })
                              .slice(0, 3)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(registro.data).toLocaleDateString("pt-BR", {
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold text-sm ${
                            registro.copos >= registro.meta
                              ? "text-green-600"
                              : "text-orange-600"
                          }`}
                        >
                          {formatNumber(registro.copos, "pt")} copos
                        </p>
                        <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
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
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente de Edição de Meta
const MetaEditor = ({ 
  metaDiaria, 
  mlPorCopo, 
  metasFinais, 
  onSetMetaManual, 
  onResetMetaAutomatica, 
  onUpdateCupSize, 
  push, 
  t 
}: any) => {
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(metaDiaria.toString());

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
    <div className="space-y-6">
      {/* Meta Atual */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Sua Meta Diária</h3>
        
        {!editingGoal ? (
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-700">Meta atual</p>
              <p className="text-2xl font-bold text-blue-600">{metaDiaria} copos</p>
              <p className="text-sm text-gray-600">{metaDiaria * mlPorCopo}ml por dia</p>
            </div>
            <button
              onClick={() => setEditingGoal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
            >
              <Settings size={16} />
              Ajustar
            </button>
          </div>
        ) : (
          <div className="bg-blue-50 rounded-xl p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nova meta diária (copos)
              </label>
              <input
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-full border-2 border-blue-300 rounded-lg px-4 py-3 text-center font-bold text-lg"
                placeholder="8"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveGoal}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                <Check size={16} />
                Salvar Meta
              </button>
              <button
                onClick={() => setEditingGoal(false)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                <X size={16} />
                Cancelar
              </button>
            </div>
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

      {/* Meta Inteligente */}
      {metasFinais.fonte === "manual" && (
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-3">
            <Zap size={20} className="text-green-600" />
            <div className="flex-1">
              <p className="font-medium text-green-800">Meta Inteligente Disponível</p>
              <p className="text-sm text-green-600">Use nossa recomendação automática</p>
            </div>
            <button
              onClick={async () => {
                await onResetMetaAutomatica();
                push({ type: "success", message: "Meta automática ativada com base no seu perfil!" });
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
            >
              Ativar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de Tamanho do Copo
const CupSizeEditor = ({ current, onSave, push, t }: any) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(current));

  const handleSave = async () => {
    const n = Math.max(50, Math.min(1000, Number(value || "0")));
    if (!n) return;
    await onSave(n);
    push({ type: "success", message: t("water.cup.updated").replace("{ml}", String(n)) });
    setOpen(false);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Tamanho do Copo</h3>
      <div className="bg-blue-50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GlassWater size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Capacidade</span>
          </div>
          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="text-sm bg-white hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg transition-colors border border-blue-200 flex items-center gap-1"
            >
              <Settings size={12} />
              Ajustar
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={handleSave}
                className="w-6 h-6 bg-green-500 text-white rounded flex items-center justify-center hover:bg-green-600 transition-colors"
              >
                <Check size={12} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-6 h-6 bg-red-500 text-white rounded flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {!open ? (
          <p className="text-lg font-bold text-blue-600 mt-2">{current}ml por copo</p>
        ) : (
          <div className="flex items-center gap-2 mt-3">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ""))}
              className="flex-1 border-2 border-blue-300 rounded-lg px-3 py-2 text-center font-medium"
              placeholder="250"
            />
            <span className="text-gray-600 font-medium">ml</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AguaRegistroPage;