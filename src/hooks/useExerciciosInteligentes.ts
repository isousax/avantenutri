import { useMemo } from 'react';
import { useMetasAutomaticas } from './useMetasAutomaticas';
import { useWeightLogsInteligente } from './useWeightLogsInteligente';
import { useMealLogsInteligente } from './useMealLogsInteligente';

export interface AtividadeSugerida {
  tipo: 'cardio' | 'forca' | 'flexibilidade' | 'funcional' | 'recuperacao';
  nome: string;
  duracao: number; // minutos
  calorias: number; // estimativa
  dificuldade: 'iniciante' | 'intermediario' | 'avancado';
  equipamento: string[];
  descricao: string;
  beneficios: string[];
  icone: string;
  ambiente?: 'indoor' | 'outdoor' | 'ambos';
}

export interface PlanoExercicioSemanal {
  segunda: AtividadeSugerida[];
  terca: AtividadeSugerida[];
  quarta: AtividadeSugerida[];
  quinta: AtividadeSugerida[];
  sexta: AtividadeSugerida[];
  sabado: AtividadeSugerida[];
  domingo: AtividadeSugerida[];
  totalSemanal: {
    tempo: number;
    calorias: number;
    variedade: number;
  };
}

export interface RecomendacaoInteligente {
  categoria: 'geral' | 'peso' | 'cardio' | 'energia' | 'humor' | 'forca';
  titulo: string;
  descricao: string;
  motivacao: string;
  intensidade: 'baixa' | 'moderada' | 'alta';
  icone: string;
}

const ATIVIDADES_BASE: AtividadeSugerida[] = [
  // Cardio
  {
    tipo: 'cardio',
    nome: 'Caminhada Rápida',
    duracao: 30,
    calorias: 150,
    dificuldade: 'iniciante',
    equipamento: ['Tênis'],
    descricao: 'Caminhada em ritmo acelerado ao ar livre ou esteira',
    beneficios: ['Melhora cardiovascular', 'Queima calorias', 'Baixo impacto'],
    icone: '🚶‍♂️',
    ambiente: 'outdoor'
  },
  {
    tipo: 'cardio',
    nome: 'Corrida Leve',
    duracao: 25,
    calorias: 250,
    dificuldade: 'intermediario',
    equipamento: ['Tênis'],
    descricao: 'Corrida em ritmo confortável',
    beneficios: ['Fortalece coração', 'Queima muitas calorias', 'Melhora resistência'],
    icone: '🏃‍♂️',
    ambiente: 'outdoor'
  },
  {
    tipo: 'cardio',
    nome: 'Dança',
    duracao: 40,
    calorias: 200,
    dificuldade: 'iniciante',
    equipamento: ['Nenhum'],
    descricao: 'Dança livre ou aulas online',
    beneficios: ['Divertido', 'Melhora coordenação', 'Queima calorias'],
    icone: '💃',
    ambiente: 'indoor'
  },
  
  // Força
  {
    tipo: 'forca',
    nome: 'Exercícios com Peso Corporal',
    duracao: 20,
    calorias: 120,
    dificuldade: 'iniciante',
    equipamento: ['Nenhum'],
    descricao: 'Flexões, agachamentos, pranchas',
    beneficios: ['Fortalece músculos', 'Melhora postura', 'Não precisa academia'],
    icone: '💪',
    ambiente: 'indoor'
  },
  {
    tipo: 'forca',
    nome: 'Treino com Halteres',
    duracao: 35,
    calorias: 180,
    dificuldade: 'intermediario',
    equipamento: ['Halteres'],
    descricao: 'Exercícios para grupos musculares principais',
    beneficios: ['Aumenta massa muscular', 'Acelera metabolismo', 'Fortalece ossos'],
    icone: '🏋️‍♂️',
    ambiente: 'indoor'
  },
  
  // Flexibilidade
  {
    tipo: 'flexibilidade',
    nome: 'Yoga Suave',
    duracao: 30,
    calorias: 100,
    dificuldade: 'iniciante',
    equipamento: ['Tapete'],
    descricao: 'Posturas básicas de yoga e respiração',
    beneficios: ['Reduz estresse', 'Melhora flexibilidade', 'Fortalece core'],
    icone: '🧘‍♀️',
    ambiente: 'indoor'
  },
  {
    tipo: 'flexibilidade',
    nome: 'Alongamento Completo',
    duracao: 15,
    calorias: 50,
    dificuldade: 'iniciante',
    equipamento: ['Nenhum'],
    descricao: 'Alongamentos para todo o corpo',
    beneficios: ['Previne lesões', 'Alivia tensões', 'Melhora mobilidade'],
    icone: '🤸‍♀️',
    ambiente: 'indoor'
  },
  
  // Funcional
  {
    tipo: 'funcional',
    nome: 'HIIT Básico',
    duracao: 20,
    calorias: 200,
    dificuldade: 'intermediario',
    equipamento: ['Nenhum'],
    descricao: 'Treino intervalado de alta intensidade',
    beneficios: ['Queima muitas calorias', 'Eficiente', 'Melhora condicionamento'],
    icone: '⚡',
    ambiente: 'indoor'
  },
  {
    tipo: 'funcional',
    nome: 'Pilates',
    duracao: 45,
    calorias: 150,
    dificuldade: 'intermediario',
    equipamento: ['Tapete'],
    descricao: 'Exercícios focados no core e postura',
    beneficios: ['Fortalece core', 'Melhora postura', 'Aumenta flexibilidade'],
    icone: '🤸‍♂️',
    ambiente: 'indoor'
  },
  
  // Recuperação
  {
    tipo: 'recuperacao',
    nome: 'Caminhada Relaxante',
    duracao: 20,
    calorias: 80,
    dificuldade: 'iniciante',
    equipamento: ['Nenhum'],
    descricao: 'Caminhada leve para recuperação',
    beneficios: ['Promove recuperação', 'Reduz estresse', 'Melhora circulação'],
    icone: '🚶‍♀️',
    ambiente: 'ambos'
  },
  {
    tipo: 'recuperacao',
    nome: 'Meditação Ativa',
    duracao: 15,
    calorias: 30,
    dificuldade: 'iniciante',
    equipamento: ['Nenhum'],
    descricao: 'Meditação com movimentos suaves',
    beneficios: ['Reduz estresse', 'Melhora foco', 'Recupera energia'],
    icone: '🧘',
    ambiente: 'indoor'
  }
];

