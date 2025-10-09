import React from 'react';
import Card from '../ui/Card';
import { useWeightLogsInteligente } from '../../hooks/useWeightLogsInteligente';
import { WeightIcon } from './icon';
import { inferWeightObjective, WEIGHT_TOLERANCE_KG } from '../../utils/weightObjective';


// Ícones SVG
const TrendingUpIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" strokeWidth={2}/>
    <polyline points="16,7 22,7 22,13" strokeWidth={2}/>
  </svg>
);

const TrendingDownIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polyline points="22,17 13.5,8.5 8.5,13.5 2,7" strokeWidth={2}/>
    <polyline points="16,17 22,17 22,11" strokeWidth={2}/>
  </svg>
);

const TargetIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth={2}/>
    <circle cx="12" cy="12" r="6" strokeWidth={2}/>
    <circle cx="12" cy="12" r="2" strokeWidth={2}/>
  </svg>
);

const AlertIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" strokeWidth={2}/>
    <path d="M12 9v4" strokeWidth={2}/>
    <path d="m12 17 .01 0" strokeWidth={2}/>
  </svg>
);

const ActivityIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" strokeWidth={2}/>
  </svg>
);

export const AnalisePesoInteligente: React.FC = () => {
  const { 
    metasFinais, 
    analiseTendencia, 
    alertas, 
    estatisticasAvancadas, 
    predicoes,
    logs
  } = useWeightLogsInteligente();

  // Objetivo do usuário em relação ao peso
  const objetivo = React.useMemo(() => inferWeightObjective(metasFinais?.pesoMeta, metasFinais?.pesoAtual, WEIGHT_TOLERANCE_KG), [metasFinais?.pesoMeta, metasFinais?.pesoAtual]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'saudavel': return 'from-green-400 to-green-600';
      case 'sobrepeso': return 'from-yellow-400 to-orange-500';
      case 'obesidade': return 'from-red-400 to-red-600';
      case 'abaixo_peso': return 'from-blue-400 to-blue-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'saudavel': return 'Peso Saudável';
      case 'sobrepeso': return 'Sobrepeso';
      case 'obesidade': return 'Obesidade';
      case 'abaixo_peso': return 'Abaixo do Peso';
      default: return 'Analisando';
    }
  };

  const getTendenciaIcon = (direcao: string) => {
    // Cores baseadas no objetivo: ganhar -> subir verde, perder -> descer verde, manter -> oscilação/variação leve amarela
    if (direcao === 'oscilando') return <ActivityIcon className="w-5 h-5 text-yellow-500" />;
    if (direcao === 'subindo') {
      const cls = objetivo === 'gain' ? 'text-green-500' : objetivo === 'lose' ? 'text-red-500' : 'text-amber-500';
      return <TrendingUpIcon className={`w-5 h-5 ${cls}`} />;
    }
    if (direcao === 'descendo') {
      const cls = objetivo === 'lose' ? 'text-green-500' : objetivo === 'gain' ? 'text-red-500' : 'text-amber-500';
      return <TrendingDownIcon className={`w-5 h-5 ${cls}`} />;
    }
    return <div className="w-5 h-5 bg-gray-400 rounded-full" />;
  };

  const getTendenciaColor = (direcao: string) => {
    if (direcao === 'oscilando') return 'text-yellow-600 bg-yellow-50';
    if (direcao === 'subindo') return objetivo === 'gain' ? 'text-green-600 bg-green-50' : objetivo === 'lose' ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50';
    if (direcao === 'descendo') return objetivo === 'lose' ? 'text-green-600 bg-green-50' : objetivo === 'gain' ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getConsistenciaLabel = (cons: string) => {
    switch (cons) {
      case 'consistente': return 'Consistente';
      case 'irregular': return 'Irregular';
      case 'muito_irregular': return 'Muito irregular';
      default: return '—';
    }
  };

  if (!logs || logs.length < 3) {
    return (
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
        <div className="p-6 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Análise Inteligente Indisponível</h3>
          <p className="text-gray-600">Registre pelo menos 3 pesagens para ver análises avançadas.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Status Principal e IMC */}
      <Card className="lg:col-span-2 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <div className="p-1">
          {/* Header com Status */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-16 h-16 bg-gradient-to-br ${getStatusColor(metasFinais.statusSaude)} rounded-2xl flex items-center justify-center shadow-lg`}>
                <WeightIcon className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {getStatusText(metasFinais.statusSaude)}
                </h3>
                <p className="text-sm text-gray-600">
                  IMC: {metasFinais.imc} • {metasFinais.pesoAtual}kg
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-700">
                {metasFinais.pesoMeta}kg
              </div>
              
            </div>
          </div>

          {/* Progresso para Meta */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>Progresso para Meta</span>
              <span>
                {Math.abs(metasFinais.pesoAtual - metasFinais.pesoMeta) < 0.5 ? 
                  'Meta atingida!' : 
                  `Faltam ${Math.abs(metasFinais.pesoAtual - metasFinais.pesoMeta).toFixed(1)}kg`}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${getStatusColor(metasFinais.statusSaude)} transition-all duration-500 ease-out`}
                style={{ 
                  width: `${Math.min(100, Math.max(0, 100 - (Math.abs(metasFinais.pesoAtual - metasFinais.pesoMeta) / metasFinais.pesoAtual * 100)))}%` 
                }}
              />
            </div>
          </div>

          {/* Análise de Tendência */}
          <div className="bg-white/60 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <TargetIcon className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-purple-800">Análise de Tendência</span>
              <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${getTendenciaColor(analiseTendencia.direcao)}`}>
                {analiseTendencia.confiabilidade}% confiável
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="text-center p-2 bg-white/80 rounded">
                <div className="flex items-center justify-center mb-1">
                  {getTendenciaIcon(analiseTendencia.direcao)}
                </div>
                <div className="font-medium capitalize">{analiseTendencia.direcao}</div>
                <div className="text-gray-600">{analiseTendencia.velocidade}</div>
              </div>
              
              <div className="text-center p-2 bg-white/80 rounded">
                <div className="font-medium text-blue-700">
                  {predicoes.peso30Dias.toFixed(1)}kg
                </div>
                <div className="text-gray-600">Em 30 dias</div>
              </div>
              
              <div className="text-center p-2 bg-white/80 rounded">
                <div className="font-medium text-green-700">
                  {predicoes.tempoParaMeta < 999 ? `${predicoes.tempoParaMeta}d` : '—'}
                </div>
                <div className="text-gray-600">Para meta</div>
              </div>
              
              <div className="text-center p-2 bg-white/80 rounded">
                <div className="font-medium text-purple-700">
                  {getConsistenciaLabel(analiseTendencia.consistencia)}
                </div>
                <div className="text-gray-600">Consistência</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Alertas e Estatísticas */}
      <div className="space-y-6">
        {/* Alertas Inteligentes */}
        {alertas.length > 0 && (
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <div className="p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <AlertIcon className="w-4 h-4 text-amber-600" />
                Alertas
              </h4>
              <div className="space-y-3">
                {alertas.slice(0, 2).map((alerta, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${
                      alerta.tipo === 'critico' ? 'bg-red-50 border-red-400' :
                      alerta.tipo === 'alerta' ? 'bg-orange-50 border-orange-400' :
                      alerta.tipo === 'atencao' ? 'bg-yellow-50 border-yellow-400' :
                      'bg-green-50 border-green-400'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{alerta.icone}</span>
                      <div>
                        <div className="font-medium text-sm text-gray-800">{alerta.titulo}</div>
                        <div className="text-xs text-gray-600 mt-1">{alerta.mensagem}</div>
                        {alerta.acao && (
                          <div className="text-xs text-blue-600 mt-2 font-medium">{alerta.acao}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Estatísticas Avançadas */}
        <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200">
          <div className="p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-gray-600" />
              Estatísticas Avançadas
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center p-2 bg-white/60 rounded">
                <div className="font-medium text-gray-600">Média 7d</div>
                <div className="text-lg font-bold text-blue-700">
                  {estatisticasAvancadas.mediaUltimos7Dias}kg
                </div>
              </div>
              
              <div className="text-center p-2 bg-white/60 rounded">
                <div className="font-medium text-gray-600">Volatilidade</div>
                <div className="text-lg font-bold text-yellow-700">
                  ±{estatisticasAvancadas.volatilidade}kg
                </div>
              </div>
              
              <div className="text-center p-2 bg-white/60 rounded">
                <div className="font-medium text-gray-600">Regularidade</div>
                <div className="text-lg font-bold text-green-700">
                  {estatisticasAvancadas.regularidade}%
                </div>
              </div>
              
              <div className="text-center p-2 bg-white/60 rounded">
                <div className="font-medium text-gray-600">Registros</div>
                <div className="text-lg font-bold text-purple-700">
                  {estatisticasAvancadas.diasRegistrados}
                </div>
              </div>
            </div>

            {/* Sequências Notáveis */}
            {(estatisticasAvancadas.maiorPerdaConsecutiva.diasPerdendo > 0 || 
              estatisticasAvancadas.maiorGanhoConsecutivo.diasGanhando > 0) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h5 className="text-xs font-medium text-gray-700 mb-2">Sequências Notáveis</h5>
                
                {estatisticasAvancadas.maiorPerdaConsecutiva.diasPerdendo > 0 && (
                  <div className="bg-green-50 rounded p-2 mb-2">
                    <div className="text-xs">
                      <span className="font-medium text-green-700">Maior perda:</span>
                      <span className="text-green-600">
                        {' '}{estatisticasAvancadas.maiorPerdaConsecutiva.kgPerdidos.toFixed(1)}kg em {estatisticasAvancadas.maiorPerdaConsecutiva.diasPerdendo} dias
                      </span>
                    </div>
                  </div>
                )}
                
                {estatisticasAvancadas.maiorGanhoConsecutivo.diasGanhando > 0 && (
                  <div className="bg-red-50 rounded p-2">
                    <div className="text-xs">
                      <span className="font-medium text-red-700">Maior ganho:</span>
                      <span className="text-red-600">
                        {' '}{estatisticasAvancadas.maiorGanhoConsecutivo.kgGanhos.toFixed(1)}kg em {estatisticasAvancadas.maiorGanhoConsecutivo.diasGanhando} dias
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};