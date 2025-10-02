import React from 'react';
import { ALIMENTOS, calcularNutricao } from '../../data/alimentos';
import type { StructuredDietData } from '../../types/structuredDiet';

interface StructuredDietViewProps {
  data: StructuredDietData;
  compact?: boolean; // se true, mostra versão reduzida
}

const StructuredDietView: React.FC<StructuredDietViewProps> = ({ data, compact }) => {
  if (!data || data.versao !== 1 || !Array.isArray(data.meals)) {
    return null;
  }
  return (
    <div className={compact ? 'space-y-2' : 'space-y-4'}>
      {data.meals.map(meal => (
        <div key={meal.key} className="border rounded bg-white/70">
          <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold bg-emerald-50 border-b">
            <span>{meal.titulo}</span>
            {meal.itens.length > 0 && (
              <span className="font-normal text-gray-500">{meal.itens.length} item{meal.itens.length>1?'s':''}</span>
            )}
          </div>
          <div className="divide-y">
            {meal.itens.map(item => {
              const alimento = ALIMENTOS.find(a => a.id === item.alimentoId);
              const nut = alimento ? calcularNutricao(alimento, item.quantidade) : null;
              return (
                <div key={item.id} className="px-2 py-1 text-[11px] flex flex-col gap-0.5">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium flex items-center gap-1">
                      {alimento?.emoji} {alimento?.nome || item.alimentoId}
                      <span className="text-[10px] text-gray-500">{item.quantidade}g</span>
                    </span>
                    {nut && (
                      <span className="text-[10px] text-gray-600">
                        {nut.calorias} kcal • P {nut.proteina} • C {nut.carboidratos} • G {nut.gordura}
                      </span>
                    )}
                  </div>
                  {item.observacao && (
                    <div className="text-[10px] text-gray-500 italic line-clamp-2">
                      {item.observacao}
                    </div>
                  )}
                  {item.alternativas && item.alternativas.length > 0 && (
                    <div className="text-[10px] text-amber-700">
                      Alternativas: {item.alternativas.map(alt => {
                        const a = ALIMENTOS.find(x => x.id === alt.alimentoId);
                        return a ? a.nome : alt.alimentoId;
                      }).join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
            {meal.itens.length === 0 && (
              <div className="px-2 py-1 text-[10px] text-gray-400 italic">Sem itens</div>
            )}
          </div>
          {meal.observacao && (
            <div className="px-2 py-1 text-[10px] text-gray-600 bg-gray-50 border-t italic">
              {meal.observacao}
            </div>
          )}
        </div>
      ))}
      {data.total && (
        <div className="text-[11px] text-gray-700 font-medium border rounded px-2 py-1 bg-white/80">
          Total: {data.total.calorias} kcal • P {data.total.proteina}g • C {data.total.carboidratos}g • G {data.total.gordura}g
        </div>
      )}
    </div>
  );
};

export default StructuredDietView;
