import React from 'react';
import Card from '../ui/Card';
import { useWaterLogsInteligente } from '../../hooks/useWaterLogsInteligente';

// Ícones SVG inline para evitar dependência do lucide-react
const DropletsIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.5 14.25v-2.5a6 6 0 1 1 12 0v2.5m-1.5 0h-9a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25Z" />
  </svg>
);

const TargetIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth={2}/>
    <circle cx="12" cy="12" r="6" strokeWidth={2}/>
    <circle cx="12" cy="12" r="2" strokeWidth={2}/>
  </svg>
);

const TrendingUpIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" strokeWidth={2}/>
    <polyline points="16,7 22,7 22,13" strokeWidth={2}/>
  </svg>
);

const ZapIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" strokeWidth={2}/>
  </svg>
);

const AlertTriangleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" strokeWidth={2}/>
    <path d="M12 9v4" strokeWidth={2}/>
    <path d="m12 17 .01 0" strokeWidth={2}/>
  </svg>
);

const CheckCircleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth={2}/>
    <polyline points="22,4 12,14.01 9,11.01" strokeWidth={2}/>
  </svg>
);

export const ProgressoHidratacao: React.FC = () => {
  const { 
    progressoHoje, 
    metasFinais, 
    dicasInteligentes, 
    estatisticasSemana,
    dadosPerfil 
  } = useWaterLogsInteligente();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'baixo': return 'from-red-400 to-red-600';
      case 'normal': return 'from-blue-400 to-blue-600';
      case 'alto': return 'from-green-400 to-green-600';
      case 'excessivo': return 'from-orange-400 to-orange-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'baixo': return <AlertTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'normal': return <DropletsIcon className="w-5 h-5 text-blue-500" />;
      case 'alto': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'excessivo': return <ZapIcon className="w-5 h-5 text-orange-500" />;
      default: return <DropletsIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'baixo': return 'Hidratação Baixa';
      case 'normal': return 'Hidratação Normal';
      case 'alto': return 'Meta Atingida';
      case 'excessivo': return 'Consumo Excessivo';
      default: return 'Hidratação';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Progresso Principal */}
      <Card className="lg:col-span-2 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <div className="p-6">
          {/* Header com Status */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {getStatusIcon(progressoHoje.status)}
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {getStatusText(progressoHoje.status)}
                </h3>
                <p className="text-sm text-gray-600">
                  Meta {metasFinais.fonte === 'automatica' ? 'automática' : 'personalizada'}: {metasFinais.metaCopos} copos
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-700">
                {progressoHoje.consumidoCopos}/{metasFinais.metaCopos}
              </div>
              <div className="text-sm text-gray-600">copos hoje</div>
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progresso: {progressoHoje.percentual}%</span>
              <span>{progressoHoje.faltaML > 0 ? `Faltam ${progressoHoje.faltaML}ml` : 'Meta atingida!'}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${getStatusColor(progressoHoje.status)} transition-all duration-500 ease-out`}
                style={{ width: `${Math.min(100, progressoHoje.percentual)}%` }}
              />
              {progressoHoje.percentual > 100 && (
                <div 
                  className="h-full bg-gradient-to-r from-orange-300 to-orange-500 opacity-60"
                  style={{ 
                    width: `${Math.min(50, progressoHoje.percentual - 100)}%`,
                    marginTop: '-16px'
                  }}
                />
              )}
            </div>
          </div>

          {/* Detalhes da Meta Inteligente */}
          {metasFinais.fonte === 'automatica' && dadosPerfil.peso && (
            <div className="bg-white/60 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <TargetIcon className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Meta Inteligente</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-gray-700">
                <div>
                  <div className="font-medium">Base</div>
                  <div>{Math.round(dadosPerfil.peso * 35)}ml</div>
                </div>
                <div>
                  <div className="font-medium">Atividade</div>
                  <div>+{dadosPerfil.nivelAtividade === 'intenso' || dadosPerfil.nivelAtividade === 'muito_intenso' ? '500ml' : '0ml'}</div>
                </div>
                <div>
                  <div className="font-medium">Clima</div>
                  <div>+{new Date().getMonth() >= 11 || new Date().getMonth() <= 2 ? '300ml' : '0ml'}</div>
                </div>
                <div>
                  <div className="font-medium">Total</div>
                  <div className="font-semibold text-blue-700">{metasFinais.metaML}ml</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Dicas e Estatísticas */}
      <div className="space-y-6">
        {/* Dicas Inteligentes */}
        {dicasInteligentes.length > 0 && (
          <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200">
            <div className="p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <ZapIcon className="w-4 h-4 text-cyan-600" />
                Dicas Inteligentes
              </h4>
              <div className="space-y-3">
                {dicasInteligentes.slice(0, 2).map((dica, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${
                      dica.tipo === 'alerta' ? 'bg-red-50 border-red-400' :
                      dica.tipo === 'parabens' ? 'bg-green-50 border-green-400' :
                      dica.tipo === 'cuidado' ? 'bg-orange-50 border-orange-400' :
                      'bg-blue-50 border-blue-400'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{dica.icone}</span>
                      <div>
                        <div className="font-medium text-sm text-gray-800">{dica.titulo}</div>
                        <div className="text-xs text-gray-600 mt-1">{dica.mensagem}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Estatísticas da Semana */}
        <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200">
          <div className="p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <TrendingUpIcon className="w-4 h-4 text-gray-600" />
              Esta Semana
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center p-2 bg-white/60 rounded">
                <div className="font-medium text-gray-600">Média Diária</div>
                <div className="text-lg font-bold text-blue-700">{estatisticasSemana.mediaCopos}</div>
                <div className="text-xs text-gray-500">copos</div>
              </div>
              <div className="text-center p-2 bg-white/60 rounded">
                <div className="font-medium text-gray-600">Dias Cumpridos</div>
                <div className="text-lg font-bold text-green-700">{estatisticasSemana.diasCumpridos}</div>
                <div className="text-xs text-gray-500">de 7</div>
              </div>
              <div className="text-center p-2 bg-white/60 rounded">
                <div className="font-medium text-gray-600">Melhor Dia</div>
                <div className="text-lg font-bold text-emerald-700">{Math.round(estatisticasSemana.melhorDia / metasFinais.cupSize)}</div>
                <div className="text-xs text-gray-500">copos</div>
              </div>
              <div className="text-center p-2 bg-white/60 rounded">
                <div className="font-medium text-gray-600">Tendência</div>
                <div className={`text-lg font-bold ${
                  estatisticasSemana.tendencia === 'subindo' ? 'text-green-700' :
                  estatisticasSemana.tendencia === 'descendo' ? 'text-red-700' :
                  'text-gray-700'
                }`}>
                  {estatisticasSemana.tendencia === 'subindo' ? '↗️' :
                   estatisticasSemana.tendencia === 'descendo' ? '↘️' : '➡️'}
                </div>
                <div className="text-xs text-gray-500">
                  {estatisticasSemana.tendencia === 'subindo' ? 'Melhorando' :
                   estatisticasSemana.tendencia === 'descendo' ? 'Diminuindo' : 'Estável'}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};