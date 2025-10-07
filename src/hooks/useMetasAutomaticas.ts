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
    
    // Função para calcular idade a partir da data de nascimento
    const calcularIdadePorDataNascimento = (birthDate: string): number | undefined => {
      if (!birthDate) return undefined;
      try {
        const hoje = new Date();
        const nascimento = new Date(birthDate);
        
        // Validar se a data é válida
        if (isNaN(nascimento.getTime())) return undefined;
        
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mesAtual = hoje.getMonth();
        const mesNascimento = nascimento.getMonth();
        
        // Ajustar se ainda não fez aniversário este ano
        if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
          idade--;
        }
        
        // Validação mais rigorosa: idade realística (10-120 anos)
        return idade >= 10 && idade <= 120 ? idade : undefined;
      } catch {
        return undefined;
      }
    };
    
    // Função helper para validar e converter números
    const parseValidNumber = (value: string | undefined, min: number, max: number): number | undefined => {
      if (!value) return undefined;
      const num = parseFloat(value.replace(',', '.'));
      return !isNaN(num) && num >= min && num <= max ? num : undefined;
    };
    
    // Usar dados do perfil como prioridade, questionário como fallback
    const peso = user?.weight || 
                 parseValidNumber(respostas['Peso (kg)'] || respostas['Peso atual (kg)'], 20, 300) || 
                 undefined;
                 
    const altura = user?.height || 
                   parseValidNumber(respostas['Altura (cm)'], 100, 250) || 
                   undefined;
                   
    const idade = calcularIdadePorDataNascimento(user?.birthDate || '') || 
                  parseValidNumber(respostas['Idade'], 10, 120) || 
                  undefined;
    
    // Inferir sexo de forma mais robusta
    const sexoRaw = respostas['Sexo']?.toLowerCase() || '';
    const sexo = sexoRaw.includes('feminino') || sexoRaw.includes('mulher') || sexoRaw.includes('f') 
                 ? 'feminino' 
                 : sexoRaw.includes('masculino') || sexoRaw.includes('homem') || sexoRaw.includes('m')
                 ? 'masculino'
                 : undefined; // Não assumir padrão
    
    return {
      peso,
      altura,
      idade,
      sexo,
      nivelAtividade: inferirNivelAtividade(respostas),
      objetivo: inferirObjetivo(respostas, user?.weight, user?.targetWeight)
    };
  }, [questionarioData.respostas, user?.weight, user?.targetWeight, user?.height, user?.birthDate]);

  const metas = useMemo((): MetasNutricionais => {
    const { peso, altura, idade, sexo, nivelAtividade, objetivo } = dadosPerfil;
    
    // Validação mais rigorosa: verificar se temos dados mínimos válidos
    if (!peso || peso < 20 || peso > 300 || 
        !altura || altura < 100 || altura > 250 || 
        !idade || idade < 10 || idade > 120 ||
        !sexo) {
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

    // Calcular macronutrientes com validações
    // Proteína: 1.2-2.5g por kg (varia com atividade e objetivo)
    let proteinaPorKg = 1.6; // Base padrão
    
    if (nivelAtividade === 'intenso' || nivelAtividade === 'muito_intenso') {
      proteinaPorKg = objetivo === 'ganhar' ? 2.2 : 2.0;
    } else if (objetivo === 'perder') {
      proteinaPorKg = 2.0; // Mais proteína para preservar massa muscular
    } else if (objetivo === 'ganhar') {
      proteinaPorKg = 1.8;
    }
    
    const proteina = Math.max(peso * proteinaPorKg, 50); // Mínimo 50g
    
    // Gordura: 20-35% das calorias totais (preferência por 25-30%)
    const percentualGordura = objetivo === 'perder' ? 0.25 : 0.30;
    const gordura = Math.max((calorias * percentualGordura) / 9, 30); // Mínimo 30g
    
    // Carboidratos: o restante das calorias (com validação)
    const caloriasProteina = proteina * 4;
    const caloriasGordura = gordura * 9;
    const caloriasRestantes = calorias - caloriasProteina - caloriasGordura;
    const carboidratos = Math.max(caloriasRestantes / 4, 50); // Mínimo 50g

    // Água: Fórmula mais precisa baseada em peso, atividade e clima
    const aguaBasePorKg = sexo === 'feminino' ? 30 : 35; // ml por kg
    const aguaBase = peso * aguaBasePorKg;
    
    // Ajustes por atividade física
    let aguaExtra = 0;
    switch (nivelAtividade) {
      case 'sedentario':
        aguaExtra = 0;
        break;
      case 'leve':
        aguaExtra = 200;
        break;
      case 'moderado':
        aguaExtra = 400;
        break;
      case 'intenso':
        aguaExtra = 600;
        break;
      case 'muito_intenso':
        aguaExtra = 800;
        break;
    }
    
    const agua = Math.min(aguaBase + aguaExtra, 4000); // Máximo 4L por segurança

    return {
      calorias: Math.round(calorias),
      proteina: Math.round(proteina),
      carboidratos: Math.round(carboidratos),
      gordura: Math.round(gordura),
      agua: Math.round(agua)
    };
  }, [dadosPerfil, user?.calorieGoal, user?.dailyWaterGoal]);

  // Validação mais robusta para metas calculadas
  const metasCalculadas = !!(
    dadosPerfil.peso && dadosPerfil.peso >= 20 && dadosPerfil.peso <= 300 &&
    dadosPerfil.altura && dadosPerfil.altura >= 100 && dadosPerfil.altura <= 250 &&
    dadosPerfil.idade && dadosPerfil.idade >= 10 && dadosPerfil.idade <= 120 &&
    dadosPerfil.sexo
  );

  return {
    metas,
    dadosPerfil,
    metasCalculadas
  };
}

