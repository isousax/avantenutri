import React, { useEffect, useMemo, useState } from "react";
import {
  ALIMENTOS,
  buscarAlimentos,
  calcularNutricao,
} from "../../data/alimentos";
import { MEAL_DEFS } from "../../types/structuredDiet";
import type { MealBlock, StructuredDietData } from "../../types/structuredDiet";
import { nanoid } from "nanoid";

interface BuilderProps {
  value: StructuredDietData | null;
  onChange: (val: StructuredDietData) => void;
  persistKey?: string;
  showAlternatives?: boolean;
  onToggleAlternatives?: (v: boolean) => void;
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
  onToggleAlternatives,
}) => {
  const [busca, setBusca] = useState("");
  const resultados = useMemo(
    () => buscarAlimentos(busca).slice(0, 30),
    [busca]
  );
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [addingCustomMeal, setAddingCustomMeal] = useState(false);
  const [customMealName, setCustomMealName] = useState("");
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const pristineJsonRef = useMemo(
    () =>
      JSON.stringify({
        versao: 1,
        meals: MEAL_DEFS.map((m) => ({
          key: m.key,
          titulo: m.titulo,
          itens: [],
        })),
      }),
    []
  );

  const data: StructuredDietData = value || {
    versao: 1,
    meals: MEAL_DEFS.map((m) => ({ key: m.key, titulo: m.titulo, itens: [] })),
  };

  // Load draft from localStorage only once (when no value provided)
  useEffect(() => {
    if (value) return; // external value controls
    try {
      const raw = localStorage.getItem(persistKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.versao === 1 && Array.isArray(parsed.meals)) {
          onChange(parsed);
          if (JSON.stringify(parsed) !== pristineJsonRef)
            setDraftRestored(true);
        }
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist draft (throttle via simple timeout)
  useEffect(() => {
    if (!data) return;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(persistKey, JSON.stringify(data));
      } catch {
        /* ignore */
      }
    }, 250);
    return () => clearTimeout(id);
  }, [data, persistKey]);

  function update(meals: MealBlock[]) {
    const next: StructuredDietData = { ...data, meals };
    next.total = computeTotals(next);
    onChange(next);
  }
  function addItem(mealKey: MealBlock["key"], alimentoId: string) {
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
                  quantidade:
                    ALIMENTOS.find((a) => a.id === alimentoId)?.porcaoPadrao ||
                    100,
                },
              ],
            }
          : m
      )
    );
  }
  function updateItem(mealKey: MealBlock["key"], itemId: string, patch: any) {
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
    update(
      data.meals.map((m) =>
        m.key === mealKey
          ? {
              ...m,
              itens: m.itens.flatMap((i) =>
                i.id === itemId ? [i, { ...i, id: nanoid(6) }] : [i]
              ),
            }
          : m
      )
    );
  }
  function moveItem(mealKey: MealBlock["key"], itemId: string, dir: -1 | 1) {
    update(
      data.meals.map((m) => {
        if (m.key !== mealKey) return m;
        const idx = m.itens.findIndex((i) => i.id === itemId);
        if (idx < 0) return m;
        const arr = [...m.itens];
        const t = idx + dir;
        if (t < 0 || t >= arr.length) return m;
        const [sp] = arr.splice(idx, 1);
        arr.splice(t, 0, sp);
        return { ...m, itens: arr };
      })
    );
  }
  function addAlternative(
    mealKey: MealBlock["key"],
    itemId: string,
    alimentoId: string
  ) {
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
                          quantidade:
                            ALIMENTOS.find((a) => a.id === alimentoId)
                              ?.porcaoPadrao || 100,
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
  function removeAlternative(
    mealKey: MealBlock["key"],
    itemId: string,
    alimentoId: string
  ) {
    update(
      data.meals.map((m) =>
        m.key === mealKey
          ? {
              ...m,
              itens: m.itens.map((i) =>
                i.id === itemId
                  ? {
                      ...i,
                      alternativas: (i.alternativas || []).filter(
                        (a) => a.alimentoId !== alimentoId
                      ),
                    }
                  : i
              ),
            }
          : m
      )
    );
  }
  function addCustomMeal() {
    if (!customMealName.trim()) return;
    const key = (customMealName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .slice(0, 30) || "refeicao_" + nanoid(4)) as MealBlock["key"];
    if (data.meals.some((m) => m.key === key)) {
      setCustomMealName("");
      return;
    }
    update([...data.meals, { key, titulo: customMealName.trim(), itens: [] }]);
    setCustomMealName("");
    setAddingCustomMeal(false);
  }
  function exportJson() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dieta_estruturada.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }
  function importJson() {
    try {
      const parsed = JSON.parse(importText);
      if (!parsed || parsed.versao !== 1 || !Array.isArray(parsed.meals)) {
        alert("JSON inválido");
        return;
      }
      onChange(parsed);
      setShowImport(false);
      setImportText("");
    } catch {
      alert("Falha parse JSON");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-[10px] items-center">
        <button
          type="button"
          onClick={exportJson}
          className="px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
        >
          Exportar
        </button>
        <button
          type="button"
          onClick={() => setShowImport((s) => !s)}
          className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          {showImport ? "Cancelar Importar" : "Importar"}
        </button>
        <button
          type="button"
          onClick={() => setAddingCustomMeal((s) => !s)}
          className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {addingCustomMeal ? "Cancelar Refeição" : "Nova Refeição"}
        </button>
        {typeof showAlternatives === "boolean" && onToggleAlternatives && (
          <label className="flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAlternatives}
              onChange={(e) => onToggleAlternatives(e.target.checked)}
            />{" "}
            Mostrar alternativas
          </label>
        )}
        <button
          type="button"
          onClick={() => {
            try {
              navigator.clipboard.writeText(JSON.stringify(data, null, 2));
            } catch {}
          }}
          className="px-2 py-1 bg-amber-600 text-white rounded hover:bg-amber-700"
        >
          Copiar JSON
        </button>
        {/* Future: add HTML copy using dietToHtml util in parent context */}
        {draftRestored && (
          <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded animate-pulse">
            Rascunho recuperado
          </span>
        )}
        {draftRestored && (
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(persistKey);
              setDraftRestored(false);
            }}
            className="px-2 py-1 bg-amber-700 text-white rounded hover:bg-amber-800"
          >
            Limpar rascunho
          </button>
        )}
      </div>
      {addingCustomMeal && (
        <div className="flex gap-2 items-center text-[10px]">
          <input
            value={customMealName}
            onChange={(e) => setCustomMealName(e.target.value)}
            placeholder="Nome da refeição"
            className="border rounded px-2 py-1 flex-1"
          />
          <button
            type="button"
            onClick={addCustomMeal}
            className="px-2 py-1 bg-blue-600 text-white rounded"
          >
            Adicionar
          </button>
        </div>
      )}
      {showImport && (
        <div className="space-y-1">
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={4}
            className="w-full border rounded px-2 py-1 text-[10px] font-mono"
            placeholder="Cole o JSON exportado"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={importJson}
              className="px-3 py-1 bg-gray-700 text-white rounded text-[11px]"
            >
              Importar
            </button>
          </div>
        </div>
      )}
      <div>
        <input
          placeholder="Buscar alimento..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm"
        />
        {busca && (
          <div className="max-h-40 mt-1 overflow-y-auto border rounded bg-white/70 text-xs divide-y">
            {resultados.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => addItem("cafe_manha", a.id)}
                className="w-full text-left px-2 py-1 hover:bg-emerald-50"
              >
                {a.emoji} {a.nome}{" "}
                <span className="text-gray-500">{a.calorias} kcal /100g</span>
              </button>
            ))}
            {resultados.length === 0 && (
              <div className="p-2 text-gray-500">Nenhum alimento</div>
            )}
          </div>
        )}
      </div>
      <div className="space-y-3">
        {data.meals.map((meal) => (
          <div key={meal.key} className="border rounded p-2 bg-white/60">
            <div className="flex justify-between items-center mb-2">
              <h5
                className="font-semibold text-sm cursor-pointer"
                onClick={() =>
                  setExpandedMeal(expandedMeal === meal.key ? null : meal.key)
                }
              >
                {meal.titulo}
              </h5>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="text-[11px] text-emerald-700 underline"
                  onClick={() => {
                    if (busca && resultados[0])
                      addItem(meal.key, resultados[0].id);
                  }}
                >
                  Adicionar primeiro resultado
                </button>
                <button
                  type="button"
                  className="text-[11px] text-blue-700 underline"
                  onClick={() => addItem(meal.key, resultados[0]?.id || "maca")}
                >
                  + Item rápido
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {meal.itens.map((item) => {
                const alimento = ALIMENTOS.find(
                  (a) => a.id === item.alimentoId
                );
                const nut = alimento
                  ? calcularNutricao(
                      alimento,
                      item.quantidade,
                      alimento.porcaoPadrao
                    )
                  : null;
                const hasAlternativas = (item.alternativas?.length || 0) > 0;
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-2 text-xs bg-white/80 rounded p-2 border group"
                  >
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-1">
                        {alimento?.emoji} {alimento?.nome}
                        <span className="text-[10px] text-gray-500">
                          {item.quantidade}g
                        </span>
                      </div>
                      {nut && (
                        <div className="text-[10px] text-gray-600">
                          {nut.calorias} kcal • P {nut.proteina}g • C{" "}
                          {nut.carboidratos}g • G {nut.gordura}g
                        </div>
                      )}
                      <textarea
                        placeholder="Observação (opcional)"
                        value={item.observacao || ""}
                        onChange={(e) =>
                          updateItem(meal.key, item.id, {
                            observacao: e.target.value,
                          })
                        }
                        className="mt-1 w-full border rounded px-1 py-0.5 text-[10px] resize-none"
                        rows={2}
                      />
                      {hasAlternativas && (
                        <div className="mt-1 text-[10px] text-amber-700">
                          Alternativas:{" "}
                          {item.alternativas!.map((alt) => {
                            const a = ALIMENTOS.find(
                              (x) => x.id === alt.alimentoId
                            );
                            return (
                              <button
                                key={alt.alimentoId}
                                type="button"
                                onClick={() =>
                                  removeAlternative(
                                    meal.key,
                                    item.id,
                                    alt.alimentoId
                                  )
                                }
                                className="mr-1 underline hover:text-red-600"
                              >
                                {a?.emoji} {a?.nome}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {expandedMeal === meal.key && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {resultados.slice(0, 8).map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() =>
                                addAlternative(meal.key, item.id, r.id)
                              }
                              className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] hover:bg-amber-200"
                            >
                              Alt: {r.emoji} {r.nome}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="w-24 flex flex-col items-end gap-1">
                      <input
                        type="number"
                        value={item.quantidade}
                        onChange={(e) =>
                          updateItem(meal.key, item.id, {
                            quantidade: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full border rounded px-1 py-0.5 text-[10px]"
                      />
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={() => moveItem(meal.key, item.id, -1)}
                          className="text-[10px] text-gray-500 hover:text-gray-700"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(meal.key, item.id, 1)}
                          className="text-[10px] text-gray-500 hover:text-gray-700"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateItem(meal.key, item.id)}
                          className="text-[10px] text-blue-600 hover:underline"
                        >
                          Dup
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(meal.key, item.id)}
                          className="text-red-600 text-[10px] hover:underline"
                        >
                          Rem
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {meal.itens.length === 0 && (
                <div className="text-[11px] text-gray-500 italic">
                  Nenhum item ainda.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {data.total && (
        <div className="text-[11px] text-gray-700">
          Total estimado: <strong>{data.total.calorias} kcal</strong> • P{" "}
          {data.total.proteina}g • C {data.total.carboidratos}g • G{" "}
          {data.total.gordura}g
        </div>
      )}
    </div>
  );
};

export default StructuredDietBuilder;
