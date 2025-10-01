import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { SEO } from "../../../components/comum/SEO";
import { useWaterLogsInteligente } from "../../../hooks/useWaterLogsInteligente";
import { ProgressoHidratacao } from "../../../components/dashboard/ProgressoHidratacao";
import { useI18n, formatNumber } from "../../../i18n";
import { useToast } from "../../../components/ui/ToastProvider";
import { motion, AnimatePresence } from "framer-motion";

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
} from "lucide-react";

const AguaRegistroPage: React.FC = () => {
  const { t } = useI18n();
  const { push } = useToast();
  useEffect(() => {
    document.title = t("water.log.title") + " - Avante Nutri";
  }, [t]);
  const navigate = useNavigate();
  const {
    logs,
    add,
    avgPerDay,
    bestDay,
    summaryDays,
    metasFinais,
    progressoHoje,
    setMetaManual,
    resetarParaAutomatica,
    updateCupSize,
  } = useWaterLogsInteligente(7);

  // Estados locais
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [historicoAberto, sethistoricoAberto] = useState(false);
  const [EstatiscicaAberto, setEstatiscicaAberto] = useState(false);
  const [metaAberto, setMetaAberto] = useState(false);

  // Sync com meta inteligente
  useEffect(() => {
    setGoalInput(metasFinais.metaCopos.toString());
  }, [metasFinais.metaCopos]);

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

  const [pendingCops, setPendingCops] = useState(0);
  const adicionarCopo = () => {
    const limiteInteligente = metaDiaria * 3;
    if (pendingCops + coposHoje < limiteInteligente) {
      setPendingCops((p) => p + 1);
    }
  };
  const removerCopo = () => {
    if (pendingCops > 0) setPendingCops((p) => p - 1);
  };

  const [isSaving, setIsSaving] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 safe-area-bottom">
      <SEO
        title={t("water.log.seo.title")}
        description={t("water.log.seo.desc")}
      />

      {/* Header compacto e moderno */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 backdrop-blur-lg bg-white/95">
        <div className="max-w-5xl mx-auto px-4 py-3">
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
                {logs.length} registros •{" "}
                {new Date().toLocaleDateString("pt-BR")}
              </p>
            </div>

            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <Droplets size={18} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Card Principal de Registro - AGORA NO TOPO */}
        <Card className="bg-white border-0 shadow-xl rounded-2xl overflow-hidden">
          <div className="p-6">
            {/* Cabeçalho com Data */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Registrar Água
              </h2>
            </div>

            {/* Contador e Controles - Layout Compacto */}
            <div className="flex items-center justify-between mb-6">
              {/* Contador Visual */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-2xl">
                    <span className="text-2xl font-bold text-white">
                      {coposHoje + pendingCops}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-lg border border-blue-100">
                    <GlassWater size={12} className="text-blue-600" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {(coposHoje + pendingCops) * mlPorCopo}ml
                  </p>
                  <p className="text-sm text-gray-600">
                    {coposHoje + pendingCops} de {metaDiaria} copos
                  </p>
                </div>
              </div>

              {/* Controles de Ação */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={removerCopo}
                  variant="secondary"
                  className="w-12 h-12 flex items-center justify-center border-2 border-red-200 hover:border-red-400 hover:bg-red-50 transition-all active:scale-95"
                  disabled={pendingCops === 0}
                  aria-label="Remover um copo de água"
                >
                  <Minus size={20} className="text-red-500" />
                </Button>

                <Button
                  onClick={adicionarCopo}
                  className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all active:scale-95"
                  disabled={coposHoje + pendingCops >= metaDiaria * 3}
                  aria-label="Adicionar um copo de água"
                >
                  <Plus size={20} className="text-white" />
                </Button>
              </div>
            </div>

            {/* Barra de Progresso Compacta */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Progresso
                </span>
                <span className="text-sm font-bold text-blue-600">
                  {Math.min(
                    ((coposHoje + pendingCops) / metaDiaria) * 100,
                    100
                  ).toFixed(0)}
                  %
                </span>
              </div>
              <div className="relative w-full bg-blue-100 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-500 ease-out relative"
                  style={{
                    width: `${Math.min(
                      ((coposHoje + pendingCops) / metaDiaria) * 100,
                      100
                    )}%`,
                  }}
                >
                  <div className="absolute inset-0 bg-white bg-opacity-20 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Botão Salvar Destaque */}
            <Button
              onClick={handleSubmit}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all rounded-xl active:scale-[0.98]"
              disabled={isSaving || pendingCops === 0}
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {t("common.saving")}
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Check size={20} />
                  {t("water.save")}{" "}
                  {pendingCops > 0 && `(+${pendingCops} copos)`}
                </span>
              )}
            </Button>
          </div>
        </Card>

        {/* Progresso de Hidratação Inteligente - ABAIXO DO REGISTRO */}
        <ProgressoHidratacao />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Painel Principal - Metas e Informações */}
          <div className="lg:col-span-2 space-y-6">
            {/* Controles de Meta */}
            <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
              <div className="p-5">
                {/* Cabeçalho clicável */}
                <div
                  className="flex items-center justify-between cursor-pointer mb-2"
                  onClick={() => setMetaAberto(!metaAberto)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Target size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Meta Diária
                      </h3>
                      <p className="text-sm text-gray-500">
                        Calculada com base no seu perfil
                      </p>
                    </div>
                  </div>

                  <ChevronDown
                    className={`transition-transform duration-300 text-gray-400 ${
                      metaAberto ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {/* Conteúdo com animação */}
                <AnimatePresence initial={false}>
                  {metaAberto && (
                    <motion.div
                      key="meta-diaria"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden space-y-4"
                    >
                      {/* Meta atual ou edição */}
                      {!editingGoal ? (
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                          <div>
                            <p className="font-medium text-gray-700">
                              Meta atual
                            </p>
                            <p className="text-2xl font-bold text-blue-600">
                              {metaDiaria} copos
                            </p>
                            <p className="text-sm text-gray-600">
                              {metaDiaria * mlPorCopo}ml por dia
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-blue-50 rounded-xl p-4 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nova meta diária (copos)
                              </label>
                              <input
                                value={goalInput}
                                onChange={(e) =>
                                  setGoalInput(
                                    e.target.value.replace(/[^0-9]/g, "")
                                  )
                                }
                                className="w-full border-2 border-blue-300 rounded-lg px-4 py-3 text-center font-bold text-lg"
                                placeholder="8"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                const v = Math.max(
                                  1,
                                  Math.min(20, Number(goalInput || "0"))
                                );
                                if (v === metaDiaria) {
                                  setEditingGoal(false);
                                  return;
                                }
                                await setMetaManual(v);
                                push({
                                  type: "success",
                                  message: t("water.goal.updated"),
                                });
                                setEditingGoal(false);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                            >
                              <Check size={16} />
                              Salvar Meta
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingGoal(false)}
                              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                            >
                              <X size={16} />
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tamanho do copo */}
                      <CupSizeEditor
                        current={mlPorCopo}
                        onSave={async (newSize) => {
                          const ok = await updateCupSize(newSize);
                          if (ok)
                            push({
                              type: "success",
                              message: t("water.cup.updated").replace(
                                "{ml}",
                                String(newSize)
                              ),
                            });
                        }}
                      />

                      {/* Meta inteligente */}
                      {metasFinais.fonte === "manual" && (
                        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                          <div className="flex items-center gap-3">
                            <Zap size={20} className="text-green-600" />
                            <div className="flex-1">
                              <p className="font-medium text-green-800">
                                Meta Inteligente Disponível
                              </p>
                              <p className="text-sm text-green-600">
                                Use nossa recomendação automática
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                await resetarParaAutomatica();
                                push({
                                  type: "success",
                                  message:
                                    "Meta automática ativada com base no seu perfil!",
                                });
                              }}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                            >
                              Ativar
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </div>

          {/* Painel Lateral - Estatísticas e Histórico */}
          <div className="space-y-6">
            {/* Estatísticas */}
            <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
              <div className="p-5">
                {/* Cabeçalho com botão de expandir */}
                <div
                  className="flex items-center justify-between cursor-pointer mb-2"
                  onClick={() => setEstatiscicaAberto(!EstatiscicaAberto)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <TrendingUp size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Estatísticas
                      </h3>
                      <p className="text-sm text-gray-500">Últimos 7 dias</p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`transition-transform duration-300 text-gray-400 ${
                      EstatiscicaAberto ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {/* Conteúdo expansível com animação */}
                <AnimatePresence initial={false}>
                  {EstatiscicaAberto && (
                    <motion.div
                      key="estatisticas"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden space-y-3"
                    >
                      {/* Média diária */}
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <TrendingUp size={14} className="text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            Média diária
                          </span>
                        </div>
                        <span className="font-bold text-blue-600">
                          {avgPerDay
                            ? formatNumber(
                                +(avgPerDay / mlPorCopo).toFixed(1),
                                "pt"
                              )
                            : "0"}{" "}
                          copos
                        </span>
                      </div>

                      {/* Dias na meta */}
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-green-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <Target size={14} className="text-green-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            Dias na meta
                          </span>
                        </div>
                        <span className="font-bold text-green-600">
                          {
                            historico.filter((h) => h.copos >= metaDiaria)
                              .length
                          }
                          /{historico.length}
                        </span>
                      </div>

                      {/* Melhor dia */}
                      <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-purple-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Trophy size={14} className="text-purple-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            Melhor dia
                          </span>
                        </div>
                        <span className="font-bold text-purple-600">
                          {bestDay
                            ? formatNumber(
                                Math.round(bestDay.amount / mlPorCopo),
                                "pt"
                              )
                            : 0}{" "}
                          copos
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>

            {/* Histórico */}
            <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
              <div className="p-5">
                {/* Cabeçalho */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => sethistoricoAberto(!historicoAberto)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Calendar size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Histórico
                      </h3>
                      <p className="text-sm text-gray-500">Últimos 7 dias</p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`transition-transform duration-300 text-gray-400 ${
                      historicoAberto ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {/* Conteúdo expansível com animação */}
                <AnimatePresence initial={false}>
                  {historicoAberto && (
                    <motion.div
                      key="conteudo"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden mt-4 space-y-3"
                    >
                      {historico.map((registro, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-600">
                                {new Date(registro.data)
                                  .toLocaleDateString("pt-BR", {
                                    weekday: "short",
                                  })
                                  .slice(0, 3)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {new Date(registro.data).toLocaleDateString(
                                  "pt-BR",
                                  {
                                    day: "numeric",
                                    month: "short",
                                  }
                                )}
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
                            <div className="w-12 bg-gray-200 rounded-full h-1.5 mt-1">
                              <div
                                className={`h-1.5 rounded-full ${
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CupSizeEditorProps {
  current: number;
  onSave: (n: number) => void | Promise<void>;
}
const CupSizeEditor: React.FC<CupSizeEditorProps> = ({ current, onSave }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(current));
  useEffect(() => {
    setValue(String(current));
  }, [current]);

  return (
    <div className="bg-blue-50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GlassWater size={16} className="text-blue-600" />
          <span className="text-sm font-medium text-gray-700">
            Tamanho do copo
          </span>
        </div>
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-sm bg-white hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg transition-colors border border-blue-200 flex items-center gap-1"
          >
            <Settings size={12} />
            Ajustar
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="w-6 h-6 bg-green-500 text-white rounded flex items-center justify-center hover:bg-green-600 transition-colors"
              onClick={async () => {
                const n = Math.max(50, Math.min(1000, Number(value || "0")));
                if (!n) return;
                await onSave(n);
                setOpen(false);
              }}
            >
              <Check size={12} />
            </button>
            <button
              type="button"
              className="w-6 h-6 bg-red-500 text-white rounded flex items-center justify-center hover:bg-red-600 transition-colors"
              onClick={() => setOpen(false)}
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {!open ? (
        <p className="text-lg font-bold text-blue-600">{current}ml por copo</p>
      ) : (
        <div className="flex items-center gap-2">
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
  );
};

export default AguaRegistroPage;
