import React from "react";
import { ALIMENTOS, calcularNutricao } from "../../data/alimentos";
import type { StructuredDietData } from "../../types/structuredDiet";

interface StructuredDietViewProps {
  data: StructuredDietData;
  compact?: boolean;
  showAlternatives?: boolean; // Nova prop para controlar alternativas
}

const StructuredDietView: React.FC<StructuredDietViewProps> = ({
  data,
  compact = false,
  showAlternatives = false,
}) => {
  if (!data || data.versao !== 1 || !Array.isArray(data.meals)) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg
          className="w-12 h-12 mx-auto mb-2 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-sm">Dados da dieta não disponíveis</p>
      </div>
    );
  }

  // Calcular totais se não existirem
  const displayTotal =
    data.total ||
    data.meals.reduce(
      (acc, meal) => {
        meal.itens.forEach((item) => {
          const alimento = ALIMENTOS.find((a) => a.id === item.alimentoId);
          if (alimento) {
            const nut = calcularNutricao(
              alimento,
              item.quantidade,
              alimento.porcaoPadrao
            );
            acc.calorias += nut.calorias;
            acc.proteina += nut.proteina;
            acc.carboidratos += nut.carboidratos;
            acc.gordura += nut.gordura;
          }
        });
        return acc;
      },
      { calorias: 0, proteina: 0, carboidratos: 0, gordura: 0 }
    );

  return (
    <div className={compact ? "space-y-3" : "space-y-6"}>
      {/* Lista de Refeições */}
      {data.meals.map((meal) => (
        <div
          key={meal.key}
          className={`border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow ${
            compact ? "text-sm" : "text-base"
          }`}
        >
          {/* Cabeçalho da Refeição */}
          <div className="px-4 py-3 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100 rounded-t-xl">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-emerald-900">
                {meal.titulo}
              </span>
              {compact && meal.itens.length > 0 && (
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                  {meal.itens.length} item{meal.itens.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {!compact && meal.itens.length > 0 && (
              <span className="text-sm text-emerald-600 font-medium">
                {meal.itens.length} item{meal.itens.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Itens da Refeição */}
          <div className="divide-y divide-gray-100">
            {meal.itens.map((item, index) => {
              const alimento = ALIMENTOS.find((a) => a.id === item.alimentoId);
              const nut = alimento
                ? calcularNutricao(
                    alimento,
                    item.quantidade,
                    alimento.porcaoPadrao
                  )
                : null;

              return (
                <div
                  key={`${item.id}-${index}`}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start gap-3">
                    {/* Informações do Alimento */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg flex-shrink-0">
                          {alimento?.emoji || "🍽️"}
                        </span>
                        <span className="font-medium text-gray-900 truncate">
                          {alimento?.nome || item.alimentoId}
                        </span>
                        <span
                          className={`text-gray-500 flex-shrink-0 ${
                            compact ? "text-xs" : "text-sm"
                          }`}
                        >
                          {item.quantidade}g
                        </span>
                      </div>

                      {/* Observação do Item */}
                      {item.observacao && (
                        <div
                          className={`text-gray-600 italic mb-2 ${
                            compact ? "text-xs" : "text-sm"
                          }`}
                        >
                          {item.observacao}
                        </div>
                      )}

                      {/* Alternativas */}
                      {showAlternatives &&
                        item.alternativas &&
                        item.alternativas.length > 0 && (
                          <div className="mt-2">
                            <div
                              className={`text-amber-700 font-medium mb-1 ${
                                compact ? "text-xs" : "text-sm"
                              }`}
                            >
                              Alternativas:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {item.alternativas.map((alt, altIndex) => {
                                const altAlimento = ALIMENTOS.find(
                                  (x) => x.id === alt.alimentoId
                                );
                                return (
                                  <span
                                    key={altIndex}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200"
                                  >
                                    <span className="text-xs">
                                      {altAlimento?.emoji || "🥄"}
                                    </span>
                                    <span
                                      className={`text-amber-700 ${
                                        compact ? "text-xs" : "text-sm"
                                      }`}
                                    >
                                      {altAlimento?.nome || alt.alimentoId} (
                                      {alt.quantidade}g)
                                    </span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Valores Nutricionais */}
                    {nut && !compact && (
                      <div className="flex-shrink-0 text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {nut.calorias} kcal
                        </div>
                        <div
                          className={`text-gray-600 ${
                            compact ? "text-xs" : "text-sm"
                          }`}
                        >
                          P {nut.proteina}g • C {nut.carboidratos}g • G{" "}
                          {nut.gordura}g
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Versão Compacta dos Nutrientes */}
                  {nut && compact && (
                    <div className="mt-2 text-xs text-gray-600">
                      {nut.calorias} kcal • P {nut.proteina}g • C{" "}
                      {nut.carboidratos}g • G {nut.gordura}g
                    </div>
                  )}
                </div>
              );
            })}

            {/* Estado Vazio */}
            {meal.itens.length === 0 && (
              <div className="px-4 py-6 text-center text-gray-400 italic bg-gray-50">
                <svg
                  className="w-8 h-8 mx-auto mb-2 opacity-50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M20 12H4"
                  />
                </svg>
                <div className={compact ? "text-sm" : "text-base"}>
                  Nenhum item nesta refeição
                </div>
              </div>
            )}
          </div>

          {/* Observação da Refeição */}
          {meal.observacao && (
            <div
              className={`px-4 py-2 bg-blue-50 border-t border-blue-100 text-blue-700 ${
                compact ? "text-xs" : "text-sm"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">💡</span>
                <span className="italic">{meal.observacao}</span>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Totais */}
      {displayTotal && (
         
          <div className="text-xs text-gray-600 font-medium text-center py-2">
            Total diário: {displayTotal.calorias} kcal • P{" "}
            {displayTotal.proteina}g • C {displayTotal.carboidratos}g • G{" "}
            {displayTotal.gordura}g
          </div>
      )}
    </div>
  );
};

export default StructuredDietView;
