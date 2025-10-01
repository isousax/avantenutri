import { useCallback, useEffect, useMemo } from 'react';
import { useMealLogs } from './useMealLogs';
import { useMetasAutomaticas } from './useMetasAutomaticas';

export interface ProgressoInteligente {
  calorias: number;
  proteina: number;
  carboidratos: number;
  gordura: number;
  status: 'baixo' | 'adequado' | 'alto' | 'excessivo';
}

export interface MetasInteligentes {
  calorias: number;
  proteina: number;
  carboidratos: number;
  gordura: number;
  fonte: 'automatica' | 'manual' | 'padrao';
}

/**
 * Hook inteligente que combina dados de refeições com metas automáticas
 * e sincroniza metas personalizadas quando necessário
 */
export function useMealLogsInteligente(defaultDays = 7) {
  const mealLogs = useMealLogs(defaultDays);
  const { metas, metasCalculadas } = useMetasAutomaticas();
  
  // Metas finais (prioridade: manual > automática > padrão)
  const metasFinais: MetasInteligentes = useMemo(() => {
    const manualGoals = mealLogs.goals;
    
    // Se existem metas manuais, usar elas
    if (manualGoals.calories || manualGoals.protein_g || manualGoals.carbs_g || manualGoals.fat_g) {
      return {
        calorias: manualGoals.calories || metas.calorias,
        proteina: manualGoals.protein_g || metas.proteina,
        carboidratos: manualGoals.carbs_g || metas.carboidratos,
        gordura: manualGoals.fat_g || metas.gordura,
        fonte: 'manual'
      };
    }
    
    // Se temos dados para calcular automaticamente, usar eles
    if (metasCalculadas) {
      return {
        calorias: metas.calorias,
        proteina: metas.proteina,
        carboidratos: metas.carboidratos,
        gordura: metas.gordura,
        fonte: 'automatica'
      };
    }
    
    // Usar valores padrão
    return {
      calorias: 2000,
      proteina: 150,
      carboidratos: 250,
      gordura: 65,
      fonte: 'padrao'
    };
  }, [mealLogs.goals, metas, metasCalculadas]);

  // Sincronizar metas automáticas com o backend se não existem metas manuais
  const sincronizarMetasAutomaticas = useCallback(async () => {
    if (metasCalculadas && metasFinais.fonte === 'automatica') {
      try {
        await mealLogs.setGoals({
          calories_goal_kcal: metas.calorias,
          protein_goal_g: metas.proteina,
          carbs_goal_g: metas.carboidratos,
          fat_goal_g: metas.gordura
        });
      } catch (error) {
        console.warn('Erro ao sincronizar metas automáticas:', error);
      }
    }
  }, [metasCalculadas, metasFinais.fonte, metas, mealLogs.setGoals]);

  // Progresso inteligente do dia atual
  const progressoHoje: ProgressoInteligente = useMemo(() => {
    const hoje = mealLogs.days[0];
    
    if (!hoje) {
      return {
        calorias: 0,
        proteina: 0,
        carboidratos: 0,
        gordura: 0,
        status: 'baixo'
      };
    }

    const calcularProgresso = (atual: number, meta: number): number => {
      return Math.round((atual / meta) * 100);
    };

    const progressoCalorias = calcularProgresso(hoje.calories, metasFinais.calorias);
    const progressoProteina = calcularProgresso(hoje.protein_g, metasFinais.proteina);
    const progressoCarboidratos = calcularProgresso(hoje.carbs_g, metasFinais.carboidratos);
    const progressoGordura = calcularProgresso(hoje.fat_g, metasFinais.gordura);

    // Determinar status geral baseado nas calorias
    let status: ProgressoInteligente['status'];
    if (progressoCalorias < 50) status = 'baixo';
    else if (progressoCalorias <= 100) status = 'adequado';
    else if (progressoCalorias <= 120) status = 'alto';
    else status = 'excessivo';

    return {
      calorias: progressoCalorias,
      proteina: progressoProteina,
      carboidratos: progressoCarboidratos,
      gordura: progressoGordura,
      status
    };
  }, [mealLogs.days, metasFinais]);

  // Dicas inteligentes baseadas no progresso
  const dicasInteligentes = useMemo(() => {
    const dicas: string[] = [];
    
    if (progressoHoje.calorias < 50) {
      dicas.push('🍽️ Você está consumindo poucas calorias. Considere adicionar mais refeições.');
    } else if (progressoHoje.calorias > 120) {
      dicas.push('⚠️ Cuidado com o excesso de calorias. Tente equilibrar melhor as porções.');
    }
    
    if (progressoHoje.proteina < 80) {
      dicas.push('💪 Inclua mais fontes de proteína como carnes, ovos, leguminosas ou laticínios.');
    }
    
    if (progressoHoje.carboidratos < 60) {
      dicas.push('🍞 Adicione carboidratos saudáveis como arroz integral, aveia ou frutas.');
    }
    
    if (progressoHoje.gordura < 50) {
      dicas.push('🥑 Inclua gorduras saudáveis como azeite, castanhas ou abacate.');
    }
    
    if (dicas.length === 0) {
      dicas.push('✅ Excelente! Você está seguindo bem sua dieta planejada.');
    }
    
    return dicas;
  }, [progressoHoje]);

  // Estatísticas da semana com base nas metas
  const estatisticasSemana = useMemo(() => {
    const diasComDados = mealLogs.days.filter(dia => dia.calories > 0);
    
    if (diasComDados.length === 0) {
      return {
        diasAtendidos: 0,
        mediaCaloriasDiarias: 0,
        consistencia: 0,
        tendencia: 'estavel' as 'crescente' | 'decrescente' | 'estavel'
      };
    }

    const diasAtendidos = diasComDados.filter(dia => 
      dia.calories >= metasFinais.calorias * 0.8 && 
      dia.calories <= metasFinais.calorias * 1.2
    ).length;

    const mediaCaloriasDiarias = diasComDados.reduce((sum, dia) => sum + dia.calories, 0) / diasComDados.length;
    const consistencia = Math.round((diasAtendidos / diasComDados.length) * 100);

    // Calcular tendência (últimos 3 dias vs primeiros 3 dias)
    const primeiros3 = diasComDados.slice(-3);
    const ultimos3 = diasComDados.slice(0, 3);
    
    const mediaPrimeiros = primeiros3.reduce((sum, dia) => sum + dia.calories, 0) / primeiros3.length;
    const mediaUltimos = ultimos3.reduce((sum, dia) => sum + dia.calories, 0) / ultimos3.length;
    
    let tendencia: 'crescente' | 'decrescente' | 'estavel';
    const diferenca = mediaUltimos - mediaPrimeiros;
    if (diferenca > 100) tendencia = 'crescente';
    else if (diferenca < -100) tendencia = 'decrescente';
    else tendencia = 'estavel';

    return {
      diasAtendidos,
      mediaCaloriasDiarias: Math.round(mediaCaloriasDiarias),
      consistencia,
      tendencia
    };
  }, [mealLogs.days, metasFinais.calorias]);

  // Sincronizar metas na inicialização se necessário
  useEffect(() => {
    if (metasFinais.fonte === 'automatica') {
      sincronizarMetasAutomaticas();
    }
  }, [sincronizarMetasAutomaticas, metasFinais.fonte]);

  return {
    // Dados originais do useMealLogs
    ...mealLogs,
    
    // Dados inteligentes
    metasFinais,
    progressoHoje,
    dicasInteligentes,
    estatisticasSemana,
    metasCalculadas,
    
    // Ações
    sincronizarMetasAutomaticas
  };
}