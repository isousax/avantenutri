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
  categoria: 'geral' | 'peso' | 'cardio' | 'energia' | 'humor';
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
    icone: '🚶‍♂️'
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
    icone: '🏃‍♂️'
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
    icone: '💃'
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
    icone: '💪'
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
    icone: '🏋️‍♂️'
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
    icone: '🧘‍♀️'
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
    icone: '🤸‍♀️'
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
    icone: '⚡'
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
    icone: '🤸‍♂️'
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
    icone: '🚶‍♀️'
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
    icone: '🧘'
  }
];

/**
 * Hook inteligente para recomendações de exercícios
 * Baseado no perfil do usuário, objetivos e dados de saúde
 */
export function useExerciciosInteligentes() {
  const { dadosPerfil, metasCalculadas } = useMetasAutomaticas();
  const peso = useWeightLogsInteligente();
  const nutricao = useMealLogsInteligente();

  // Determinar nível de condicionamento
  const nivelCondicionamento = useMemo(() => {
    const atividade = dadosPerfil.nivelAtividade;
    if (atividade === 'sedentario' || atividade === 'leve') return 'iniciante';
    if (atividade === 'moderado') return 'intermediario';
    return 'avancado';
  }, [dadosPerfil.nivelAtividade]);

  // Calcular calorias a queimar baseado no objetivo
  const caloriasAlvo = useMemo(() => {
    const objetivo = dadosPerfil.objetivo;
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
  }, [dadosPerfil.objetivo, peso.metasFinais.pesoAtual]);

  // Gerar recomendações inteligentes
  const recomendacoes: RecomendacaoInteligente[] = useMemo(() => {
    const recomendacoes: RecomendacaoInteligente[] = [];

    // Baseado no IMC
    if (peso.metasFinais.statusSaude === 'sobrepeso' || peso.metasFinais.statusSaude === 'obesidade') {
      recomendacoes.push({
        categoria: 'peso',
        titulo: 'Foco em Cardio para Perda de Peso',
        descricao: 'Exercícios cardiovasculares ajudarão a queimar calorias e reduzir o peso.',
        motivacao: 'Cada sessão te aproxima do seu peso ideal! 💪',
        intensidade: 'moderada',
        icone: '🏃‍♂️'
      });
    }

    // Baseado na tendência de peso
    if (peso.analiseTendencia.direcao === 'subindo' && dadosPerfil.objetivo === 'perder') {
      recomendacoes.push({
        categoria: 'peso',
        titulo: 'Intensificar Atividades',
        descricao: 'Seu peso está subindo. Hora de aumentar a intensidade dos exercícios.',
        motivacao: 'Você tem força para reverter essa tendência! 🔥',
        intensidade: 'alta',
        icone: '⚡'
      });
    }

    // Baseado no nível de atividade
    if (dadosPerfil.nivelAtividade === 'sedentario') {
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
      recomendacoes.push({
        categoria: 'cardio',
        titulo: 'Queimar Calorias Extras',
        descricao: 'Você consumiu mais calorias hoje. Um exercício cardio pode ajudar.',
        motivacao: 'Transforme essas calorias em energia positiva! ⚡',
        intensidade: 'moderada',
        icone: '🔥'
      });
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
  }, [peso, dadosPerfil, nutricao.progressoHoje]);

  // Gerar plano semanal personalizado
  const planoSemanal: PlanoExercicioSemanal = useMemo(() => {
    const objetivo = dadosPerfil.objetivo;
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
  }, [dadosPerfil.objetivo, nivelCondicionamento]);

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
    
    // Recomendações
    recomendacoes,
    planoSemanal,
    atividadeHoje,
    
    // Dados brutos para customização
    atividadesDisponiveis: ATIVIDADES_BASE
  };
}