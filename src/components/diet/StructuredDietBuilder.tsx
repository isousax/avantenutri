import React, { useEffect, useMemo, useState } from "react";
import {
  ALIMENTOS,
  buscarAlimentos,
  calcularNutricao,
} from "../../data/alimentos";
import { MEAL_DEFS } from "../../types/structuredDiet";
import type { MealBlock, StructuredDietData, MealItem } from "../../types/structuredDiet";
import { nanoid } from "nanoid";

interface BuilderProps {
  value: StructuredDietData | null;
  onChange: (val: StructuredDietData) => void;
  persistKey?: string;
  showAlternatives?: boolean;
  onToggleAlternatives?: (v: boolean) => void;
  compact?: boolean;
}

function computeTotals(data: StructuredDietData) {
  const total = { calorias: 0, proteina: 0, carboidratos: 0, gordura: 0 };
  data.meals.forEach((m) =>
    m.itens.forEach((i) => {
      const alimento = ALIMENTOS.find((a) => a.id === i.alimentoId);
      if (!alimento) return;
      const nut = calcularNutricao(
        alimento,
        i.quantidade,
        alimento.porcaoPadrao
      );
      total.calorias += nut.calorias;
      total.proteina += nut.proteina;
      total.carboidratos += nut.carboidratos;
      total.gordura += nut.gordura;
    })
  );
  return {
    calorias: Math.round(total.calorias),
    proteina: +total.proteina.toFixed(1),
    carboidratos: +total.carboidratos.toFixed(1),
    gordura: +total.gordura.toFixed(1),
  };
}

