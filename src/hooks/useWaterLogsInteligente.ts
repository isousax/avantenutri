import { useMemo, useEffect, useState } from 'react';
import { useWaterData } from './useWaterData';
import { useMetasAutomaticas } from './useMetasAutomaticas';
import { useWeather } from './useWeather';
import { useUserLocation } from './useUserLocation';

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
  const waterData = useWaterData(Math.min(days, 30));
  const logs = waterData.logs;
  const totalToday = waterData.totalToday;
  const summaryDays = waterData.summaryDays as Array<{ date: string; total_ml: number }> | undefined;
  const dailyGoalCups = waterData.dailyGoalCups as number | null;
  const cupSizeRaw = waterData.cupSize as number | undefined;
  const updateGoal = waterData.updateGoal;
  const updateCupSize = waterData.updateCupSize;
  const add = waterData.add;
  const { metas, dadosPerfil, metasCalculadas } = useMetasAutomaticas();
  const weather = useWeather();
  const location = useUserLocation({ auto: true });

  // Tamanho do copo padrão ou personalizado
  const cupSize = cupSizeRaw || 250;

  // Fonte da meta (manual vs automática) – proxy local enquanto backend não expõe
  const GOAL_SOURCE_LS = 'water.goalSource.v1';
  const readLocalSource = (): 'automatica'|'manual'|null => {
    try {
      const v = localStorage.getItem(GOAL_SOURCE_LS);
      return v === 'manual' || v === 'automatica' ? v : null;
    } catch { return null; }
  };
  const writeLocalSource = (v: 'automatica'|'manual') => {
    try { localStorage.setItem(GOAL_SOURCE_LS, v); } catch { /* ignore */ }
  };
  const [goalSource, setGoalSource] = useState<'automatica' | 'manual'>(() => readLocalSource() ?? (dailyGoalCups ? 'manual' : 'automatica'));
  // Persistir mudanças de source
  useEffect(() => { writeLocalSource(goalSource); }, [goalSource]);

  // Metas inteligentes de água
  const metasFinais: MetasAguaInteligentes = useMemo(() => {
    // Se há meta manual definida pelo usuário e a fonte atual é manual, usar ela
    if (dailyGoalCups && goalSource === 'manual') {
      return {
        metaML: dailyGoalCups * cupSize,
        metaCopos: dailyGoalCups,
        cupSize,
        fonte: 'manual'
      };
    }

    // Usar meta automática baseada no perfil
    const metaAutomaticaML = metasCalculadas ? metas.agua : 2000; // fallback 2L
    
    // Ajustes adicionais baseados em fatores externos
    let metaAjustada = metaAutomaticaML;
    
    if (import.meta.env.DEV) {
      console.log('[water] base auto (perfil):', { metaAutomaticaML, dadosPerfil });
    }

    // Clima real: aumentar conforme a temperatura
    // > 32°C: +600ml, 28–32: +400ml, 24–28: +200ml; se clima indisponível, mantemos sem este ajuste
    if (weather.success && typeof weather.temperatureC === 'number') {
      const t = weather.temperatureC;
      if (t > 32) metaAjustada += 600;
      else if (t > 28) metaAjustada += 400;
      else if (t > 24) metaAjustada += 200;
      if (import.meta.env.DEV) console.log('[water] ajuste clima:', { t, metaAjustada });
    }

    // Ajuste por nível de atividade extra
    if (dadosPerfil.nivelAtividade === 'muito_intenso') {
      metaAjustada += 500; // +500ml para atletas
      if (import.meta.env.DEV) console.log('[water] ajuste atividade muito_intenso:', { metaAjustada });
    }

    // Ajuste progressivo por histórico: usar média dos últimos 5 dias (se houver)
    if (summaryDays && summaryDays.length > 0) {
      const last5 = summaryDays.slice(-5);
      const avg5 = last5.reduce((s, d) => s + d.total_ml, 0) / last5.length;
      // Se média < 70% da meta, reduzir meta em 10% (sem descer abaixo de 1500ml)
      if (avg5 < metaAjustada * 0.7) {
        metaAjustada = Math.max(1500, Math.round(metaAjustada * 0.9));
        if (import.meta.env.DEV) console.log('[water] ajuste historico (baixo):', { avg5, metaAjustada });
      }
      // Se média > 110% da meta, aumentar meta em 5% (sem passar de 4000ml)
      else if (avg5 > metaAjustada * 1.1) {
        metaAjustada = Math.min(4000, Math.round(metaAjustada * 1.05));
        if (import.meta.env.DEV) console.log('[water] ajuste historico (alto):', { avg5, metaAjustada });
      }
    }

    // Clamp por IMC: ajustar faixa segura (sem ser prescritivo, apenas limites macios)
    const clampByBMI = (ml: number) => {
      const peso = dadosPerfil.peso;
      const alturaCm = dadosPerfil.altura;
      if (!peso || !alturaCm) return ml;
      const alturaM = alturaCm / 100;
      const imc = peso / (alturaM * alturaM);
      // Faixas: baixo peso: 1800–3200; normal: 1800–3800; sobrepeso/obesidade: 1600–3600
      if (imc < 18.5) return Math.max(1800, Math.min(3200, ml));
      if (imc < 25) return Math.max(1800, Math.min(3800, ml));
      return Math.max(1600, Math.min(3600, ml));
    };

  const finalML = clampByBMI(Math.round(metaAjustada));
  // Opção 3: arredondar para múltiplos do tamanho do copo
  const roundedML = Math.max(cupSize, Math.round(finalML / cupSize) * cupSize);
  if (import.meta.env.DEV) console.log('[water] final ML após clamps:', { finalML, roundedML, cupSize });

    return {
      metaML: roundedML,
      metaCopos: Math.max(1, Math.round(roundedML / cupSize)),
      cupSize,
      fonte: 'automatica'
    };
  }, [metas.agua, metasCalculadas, dailyGoalCups, goalSource, cupSize, dadosPerfil, weather.success, weather.temperatureC, summaryDays]);

  // Progresso de hoje
  const progressoHoje: ProgressoAguaHoje = useMemo(() => {
    const consumidoML = totalToday;
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
  }, [totalToday, metasFinais.metaML, cupSize]);

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
    if (!summaryDays || summaryDays.length === 0) {
      return {
        mediaML: 0,
        mediaCopos: 0,
        melhorDia: 0,
        piorDia: 0,
        diasCumpridos: 0,
        tendencia: 'estavel'
      };
    }

    const consumosDiarios: number[] = summaryDays.map((d) => d.total_ml);
  const mediaML = consumosDiarios.reduce((a: number, b: number) => a + b, 0) / consumosDiarios.length;
    const mediaCopos = Math.round(mediaML / cupSize);
    const melhorDia = Math.max(...consumosDiarios);
    const piorDia = Math.min(...consumosDiarios);
    const diasCumpridos = consumosDiarios.filter((ml) => ml >= metasFinais.metaML).length;

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
  }, [summaryDays, metasFinais.metaML, cupSize]);

  // Função para definir meta manual
  const setMetaManual = async (copos: number) => {
    await updateGoal(copos);
    setGoalSource('manual');
  };

  // Função para resetar para meta automática
  const resetarParaAutomatica = async () => {
    // Recalcula meta automática localmente (mesma lógica do useMemo acima)
    const baseML = metasCalculadas ? metas.agua : 2000;
    let metaAjustada = baseML;
    // Aplicar ajuste pelo clima real
    if (weather.success && typeof weather.temperatureC === 'number') {
      const t = weather.temperatureC;
      if (t > 32) metaAjustada += 600;
      else if (t > 28) metaAjustada += 400;
      else if (t > 24) metaAjustada += 200;
      if (import.meta.env.DEV) console.log('[water] reset clima:', { t, metaAjustada });
    }
    // Atividade
    if (dadosPerfil.nivelAtividade === 'muito_intenso') {
      metaAjustada += 500;
      if (import.meta.env.DEV) console.log('[water] reset atividade muito_intenso:', { metaAjustada });
    }
    // Histórico (últimos 5 dias)
    if (summaryDays && summaryDays.length > 0) {
      const last5 = summaryDays.slice(-5);
      const avg5 = last5.reduce((s, d) => s + d.total_ml, 0) / last5.length;
      if (avg5 < metaAjustada * 0.7) {
        metaAjustada = Math.max(1500, Math.round(metaAjustada * 0.9));
        if (import.meta.env.DEV) console.log('[water] reset historico (baixo):', { avg5, metaAjustada });
      } else if (avg5 > metaAjustada * 1.1) {
        metaAjustada = Math.min(4000, Math.round(metaAjustada * 1.05));
        if (import.meta.env.DEV) console.log('[water] reset historico (alto):', { avg5, metaAjustada });
      }
    }
    // Clamp por IMC
    const clampByBMI = (ml: number) => {
      const peso = dadosPerfil.peso;
      const alturaCm = dadosPerfil.altura;
      if (!peso || !alturaCm) return ml;
      const alturaM = alturaCm / 100;
      const imc = peso / (alturaM * alturaM);
      if (imc < 18.5) return Math.max(1800, Math.min(3200, ml));
      if (imc < 25) return Math.max(1800, Math.min(3800, ml));
      return Math.max(1600, Math.min(3600, ml));
    };
  const finalML = clampByBMI(Math.round(metaAjustada));
  const roundedML = Math.max(cupSize, Math.round(finalML / cupSize) * cupSize);
  const autoCups = Math.max(1, Math.round(roundedML / cupSize));

  if (import.meta.env.DEV) console.log('[water] reset final', { baseML, finalML, roundedML, autoCups, cupSize });

    await updateGoal(autoCups);
    setGoalSource('automatica');

    // Solicitar geolocalização apenas quando necessário e evitar prompt recorrente
    try {
      const PERM_LS = 'geoloc.prompted.once.v1';
      const alreadyPrompted = localStorage.getItem(PERM_LS) === '1';
      if (!location.coords) {
        const perms: Permissions | undefined = (navigator as unknown as { permissions?: Permissions }).permissions;
        if (perms && perms.query) {
          const res = await perms.query({ name: 'geolocation' as PermissionName });
          if (res.state === 'granted') {
            location.request();
          } else if (res.state === 'prompt' && !alreadyPrompted) {
            localStorage.setItem(PERM_LS, '1');
            location.request();
          }
        }
      }
    } catch { /* ignore */ }
  };

  return {
    // Dados básicos do hook original
    logs,
    totalToday,
    summaryDays,
    dailyGoalCups,
    cupSize,
    updateGoal,
    updateCupSize,
    add,
    goalSource,
    
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