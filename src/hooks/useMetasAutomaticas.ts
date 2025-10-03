import { useMemo } from 'react';
import { useAuth } from '../contexts/useAuth';
import { useQuestionario } from '../contexts/useQuestionario';

export interface MetasNutricionais {
  calorias: number;
  proteina: number;
  carboidratos: number;
  gordura: number;
  agua: number; // em ml
}

export interface DadosPerfil {
  peso?: number;
  altura?: number;
  idade?: number;
  sexo?: 'masculino' | 'feminino';
  nivelAtividade?: 'sedentario' | 'leve' | 'moderado' | 'intenso' | 'muito_intenso';
  objetivo?: 'manter' | 'perder' | 'ganhar';
}

/**
 * Hook para calcular metas nutricionais automáticas baseadas no perfil do usuário
 */
export function useMetasAutomaticas(): {
  metas: MetasNutricionais;
  dadosPerfil: DadosPerfil;
  metasCalculadas: boolean;
} {
  const { user } = useAuth();
  const { questionarioData } = useQuestionario();

  const dadosPerfil = useMemo((): DadosPerfil => {
    const respostas = questionarioData.respostas;
    
    return {
      peso: parseFloat(respostas['Peso (kg)'] || respostas['Peso atual (kg)'] || user?.weight?.toString() || '0') || undefined,
      altura: parseFloat(respostas['Altura (cm)'] || '0') || undefined,
      idade: parseFloat(respostas['Idade'] || '0') || undefined,
      sexo: respostas['Sexo']?.toLowerCase().includes('feminino') ? 'feminino' : 'masculino',
      nivelAtividade: inferirNivelAtividade(respostas),
      objetivo: inferirObjetivo(respostas, user?.weight, user?.targetWeight)
    };
  }, [questionarioData.respostas, user?.weight, user?.targetWeight]);

  const metas = useMemo((): MetasNutricionais => {
    const { peso, altura, idade, sexo, nivelAtividade, objetivo } = dadosPerfil;
    
    // Se não temos dados básicos, usar valores padrão
    if (!peso || !altura || !idade) {
      return {
        calorias: user?.calorieGoal || 2000,
        proteina: 150,
        carboidratos: 250,
        gordura: 65,
        agua: user?.dailyWaterGoal || 2000
      };
    }

    // Calcular TMB (Taxa Metabólica Basal) usando fórmula de Mifflin-St Jeor
    let tmb: number;
    if (sexo === 'feminino') {
      tmb = (10 * peso) + (6.25 * altura) - (5 * idade) - 161;
    } else {
      tmb = (10 * peso) + (6.25 * altura) - (5 * idade) + 5;
    }

    // Aplicar fator de atividade
    const fatoresAtividade = {
      sedentario: 1.2,
      leve: 1.375,
      moderado: 1.55,
      intenso: 1.725,
      muito_intenso: 1.9
    };
    
    const fatorAtividade = fatoresAtividade[nivelAtividade || 'moderado'];
    const caloriasManutencao = tmb * fatorAtividade;

    // Ajustar baseado no objetivo
    let calorias = caloriasManutencao;
    switch (objetivo) {
      case 'perder':
        calorias = caloriasManutencao - 500; // Déficit de 500 kcal para perder ~0.5kg/semana
        break;
      case 'ganhar':
        calorias = caloriasManutencao + 300; // Superávit de 300 kcal para ganho controlado
        break;
      case 'manter':
      default:
        calorias = caloriasManutencao;
        break;
    }

    // Calcular macronutrientes
    // Proteína: 1.6-2.2g por kg de peso corporal (varia com atividade)
    const proteinaPorKg = nivelAtividade === 'intenso' || nivelAtividade === 'muito_intenso' ? 2.0 : 1.6;
    const proteina = peso * proteinaPorKg;
    
    // Gordura: 20-35% das calorias totais (usamos 25%)
    const gordura = (calorias * 0.25) / 9; // 9 kcal por grama de gordura
    
    // Carboidratos: o restante das calorias
    const caloriasProteina = proteina * 4; // 4 kcal por grama
    const caloriasGordura = gordura * 9;
    const carboidratos = (calorias - caloriasProteina - caloriasGordura) / 4; // 4 kcal por grama

    // Água: 35ml por kg de peso corporal + extra para atividade
    const aguaBase = peso * 35;
    const aguaExtra = (nivelAtividade === 'intenso' || nivelAtividade === 'muito_intenso') ? 500 : 0;
    const agua = aguaBase + aguaExtra;

    return {
      calorias: Math.round(calorias),
      proteina: Math.round(proteina),
      carboidratos: Math.round(carboidratos),
      gordura: Math.round(gordura),
      agua: Math.round(agua)
    };
  }, [dadosPerfil, user?.calorieGoal, user?.dailyWaterGoal]);

  const metasCalculadas = !!(dadosPerfil.peso && dadosPerfil.altura && dadosPerfil.idade);

  return {
    metas,
    dadosPerfil,
    metasCalculadas
  };
}

function inferirNivelAtividade(respostas: Record<string, string>): DadosPerfil['nivelAtividade'] {
  const atividade = respostas['Nível de atividade física'] || respostas['Atividade física'] || '';
  
  if (atividade.toLowerCase().includes('sedentário') || atividade.toLowerCase().includes('pouco')) {
    return 'sedentario';
  }
  if (atividade.toLowerCase().includes('leve') || atividade.toLowerCase().includes('1-3')) {
    return 'leve';
  }
  if (atividade.toLowerCase().includes('moderado') || atividade.toLowerCase().includes('3-5')) {
    return 'moderado';
  }
  if (atividade.toLowerCase().includes('intenso') || atividade.toLowerCase().includes('6-7')) {
    return 'intenso';
  }
  if (atividade.toLowerCase().includes('muito') || atividade.toLowerCase().includes('atleta')) {
    return 'muito_intenso';
  }
  
  return 'moderado'; // padrão
}

function inferirObjetivo(respostas: Record<string, string>, pesoAtual?: number, pesoMeta?: number): DadosPerfil['objetivo'] {
  const objetivo = respostas['Objetivo'] || respostas['Meta'] || '';
  
  if (objetivo.toLowerCase().includes('perder') || objetivo.toLowerCase().includes('emagrecer')) {
    return 'perder';
  }
  if (objetivo.toLowerCase().includes('ganhar') || objetivo.toLowerCase().includes('massa')) {
    return 'ganhar';
  }
  if (objetivo.toLowerCase().includes('manter') || objetivo.toLowerCase().includes('manutenção')) {
    return 'manter';
  }
  
  // Inferir baseado nos pesos
  if (pesoAtual && pesoMeta) {
    if (pesoMeta < pesoAtual) return 'perder';
    if (pesoMeta > pesoAtual) return 'ganhar';
    return 'manter';
  }
  
  return 'manter'; // padrão
}