const StructuredDietBuilder: React.FC<BuilderProps> = ({
  value,
  onChange,
  persistKey = "structuredDietDraft",
  showAlternatives,
}) => {
  const [busca, setBusca] = useState("");
  const [selectedMealKey, setSelectedMealKey] = useState<string>("cafe_manha");
  const [activeTab, setActiveTab] = useState<'search' | 'meals'>('search');
  const resultados = useMemo(
    () => buscarAlimentos(busca).slice(0, 20),
    [busca]
  );
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set(['cafe_manha']));

  const data: StructuredDietData = useMemo(() => (
    value || {
      versao: 1,
      meals: MEAL_DEFS.map((m) => ({ key: m.key, titulo: m.titulo, itens: [] })),
    }
  ), [value]);

  // Auto-save draft
  useEffect(() => {
    if (!data) return;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(persistKey, JSON.stringify(data));
      } catch {
        console.warn("Falha ao salvar rascunho no localStorage");
      }
    }, 500);
    return () => clearTimeout(id);
  }, [data, persistKey]);

  function update(meals: MealBlock[]) {
    const next: StructuredDietData = { ...data, meals };
    next.total = computeTotals(next);
    onChange(next);
  }

  function addItem(mealKey: MealBlock["key"], alimentoId: string) {
    const alimento = ALIMENTOS.find(a => a.id === alimentoId);
    update(
      data.meals.map((m) =>
        m.key === mealKey
          ? {
              ...m,
              itens: [
                ...m.itens,
                {
                  id: nanoid(6),
                  alimentoId,
                  quantidade: alimento?.porcaoPadrao || 100,
                  observacao: "",
                },
              ],
            }
          : m
      )
    );
    // Auto-expand the meal when adding items
    setExpandedMeals(prev => new Set(prev).add(mealKey));
  }

  function updateItem(mealKey: MealBlock["key"], itemId: string, patch: Partial<MealItem>) {
    update(
      data.meals.map((m) =>
        m.key === mealKey
          ? {
              ...m,
              itens: m.itens.map((i) =>
                i.id === itemId ? { ...i, ...patch } : i
              ),
            }
          : m
      )
    );
  }

  function removeItem(mealKey: MealBlock["key"], itemId: string) {
    update(
      data.meals.map((m) =>
        m.key === mealKey
          ? { ...m, itens: m.itens.filter((i) => i.id !== itemId) }
          : m
      )
    );
  }

  function duplicateItem(mealKey: MealBlock["key"], itemId: string) {
    const item = data.meals.find(m => m.key === mealKey)?.itens.find(i => i.id === itemId);
    if (!item) return;
    
    update(
      data.meals.map((m) =>
        m.key === mealKey
          ? {
              ...m,
              itens: [...m.itens, { ...item, id: nanoid(6) }],
            }
          : m
      )
    );
  }

  function addAlternative(mealKey: MealBlock["key"], itemId: string, alimentoId: string) {
    const alimento = ALIMENTOS.find(a => a.id === alimentoId);
    update(
      data.meals.map((m) =>
        m.key === mealKey
          ? {
              ...m,
              itens: m.itens.map((i) =>
                i.id === itemId
                  ? {
                      ...i,
                      alternativas: [
                        ...(i.alternativas || []),
                        {
                          alimentoId,
                          quantidade: alimento?.porcaoPadrao || 100,
                        },
                      ],
                    }
                  : i
              ),
            }
          : m
      )
    );
  }

  function removeAlternative(mealKey: MealBlock["key"], itemId: string, altIndex: number) {
    update(
      data.meals.map((m) =>
        m.key === mealKey
          ? {
              ...m,
              itens: m.itens.map((i) =>
                i.id === itemId
                  ? {
                      ...i,
                      alternativas: (i.alternativas || []).filter((_, idx) => idx !== altIndex),
                    }
                  : i
              ),
            }
          : m
      )
    );
  }

  function toggleMealExpansion(mealKey: string) {
    setExpandedMeals(prev => {
      const next = new Set(prev);
      if (next.has(mealKey)) {
        next.delete(mealKey);
      } else {
        next.add(mealKey);
      }
      return next;
    });
  }

  function expandAllMeals() {
    setExpandedMeals(new Set(data.meals.map(m => m.key)));
  }

  function collapseAllMeals() {
    setExpandedMeals(new Set());
  }

  // Quick add common foods
  const commonFoods = [
    { id: "arroz_branco", nome: "Arroz Branco (cozido)", emoji: "🍚" },
    { id: "feijao_preto", nome: "Feijão Preto (cozido)", emoji: "🫘" },
    { id: "frango_peito", nome: "Peito de Frango (grelhado)", emoji: "🍗" },
    { id: "ovo", nome: "Ovo de Galinha (cozido)", emoji: "🥚" },
    { id: "banana", nome: "Banana", emoji: "🍌" },
    { id: "maca", nome: "Maçã", emoji: "🍎" },
    { id: "aveia_em_flocos", nome: "Aveia em Flocos", emoji: "🌾" },
    { id: "leite_integral", nome: "Leite Integral", emoji: "🥛" },
  ];

  const totalItems = data.meals.reduce((sum, meal) => sum + meal.itens.length, 0);

  return (
    <div className="space-y-4">
      {/* Header com Estatísticas Rápidas */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-blue-900">Resumo da Dieta</div>
            <div className="text-xs text-blue-700">
              {totalItems} alimento{totalItems !== 1 ? 's' : ''} • {data.meals.length} refeiç{data.meals.length !== 1 ? 'ões' : 'ão'}
            </div>
          </div>
          {data.total && (
            <div className="text-right">
              <div className="text-sm font-bold text-blue-900">{data.total.calorias} kcal</div>
              <div className="text-xs text-blue-700">
                P{data.total.proteina}g C{data.total.carboidratos}g G{data.total.gordura}g
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'search' 
              ? 'border-green-500 text-green-700' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🔍 Buscar Alimentos
        </button>
        <button
          onClick={() => setActiveTab('meals')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'meals' 
              ? 'border-blue-500 text-blue-700' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 Refeições ({data.meals.length})
        </button>
      </div>

      {/* Conteúdo da Aba de Busca */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          {/* Seletor Rápido de Refeição */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              {data.meals.map((meal) => (
                <button
                  key={meal.key}
                  onClick={() => setSelectedMealKey(meal.key)}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedMealKey === meal.key
                      ? "bg-green-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {meal.titulo}
                </button>
              ))}
            </div>
          </div>

          {/* Busca Principal */}
          <div className="space-y-3">
            <div className="relative">
              <input
                placeholder="Buscar alimentos (arroz, frango, aveia...)"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-green-500"
              />
              {busca && (
                <button
                  onClick={() => setBusca("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Alimentos Rápidos */}
            {!busca && (
              <div>
                <div className="text-xs text-gray-600 mb-2 font-medium">Adição rápida:</div>
                <div className="grid grid-cols-2 gap-2">
                  {commonFoods.map((food) => (
                    <button
                      key={food.id}
                      onClick={() => addItem(selectedMealKey as MealBlock["key"], food.id)}
                      className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-base">{food.emoji}</span>
                      <span className="flex-1 text-left text-xs sm:text-sm">{food.nome}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Resultados da Busca */}
            {busca && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  {resultados.map((alimento) => (
                    <button
                      key={alimento.id}
                      onClick={() => {
                        addItem(selectedMealKey as MealBlock["key"], alimento.id);
                        setBusca("");
                      }}
                      className="flex items-center gap-3 w-full p-3 border-b border-gray-100 last:border-b-0 hover:bg-green-50 transition-colors"
                    >
                      <span className="text-lg flex-shrink-0">{alimento.emoji}</span>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm text-gray-900">{alimento.nome}</div>
                        <div className="text-xs text-gray-500">
                          {alimento.calorias} kcal • P{alimento.proteina}g C{alimento.carboidratos}g G{alimento.gordura}g
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  ))}
                  {resultados.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      <div className="text-sm">Nenhum alimento encontrado</div>
                      <div className="text-xs mt-1">Tente outros termos como "arroz", "frango", etc.</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conteúdo da Aba de Refeições */}
      {activeTab === 'meals' && (
        <div className="space-y-4">
          {/* Controles de Expansão */}
          <div className="flex gap-2">
            <button
              onClick={expandAllMeals}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Expandir Todas
            </button>
            <button
              onClick={collapseAllMeals}
              className="flex-1 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Recolher Todas
            </button>
          </div>

          {/* Lista de Refeições */}
          <div className="space-y-3">
            {data.meals.map((meal) => {
              const mealItems = meal.itens.length;
              const mealTotal = meal.itens.reduce((sum, item) => {
                const alimento = ALIMENTOS.find(a => a.id === item.alimentoId);
                return sum + (alimento ? calcularNutricao(alimento, item.quantidade, alimento.porcaoPadrao).calorias : 0);
              }, 0);
              
              return (
                <div key={meal.key} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {/* Header da Refeição */}
                  <button
                    onClick={() => toggleMealExpansion(meal.key)}
                    className="flex items-center justify-between w-full p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        expandedMeals.has(meal.key) ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d={expandedMeals.has(meal.key) ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">{meal.titulo}</div>
                        <div className="text-xs text-gray-500">
                          {mealItems} item{mealItems !== 1 ? 's' : ''} • {Math.round(mealTotal)} kcal
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {expandedMeals.has(meal.key) ? 'Recolher' : 'Expandir'}
                      </span>
                    </div>
                  </button>

                  {/* Conteúdo da Refeição */}
                  {expandedMeals.has(meal.key) && (
                    <div className="border-t border-gray-200 p-4 space-y-3">
                      {meal.itens.map((item) => {
                        const alimento = ALIMENTOS.find(a => a.id === item.alimentoId);
                        const nut = alimento ? calcularNutricao(alimento, item.quantidade, alimento.porcaoPadrao) : null;
                        
                        return (
                          <div key={item.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
                            {/* Linha Principal */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2 flex-1">
                                <span className="text-lg mt-0.5">{alimento?.emoji}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 text-sm">
                                    {alimento?.nome}
                                  </div>
                                  {nut && (
                                    <div className="text-xs text-gray-600 mt-1">
                                      {nut.calorias} kcal • P{nut.proteina}g C{nut.carboidratos}g G{nut.gordura}g
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={item.quantidade}
                                  onChange={(e) => updateItem(meal.key, item.id, {
                                    quantidade: Number(e.target.value) || 0
                                  })}
                                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <span className="text-xs text-gray-600">g</span>
                              </div>
                            </div>

                            {/* Observação */}
                            <div>
                              <textarea
                                placeholder="Adicionar observação..."
                                value={item.observacao || ""}
                                onChange={(e) => updateItem(meal.key, item.id, {
                                  observacao: e.target.value
                                })}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none"
                              />
                            </div>

                            {/* Alternativas */}
                            {showAlternatives && (
                              <div className="border-t pt-2">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium text-gray-700">
                                    Opções de Substituição ({item.alternativas?.length || 0})
                                  </span>
                                </div>
                                
                                {item.alternativas && item.alternativas.map((alt, idx) => {
                                  const altAlimento = ALIMENTOS.find(a => a.id === alt.alimentoId);
                                  return (
                                    <div key={`${alt.alimentoId}-${idx}`} className="flex items-center justify-between bg-white border border-amber-200 rounded px-3 py-2 mb-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm">{altAlimento?.emoji}</span>
                                        <span className="text-sm text-gray-900">{altAlimento?.nome}</span>
                                        <input
                                          type="number"
                                          value={alt.quantidade}
                                          onChange={(e) => {
                                            const newAlts = (item.alternativas || []).map((a, i) => 
                                              i === idx ? { ...a, quantidade: Number(e.target.value) || 0 } : a
                                            );
                                            updateItem(meal.key, item.id, { alternativas: newAlts });
                                          }}
                                          className="w-12 px-1 py-0.5 border border-gray-300 rounded text-xs"
                                        />
                                        <span className="text-xs text-gray-500">g</span>
                                      </div>
                                      <button
                                        onClick={() => removeAlternative(meal.key, item.id, idx)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  );
                                })}

                                {/* Adicionar Alternativa Rápida */}
                                <div className="mt-2">
                                  <div className="text-xs text-gray-600 mb-1">Adicionar alternativa:</div>
                                  <div className="flex gap-2 overflow-x-auto pb-2">
                                    {commonFoods.slice(0, 6).map(food => (
                                      <button
                                        key={food.id}
                                        onClick={() => addAlternative(meal.key, item.id, food.id)}
                                        className="flex-shrink-0 flex items-center gap-1 px-3 py-1 bg-amber-100 border border-amber-300 rounded text-xs text-amber-800 hover:bg-amber-200"
                                      >
                                        <span>{food.emoji}</span>
                                        <span>{food.nome}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Ações do Item */}
                            <div className="flex gap-2 pt-2 border-t border-gray-200">
                              <button
                                onClick={() => duplicateItem(meal.key, item.id)}
                                className="flex-1 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                              >
                                Duplicar
                              </button>
                              <button
                                onClick={() => removeItem(meal.key, item.id)}
                                className="flex-1 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                              >
                Remover
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {meal.itens.length === 0 && (
                        <div className="text-center py-6 text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <div className="text-sm font-medium">Nenhum alimento adicionado</div>
                          <div className="text-xs mt-1">Vá para a aba "Buscar Alimentos" para adicionar</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resumo Final */}
      {data.total && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-xl p-4">
          <div className="text-center">
            <div className="text-sm font-semibold text-green-900 mb-1">Total da Dieta</div>
            <div className="text-2xl font-bold text-green-800">{data.total.calorias} kcal</div>
            <div className="flex justify-center gap-4 mt-2 text-xs text-green-700">
              <span>Proteínas: {data.total.proteina}g</span>
              <span>Carboidratos: {data.total.carboidratos}g</span>
              <span>Gorduras: {data.total.gordura}g</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StructuredDietBuilder;