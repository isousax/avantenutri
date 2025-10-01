import { useMemo } from 'react';
// Migrado para reutilizar cache do React Query (useWeightData)
// Mantemos fallback ao hook antigo caso necessário em edge cases
import { useWeightData } from './useWeightData';
import { useWeightLogs } from './useWeightLogs';
import { useMetasAutomaticas } from './useMetasAutomaticas';

export interface MetasPesoInteligentes {
  pesoAtual: number;
  pesoMeta: number;
  fonte: 'automatica' | 'manual';
  tempoEstimado: number; // dias para atingir meta
  taxaRecomendada: number; // kg por semana
  statusSaude: 'saudavel' | 'sobrepeso' | 'obesidade' | 'abaixo_peso';
  imc: number;
}

export interface AnaliseTendencia {
  direcao: 'subindo' | 'descendo' | 'estavel' | 'oscilando';
  velocidade: 'rapida' | 'moderada' | 'lenta';
  consistencia: 'consistente' | 'irregular' | 'muito_irregular';
  confiabilidade: number; // 0-100%
  proximoMilestone: {
    peso: number;
    diasEstimados: number;
    probabilidade: number;
  };
}

export interface AlertasPeso {
  tipo: 'sucesso' | 'atencao' | 'alerta' | 'critico';
  titulo: string;
  mensagem: string;
  icone: string;
  acao?: string;
}

export interface EstatisticasPesoAvancadas {
  mediaUltimos7Dias: number;
  mediaUltimos30Dias: number;
  maiorPerdaConsecutiva: {
    diasPerdendo: number;
    kgPerdidos: number;
    periodo: { inicio: string; fim: string };
  };
  maiorGanhoConsecutivo: {
    diasGanhando: number;
    kgGanhos: number;
    periodo: { inicio: string; fim: string };
  };
  volatilidade: number; // desvio padrão das mudanças diárias
  diasRegistrados: number;
  regularidade: number; // % de dias com registro
}

export interface PredicoesPeso {
  peso30Dias: number;
  peso90Dias: number;
  tempoParaMeta: number; // dias
  confianca: number; // 0-100%
  cenarios: {
    otimista: { peso: number; tempo: number };
    realista: { peso: number; tempo: number };
    pessimista: { peso: number; tempo: number };
  };
}

/**
 * Hook inteligente para análise avançada de peso
 * Combina dados históricos com IA para insights e previsões
 */