function inferirNivelAtividade(respostas: Record<string, string>): DadosPerfil['nivelAtividade'] {
  const atividade = (respostas['Nível de atividade física'] || 
                     respostas['Atividade física'] || 
                     respostas['Frequência de treinos'] || '').toLowerCase();
  
  // Padrões mais específicos
  if (atividade.includes('sedentário') || atividade.includes('nenhuma') || atividade.includes('parado')) {
    return 'sedentario';
  }
  if (atividade.includes('leve') || atividade.includes('1-2') || atividade.includes('pouco')) {
    return 'leve';
  }
  if (atividade.includes('moderado') || atividade.includes('3-4') || atividade.includes('regular')) {
    return 'moderado';
  }
  if (atividade.includes('intenso') || atividade.includes('5-6') || atividade.includes('alto')) {
    return 'intenso';
  }
  if (atividade.includes('muito') || atividade.includes('atleta') || 
      atividade.includes('profissional') || atividade.includes('diário')) {
    return 'muito_intenso';
  }
  
  return 'moderado'; // padrão seguro
}

function inferirObjetivo(respostas: Record<string, string>, pesoAtual?: number, pesoMeta?: number): DadosPerfil['objetivo'] {
  const objetivo = (respostas['Objetivo'] || 
                   respostas['Meta'] || 
                   respostas['Objetivo principal'] || 
                   respostas['Objetivo nutricional'] || '').toLowerCase();
  
  // Padrões mais específicos
  if (objetivo.includes('perder') || objetivo.includes('emagrecer') || 
      objetivo.includes('reduzir') || objetivo.includes('diminuir')) {
    return 'perder';
  }
  if (objetivo.includes('ganhar') || objetivo.includes('massa') || 
      objetivo.includes('aumentar') || objetivo.includes('hipertrofia')) {
    return 'ganhar';
  }
  if (objetivo.includes('manter') || objetivo.includes('manutenção') || 
      objetivo.includes('estabilizar')) {
    return 'manter';
  }
  
  // Inferir baseado nos pesos com validação
  if (pesoAtual && pesoMeta && pesoAtual > 0 && pesoMeta > 0) {
    const diferenca = Math.abs(pesoMeta - pesoAtual);
    // Só considerar significativo se diferença > 2kg
    if (diferenca > 2) {
      if (pesoMeta < pesoAtual) return 'perder';
      if (pesoMeta > pesoAtual) return 'ganhar';
    }
    return 'manter';
  }
  
  return 'manter'; // padrão seguro
}