/**
 * Hook inteligente para recomendações de exercícios
 * Baseado no perfil do usuário, objetivos e dados de saúde
 */
type Objetivo = 'perder' | 'ganhar' | 'manter';
type NivelAtividade = 'sedentario' | 'leve' | 'moderado' | 'intenso';

export function useExerciciosInteligentes(overrides?: { objetivo?: Objetivo; nivelAtividade?: NivelAtividade }) {
  const { dadosPerfil, metasCalculadas } = useMetasAutomaticas();
  const peso = useWeightLogsInteligente();
  const nutricao = useMealLogsInteligente();

  // Determinar nível de condicionamento
  const nivelCondicionamento = useMemo(() => {
    const atividade = overrides?.nivelAtividade ?? dadosPerfil.nivelAtividade;
    if (atividade === 'sedentario' || atividade === 'leve') return 'iniciante';
    if (atividade === 'moderado') return 'intermediario';
    return 'avancado';
  }, [dadosPerfil.nivelAtividade, overrides?.nivelAtividade]);

  // Calcular calorias a queimar baseado no objetivo
  const caloriasAlvo = useMemo(() => {
    const objetivo = overrides?.objetivo ?? dadosPerfil.objetivo;
    const pesoAtual = peso.metasFinais.pesoAtual;
    
    if (objetivo === 'perder') {
      // Para perder 0.5kg por semana, precisa queimar ~500 calorias extras por dia
      return Math.round(500 * 0.3); // 30% via exercício, 70% via dieta
    } else if (objetivo === 'ganhar') {
      // Para ganho de massa, foco em exercícios de força
      return Math.round(pesoAtual * 2); // 2 calorias por kg de peso
    } else {
      // Manutenção: exercício moderado
      return Math.round(pesoAtual * 3); // 3 calorias por kg de peso
    }
  }, [dadosPerfil.objetivo, overrides?.objetivo, peso.metasFinais.pesoAtual]);

  // Gerar recomendações inteligentes
  const recomendacoes: RecomendacaoInteligente[] = useMemo(() => {
    const recomendacoes: RecomendacaoInteligente[] = [];
    const objetivoEfetivo = overrides?.objetivo ?? dadosPerfil.objetivo;

    // Baseado no IMC
    if (peso.metasFinais.statusSaude === 'sobrepeso' || peso.metasFinais.statusSaude === 'obesidade') {
      if (objetivoEfetivo === 'perder') {
        recomendacoes.push({
          categoria: 'peso',
          titulo: 'Cardio Consistente para Reduzir Medidas',
          descricao: 'Cardio regular e progressivo auxilia na redução de gordura corporal com segurança.',
          motivacao: 'Constância > intensidade. Você está no caminho! 💪',
          intensidade: 'moderada',
          icone: '🏃‍♂️'
        });
      } else if (objetivoEfetivo === 'ganhar') {
        recomendacoes.push({
          categoria: 'peso',
          titulo: 'Foque Força, Inclua Cardio Leve',
          descricao: 'Treinos de força para ganho muscular, com cardio leve para saúde cardiovascular.',
          motivacao: 'Construir músculo com qualidade também cuida do coração. 🫀',
          intensidade: 'moderada',
          icone: '💪'
        });
      } else {
        recomendacoes.push({
          categoria: 'peso',
          titulo: 'Cardio Moderado para Manutenção',
          descricao: 'Sessões de cardio moderadas ajudam a manter composição corporal saudável.',
          motivacao: 'Equilíbrio e consistência geram resultado sustentável. ⚖️',
          intensidade: 'moderada',
          icone: '🚶‍♂️'
        });
      }
    }

    // Baseado na tendência de peso
    if (peso.analiseTendencia.direcao === 'subindo') {
      if (objetivoEfetivo === 'perder') {
        recomendacoes.push({
          categoria: 'peso',
          titulo: 'Ajuste de Intensidade (Cardio + Funcional)',
          descricao: 'Variações pra cima pedem reforço de cardio e funcional esta semana.',
          motivacao: 'Pequenos ajustes = grandes resultados. 🔥',
          intensidade: 'alta',
          icone: '⚡'
        });
      } else if (objetivoEfetivo === 'ganhar') {
        recomendacoes.push({
          categoria: 'peso',
          titulo: 'Boa! Sinal de Progresso em Massa',
          descricao: 'Mantenha treinos de força consistentes e monitore a qualidade dos ganhos.',
          motivacao: 'Força, técnica e descanso: trio do crescimento. 🧱',
          intensidade: 'moderada',
          icone: '🏋️‍♂️'
        });
      }
    } else if (peso.analiseTendencia.direcao === 'descendo' && objetivoEfetivo === 'ganhar') {
      recomendacoes.push({
        categoria: 'peso',
        titulo: 'Refinar Carga e Volume',
        descricao: 'Queda no peso? Aumente gradualmente volume de força e suporte proteico.',
        motivacao: 'Ajuste fino mantém a evolução contínua. �',
        intensidade: 'moderada',
        icone: '📈'
      });
    }

    // Baseado no nível de atividade
    if ((overrides?.nivelAtividade ?? dadosPerfil.nivelAtividade) === 'sedentario') {
      recomendacoes.push({
        categoria: 'geral',
        titulo: 'Comece Devagar e Consistente',
        descricao: 'Atividades leves e regulares são a chave para criar o hábito.',
        motivacao: 'O primeiro passo é sempre o mais importante! 🌟',
        intensidade: 'baixa',
        icone: '🚶‍♂️'
      });
    }

    // Baseado na nutrição
    if (nutricao.progressoHoje && nutricao.progressoHoje.calorias > 120) {
      if (objetivoEfetivo === 'perder' || objetivoEfetivo === 'manter') {
        recomendacoes.push({
          categoria: 'cardio',
          titulo: 'Equilibrar com Cardio',
          descricao: 'Excedeu calorias hoje? Uma sessão de cardio ajuda a balancear.',
          motivacao: 'Consistência e balanço fazem a diferença. ⚖️',
          intensidade: 'moderada',
          icone: '🔥'
        });
      } else if (objetivoEfetivo === 'ganhar') {
        recomendacoes.push({
          categoria: 'forca',
          titulo: 'Aproveite para Força',
          descricao: 'Com energia extra, foque em treino de força para bons ganhos.',
          motivacao: 'Energia bem usada vira progresso. 💥',
          intensidade: 'moderada',
          icone: '�'
        });
      }
    }

    // Baseado no dia da semana
    const hoje = new Date().getDay();
    if (hoje === 1) { // Segunda-feira
      recomendacoes.push({
        categoria: 'energia',
        titulo: 'Comece a Semana com Energia',
        descricao: 'Segunda-feira é perfeita para começar com uma atividade energizante.',
        motivacao: 'Uma segunda ativa define o tom da semana! 🚀',
        intensidade: 'moderada',
        icone: '🌟'
      });
    } else if (hoje === 5) { // Sexta-feira
      recomendacoes.push({
        categoria: 'humor',
        titulo: 'Finalize a Semana com Alegria',
        descricao: 'Que tal uma atividade divertida para celebrar o fim da semana?',
        motivacao: 'Você merece uma sexta-feira especial! 🎉',
        intensidade: 'moderada',
        icone: '💃'
      });
    }

    return recomendacoes;
  }, [peso, dadosPerfil, nutricao.progressoHoje, overrides?.objetivo, overrides?.nivelAtividade]);

  // Gerar plano semanal personalizado
  const planoSemanal: PlanoExercicioSemanal = useMemo(() => {
    const objetivo = overrides?.objetivo ?? dadosPerfil.objetivo;
    const nivel = nivelCondicionamento;
    
    // Filtrar atividades apropriadas
    const atividadesDisponiveis = ATIVIDADES_BASE.filter(atividade => 
      atividade.dificuldade === nivel || 
      (nivel === 'avancado' && atividade.dificuldade === 'intermediario') ||
      (nivel === 'intermediario' && atividade.dificuldade === 'iniciante')
    );

    const selecionarAtividades = (tipos: AtividadeSugerida['tipo'][], quantidade: number): AtividadeSugerida[] => {
      const atividades = atividadesDisponiveis.filter(a => tipos.includes(a.tipo));
      return atividades.slice(0, quantidade);
    };

    let planoBase: Omit<PlanoExercicioSemanal, 'totalSemanal'>;

    if (objetivo === 'perder') {
      // Foco em cardio para perda de peso
      planoBase = {
        segunda: selecionarAtividades(['cardio', 'funcional'], 1),
        terca: selecionarAtividades(['forca'], 1),
        quarta: selecionarAtividades(['cardio'], 1),
        quinta: selecionarAtividades(['flexibilidade'], 1),
        sexta: selecionarAtividades(['funcional'], 1),
        sabado: selecionarAtividades(['cardio'], 1),
        domingo: selecionarAtividades(['recuperacao'], 1)
      };
    } else if (objetivo === 'ganhar') {
      // Foco em força para ganho de massa
      planoBase = {
        segunda: selecionarAtividades(['forca'], 1),
        terca: selecionarAtividades(['cardio'], 1),
        quarta: selecionarAtividades(['forca'], 1),
        quinta: selecionarAtividades(['flexibilidade'], 1),
        sexta: selecionarAtividades(['forca'], 1),
        sabado: selecionarAtividades(['funcional'], 1),
        domingo: selecionarAtividades(['recuperacao'], 1)
      };
    } else {
      // Equilibrio para manutenção
      planoBase = {
        segunda: selecionarAtividades(['cardio'], 1),
        terca: selecionarAtividades(['forca'], 1),
        quarta: selecionarAtividades(['flexibilidade'], 1),
        quinta: selecionarAtividades(['funcional'], 1),
        sexta: selecionarAtividades(['cardio'], 1),
        sabado: selecionarAtividades(['forca'], 1),
        domingo: selecionarAtividades(['recuperacao'], 1)
      };
    }

    // Calcular totais semanais
    const todasAtividades = [
      ...planoBase.segunda, ...planoBase.terca, ...planoBase.quarta, ...planoBase.quinta,
      ...planoBase.sexta, ...planoBase.sabado, ...planoBase.domingo
    ];

    const totalSemanal = {
      tempo: todasAtividades.reduce((acc, atividade) => acc + atividade.duracao, 0),
      calorias: todasAtividades.reduce((acc, atividade) => acc + atividade.calorias, 0),
      variedade: new Set(todasAtividades.map(a => a.tipo)).size
    };

    const plano: PlanoExercicioSemanal = { ...planoBase, totalSemanal };
    return plano;
  }, [dadosPerfil.objetivo, overrides?.objetivo, nivelCondicionamento]);

  // Atividade recomendada para hoje
  const atividadeHoje = useMemo(() => {
    const hoje = new Date().getDay();
    const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'] as const;
    const dia = diasSemana[hoje];
    return planoSemanal[dia][0] || null;
  }, [planoSemanal]);

  return {
    // Dados calculados
    nivelCondicionamento,
    caloriasAlvo,
    metasCalculadas,
    dadosPerfil,
    objetivoEfetivo: overrides?.objetivo ?? (dadosPerfil.objetivo as Objetivo | undefined),
    
    // Recomendações
    recomendacoes,
    planoSemanal,
    atividadeHoje,
    
    // Dados brutos para customização
    atividadesDisponiveis: ATIVIDADES_BASE
  };
}