export function useWeightLogsInteligente(days: number = 90) {
  // Primeiro tenta usar novo hook com cache compartilhado
  const weightData = useWeightData(Math.min(days, 120));
  // Adaptador para interface antiga esperada mais abaixo
  const weightLogs = weightData.logs.length > 0 || weightData.loading || weightData.error == null ? {
    logs: weightData.logs.map(l => ({ id: l.id, log_date: l.log_date, weight_kg: l.weight_kg, note: l.note, created_at: l.created_at, updated_at: l.updated_at })),
    latest: weightData.latest ? { date: weightData.latest.date, weight_kg: weightData.latest.weight_kg } : null,
    goal: weightData.goal,
    summary: weightData.summary,
    series: weightData.series?.map(s=> ({ date: s.date, weight_kg: s.weight_kg })),
    diff_kg: weightData.diff_kg,
    diff_percent: weightData.diff_percent,
    trend_slope: weightData.trend_slope,
    loading: weightData.loading,
    error: weightData.error,
  } : useWeightLogs(days); // fallback (se nenhum dado e erro anterior)
  const { dadosPerfil, metasCalculadas } = useMetasAutomaticas();

  // Calcular IMC e status de saúde
  const metasFinais: MetasPesoInteligentes = useMemo(() => {
    const pesoAtual = weightLogs.latest?.weight_kg || dadosPerfil.peso || 70;
    const altura = dadosPerfil.altura || 170;
    const imc = pesoAtual / Math.pow(altura / 100, 2);
    
    let statusSaude: MetasPesoInteligentes['statusSaude'] = 'saudavel';
    if (imc < 18.5) statusSaude = 'abaixo_peso';
    else if (imc >= 25 && imc < 30) statusSaude = 'sobrepeso';
    else if (imc >= 30) statusSaude = 'obesidade';

    // Meta de peso inteligente
    let pesoMeta = pesoAtual;
    let fonte: 'automatica' | 'manual' = 'automatica';
    
    if (weightLogs.goal) {
      pesoMeta = weightLogs.goal;
      fonte = 'manual';
    } else {
      // Calcular meta baseada no IMC ideal (22.5)
      const imcIdeal = 22.5;
      const pesoIdeal = imcIdeal * Math.pow(altura / 100, 2);
      
      // Ajustar gradualmente - não mais que 10% do peso atual
      const maxMudanca = pesoAtual * 0.1;
      const diferencaIdeal = pesoIdeal - pesoAtual;
      
      if (Math.abs(diferencaIdeal) <= maxMudanca) {
        pesoMeta = pesoIdeal;
      } else {
        pesoMeta = diferencaIdeal > 0 ? 
          pesoAtual + maxMudanca : 
          pesoAtual - maxMudanca;
      }
    }

    // Taxa recomendada (0.5-1kg por semana é saudável)
    const diferencaPeso = Math.abs(pesoMeta - pesoAtual);
    const taxaRecomendada = Math.min(0.8, diferencaPeso / 4); // kg por semana
    const tempoEstimado = taxaRecomendada > 0 ? Math.ceil(diferencaPeso / (taxaRecomendada / 7)) : 0;

    return {
      pesoAtual,
      pesoMeta,
      fonte,
      tempoEstimado,
      taxaRecomendada,
      statusSaude,
      imc: Math.round(imc * 10) / 10
    };
  }, [weightLogs.latest, weightLogs.goal, dadosPerfil.altura, dadosPerfil.peso]);

  // Análise de tendência avançada
  const analiseTendencia: AnaliseTendencia = useMemo(() => {
    if (!weightLogs.logs || weightLogs.logs.length < 7) {
      return {
        direcao: 'estavel',
        velocidade: 'lenta',
        consistencia: 'irregular',
        confiabilidade: 0,
        proximoMilestone: { peso: metasFinais.pesoAtual, diasEstimados: 0, probabilidade: 0 }
      };
    }

    const logs = [...weightLogs.logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
    // const ultimos14 = logs.slice(-14); // Para futuras análises
    const ultimos7 = logs.slice(-7);

    // Calcular tendência usando regressão linear simples
    const calcularTendencia = (dados: typeof logs) => {
      const n = dados.length;
      const sumX = dados.reduce((acc, _, i) => acc + i, 0);
      const sumY = dados.reduce((acc, log) => acc + log.weight_kg, 0);
      const sumXY = dados.reduce((acc, log, i) => acc + i * log.weight_kg, 0);
      const sumX2 = dados.reduce((acc, _, i) => acc + i * i, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      return slope * 7; // kg por semana
    };

    const tendencia7 = calcularTendencia(ultimos7);
    // const tendencia14 = calcularTendencia(ultimos14); // Para futuras melhorias

    // Determinar direção
    let direcao: AnaliseTendencia['direcao'] = 'estavel';
    if (Math.abs(tendencia7) > 0.1) {
      direcao = tendencia7 > 0 ? 'subindo' : 'descendo';
    }
    
    // Verificar oscilação
    const mudancasDiarias = logs.slice(1).map((log, i) => log.weight_kg - logs[i].weight_kg);
    const mudasPositivas = mudancasDiarias.filter(m => m > 0).length;
    const mudasNegativas = mudancasDiarias.filter(m => m < 0).length;
    
    if (mudasPositivas > 0 && mudasNegativas > 0 && Math.abs(mudasPositivas - mudasNegativas) < 2) {
      direcao = 'oscilando';
    }

    // Velocidade
    let velocidade: AnaliseTendencia['velocidade'] = 'lenta';
    const velocidadeAbs = Math.abs(tendencia7);
    if (velocidadeAbs > 0.8) velocidade = 'rapida';
    else if (velocidadeAbs > 0.3) velocidade = 'moderada';

    // Consistência
    const variancia = mudancasDiarias.reduce((acc, m) => acc + Math.pow(m, 2), 0) / mudancasDiarias.length;
    let consistencia: AnaliseTendencia['consistencia'] = 'consistente';
    if (variancia > 1) consistencia = 'muito_irregular';
    else if (variancia > 0.3) consistencia = 'irregular';

    // Confiabilidade baseada na quantidade de dados e consistência
    const confiabilidade = Math.min(100, 
      (logs.length / 30) * 50 + // 50% baseado na quantidade de dados
      (consistencia === 'consistente' ? 50 : 
       consistencia === 'irregular' ? 25 : 0) // 50% baseado na consistência
    );

    // Próximo milestone
    const diferencaParaMeta = metasFinais.pesoMeta - metasFinais.pesoAtual;
    const proximoMilestone = {
      peso: metasFinais.pesoMeta,
      diasEstimados: tendencia7 !== 0 ? Math.abs(diferencaParaMeta / (tendencia7 / 7)) : 999,
      probabilidade: Math.max(0, Math.min(100, confiabilidade - (Math.abs(diferencaParaMeta) * 10)))
    };

    return {
      direcao,
      velocidade,
      consistencia,
      confiabilidade: Math.round(confiabilidade),
      proximoMilestone
    };
  }, [weightLogs.logs, metasFinais]);

  // Alertas inteligentes
  const alertas: AlertasPeso[] = useMemo(() => {
    const alertas: AlertasPeso[] = [];

    // Alerta de IMC
    if (metasFinais.statusSaude === 'obesidade') {
      alertas.push({
        tipo: 'critico',
        titulo: 'IMC Elevado',
        mensagem: `Seu IMC (${metasFinais.imc}) indica obesidade. Considere consultar um profissional de saúde.`,
        icone: '⚠️',
        acao: 'Buscar orientação médica'
      });
    } else if (metasFinais.statusSaude === 'sobrepeso') {
      alertas.push({
        tipo: 'atencao',
        titulo: 'IMC Acima do Ideal',
        mensagem: `Seu IMC (${metasFinais.imc}) indica sobrepeso. Meta: reduzir para zona saudável.`,
        icone: '📊',
        acao: 'Planejar redução gradual'
      });
    } else if (metasFinais.statusSaude === 'abaixo_peso') {
      alertas.push({
        tipo: 'atencao',
        titulo: 'IMC Abaixo do Ideal',
        mensagem: `Seu IMC (${metasFinais.imc}) está baixo. Considere ganho de peso saudável.`,
        icone: '📈'
      });
    }

    // Alerta de tendência
    if (analiseTendencia.velocidade === 'rapida') {
      const tipo = analiseTendencia.direcao === 'subindo' ? 'atencao' : 'alerta';
      alertas.push({
        tipo,
        titulo: 'Mudança Rápida de Peso',
        mensagem: `Peso ${analiseTendencia.direcao === 'subindo' ? 'aumentando' : 'diminuindo'} rapidamente. Verifique se é intencional.`,
        icone: analiseTendencia.direcao === 'subindo' ? '📈' : '📉'
      });
    }

    // Alerta de irregularidade
    if (analiseTendencia.consistencia === 'muito_irregular') {
      alertas.push({
        tipo: 'atencao',
        titulo: 'Peso Muito Irregular',
        mensagem: 'Suas pesagens estão muito irregulares. Tente manter rotina consistente.',
        icone: '📊'
      });
    }

    // Sucesso na meta
    if (Math.abs(metasFinais.pesoAtual - metasFinais.pesoMeta) < 1) {
      alertas.push({
        tipo: 'sucesso',
        titulo: 'Meta Quase Alcançada!',
        mensagem: `Você está muito próximo da sua meta de ${metasFinais.pesoMeta}kg!`,
        icone: '🎯'
      });
    }

    return alertas;
  }, [metasFinais, analiseTendencia]);

  // Estatísticas avançadas
  const estatisticasAvancadas: EstatisticasPesoAvancadas = useMemo(() => {
    if (!weightLogs.logs || weightLogs.logs.length === 0) {
      return {
        mediaUltimos7Dias: 0,
        mediaUltimos30Dias: 0,
        maiorPerdaConsecutiva: { diasPerdendo: 0, kgPerdidos: 0, periodo: { inicio: '', fim: '' } },
        maiorGanhoConsecutivo: { diasGanhando: 0, kgGanhos: 0, periodo: { inicio: '', fim: '' } },
        volatilidade: 0,
        diasRegistrados: 0,
        regularidade: 0
      };
    }

    const logs = [...weightLogs.logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
    
    // Médias
    const ultimos7 = logs.slice(-7);
    const ultimos30 = logs.slice(-30);
    const mediaUltimos7Dias = ultimos7.reduce((acc, log) => acc + log.weight_kg, 0) / ultimos7.length;
    const mediaUltimos30Dias = ultimos30.reduce((acc, log) => acc + log.weight_kg, 0) / ultimos30.length;

    // Análise de sequências
    let maiorPerdaConsecutiva = { diasPerdendo: 0, kgPerdidos: 0, periodo: { inicio: '', fim: '' } };
    let maiorGanhoConsecutivo = { diasGanhando: 0, kgGanhos: 0, periodo: { inicio: '', fim: '' } };
    
    let perdaAtual = { dias: 0, kg: 0, inicio: '' };
    let ganhoAtual = { dias: 0, kg: 0, inicio: '' };

    for (let i = 1; i < logs.length; i++) {
      const mudanca = logs[i].weight_kg - logs[i-1].weight_kg;
      
      if (mudanca < 0) { // Perdendo peso
        if (perdaAtual.dias === 0) perdaAtual.inicio = logs[i-1].log_date;
        perdaAtual.dias++;
        perdaAtual.kg += Math.abs(mudanca);
        
        // Reset ganho
        if (ganhoAtual.dias > maiorGanhoConsecutivo.diasGanhando) {
          maiorGanhoConsecutivo = {
            diasGanhando: ganhoAtual.dias,
            kgGanhos: ganhoAtual.kg,
            periodo: { inicio: ganhoAtual.inicio, fim: logs[i-1].log_date }
          };
        }
        ganhoAtual = { dias: 0, kg: 0, inicio: '' };
      } else if (mudanca > 0) { // Ganhando peso
        if (ganhoAtual.dias === 0) ganhoAtual.inicio = logs[i-1].log_date;
        ganhoAtual.dias++;
        ganhoAtual.kg += mudanca;
        
        // Reset perda
        if (perdaAtual.dias > maiorPerdaConsecutiva.diasPerdendo) {
          maiorPerdaConsecutiva = {
            diasPerdendo: perdaAtual.dias,
            kgPerdidos: perdaAtual.kg,
            periodo: { inicio: perdaAtual.inicio, fim: logs[i-1].log_date }
          };
        }
        perdaAtual = { dias: 0, kg: 0, inicio: '' };
      }
    }

    // Check final sequences
    if (perdaAtual.dias > maiorPerdaConsecutiva.diasPerdendo) {
      maiorPerdaConsecutiva = {
        diasPerdendo: perdaAtual.dias,
        kgPerdidos: perdaAtual.kg,
        periodo: { inicio: perdaAtual.inicio, fim: logs[logs.length - 1].log_date }
      };
    }
    if (ganhoAtual.dias > maiorGanhoConsecutivo.diasGanhando) {
      maiorGanhoConsecutivo = {
        diasGanhando: ganhoAtual.dias,
        kgGanhos: ganhoAtual.kg,
        periodo: { inicio: ganhoAtual.inicio, fim: logs[logs.length - 1].log_date }
      };
    }

    // Volatilidade (desvio padrão das mudanças diárias)
    const mudancasDiarias = logs.slice(1).map((log, i) => log.weight_kg - logs[i].weight_kg);
    const mediaMudancas = mudancasDiarias.reduce((acc, m) => acc + m, 0) / mudancasDiarias.length;
    const variancia = mudancasDiarias.reduce((acc, m) => acc + Math.pow(m - mediaMudancas, 2), 0) / mudancasDiarias.length;
    const volatilidade = Math.sqrt(variancia);

    // Regularidade (assumindo que deveria ter registros diários)
    const diasTotais = Math.ceil((new Date(logs[logs.length - 1].log_date).getTime() - new Date(logs[0].log_date).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const regularidade = (logs.length / diasTotais) * 100;

    return {
      mediaUltimos7Dias: Math.round(mediaUltimos7Dias * 10) / 10,
      mediaUltimos30Dias: Math.round(mediaUltimos30Dias * 10) / 10,
      maiorPerdaConsecutiva,
      maiorGanhoConsecutivo,
      volatilidade: Math.round(volatilidade * 100) / 100,
      diasRegistrados: logs.length,
      regularidade: Math.round(regularidade)
    };
  }, [weightLogs.logs]);

  // Previsões usando tendência atual
  const predicoes: PredicoesPeso = useMemo(() => {
    if (!weightLogs.logs || weightLogs.logs.length < 7) {
      return {
        peso30Dias: metasFinais.pesoAtual,
        peso90Dias: metasFinais.pesoAtual,
        tempoParaMeta: 999,
        confianca: 0,
        cenarios: {
          otimista: { peso: metasFinais.pesoAtual, tempo: 999 },
          realista: { peso: metasFinais.pesoAtual, tempo: 999 },
          pessimista: { peso: metasFinais.pesoAtual, tempo: 999 }
        }
      };
    }

    const logs = [...weightLogs.logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
    const ultimos14 = logs.slice(-14);

    // Calcular tendência (kg por dia)
    const n = ultimos14.length;
    const sumX = ultimos14.reduce((acc, _, i) => acc + i, 0);
    const sumY = ultimos14.reduce((acc, log) => acc + log.weight_kg, 0);
    const sumXY = ultimos14.reduce((acc, log, i) => acc + i * log.weight_kg, 0);
    const sumX2 = ultimos14.reduce((acc, _, i) => acc + i * i, 0);
    
    const tendenciaDiaria = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    const peso30Dias = metasFinais.pesoAtual + (tendenciaDiaria * 30);
    const peso90Dias = metasFinais.pesoAtual + (tendenciaDiaria * 90);

    const diferencaParaMeta = metasFinais.pesoMeta - metasFinais.pesoAtual;
    const tempoParaMeta = tendenciaDiaria !== 0 ? Math.abs(diferencaParaMeta / tendenciaDiaria) : 999;

    // Confiança baseada na consistência e quantidade de dados
    const confianca = Math.min(100, analiseTendencia.confiabilidade);

    // Cenários
    const variacao = estatisticasAvancadas.volatilidade * 2; // 2 desvios padrão
    const cenarios = {
      otimista: {
        peso: peso30Dias + (diferencaParaMeta > 0 ? variacao : -variacao),
        tempo: Math.max(1, tempoParaMeta * 0.7)
      },
      realista: {
        peso: peso30Dias,
        tempo: tempoParaMeta
      },
      pessimista: {
        peso: peso30Dias + (diferencaParaMeta > 0 ? -variacao : variacao),
        tempo: tempoParaMeta * 1.5
      }
    };

    return {
      peso30Dias: Math.round(peso30Dias * 10) / 10,
      peso90Dias: Math.round(peso90Dias * 10) / 10,
      tempoParaMeta: Math.round(tempoParaMeta),
      confianca: Math.round(confianca),
      cenarios
    };
  }, [weightLogs.logs, metasFinais, analiseTendencia.confiabilidade, estatisticasAvancadas.volatilidade]);

  return {
    // Dados básicos do hook original
    ...weightLogs,
    
    // Análises inteligentes
    metasFinais,
    analiseTendencia,
    alertas,
    estatisticasAvancadas,
    predicoes,
    metasCalculadas,
    dadosPerfil
  };
}