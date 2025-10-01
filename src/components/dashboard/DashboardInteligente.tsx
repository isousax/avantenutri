import React from 'react';
import Card from '../ui/Card';
import { useWaterLogsInteligente } from '../../hooks/useWaterLogsInteligente';
import { useWeightLogsInteligente } from '../../hooks/useWeightLogsInteligente';
import { useMealLogsInteligente } from '../../hooks/useMealLogsInteligente';


// Ícones SVG
const BrainIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const TrendingUpIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" strokeWidth={2}/>
    <polyline points="16,7 22,7 22,13" strokeWidth={2}/>
  </svg>
);

const AlertIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
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

export interface InsightCrossPlataforma {
  tipo: 'correlacao' | 'tendencia' | 'recomendacao' | 'alerta' | 'conquista';
  prioridade: 'alta' | 'media' | 'baixa';
  titulo: string;
  descricao: string;
  icone: string;
  metricas?: string[];
  acao?: string;
}

export const DashboardInteligente: React.FC = () => {
  const agua = useWaterLogsInteligente();
  const peso = useWeightLogsInteligente();
  const nutricao = useMealLogsInteligente();

  // Gerar insights cross-plataforma
  const insights: InsightCrossPlataforma[] = React.useMemo(() => {
    const insights: InsightCrossPlataforma[] = [];

    // 1. Correlação peso x hidratação
    if (peso.logs && peso.logs.length > 7 && agua.summaryDays && agua.summaryDays.length > 7) {
      const pesoDecrescendo = peso.analiseTendencia.direcao === 'descendo';
      const aguaAcimaMeta = agua.progressoHoje.percentual > 90;
      
      if (pesoDecrescendo && aguaAcimaMeta) {
        insights.push({
          tipo: 'correlacao',
          prioridade: 'alta',
          titulo: 'Hidratação Impulsionando Perda de Peso',
          descricao: 'Excelente! Sua boa hidratação está contribuindo para a perda de peso saudável.',
          icone: '💧✨',
          metricas: [`Peso: ${peso.analiseTendencia.direcao}`, `Água: ${agua.progressoHoje.percentual}%`]
        });
      } else if (!pesoDecrescendo && !aguaAcimaMeta && peso.metasFinais.statusSaude !== 'saudavel') {
        insights.push({
          tipo: 'recomendacao',
          prioridade: 'alta',
          titulo: 'Hidratação Pode Acelerar Resultados',
          descricao: 'Aumentar a ingestão de água pode ajudar no metabolismo e na perda de peso.',
          icone: '💧🎯',
          acao: 'Tente beber mais 2-3 copos de água por dia'
        });
      }
    }

    // 2. Análise nutricional x objetivos de peso
    if (nutricao.metasFinais && peso.metasFinais) {
      const caloriasAcimaMeta = nutricao.progressoHoje && nutricao.progressoHoje.calorias > 110;
      const objetivoPerderPeso = peso.metasFinais.pesoMeta < peso.metasFinais.pesoAtual;
      
      if (caloriasAcimaMeta && objetivoPerderPeso) {
        insights.push({
          tipo: 'alerta',
          prioridade: 'alta',
          titulo: 'Calorias Acima da Meta',
          descricao: 'Você está consumindo mais calorias que o recomendado para seu objetivo de perda de peso.',
          icone: '⚠️🍽️',
          acao: 'Revise suas porções nas próximas refeições'
        });
      }
    }

    // 3. Consistência geral
    const pesoRegular = peso.estatisticasAvancadas.regularidade > 70;
    const aguaConsistente = agua.estatisticasSemana.diasCumpridos >= 5;
    const nutricaoAtiva = nutricao.logs && nutricao.logs.length > 5;

    if (pesoRegular && aguaConsistente && nutricaoAtiva) {
      insights.push({
        tipo: 'conquista',
        prioridade: 'media',
        titulo: 'Consistência Exemplar! 🎉',
        descricao: 'Parabéns! Você está mantendo um registro consistente em todas as áreas.',
        icone: '🏆',
        metricas: ['Peso: Regular', 'Água: Consistente', 'Nutrição: Ativa']
      });
    }

    // 4. Padrões de comportamento
    const horaAtual = new Date().getHours();
    if (horaAtual >= 18 && agua.progressoHoje.percentual < 60) {
      insights.push({
        tipo: 'recomendacao',
        prioridade: 'media',
        titulo: 'Hora de Acelerar a Hidratação',
        descricao: 'Já é final do dia e você ainda está abaixo da meta de água.',
        icone: '⏰💧',
        acao: 'Beba pelo menos 2 copos nas próximas horas'
      });
    }

    // 5. Análise de volatilidade
    if (peso.estatisticasAvancadas.volatilidade > 1.5) {
      insights.push({
        tipo: 'recomendacao',
        prioridade: 'media',
        titulo: 'Peso Muito Variável',
        descricao: 'Seu peso está oscilando muito. Isso pode indicar retenção de líquidos ou inconsistência na dieta.',
        icone: '📊⚖️',
        acao: 'Mantenha horários consistentes para pesagem e hidratação'
      });
    }

    // 6. Previsões positivas
    if (peso.predicoes.confianca > 70 && peso.predicoes.tempoParaMeta < 90 && peso.predicoes.tempoParaMeta > 0) {
      insights.push({
        tipo: 'tendencia',
        prioridade: 'baixa',
        titulo: 'Meta de Peso Alcançável',
        descricao: `Com seu ritmo atual, você deve atingir sua meta em aproximadamente ${peso.predicoes.tempoParaMeta} dias.`,
        icone: '🎯📈',
        metricas: [`Confiança: ${peso.predicoes.confianca}%`]
      });
    }

    return insights.sort((a, b) => {
      const prioridadeOrder = { alta: 3, media: 2, baixa: 1 };
      return prioridadeOrder[b.prioridade] - prioridadeOrder[a.prioridade];
    });
  }, [agua, peso, nutricao]);

  // Status geral do usuário
  const statusGeral = React.useMemo(() => {
    const scores = {
      peso: peso.metasFinais.statusSaude === 'saudavel' ? 100 : 
            peso.metasFinais.statusSaude === 'sobrepeso' ? 70 : 
            peso.metasFinais.statusSaude === 'abaixo_peso' ? 80 : 50,
      
      agua: agua.progressoHoje.status === 'alto' ? 100 :
            agua.progressoHoje.status === 'normal' ? 80 :
            agua.progressoHoje.status === 'baixo' ? 40 : 60,
      
      nutricao: nutricao.progressoHoje && nutricao.progressoHoje.calorias >= 80 && nutricao.progressoHoje.calorias <= 120 ? 100 :
                nutricao.progressoHoje && Math.abs(nutricao.progressoHoje.calorias - 100) <= 30 ? 70 : 50
    };

    const scoreGeral = (scores.peso + scores.agua + scores.nutricao) / 3;
    
    let status = 'Precisa Atenção';
    let cor = 'from-red-400 to-red-600';
    
    if (scoreGeral >= 90) {
      status = 'Excelente';
      cor = 'from-green-400 to-green-600';
    } else if (scoreGeral >= 75) {
      status = 'Muito Bom';
      cor = 'from-blue-400 to-blue-600';
    } else if (scoreGeral >= 60) {
      status = 'Bom';
      cor = 'from-yellow-400 to-yellow-600';
    }

    return { status, cor, score: Math.round(scoreGeral) };
  }, [peso.metasFinais.statusSaude, agua.progressoHoje.status, nutricao.progressoHoje]);

  const getInsightIcon = (tipo: string) => {
    switch (tipo) {
      case 'correlacao': return <TrendingUpIcon className="w-4 h-4 text-blue-600" />;
      case 'recomendacao': return <BrainIcon className="w-4 h-4 text-purple-600" />;
      case 'alerta': return <AlertIcon className="w-4 h-4 text-red-600" />;
      case 'conquista': return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      default: return <TrendingUpIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getInsightColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'border-red-200 bg-red-50';
      case 'media': return 'border-yellow-200 bg-yellow-50';
      case 'baixa': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Status Geral */}
      <Card className="lg:col-span-2 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-16 h-16 bg-gradient-to-br ${statusGeral.cor} rounded-2xl flex items-center justify-center shadow-lg`}>
                <span className="text-3xl">🧠</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Status Geral de Saúde</h3>
                <p className="text-sm text-gray-600">Análise inteligente integrada</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-700">{statusGeral.score}%</div>
              <div className="text-sm text-gray-600">{statusGeral.status}</div>
            </div>
          </div>

          {/* Métricas Principais */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-white/60 rounded-lg">
              <div className="text-lg font-bold text-purple-700">⚖️</div>
              <div className="text-sm font-medium text-gray-700">Peso</div>
              <div className="text-xs text-gray-600">{peso.metasFinais.statusSaude}</div>
            </div>
            
            <div className="text-center p-3 bg-white/60 rounded-lg">
              <div className="text-lg font-bold text-blue-700">💧</div>
              <div className="text-sm font-medium text-gray-700">Hidratação</div>
              <div className="text-xs text-gray-600">{agua.progressoHoje.percentual}%</div>
            </div>
            
            <div className="text-center p-3 bg-white/60 rounded-lg">
              <div className="text-lg font-bold text-green-700">🍽️</div>
              <div className="text-sm font-medium text-gray-700">Nutrição</div>
              <div className="text-xs text-gray-600">
                {nutricao.progressoHoje ? `${nutricao.progressoHoje.calorias}%` : 'N/A'}
              </div>
            </div>
          </div>

          {/* Barra de Progresso Geral */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Saúde Geral</span>
              <span>{statusGeral.status}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-full bg-gradient-to-r ${statusGeral.cor} rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${statusGeral.score}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Insights Inteligentes */}
      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
          <div className="p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <BrainIcon className="w-4 h-4 text-violet-600" />
              Insights Inteligentes
            </h4>
            
            {insights.length === 0 ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">🤖</div>
                <p className="text-gray-600 text-sm">Continue registrando para obter insights personalizados!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {insights.slice(0, 5).map((insight, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${getInsightColor(insight.prioridade)}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{insight.icone}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getInsightIcon(insight.tipo)}
                          <span className="font-medium text-sm text-gray-800">{insight.titulo}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            insight.prioridade === 'alta' ? 'bg-red-100 text-red-700' :
                            insight.prioridade === 'media' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {insight.prioridade}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mb-2">{insight.descricao}</div>
                        
                        {insight.metricas && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {insight.metricas.map((metrica, i) => (
                              <span key={i} className="px-2 py-1 bg-white/80 rounded text-xs text-gray-700">
                                {metrica}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {insight.acao && (
                          <div className="text-xs text-indigo-600 font-medium bg-indigo-50 rounded px-2 py-1">
                            💡 {insight.acao}
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
      </div>
    </div>
  );
};