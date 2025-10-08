import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import { SEO } from "../../../components/comum/SEO";
import { useMealLogsInteligente } from "../../../hooks/useMealLogsInteligente";
import { useMealData } from "../../../hooks/useMealData";
import MiniSparkline from "../../../components/ui/MiniSparkline";
import { useI18n, formatNumber } from "../../../i18n";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import SeletorAlimentos from "../../../components/ui/SeletorAlimentos";
import ProgressoNutricional from "../../../components/dashboard/ProgressoNutricional";
import DataSection from "../../../components/ui/DataSection";
import { shouldShowSkeleton } from "../../../utils/loadingHelpers";
import type { Alimento } from "../../../data/alimentos";
import { calcularNutricao } from "../../../data/alimentos";
import {
  ArrowLeft,
  Plus,
  Settings,
  Check,
  X,
  Target,
  BarChart3,
  Clock,
  Scale,
  Utensils,
  Edit3,
  Trash2,
  History,
} from "lucide-react";

const mealTypes = ["breakfast", "lunch", "dinner", "snack", "other"] as const;

const RefeicaoRegistroPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "registrar" | "analise" | "historico"
  >("registrar");

  const inteligente = useMealLogsInteligente(7);
  const mealBase = useMealData(7);
  const logs = mealBase.logs;
  const daysData = mealBase.summary?.days || [];
  const metasFinais = inteligente.metasFinais || mealBase.goals || ({} as any);
  const create = mealBase.create;
  const patch = mealBase.patch;
  const remove = mealBase.remove;
  const setGoals = mealBase.setGoals;
  const { t, locale } = useI18n();

  // Estados para metas
  const [editingGoals, setEditingGoals] = useState(false);
  const [gCal, setGCal] = useState(metasFinais.calorias?.toString() || "");
  const [gProt, setGProt] = useState(metasFinais.proteina?.toString() || "");
  const [gCarb, setGCarb] = useState(
    metasFinais.carboidratos?.toString() || ""
  );
  const [gFat, setGFat] = useState(metasFinais.gordura?.toString() || "");

  React.useEffect(() => {
    setGCal(metasFinais.calorias?.toString() || "");
    setGProt(metasFinais.proteina?.toString() || "");
    setGCarb(metasFinais.carboidratos?.toString() || "");
    setGFat(metasFinais.gordura?.toString() || "");
  }, [metasFinais]);

  // Estados para edição
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editCal, setEditCal] = useState("");
  const [editProtein, setEditProtein] = useState("");
  const [editCarbs, setEditCarbs] = useState("");
  const [editFat, setEditFat] = useState("");

  // Estados para novo registro
  const [meal_type, setMealType] = useState("lunch");
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [alimentosSelecionados, setAlimentosSelecionados] = useState<
    Array<{
      alimento: Alimento;
      quantidade: number;
      nutricao: ReturnType<typeof calcularNutricao>;
    }>
  >([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (!logs || logs.length === 0) {
      return {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        avgCalories: 0,
      };
    }

    const totals = logs.reduce(
      (acc, log) => ({
        calories: acc.calories + (log.calories || 0),
        protein: acc.protein + (log.protein_g || 0),
        carbs: acc.carbs + (log.carbs_g || 0),
        fat: acc.fat + (log.fat_g || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
      avgCalories: logs.length > 0 ? totals.calories / logs.length : 0,
    };
  }, [logs]);

  // Calcular progresso
  const progress = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayLogs = logs?.filter((log) => log.log_date === today) || [];

    const todayTotals = todayLogs.reduce(
      (acc, log) => ({
        calories: acc.calories + (log.calories || 0),
        protein: acc.protein + (log.protein_g || 0),
        carbs: acc.carbs + (log.carbs_g || 0),
        fat: acc.fat + (log.fat_g || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      calories: metasFinais.calorias
        ? Math.round((todayTotals.calories / metasFinais.calorias) * 100)
        : null,
      protein_g: metasFinais.proteina
        ? Math.round((todayTotals.protein / metasFinais.proteina) * 100)
        : null,
      carbs_g: metasFinais.carboidratos
        ? Math.round((todayTotals.carbs / metasFinais.carboidratos) * 100)
        : null,
      fat_g: metasFinais.gordura
        ? Math.round((todayTotals.fat / metasFinais.gordura) * 100)
        : null,
    };
  }, [logs, metasFinais]);

  const goals = metasFinais;

  // Funções
  const saveGoals = async () => {
    await setGoals({
      calories_goal_kcal: gCal ? Number(gCal) : null,
      protein_goal_g: gProt ? Number(gProt) : null,
      carbs_goal_g: gCarb ? Number(gCarb) : null,
      fat_goal_g: gFat ? Number(gFat) : null,
    });
    setEditingGoals(false);
  };

  const startEdit = (log: any) => {
    setEditingId(log.id);
    setEditDesc(log.description || "");
    setEditCal(log.calories?.toString() || "");
    setEditProtein(log.protein_g?.toString() || "");
    setEditCarbs(log.carbs_g?.toString() || "");
    setEditFat(log.fat_g?.toString() || "");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await patch({
      id: editingId,
      data: {
        description: editDesc || undefined,
        calories: editCal ? Number(editCal) : undefined,
        protein_g: editProtein ? Number(editProtein) : undefined,
        carbs_g: editCarbs ? Number(editCarbs) : undefined,
        fat_g: editFat ? Number(editFat) : undefined,
      },
    });
    setEditingId(null);
  };

  const adicionarAlimento = (alimento: Alimento, quantidade: number) => {
    // Pass the alimento's standard portion so the calculator can compute per-portion values
    const nutricao = calcularNutricao(
      alimento,
      quantidade,
      alimento.porcaoPadrao
    );
    setAlimentosSelecionados((prev) => [
      ...prev,
      { alimento, quantidade, nutricao },
    ]);
  };

  const removerAlimento = (index: number) => {
    setAlimentosSelecionados((prev) => prev.filter((_, i) => i !== index));
  };

  const calcularTotalNutricao = () => {
    return alimentosSelecionados.reduce(
      (total, item) => ({
        calorias: total.calorias + item.nutricao.calorias,
        proteina: total.proteina + item.nutricao.proteina,
        carboidratos: total.carboidratos + item.nutricao.carboidratos,
        gordura: total.gordura + item.nutricao.gordura,
      }),
      { calorias: 0, proteina: 0, carboidratos: 0, gordura: 0 }
    );
  };

  const totalNutricao = calcularTotalNutricao();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (alimentosSelecionados.length === 0) {
      setError("Adicione pelo menos um alimento à refeição");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const descricao = alimentosSelecionados
        .map((item) => `${item.alimento.nome} (${item.quantidade}g)`)
        .join(", ");

      const body = {
        meal_type,
        description: descricao,
        calories: Math.round(totalNutricao.calorias),
        protein_g: +totalNutricao.proteina.toFixed(2),
        carbs_g: +totalNutricao.carboidratos.toFixed(2),
        fat_g: +totalNutricao.gordura.toFixed(2),
      };

      await create(body);
      setAlimentosSelecionados([]);
    } catch (e: any) {
      setError(e.message || "Erro ao registrar refeição");
    } finally {
      setSaving(false);
    }
  };

  // Conteúdo da aba Registrar
  const renderRegistrar = () => (
    <div className="space-y-6">
      <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
        <div className="">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Plus size={20} className="text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Nova Refeição
              </h2>
              <p className="text-sm text-gray-500">
                Adicione os alimentos consumidos
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-6">
            {/* Tipo de refeição */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Clock size={16} className="text-gray-500" />
                Tipo de Refeição
              </label>
              <select
                value={meal_type}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-200"
              >
                {mealTypes.map((m) => (
                  <option key={m} value={m}>
                    {t(`meal.type.${m}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Alimentos selecionados */}
            <div>
              <div className="flex items-center justify-end mb-4">
                <button
                  type="button"
                  onClick={() => setSeletorAberto(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium px-4 py-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                >
                  <Plus size={16} />
                  Adicionar Alimento
                </button>
              </div>

              {alimentosSelecionados.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-300">
                  <div className="w-12 h-12 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Utensils size={20} className="text-gray-500" />
                  </div>
                  <p className="text-gray-500 font-medium">
                    Nenhum alimento adicionado
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Clique no botão acima para começar
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alimentosSelecionados.map((item, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <span className="text-lg">
                              {item.alimento.emoji}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-gray-800 truncate">
                              {item.alimento.nome}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                              <Scale size={12} className="text-gray-500" />
                              {item.quantidade}g
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right text-sm hidden sm:block">
                            <div className="font-medium text-orange-700">
                              {item.nutricao.calorias} kcal
                            </div>
                            <div className="text-gray-600 text-xs">
                              P:{item.nutricao.proteina}g • C:
                              {item.nutricao.carboidratos}g • G:
                              {item.nutricao.gordura}g
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removerAlimento(index)}
                            className="text-red-600 hover:text-red-700 bg-red-100 hover:bg-red-200 rounded-lg w-8 h-8 flex items-center justify-center transition-colors active:scale-95"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Total nutricional */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-gray-800 flex items-center gap-2">
                        <BarChart3 size={18} className="text-blue-600" />
                        Total da Refeição
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-bold text-orange-700">
                            {totalNutricao.calorias}
                          </div>
                          <div className="text-xs text-gray-600">kcal</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-green-700">
                            {totalNutricao.proteina.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-600">Proteína</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-blue-700">
                            {totalNutricao.carboidratos.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-600">
                            Carboidratos
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-purple-700">
                            {totalNutricao.gordura.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-600">Gordura</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-700 font-medium text-sm">{error}</p>
              </div>
            )}

            <Button
              disabled={saving || alimentosSelecionados.length === 0}
              className="w-full !py-4 !text-base font-semibold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl active:scale-[0.98]"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Salvando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Check size={18} />
                  Registrar Refeição
                </span>
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );

  // Conteúdo da aba Estatísticas
  const renderEstatisticas = () => (
    <div className="space-y-6">
      {/* Progresso Nutricional */}
      <DataSection
        isLoading={shouldShowSkeleton(logs.length === 0, logs)}
        error={null}
        skeletonLines={4}
        skeletonClassName="h-40"
      >
        <ProgressoNutricional />
      </DataSection>

      {/* Metas */}
      <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
        <div className="">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Target size={20} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                Metas Nutricionais
              </h2>
            </div>
            {!editingGoals ? (
              <button
                onClick={() => setEditingGoals(true)}
                className="flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors duration-200"
              >
                <Settings size={14} />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={saveGoals}
                  className="w-8 h-8 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => setEditingGoals(false)}
                  className="w-8 h-8 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Inputs de metas quando editando */}
          {editingGoals && (
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Calorias (kcal)
                  </label>
                  <input
                    value={gCal}
                    onChange={(e) => setGCal(e.target.value)}
                    className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="2000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Proteína (g)
                  </label>
                  <input
                    value={gProt}
                    onChange={(e) => setGProt(e.target.value)}
                    className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="120"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Carboidratos (g)
                  </label>
                  <input
                    value={gCarb}
                    onChange={(e) => setGCarb(e.target.value)}
                    className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="250"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Gordura (g)
                  </label>
                  <input
                    value={gFat}
                    onChange={(e) => setGFat(e.target.value)}
                    className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="65"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Resumo geral */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
              <div className="text-xs font-semibold text-gray-700 mb-1">
                Calorias Total
              </div>
              <div className="text-lg font-bold text-orange-700">
                {formatNumber(stats.totalCalories, locale)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <div className="text-xs font-semibold text-gray-700 mb-1">
                Proteína (g)
              </div>
              <div className="text-lg font-bold text-green-700">
                {formatNumber(stats.totalProtein, locale)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
              <div className="text-xs font-semibold text-gray-700 mb-1">
                Carboidratos (g)
              </div>
              <div className="text-lg font-bold text-blue-700">
                {formatNumber(stats.totalCarbs, locale)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
              <div className="text-xs font-semibold text-gray-700 mb-1">
                Gordura (g)
              </div>
              <div className="text-lg font-bold text-purple-700">
                {formatNumber(stats.totalFat, locale)}
              </div>
            </div>
          </div>

          {/* Progresso das metas */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-medium text-gray-700 text-sm">
                    🔥 Calorias
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Meta: {goals.calorias || "Não definida"}
                  </div>
                </div>
                <span className="text-sm font-semibold text-orange-600">
                  {progress.calories != null ? progress.calories + "%" : "—"}
                </span>
              </div>
              <MiniSparkline
                values={daysData.map((d: any) => d.calories)}
                stroke="#f97316"
              />
              {goals.calorias && (
                <div className="h-2 mt-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-500"
                    style={{
                      width: Math.min(100, progress.calories || 0) + "%",
                    }}
                  />
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-medium text-gray-700 text-sm">
                    💪 Proteína
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Meta: {goals.proteina || "Não definida"}
                  </div>
                </div>
                <span className="text-sm font-semibold text-green-600">
                  {progress.protein_g != null ? progress.protein_g + "%" : "—"}
                </span>
              </div>
              <MiniSparkline
                values={daysData.map((d: any) => d.protein_g)}
                stroke="#10b981"
              />
              {goals.proteina && (
                <div className="h-2 mt-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: Math.min(100, progress.protein_g || 0) + "%",
                    }}
                  />
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-medium text-gray-700 text-sm">
                    🍞 Carboidratos
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Meta: {goals.carboidratos || "Não definida"}
                  </div>
                </div>
                <span className="text-sm font-semibold text-blue-600">
                  {progress.carbs_g != null ? progress.carbs_g + "%" : "—"}
                </span>
              </div>
              <MiniSparkline
                values={daysData.map((d: any) => d.carbs_g)}
                stroke="#3b82f6"
              />
              {goals.carboidratos && (
                <div className="h-2 mt-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full transition-all duration-500"
                    style={{
                      width: Math.min(100, progress.carbs_g || 0) + "%",
                    }}
                  />
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-4 border border-purple-200 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-medium text-gray-700 text-sm">
                    🥑 Gordura
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Meta: {goals.gordura || "Não definida"}
                  </div>
                </div>
                <span className="text-sm font-semibold text-purple-600">
                  {progress.fat_g != null ? progress.fat_g + "%" : "—"}
                </span>
              </div>
              <MiniSparkline
                values={daysData.map((d: any) => d.fat_g)}
                stroke="#ec4899"
              />
              {goals.gordura && (
                <div className="h-2 mt-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: Math.min(100, progress.fat_g || 0) + "%" }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  // Conteúdo da aba Histórico
  const renderHistorico = () => (
    <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
      <div className="">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <History size={20} className="text-purple-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">
              Histórico de Refeições
            </h2>
            <p className="text-sm text-gray-500">Suas refeições registradas</p>
          </div>
          <span className="text-sm bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
            {logs.length}
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Utensils size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium mb-1">
              Nenhuma refeição registrada
            </p>
            <p className="text-sm text-gray-500">
              Registre sua primeira refeição acima
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log, index) => (
              <div
                key={log.id}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  editingId === log.id
                    ? "border-blue-300 bg-blue-50 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                } ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock size={16} className="text-orange-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="capitalize text-sm font-medium text-gray-700">
                          {t(
                            `meal.type.${
                              mealTypes.includes(log.meal_type as any)
                                ? log.meal_type
                                : "other"
                            }` as any
                          )}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(log.log_datetime).toLocaleTimeString(
                            locale === "pt" ? "pt-BR" : "en-US",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600">
                        {new Date(log.log_datetime).toLocaleDateString(
                          locale === "pt" ? "pt-BR" : "en-US",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {editingId === log.id ? (
                      <>
                        <button
                          onClick={saveEdit}
                          className="w-8 h-8 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="w-8 h-8 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(log)}
                          className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => setPendingDelete(log.id)}
                          className="w-8 h-8 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Descrição */}
                <div className="mb-3">
                  {editingId === log.id ? (
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full border-2 border-blue-300 rounded-lg px-3 py-2 text-sm resize-none"
                      rows={2}
                    />
                  ) : (
                    <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">
                      {log.description || "Sem descrição"}
                    </p>
                  )}
                </div>

                {/* Valores nutricionais */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="text-center">
                    <div className="text-xs text-gray-600">Calorias</div>
                    {editingId === log.id ? (
                      <input
                        value={editCal}
                        onChange={(e) => setEditCal(e.target.value)}
                        className="w-full border-2 border-blue-300 rounded-lg px-2 py-1 text-sm text-center"
                      />
                    ) : (
                      <div className="font-bold text-orange-700 text-sm">
                        {log.calories != null
                          ? formatNumber(log.calories, locale)
                          : "—"}
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600">Proteína</div>
                    {editingId === log.id ? (
                      <input
                        value={editProtein}
                        onChange={(e) => setEditProtein(e.target.value)}
                        className="w-full border-2 border-blue-300 rounded-lg px-2 py-1 text-sm text-center"
                      />
                    ) : (
                      <div className="font-bold text-green-700 text-sm">
                        {log.protein_g != null
                          ? formatNumber(+log.protein_g.toFixed(1), locale)
                          : "—"}
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600">Carboidratos</div>
                    {editingId === log.id ? (
                      <input
                        value={editCarbs}
                        onChange={(e) => setEditCarbs(e.target.value)}
                        className="w-full border-2 border-blue-300 rounded-lg px-2 py-1 text-sm text-center"
                      />
                    ) : (
                      <div className="font-bold text-blue-700 text-sm">
                        {log.carbs_g != null
                          ? formatNumber(+log.carbs_g.toFixed(1), locale)
                          : "—"}
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600">Gordura</div>
                    {editingId === log.id ? (
                      <input
                        value={editFat}
                        onChange={(e) => setEditFat(e.target.value)}
                        className="w-full border-2 border-blue-300 rounded-lg px-2 py-1 text-sm text-center"
                      />
                    ) : (
                      <div className="font-bold text-purple-700 text-sm">
                        {log.fat_g != null
                          ? formatNumber(+log.fat_g.toFixed(1), locale)
                          : "—"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-red-50 safe-area-bottom">
      <SEO
        title={t("meal.log.seo.title")}
        description={t("meal.log.seo.desc")}
      />

      {/* Header */}
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
                Registro de Refeições
              </h1>
            </div>

            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <Utensils size={18} className="text-white" />
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
                  ? "bg-orange-500 text-white shadow-sm"
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
                  ? "bg-orange-500 text-white shadow-sm"
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
                  ? "bg-orange-500 text-white shadow-sm"
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
          {activeTab === "analise" && renderEstatisticas()}
          {activeTab === "historico" && renderHistorico()}
        </div>
      </div>

      {/* Seletor de Alimentos Modal */}
      {seletorAberto && (
        <SeletorAlimentos
          onSelect={adicionarAlimento}
          onClose={() => setSeletorAberto(false)}
        />
      )}

      {/* Dialog de confirmação para exclusão */}
      <ConfirmDialog
        open={!!pendingDelete}
        title="Confirmar Exclusão"
        description={`Tem certeza que deseja excluir esta refeição? ${
          logs.find((l) => l.id === pendingDelete)?.description || ""
        }`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        danger
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            remove(pendingDelete);
            setPendingDelete(null);
          }
        }}
      />
    </div>
  );
};

export default RefeicaoRegistroPage;
