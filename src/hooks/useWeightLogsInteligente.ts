import { useMemo } from 'react';
// Migrado para reutilizar cache do React Query (useWeightData)
// Mantemos fallback ao hook antigo caso necessário em edge cases
import { useWeightData } from './useWeightData';
import { useWeightLogs } from './useWeightLogs';
import { useMetasAutomaticas } from './useMetasAutomaticas';
import { WEIGHT_TOLERANCE_KG } from '../utils/weightObjective';

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
  // Hooks (sempre na mesma ordem)
  const weightData = useWeightData(Math.min(days, 120));
  const weightLogsLegacy = useWeightLogs(days); // fallback disponível sem quebrar regras de Hooks

  // Adaptador para interface antiga esperada mais abaixo
  const weightLogs = (weightData.logs.length > 0 || weightData.loading || weightData.error == null) ? {
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
  } : weightLogsLegacy; // usa legado somente se necessário
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
    if (!weightLogs.logs || weightLogs.logs.length < 5) {
      return {
        direcao: 'estavel',
        velocidade: 'lenta',
        consistencia: 'irregular',
        confiabilidade: 0,
        proximoMilestone: { peso: metasFinais.pesoAtual, diasEstimados: 0, probabilidade: 0 }
      };
    }

    const logsOrdenados = [...weightLogs.logs]
      .sort((a, b) => a.log_date.localeCompare(b.log_date));
    // Deduplicar por dia para evitar múltiplos registros no mesmo dia afetarem a regressão
    const vistos = new Set<string>();
    const logs = logsOrdenados.filter(l => {
      if (vistos.has(l.log_date)) return false;
      vistos.add(l.log_date);
      return true;
    });

    const janela = Math.max(5, Math.min(30, Math.floor(logs.length))); // entre 5 e 30 pontos
    const pontos = logs.slice(-janela);

    // Converter datas em dias relativos (x) e pesos (y)
    const t0 = new Date(`${pontos[0].log_date}T00:00:00`).getTime();
    const xs = pontos.map(p => (new Date(`${p.log_date}T00:00:00`).getTime() - t0) / (1000 * 60 * 60 * 24));
    const ys = pontos.map(p => p.weight_kg);

    const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const xBar = mean(xs);
    const yBar = mean(ys);
    const covXY = xs.reduce((acc, x, i) => acc + (x - xBar) * (ys[i] - yBar), 0);
    const varX = xs.reduce((acc, x) => acc + (x - xBar) ** 2, 0);
    const slopePerDay = varX !== 0 ? (covXY / varX) : 0; // kg por dia
    const intercept = yBar - slopePerDay * xBar;
    const yHat = xs.map(x => intercept + slopePerDay * x);
    const ssRes = yHat.reduce((acc, y, i) => acc + (ys[i] - y) ** 2, 0);
    const ssTot = ys.reduce((acc, y) => acc + (y - yBar) ** 2, 0);
    const r2 = ssTot !== 0 ? Math.max(0, Math.min(1, 1 - ssRes / ssTot)) : 0;

    const tendenciaSemana = slopePerDay * 7; // kg/semana

    // Direção
    let direcao: AnaliseTendencia['direcao'] = 'estavel';
    const limiarSemana = 0.1; // kg/semana
    if (Math.abs(tendenciaSemana) > limiarSemana) {
      direcao = tendenciaSemana > 0 ? 'subindo' : 'descendo';
    }

    // Verificar oscilação via mudanças de sinal
    const mudancasDiarias = logs.slice(1).map((log, i) => log.weight_kg - logs[i].weight_kg);
    const mudasPositivas = mudancasDiarias.filter(m => m > 0).length;
    const mudasNegativas = mudancasDiarias.filter(m => m < 0).length;
    if (mudasPositivas > 0 && mudasNegativas > 0 && Math.abs(mudasPositivas - mudasNegativas) < 2) {
      direcao = 'oscilando';
    }

    // Velocidade
    let velocidade: AnaliseTendencia['velocidade'] = 'lenta';
    const velAbs = Math.abs(tendenciaSemana);
    if (velAbs > 0.8) velocidade = 'rapida';
    else if (velAbs > 0.3) velocidade = 'moderada';

    // Consistência combinando r2 e variância das mudanças
    const varianciaMud = mudancasDiarias.reduce((acc, m) => acc + (m * m), 0) / Math.max(1, mudancasDiarias.length);
    let consistencia: AnaliseTendencia['consistencia'] = 'consistente';
    if (r2 < 0.3 || varianciaMud > 1) consistencia = 'muito_irregular';
    else if (r2 < 0.6 || varianciaMud > 0.3) consistencia = 'irregular';

  // Confiabilidade: datas suficientes + qualidade do ajuste + consistência
  const n = xs.length;
  const fatorDados = Math.min(1, n / 30); // até 30 pontos
    const fatorAjuste = r2; // 0..1
    const fatorConsistencia = consistencia === 'consistente' ? 1 : consistencia === 'irregular' ? 0.5 : 0.2;
    const confiabilidade = Math.round(
      Math.max(0, Math.min(100, (fatorDados * 40 + fatorAjuste * 40 + fatorConsistencia * 20)))
    );

    // Próximo milestone (meta)
    const diferencaParaMeta = metasFinais.pesoMeta - metasFinais.pesoAtual;
    const direcaoNecessaria = Math.sign(diferencaParaMeta); // 1 ganhar, -1 perder
    const alinhado = Math.sign(tendenciaSemana || 0) === direcaoNecessaria && Math.abs(tendenciaSemana) > limiarSemana;
    const confiavel = confiabilidade >= 35; // mínimo para estimar
    const diasEstimados = (alinhado && confiavel)
      ? Math.max(1, Math.round(Math.abs(diferencaParaMeta) / Math.abs(slopePerDay)))
      : 999;
    const probabilidade = Math.max(0, Math.min(100, confiabilidade - Math.max(0, (varianciaMud - 0.3)) * 30));

    return {
      direcao,
      velocidade,
      consistencia,
      confiabilidade,
      proximoMilestone: {
        peso: metasFinais.pesoMeta,
        diasEstimados,
        probabilidade: Math.round(probabilidade)
      }
    };
  }, [weightLogs.logs, metasFinais]);

  // Alertas inteligentes
  const alertas: AlertasPeso[] = useMemo(() => {
    const lista: AlertasPeso[] = [];

    // Sucesso/Proximidade da meta com tolerância
    const diff = Math.abs(metasFinais.pesoAtual - metasFinais.pesoMeta);
    if (diff <= WEIGHT_TOLERANCE_KG) {
      lista.push({
        tipo: 'sucesso',
        titulo: 'Meta Atingida! 🎉',
        mensagem: `Você alcançou sua meta de ${metasFinais.pesoMeta}kg. Excelente!`,
        icone: '🎯'
      });
    } else if (diff <= Math.max(1, WEIGHT_TOLERANCE_KG * 2)) {
      lista.push({
        tipo: 'atencao',
        titulo: 'Meta Quase Alcançada!',
        mensagem: `Faltam apenas ${diff.toFixed(1)}kg para sua meta de ${metasFinais.pesoMeta}kg. Mantenha o ritmo!`,
        icone: '🏁'
      });
    }

    // Alerta de IMC
    if (metasFinais.statusSaude === 'obesidade') {
      lista.push({
        tipo: 'critico',
        titulo: 'IMC Elevado',
        mensagem: `Seu IMC (${metasFinais.imc}) indica obesidade. Considere consultar um profissional de saúde.`,
        icone: '⚠️',
        acao: 'Buscar orientação médica'
      });
    } else if (metasFinais.statusSaude === 'sobrepeso') {
      lista.push({
        tipo: 'atencao',
        titulo: 'IMC Acima do Ideal',
        mensagem: `Seu IMC (${metasFinais.imc}) indica sobrepeso. Meta: reduzir para zona saudável.`,
        icone: '📊',
        acao: 'Planejar redução gradual'
      });
    } else if (metasFinais.statusSaude === 'abaixo_peso') {
      lista.push({
        tipo: 'atencao',
        titulo: 'IMC Abaixo do Ideal',
        mensagem: `Seu IMC (${metasFinais.imc}) está baixo. Considere ganho de peso saudável.`,
        icone: '📈'
      });
    }

    // Alerta de tendência (objetivo-aware)
    const precisaSubir = metasFinais.pesoMeta > metasFinais.pesoAtual + WEIGHT_TOLERANCE_KG;
    const precisaDescer = metasFinais.pesoMeta < metasFinais.pesoAtual - WEIGHT_TOLERANCE_KG;
    if (analiseTendencia.velocidade === 'rapida') {
      if ((analiseTendencia.direcao === 'subindo' && precisaDescer) || (analiseTendencia.direcao === 'descendo' && precisaSubir)) {
        // Rápido na direção contrária ao objetivo
        lista.push({
          tipo: 'alerta',
          titulo: 'Tendência Contrária à Meta',
          mensagem: `Seu peso está ${analiseTendencia.direcao === 'subindo' ? 'subindo' : 'descendo'} rapidamente, indo contra seu objetivo. Reavalie alimentação e rotina.`,
          icone: analiseTendencia.direcao === 'subindo' ? '📈' : '📉'
        });
      } else {
        // Rápido na direção alinhada — atenção para saúde/segurança
        lista.push({
          tipo: 'atencao',
          titulo: 'Mudança Rápida de Peso',
          mensagem: `Peso ${analiseTendencia.direcao === 'subindo' ? 'aumentando' : 'diminuindo'} rapidamente. Verifique se é intencional e saudável.`,
          icone: analiseTendencia.direcao === 'subindo' ? '📈' : '📉'
        });
      }
    }

    // Alerta de irregularidade
    if (analiseTendencia.consistencia === 'muito_irregular') {
      lista.push({
        tipo: 'atencao',
        titulo: 'Peso Muito Irregular',
        mensagem: 'Suas pesagens estão muito irregulares. Tente manter rotina consistente.',
        icone: '📊'
      });
    }

    // Ordenar por severidade (critico > alerta > atencao > sucesso), mas priorizar sucesso se presente
    const severidade = { critico: 3, alerta: 2, atencao: 1, sucesso: 0 } as const;
    lista.sort((a, b) => severidade[b.tipo] - severidade[a.tipo]);
    const temSucesso = lista.find(l => l.tipo === 'sucesso');
    if (temSucesso) {
      // Garante que sucesso apareça no topo visualmente quando fatiado na UI
      const semSucesso = lista.filter(l => l.tipo !== 'sucesso');
      return [temSucesso, ...semSucesso];
    }
    return lista;
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
  const firstDay = new Date(`${logs[0].log_date}T00:00:00`).getTime();
  const lastDay = new Date(`${logs[logs.length - 1].log_date}T00:00:00`).getTime();
  const diasTotais = Math.ceil((lastDay - firstDay) / (1000 * 60 * 60 * 24)) + 1;
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
    if (!weightLogs.logs || weightLogs.logs.length < 5) {
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

    // Reutilizar mesma preparação de dados da análise
    const logsOrdenados = [...weightLogs.logs].sort((a, b) => a.log_date.localeCompare(b.log_date));
    const vistos = new Set<string>();
    const logsUnicos = logsOrdenados.filter(l => {
      if (vistos.has(l.log_date)) return false;
      vistos.add(l.log_date);
      return true;
    });
    const janela = Math.max(5, Math.min(30, Math.floor(logsUnicos.length)));
    const pts = logsUnicos.slice(-janela);
    const t0 = new Date(`${pts[0].log_date}T00:00:00`).getTime();
    const xs = pts.map(p => (new Date(`${p.log_date}T00:00:00`).getTime() - t0) / (1000 * 60 * 60 * 24));
  const ys = pts.map(p => p.weight_kg);
    const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const xBar = mean(xs);
    const yBar = mean(ys);
    const covXY = xs.reduce((acc, x, i) => acc + (x - xBar) * (ys[i] - yBar), 0);
    const varX = xs.reduce((acc, x) => acc + (x - xBar) ** 2, 0);
    const slopePerDay = varX !== 0 ? (covXY / varX) : 0;

    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const slopeWeek = clamp(slopePerDay * 7, -1.2, 1.2); // limitar a ±1.2 kg/semana
    const peso30Dias = metasFinais.pesoAtual + (slopePerDay * 30);
    const peso90Dias = metasFinais.pesoAtual + (slopePerDay * 90);

    const diferencaParaMeta = metasFinais.pesoMeta - metasFinais.pesoAtual;
    const direcaoNecessaria = Math.sign(diferencaParaMeta);
    const alinhado = Math.sign(slopeWeek || 0) === direcaoNecessaria && Math.abs(slopeWeek) >= 0.14; // ~0.02 kg/dia

    const confianca = Math.min(100, analiseTendencia.confiabilidade);
    const confiavel = confianca >= 35;
    const tempoParaMeta = (alinhado && confiavel && slopePerDay !== 0)
      ? Math.max(1, Math.round(Math.abs(diferencaParaMeta) / Math.abs(slopePerDay)))
      : 999;

    const variacao = estatisticasAvancadas.volatilidade * 2; // 2 desvios padrão
    const cenarios = {
      otimista: {
        peso: (diferencaParaMeta > 0 ? peso30Dias + variacao : peso30Dias - variacao),
        tempo: tempoParaMeta === 999 ? 999 : Math.max(1, Math.round(tempoParaMeta * 0.7))
      },
      realista: {
        peso: peso30Dias,
        tempo: tempoParaMeta
      },
      pessimista: {
        peso: (diferencaParaMeta > 0 ? peso30Dias - variacao : peso30Dias + variacao),
        tempo: tempoParaMeta === 999 ? 999 : Math.round(tempoParaMeta * 1.5)
      }
    };

    return {
      peso30Dias: Math.round(peso30Dias * 10) / 10,
      peso90Dias: Math.round(peso90Dias * 10) / 10,
      tempoParaMeta,
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