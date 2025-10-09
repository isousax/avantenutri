import { useMemo } from 'react';
import { useExerciciosInteligentes } from './useExerciciosInteligentes';
import { useGetQuestionnaire, type QuestionnaireResponse } from './useQuestionnaire';
import { useWeightLogsInteligente } from './useWeightLogsInteligente';
import { inferWeightObjective, WEIGHT_TOLERANCE_KG } from '../utils/weightObjective';
import { useWeather } from './useWeather';

// Mapeia respostas do questionário para objetivo
function mapObjectiveFromQuestionnaire(ans?: Record<string, string> | null | undefined): 'perder' | 'ganhar' | 'manter' | undefined {
  const raw = ans?.objetivo_nutricional?.toLowerCase();
  if (!raw) return undefined;
  if (/(emagrec|perda|perder)/.test(raw)) return 'perder';
  if (/(ganho|massa|aument)/.test(raw)) return 'ganhar';
  if (/(manuten|manter|saude|melhorar)/.test(raw)) return 'manter';
  return undefined;
}

function mapNivelFromQuestionnaire(ans?: Record<string,string> | null | undefined): 'sedentario' | 'leve' | 'moderado' | 'intenso' | undefined {
  const raw = ans?.atividade_fisica?.toLowerCase();
  if (!raw) return undefined;
  if (/sedent/.test(raw)) return 'sedentario';
  if (/leve|1-2/.test(raw)) return 'leve';
  if (/moderad|3-4/.test(raw)) return 'moderado';
  if (/intens|5\+/.test(raw)) return 'intenso';
  return undefined;
}

type QuestionnaireDataShape = QuestionnaireResponse | null;

export function useExercisePlan() {
  const q = useGetQuestionnaire();
  const peso = useWeightLogsInteligente();
  const weather = useWeather();

  // Deriva objetivo com fallback pelo peso (meta vs atual)
  const objetivoDerivado = useMemo(() => {
  const data = (q.data as QuestionnaireDataShape)?.data as Record<string, string> | undefined;
  const fromQ = mapObjectiveFromQuestionnaire(data);
    if (fromQ) return fromQ;
    const goal = peso.metasFinais.pesoMeta;
    const current = peso.metasFinais.pesoAtual;
    const wObj = inferWeightObjective(goal, current, WEIGHT_TOLERANCE_KG);
    if (wObj === 'lose') return 'perder';
    if (wObj === 'gain') return 'ganhar';
    return 'manter';
  }, [q.data, peso.metasFinais.pesoMeta, peso.metasFinais.pesoAtual]);

  // Labels e descrições amigáveis para o usuário
  const objetivoInfo = useMemo(() => {
    switch (objetivoDerivado) {
      case 'perder':
        return {
          label: 'Emagrecimento saudável',
          descricao: 'Reduzir percentual de gordura com treino cardio/funcional e alimentação equilibrada.'
        } as const;
      case 'ganhar':
        return {
          label: 'Ganho de massa muscular',
          descricao: 'Aumentar massa e força com treinos de resistência e ingestão proteica adequada.'
        } as const;
      case 'manter':
      default:
        return {
          label: 'Manutenção e definição',
          descricao: 'Equilíbrio entre cardio, força e mobilidade para manter composição corporal e condicionamento.'
        } as const;
    }
  }, [objetivoDerivado]);

  const nivelDerivado = useMemo(() => {
    const data = (q.data as QuestionnaireDataShape)?.data as Record<string, string> | undefined;
    return mapNivelFromQuestionnaire(data);
  }, [q.data]);

  const plan = useExerciciosInteligentes({ objetivo: objetivoDerivado, nivelAtividade: nivelDerivado });

  // Preferência de ambiente com base no clima
  const indoorPreferred = useMemo(() => {
    if (!weather.success || weather.temperatureC == null) return false;
    const t = weather.temperatureC;
    // Muito quente ou muito frio → preferir indoor
    if (t >= 32 || t <= 12) return true;
    return false;
  }, [weather.success, weather.temperatureC]);

  // Sugestão de alternativa indoor/outdoor para a atividade do dia
  const alternativaHoje = useMemo(() => {
    const atual = plan.atividadeHoje;
    if (!atual) return null;
    if (indoorPreferred && (atual.ambiente === 'outdoor')) {
      // buscar atividade similar indoor do mesmo tipo / objetivo
      const similares = plan.atividadesDisponiveis.filter(a => a.tipo === atual.tipo && (a.ambiente === 'indoor' || a.ambiente === 'ambos'));
      return similares[0] || null;
    }
    if (!indoorPreferred && (atual.ambiente === 'indoor')) {
      const similares = plan.atividadesDisponiveis.filter(a => a.tipo === atual.tipo && (a.ambiente === 'outdoor' || a.ambiente === 'ambos'));
      return similares[0] || null;
    }
    return null;
  }, [plan.atividadeHoje, plan.atividadesDisponiveis, indoorPreferred]);

  return {
    loading: q.isLoading,
    error: q.error as Error | null,
    questionario: q.data,
    objetivo: objetivoDerivado,
    objetivoLabel: objetivoInfo.label,
    objetivoDescricao: objetivoInfo.descricao,
    nivelAtividade: nivelDerivado,
    clima: weather,
    indoorPreferred,
    alternativaHoje,
    ...plan,
  };
}
