import { useMemo } from 'react';
import { useWaterLogs } from './useWaterLogs';
import { useMetasAutomaticas } from './useMetasAutomaticas';

export interface MetasAguaInteligentes {
  metaML: number;
  metaCopos: number;
  cupSize: number;
  fonte: 'automatica' | 'manual';
}

export interface ProgressoAguaHoje {
  consumidoML: number;
  consumidoCopos: number;
  percentual: number;
  faltaML: number;
  faltaCopos: number;
  status: 'baixo' | 'normal' | 'alto' | 'excessivo';
}

export interface DicasHidratacao {
  tipo: 'motivacao' | 'alerta' | 'parabens' | 'cuidado';
  titulo: string;
  mensagem: string;
  icone: string;
}

export interface EstatisticasAguaSemana {
  mediaML: number;
  mediaCopos: number;
  melhorDia: number;
  piorDia: number;
  diasCumpridos: number;
  tendencia: 'subindo' | 'descendo' | 'estavel';
}

/**
 * Hook inteligente para gerenciamento de consumo de água
 * Combina metas automáticas com logs de água e fornece insights
 */
export function useWaterLogsInteligente(days: number = 7) {
  const waterLogs = useWaterLogs(days);
  const { metas, dadosPerfil, metasCalculadas } = useMetasAutomaticas();

  // Tamanho do copo padrão ou personalizado
  const cupSize = waterLogs.cupSize || 250;

  // Metas inteligentes de água
  const metasFinais: MetasAguaInteligentes = useMemo(() => {
    // Se há meta manual definida pelo usuário, usar ela
    if (waterLogs.dailyGoalCups && waterLogs.goalSource === 'manual') {
      return {
        metaML: waterLogs.dailyGoalCups * cupSize,
        metaCopos: waterLogs.dailyGoalCups,
        cupSize,
        fonte: 'manual'
      };
    }

    // Usar meta automática baseada no perfil
    const metaAutomaticaML = metasCalculadas ? metas.agua : 2000; // fallback 2L
    
    // Ajustes adicionais baseados em fatores externos
    let metaAjustada = metaAutomaticaML;
    
    // Ajuste por temperatura/clima (simulado - pode ser integrado com API meteorológica)
    const mesAtual = new Date().getMonth();
    const isVerao = mesAtual >= 11 || mesAtual <= 2; // Dezembro, Janeiro, Fevereiro
    if (isVerao) {
      metaAjustada += 300; // +300ml no verão
    }

    // Ajuste por nível de atividade extra
    if (dadosPerfil.nivelAtividade === 'muito_intenso') {
      metaAjustada += 500; // +500ml para atletas
    }

    return {
      metaML: Math.round(metaAjustada),
      metaCopos: Math.round(metaAjustada / cupSize),
      cupSize,
      fonte: 'automatica'
    };
  }, [metas.agua, metasCalculadas, waterLogs.dailyGoalCups, waterLogs.goalSource, cupSize, dadosPerfil.nivelAtividade]);

  // Progresso de hoje
  const progressoHoje: ProgressoAguaHoje = useMemo(() => {
    const consumidoML = waterLogs.totalToday;
    const consumidoCopos = Math.round(consumidoML / cupSize);
    const percentual = Math.round((consumidoML / metasFinais.metaML) * 100);
    const faltaML = Math.max(0, metasFinais.metaML - consumidoML);
    const faltaCopos = Math.round(faltaML / cupSize);

    let status: ProgressoAguaHoje['status'] = 'normal';
    if (percentual < 50) status = 'baixo';
    else if (percentual >= 100 && percentual < 150) status = 'alto';
    else if (percentual >= 150) status = 'excessivo';

    return {
      consumidoML,
      consumidoCopos,
      percentual,
      faltaML,
      faltaCopos,
      status
    };
  }, [waterLogs.totalToday, metasFinais.metaML, cupSize]);

  // Dicas inteligentes de hidratação
  const dicasInteligentes: DicasHidratacao[] = useMemo(() => {
    const dicas: DicasHidratacao[] = [];
    const horaAtual = new Date().getHours();

    if (progressoHoje.status === 'baixo') {
      if (horaAtual < 12) {
        dicas.push({
          tipo: 'motivacao',
          titulo: 'Comece o dia hidratado!',
          mensagem: `Beba ${progressoHoje.faltaCopos} copos ao longo do dia para atingir sua meta.`,
          icone: '☀️'
        });
      } else {
        dicas.push({
          tipo: 'alerta',
          titulo: 'Hora de se hidratar!',
          mensagem: `Você está abaixo da meta. Beba ${Math.min(3, progressoHoje.faltaCopos)} copos agora.`,
          icone: '💧'
        });
      }
    } else if (progressoHoje.status === 'alto') {
      dicas.push({
        tipo: 'parabens',
        titulo: 'Meta atingida! 🎉',
        mensagem: 'Parabéns! Você cumpriu sua meta de hidratação hoje.',
        icone: '✅'
      });
    } else if (progressoHoje.status === 'excessivo') {
      dicas.push({
        tipo: 'cuidado',
        titulo: 'Cuidado com o excesso',
        mensagem: 'Você já bebeu muito hoje. Espaçe o consumo para evitar sobrecarga renal.',
        icone: '⚠️'
      });
    }

    // Dica baseada no horário
    if (horaAtual >= 6 && horaAtual <= 8 && progressoHoje.consumidoCopos === 0) {
      dicas.push({
        tipo: 'motivacao',
        titulo: 'Manhã perfeita para hidratação',
        mensagem: 'Beba 1-2 copos de água em jejum para ativar o metabolismo.',
        icone: '🌅'
      });
    }

    return dicas;
  }, [progressoHoje]);

  // Estatísticas da semana
  const estatisticasSemana: EstatisticasAguaSemana = useMemo(() => {
    if (!waterLogs.summaryDays || waterLogs.summaryDays.length === 0) {
      return {
        mediaML: 0,
        mediaCopos: 0,
        melhorDia: 0,
        piorDia: 0,
        diasCumpridos: 0,
        tendencia: 'estavel'
      };
    }

    const consumosDiarios = waterLogs.summaryDays.map(d => d.total_ml);
    const mediaML = consumosDiarios.reduce((a, b) => a + b, 0) / consumosDiarios.length;
    const mediaCopos = Math.round(mediaML / cupSize);
    const melhorDia = Math.max(...consumosDiarios);
    const piorDia = Math.min(...consumosDiarios);
    const diasCumpridos = consumosDiarios.filter(ml => ml >= metasFinais.metaML).length;

    // Calcular tendência baseada nos últimos 3 dias vs 3 primeiros
    let tendencia: EstatisticasAguaSemana['tendencia'] = 'estavel';
    if (consumosDiarios.length >= 6) {
      const primeiros3 = consumosDiarios.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      const ultimos3 = consumosDiarios.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const diferenca = ultimos3 - primeiros3;
      
      if (diferenca > 200) tendencia = 'subindo';
      else if (diferenca < -200) tendencia = 'descendo';
    }

    return {
      mediaML: Math.round(mediaML),
      mediaCopos,
      melhorDia,
      piorDia,
      diasCumpridos,
      tendencia
    };
  }, [waterLogs.summaryDays, metasFinais.metaML, cupSize]);

  // Função para definir meta manual
  const setMetaManual = async (copos: number) => {
    await waterLogs.updateGoal(copos);
  };

  // Função para resetar para meta automática
  const resetarParaAutomatica = async () => {
    await waterLogs.updateGoal(metasFinais.metaCopos);
  };

  return {
    // Dados básicos do hook original
    ...waterLogs,
    
    // Metas inteligentes
    metasFinais,
    metasCalculadas,
    dadosPerfil,
    
    // Progresso e insights
    progressoHoje,
    dicasInteligentes,
    estatisticasSemana,
    
    // Funções para controle de metas
    setMetaManual,
    resetarParaAutomatica
  };
}