import React from 'react';
import { useMetasAutomaticas } from '../../hooks/useMetasAutomaticas';
import { useMealLogs } from '../../hooks/useMealLogs';
import { useWaterLogs } from '../../hooks/useWaterLogs';

interface ProgressoNutricionalProps {
  className?: string;
}

const ProgressoNutricional: React.FC<ProgressoNutricionalProps> = ({ className = '' }) => {
  const { metas, metasCalculadas } = useMetasAutomaticas();
  const { days } = useMealLogs(1); // Apenas hoje
  const { totalToday, cupSize } = useWaterLogs(1);
  
  // Dados de hoje
  const hoje = days[0];
  const aguaHoje = (totalToday * cupSize) || 0; // converter copos para ml
  
  // Calcular percentuais
  const progressos = {
    calorias: hoje ? Math.min(100, Math.round((hoje.calories / metas.calorias) * 100)) : 0,
    proteina: hoje ? Math.min(100, Math.round((hoje.protein_g / metas.proteina) * 100)) : 0,
    carboidratos: hoje ? Math.min(100, Math.round((hoje.carbs_g / metas.carboidratos) * 100)) : 0,
    gordura: hoje ? Math.min(100, Math.round((hoje.fat_g / metas.gordura) * 100)) : 0,
    agua: Math.min(100, Math.round((aguaHoje / metas.agua) * 100))
  };

  const getCorProgresso = (percentual: number) => {
    if (percentual < 50) return 'from-red-400 to-red-500';
    if (percentual < 80) return 'from-yellow-400 to-orange-500';
    if (percentual <= 100) return 'from-green-400 to-green-500';
    return 'from-blue-400 to-purple-500'; // Acima da meta
  };

  const getTextoProgresso = (percentual: number) => {
    if (percentual < 50) return 'text-red-700';
    if (percentual < 80) return 'text-yellow-700';
    if (percentual <= 100) return 'text-green-700';
    return 'text-purple-700';
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            📊 Progresso Nutricional de Hoje
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {metasCalculadas ? 'Metas calculadas automaticamente' : 'Usando metas padrão'}
          </p>
        </div>
        <div className="text-right text-sm text-gray-500">
          {new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>

      {/* Grid de Progressos */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Calorias */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">🔥 Calorias</span>
            <span className={`text-xs font-bold ${getTextoProgresso(progressos.calorias)}`}>
              {progressos.calorias}%
            </span>
          </div>
          
          <div className="mb-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-2 bg-gradient-to-r ${getCorProgresso(progressos.calorias)} rounded-full transition-all duration-700`}
                style={{ width: `${Math.min(100, progressos.calorias)}%` }}
              />
            </div>
          </div>
          
          <div className="text-xs text-gray-600">
            <div className="font-bold text-orange-700 text-lg">
              {hoje?.calories || 0} / {metas.calorias}
            </div>
            <div>kcal</div>
          </div>
        </div>

        {/* Proteína */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">💪 Proteína</span>
            <span className={`text-xs font-bold ${getTextoProgresso(progressos.proteina)}`}>
              {progressos.proteina}%
            </span>
          </div>
          
          <div className="mb-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-2 bg-gradient-to-r ${getCorProgresso(progressos.proteina)} rounded-full transition-all duration-700`}
                style={{ width: `${Math.min(100, progressos.proteina)}%` }}
              />
            </div>
          </div>
          
          <div className="text-xs text-gray-600">
            <div className="font-bold text-green-700 text-lg">
              {hoje?.protein_g?.toFixed(1) || 0} / {metas.proteina}
            </div>
            <div>gramas</div>
          </div>
        </div>

        {/* Carboidratos */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">🍞 Carboidratos</span>
            <span className={`text-xs font-bold ${getTextoProgresso(progressos.carboidratos)}`}>
              {progressos.carboidratos}%
            </span>
          </div>
          
          <div className="mb-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-2 bg-gradient-to-r ${getCorProgresso(progressos.carboidratos)} rounded-full transition-all duration-700`}
                style={{ width: `${Math.min(100, progressos.carboidratos)}%` }}
              />
            </div>
          </div>
          
          <div className="text-xs text-gray-600">
            <div className="font-bold text-blue-700 text-lg">
              {hoje?.carbs_g?.toFixed(1) || 0} / {metas.carboidratos}
            </div>
            <div>gramas</div>
          </div>
        </div>

        {/* Gordura */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">🥑 Gordura</span>
            <span className={`text-xs font-bold ${getTextoProgresso(progressos.gordura)}`}>
              {progressos.gordura}%
            </span>
          </div>
          
          <div className="mb-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-2 bg-gradient-to-r ${getCorProgresso(progressos.gordura)} rounded-full transition-all duration-700`}
                style={{ width: `${Math.min(100, progressos.gordura)}%` }}
              />
            </div>
          </div>
          
          <div className="text-xs text-gray-600">
            <div className="font-bold text-purple-700 text-lg">
              {hoje?.fat_g?.toFixed(1) || 0} / {metas.gordura}
            </div>
            <div>gramas</div>
          </div>
        </div>

        {/* Água */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">💧 Água</span>
            <span className={`text-xs font-bold ${getTextoProgresso(progressos.agua)}`}>
              {progressos.agua}%
            </span>
          </div>
          
          <div className="mb-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-2 bg-gradient-to-r ${getCorProgresso(progressos.agua)} rounded-full transition-all duration-700`}
                style={{ width: `${Math.min(100, progressos.agua)}%` }}
              />
            </div>
          </div>
          
          <div className="text-xs text-gray-600">
            <div className="font-bold text-cyan-700 text-lg">
              {aguaHoje} / {metas.agua}
            </div>
            <div>ml</div>
          </div>
        </div>
      </div>

      {/* Resumo e Dicas */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Resumo do Dia */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            🎯 Resumo do Dia
          </h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Total de calorias:</span>
              <span className="font-medium">{hoje?.calories || 0} kcal</span>
            </div>
            <div className="flex justify-between">
              <span>Refeições registradas:</span>
              <span className="font-medium">{hoje?.count || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Copos de água:</span>
              <span className="font-medium">{totalToday || 0}</span>
            </div>
          </div>
        </div>

        {/* Próxima Meta */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            🚀 Próximo Passo
          </h4>
          <div className="text-sm text-gray-700">
            {(() => {
              const menorProgresso = Math.min(progressos.calorias, progressos.proteina, progressos.carboidratos, progressos.gordura, progressos.agua);
              
              if (menorProgresso === progressos.agua) {
                return '💧 Beba mais água para manter a hidratação!';
              } else if (menorProgresso === progressos.proteina) {
                return '💪 Inclua mais proteína na próxima refeição.';
              } else if (menorProgresso === progressos.calorias) {
                return '🍽️ Adicione mais alimentos para atingir sua meta calórica.';
              } else if (menorProgresso === progressos.carboidratos) {
                return '🍞 Inclua carboidratos para ter energia.';
              } else if (menorProgresso === progressos.gordura) {
                return '🥑 Adicione gorduras saudáveis à sua dieta.';
              } else {
                return '✅ Você está indo muito bem! Continue assim!';
              }
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressoNutricional;