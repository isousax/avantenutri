import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useQuestionario } from "../../contexts/useQuestionario";
import { SEO } from "../../components/comum/SEO";
import { useI18n } from "../../i18n";
import { useSaveQuestionnaire } from "../../hooks/useQuestionnaire";
import { useToast } from "../../components/ui/ToastProvider";
import {
  ArrowLeft,
  Baby,
  Heart,
  User,
  Activity,
  ChevronRight,
  CheckCircle,
  Star,
  Award,
  Zap,
} from "lucide-react";

// Tipos (mantidos iguais)
type CategoriaType = "infantil" | "gestante" | "adulto" | "esportiva";

interface Pergunta {
  pergunta: string;
  tipo: "texto" | "numero" | "select" | "textarea";
  icon: string;
  expansivel?: boolean;
  placeholderExt?: string;
  opcoes?: string[];
  required?: boolean;
  id: string;
}

interface Categoria {
  label: string;
  value: CategoriaType;
  icon: React.ReactNode;
  description: string;
  color: string;
  borderColor: string;
  activeColor: string;
  gradient: string;
}

// Categorias com ícones modernos
const categorias: Categoria[] = [
  {
    label: "Nutrição Infantil",
    value: "infantil",
    icon: <Baby size={24} />,
    description: "Para crianças de 0 a 12 anos",
    color: "from-blue-50 to-blue-100",
    borderColor: "border-blue-200",
    activeColor: "border-blue-500 bg-blue-50",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    label: "Nutrição na Gestação",
    value: "gestante",
    icon: <Heart size={24} />,
    description: "Acompanhamento pré e pós-parto",
    color: "from-pink-50 to-pink-100",
    borderColor: "border-pink-200",
    activeColor: "border-pink-500 bg-pink-50",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    label: "Nutrição Adulto/Idoso",
    value: "adulto",
    icon: <User size={24} />,
    description: "Para adultos e melhor idade",
    color: "from-green-50 to-green-100",
    borderColor: "border-green-200",
    activeColor: "border-green-500 bg-green-50",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    label: "Nutrição Esportiva",
    value: "esportiva",
    icon: <Activity size={24} />,
    description: "Otimização de performance",
    color: "from-orange-50 to-orange-100",
    borderColor: "border-orange-200",
    activeColor: "border-orange-500 bg-orange-50",
    gradient: "from-orange-500 to-red-500",
  },
];

// Perguntas por categoria (mantidas iguais)
const perguntasPorCategoria: Record<CategoriaType, Pergunta[]> = {
  infantil: [
    {
      id: "nome_crianca",
      pergunta: "Nome da criança",
      tipo: "texto",
      icon: "👧",
    },
    { id: "idade", pergunta: "Idade", tipo: "numero", icon: "🎂" },
    {
      id: "peso_atual",
      pergunta: "Peso atual (kg)",
      tipo: "numero",
      icon: "⚖️",
    },
    {
      id: "sexo",
      pergunta: "Sexo",
      tipo: "select",
      icon: "🚻",
      opcoes: ["Feminino", "Masculino"],
    },
    { id: "altura", pergunta: "Altura (cm)", tipo: "numero", icon: "📏" },
    {
      id: "restricao_alimentar",
      pergunta: "Possui alguma restrição alimentar?",
      tipo: "select",
      icon: "🚫",
      expansivel: true,
      placeholderExt: "Descreva a restrição alimentar",
      opcoes: ["Não", "Sim - Lactose", "Sim - Glúten", "Sim - Outras"],
    },
    {
      id: "objetivo_nutricional",
      pergunta: "Objetivo principal",
      tipo: "select",
      icon: "🎯",
      expansivel: true,
      placeholderExt: "Descreva o objetivo nutricional",
      opcoes: [
        "Ganho de peso",
        "Perda de peso",
        "Melhorar alimentação",
        "Problemas digestivos",
        "Outros",
      ],
    },
  ],
  gestante: [
    { id: "idade", pergunta: "Idade", tipo: "numero", icon: "🎂" },
    { id: "profissao", pergunta: "Profissão", tipo: "texto", icon: "💼" },
    {
      id: "tempo_gestacao",
      pergunta: "Tempo de gestação (semanas)",
      tipo: "numero",
      icon: "📅",
    },
    {
      id: "peso_antes",
      pergunta: "Peso antes da gravidez (kg)",
      tipo: "numero",
      icon: "⚖️",
    },
    {
      id: "peso_atual",
      pergunta: "Peso atual (kg)",
      tipo: "numero",
      icon: "⚖️",
    },
    {
      id: "restricao_alimentar",
      pergunta: "Possui restrições alimentares?",
      tipo: "select",
      icon: "🚫",
      expansivel: true,
      placeholderExt: "Descreva a restrição alimentar",
      opcoes: ["Não", "Sim - Lactose", "Sim - Glúten", "Sim - Outras"],
    },
    {
      id: "problemas_gestacao",
      pergunta: "Teve complicações na gestação?",
      tipo: "select",
      icon: "🏥",
      expansivel: true,
      placeholderExt: "Qual?",
      opcoes: ["Não", "Sim"],
    },
    {
      id: "objetivo_nutricional",
      pergunta: "Objetivo nutricional",
      tipo: "select",
      icon: "🎯",
      expansivel: true,
      placeholderExt: "Descreva o objetivo nutricional",
      opcoes: [
        "Controlar ganho de peso",
        "Melhorar nutrição",
        "Preparar para amamentação",
        "Outros",
      ],
    },
  ],
  adulto: [
    { id: "idade", pergunta: "Idade", tipo: "numero", icon: "🎂" },
    {
      id: "sexo",
      pergunta: "Sexo",
      tipo: "select",
      icon: "🚻",
      opcoes: ["Feminino", "Masculino"],
    },
    { id: "profissao", pergunta: "Profissão", tipo: "texto", icon: "💼" },
    { id: "peso", pergunta: "Peso (kg)", tipo: "numero", icon: "⚖️" },
    { id: "altura", pergunta: "Altura (cm)", tipo: "numero", icon: "📏" },
    {
      id: "atividade_fisica",
      pergunta: "Nível de atividade física",
      tipo: "select",
      icon: "💪",
      expansivel: false,
      opcoes: [
        "Sedentário",
        "Leve (1-2x/semana)",
        "Moderado (3-4x/semana)",
        "Intenso (5+ vezes/semana)",
      ],
    },
    {
      id: "restricao_alimentar",
      pergunta: "Possui restrições alimentares?",
      tipo: "select",
      icon: "🚫",
      expansivel: true,
      placeholderExt: "Descreva a restrição alimentar",
      opcoes: ["Não", "Sim - Lactose", "Sim - Glúten", "Sim - Outras"],
    },
    {
      id: "objetivo_nutricional",
      pergunta: "Objetivo principal",
      tipo: "select",
      icon: "🎯",
      expansivel: true,
      placeholderExt: "Descreva o objetivo nutricional",
      opcoes: [
        "Emagrecimento",
        "Ganho de massa",
        "Melhorar saúde",
        "Performance esportiva",
        "Controle de doenças",
        "Outros",
      ],
    },
  ],
  esportiva: [
    { id: "idade", pergunta: "Idade", tipo: "numero", icon: "🎂" },
    {
      id: "sexo",
      pergunta: "Sexo",
      tipo: "select",
      icon: "🚻",
      opcoes: ["Feminino", "Masculino"],
    },
    { id: "profissao", pergunta: "Profissão", tipo: "texto", icon: "💼" },
    { id: "esporte", pergunta: "Esporte praticado", tipo: "texto", icon: "⚽" },
    {
      id: "frequencia_treinos",
      pergunta: "Frequência de treinos",
      tipo: "select",
      icon: "📊",
      expansivel: false,
      opcoes: ["3-4x/semana", "5-6x/semana", "Diário", "Profissional"],
    },
    { id: "peso", pergunta: "Peso (kg)", tipo: "numero", icon: "⚖️" },
    { id: "altura", pergunta: "Altura (cm)", tipo: "numero", icon: "📏" },
    {
      id: "restricao_alimentar",
      pergunta: "Possui alguma restrição alimentar?",
      tipo: "select",
      icon: "🚫",
      expansivel: true,
      placeholderExt: "Descreva a restrição alimentar",
      opcoes: ["Não", "Sim - Lactose", "Sim - Glúten", "Sim - Outras"],
    },
    {
      id: "objetivo_nutricional",
      pergunta: "Objetivo principal",
      tipo: "select",
      icon: "🎯",
      expansivel: false,
      opcoes: [
        "Melhorar performance",
        "Ganho de massa",
        "Definição muscular",
        "Recuperação pós-treino",
        "Competição específica",
      ],
    },
    {
      id: "suplementos",
      pergunta: "Utiliza algum suplemento?",
      tipo: "select",
      icon: "💊",
      expansivel: true,
      opcoes: ["Sim", "Não"],
      placeholderExt: "Quais?",
    },
  ],
};

const etapas = ["Categoria", "Informações", "Confirmação"];

const QuestionarioPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { questionarioData, updateQuestionario } = useQuestionario();
  const { step, categoria, respostas } = questionarioData;
  const [erros, setErros] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const saveQuestionnaire = useSaveQuestionnaire();
  const { push } = useToast();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const validarEtapa = (etapa: number): boolean => {
    const novosErros: Record<string, string> = {};

    if (etapa === 0 && !categoria) return false;

    if (etapa === 1 && categoria) {
      const perguntas = perguntasPorCategoria[categoria as CategoriaType];
      perguntas.forEach((perguntaObj: Pergunta) => {
        if (!respostas[perguntaObj.id]?.trim()) {
          novosErros[perguntaObj.id] = "Campo obrigatório";
        }
      });
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && categoria) {
      const perguntas = perguntasPorCategoria[categoria as CategoriaType];
      if (currentQuestionIndex < perguntas.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        return;
      }
    }

    if (validarEtapa(step)) {
      updateQuestionario({ step: Math.min(step + 1, etapas.length - 1) });
      setCurrentQuestionIndex(0);
    }
  };

  const handleBack = () => {
    if (step === 1 && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      return;
    }

    updateQuestionario({ step: Math.max(step - 1, 0) });
    setCurrentQuestionIndex(0);
  };

  const handleInputChange = (campo: string, valor: string) => {
    updateQuestionario({ respostas: { ...respostas, [campo]: valor } });
    if (erros[campo]) setErros((prev) => ({ ...prev, [campo]: "" }));
  };

  const handleSubmit = async () => {
    if (!validarEtapa(step) || !categoria) return;

    const perguntasValidas = perguntasPorCategoria[categoria as CategoriaType];
    const respostasFiltradas: Record<string, string> = {};

    perguntasValidas.forEach((p) => {
      if (respostas[p.id]) {
        respostasFiltradas[p.id] = respostas[p.id];
      }
      if (p.expansivel && respostas[`${p.id}_detalhe`]) {
        respostasFiltradas[`${p.id}_detalhe`] = respostas[`${p.id}_detalhe`];
      }
    });

    try {
      await saveQuestionnaire.mutateAsync({
        categoria,
        respostas: respostasFiltradas,
      });

      updateQuestionario({ step: etapas.length - 1 });

      // Feedback e pequeno delay antes de redirecionar
      push({ type: 'success', message: 'Questionário salvo com sucesso. Redirecionando...' });
      setTimeout(() => {
        navigate("/dashboard");
      }, 800);
    } catch (error) {
      console.error("Erro ao salvar questionário:", error);
    }
  };

  // Componente de pergunta individual
  const RenderPergunta = ({ pergunta }: { pergunta: Pergunta }) => {
    const progresso = categoria
      ? ((currentQuestionIndex + 1) /
          perguntasPorCategoria[categoria as CategoriaType].length) *
        100
      : 0;

    return (
      <div className="space-y-6">
        {/* Cabeçalho da pergunta */}
        <div className="text-center mb-8">
          <div className="flex items-center gap-3 mb-4">
            {/* Ícone */}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">{pergunta.icon}</span>
            </div>

            {/* Texto */}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-left break-words leading-snug">
                {pergunta.pergunta}
              </h2>
              <p className="text-gray-600 text-[11px] mt-1 flex items-center justify-start">
                Pergunta {currentQuestionIndex + 1} de{" "}
                {perguntasPorCategoria[categoria as CategoriaType].length}
              </p>
            </div>
          </div>

          {/* Barra de progresso da pergunta */}
          <div className="max-w-md mx-auto">
            <div className="flex justify-end text-xs text-gray-600 mb-2">
              <span>{Math.round(progresso)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>
        </div>

        {/* Campo de entrada */}
        <div className="space-y-4">
          {pergunta.tipo === "texto" && (
            <input
              className="w-full px-4 py-4 border-2 rounded-xl text-lg flex pr-10 bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 placeholder:text-gray-400 focus:border-green-800 focus:ring-green-700/20"
              value={respostas[pergunta.id] || ""}
              onChange={(e) => handleInputChange(pergunta.id, e.target.value)}
              placeholder={`Digite ${pergunta.pergunta.toLowerCase()}`}
              autoFocus
            />
          )}

          {pergunta.tipo === "numero" && (
            <input
              type="number"
              className="w-full px-4 py-4 border-2 rounded-xl text-lg flex pr-10 bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 placeholder:text-gray-400 focus:border-green-800 focus:ring-green-700/20 text-center"
              value={respostas[pergunta.id] || ""}
              onChange={(e) => handleInputChange(pergunta.id, e.target.value)}
              placeholder={`Digite ${pergunta.pergunta.toLowerCase()}`}
              autoFocus
            />
          )}

          {pergunta.tipo === "select" && (
            <div className="space-y-3">
              <select
                className="w-full px-4 py-4 border-2 rounded-xl text-lg flex pr-10 bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 placeholder:text-gray-400 focus:border-green-800 focus:ring-green-700/20"
                value={respostas[pergunta.id] || ""}
                onChange={(e) => handleInputChange(pergunta.id, e.target.value)}
                autoFocus
              >
                <option value="">Selecione uma opção</option>
                {pergunta.opcoes?.map((o: string, i: number) => (
                  <option key={i} value={o}>
                    {o}
                  </option>
                ))}
              </select>

              {pergunta.expansivel &&
                ["Sim - Outras", "Outros", "Sim"].includes(
                  respostas[pergunta.id]
                ) && (
                  <input
                    className="w-full px-4 py-4 border-2 rounded-xl text-lg flex pr-10 bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 placeholder:text-gray-400 focus:border-green-800 focus:ring-green-700/20"
                    value={respostas[`${pergunta.id}_detalhe`] || ""}
                    onChange={(e) =>
                      handleInputChange(
                        `${pergunta.id}_detalhe`,
                        e.target.value
                      )
                    }
                    placeholder={
                      pergunta.placeholderExt || "Por favor, especifique"
                    }
                    autoFocus
                  />
                )}
            </div>
          )}

          {pergunta.tipo === "textarea" && (
            <textarea
              rows={4}
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-lg"
              placeholder={`${pergunta.pergunta.toLowerCase()}`}
              value={respostas[pergunta.id] || ""}
              onChange={(e) => handleInputChange(pergunta.id, e.target.value)}
              autoFocus
            />
          )}

          {erros[pergunta.id] && (
            <div className="flex items-center gap-2 text-red-500 text-sm p-3 bg-red-50 rounded-lg border border-red-200">
              <Zap size={16} />
              {erros[pergunta.id]}
            </div>
          )}
        </div>

        {/* Dica motivacional */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-3">
            <Star size={20} className="text-blue-500 flex-shrink-0" />
            <p className="text-blue-700 text-xs">
              {currentQuestionIndex === 0
                ? "Ótimo começo! Suas informações nos ajudarão a personalizar sua experiência."
                : "Continue assim! Isso nos permite criar uma experiência feita sob medida para você."}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Render por etapa
  let conteudo;

  if (step === 0) {
    conteudo = (
      <div className="space-y-8">
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
            Como podemos te ajudar?
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm">
            Escolha a categoria que melhor se adequa às suas necessidades
          </p>
        </div>

        <div className="grid gap-4 md:gap-6">
          {categorias.map((cat) => (
            <div
              key={cat.value}
              className={`p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 group ${
                categoria === cat.value
                  ? `${cat.activeColor} shadow-lg scale-105 border-2`
                  : `${cat.borderColor} ${cat.color} hover:shadow-md`
              }`}
              onClick={() =>
                updateQuestionario({ categoria: cat.value as CategoriaType })
              }
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-xl bg-gradient-to-br ${cat.gradient} shadow-lg group-hover:shadow-xl transition-shadow`}
                >
                  {cat.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold sm:text-lg text-gray-800">
                    {cat.label}
                  </h3>
                  <p className="text-gray-600 text-xs">{cat.description}</p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    categoria === cat.value
                      ? "bg-green-500 border-green-500 scale-110"
                      : "border-gray-300 group-hover:border-gray-400"
                  }`}
                >
                  {categoria === cat.value && (
                    <CheckCircle className="w-3 h-3 text-white" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-6">
          <Button
            variant="secondary"
            className="flex-1 border-none p-0 text-sm hover:bg-transparent cursor-default"
            disabled
          >
            <span
              onClick={() => navigate("/dashboard")}
              className="cursor-pointer"
            >
              Voltar
            </span>
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-0 text-white shadow-lg shadow-green-500/25 flex items-center justify-center gap-2"
            disabled={!categoria}
          >
            Continuar
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>
    );
  } else if (step === 1 && categoria) {
    const perguntas = perguntasPorCategoria[categoria as CategoriaType] || [];
    const perguntaAtual = perguntas[currentQuestionIndex];

    conteudo = (
      <div className="space-y-6">
        <RenderPergunta pergunta={perguntaAtual} />

        <div className="flex gap-3 pt-6">
          <Button
            onClick={handleBack}
            variant="secondary"
            className="flex-1 border-none p-10 text-sm hover:bg-transparent cursor-default"
          >
            {currentQuestionIndex === 0 ? "Voltar" : "Anterior"}
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-0 text-white shadow-lg shadow-green-500/25 flex items-center justify-center gap-2"
            disabled={!respostas[perguntaAtual.id]?.trim()}
          >
            {currentQuestionIndex === perguntas.length - 1
              ? "Revisar"
              : "Próxima"}
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>
    );
  } else if (step === 2) {
    const perguntas = categoria
      ? perguntasPorCategoria[categoria as CategoriaType]
      : [];

    const categoriaSelecionada = categorias.find(
      (cat) => cat.value === categoria
    );

    conteudo = (
      <div className="space-y-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Award size={32} className="text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
            Perfeito! ✨
          </h2>
          <p className="text-gray-600 text-sm">Confirme suas informações</p>
        </div>

        {/* Card de resumo */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0">
          <div className="p-1">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                {categoriaSelecionada?.icon}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 text-lg">
                  {categoriaSelecionada?.label}
                </h3>
              </div>
            </div>

            <div className="grid gap-4">
              {perguntas.map((p: Pergunta, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-white/60 rounded-lg border border-white"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{p.icon}</span>
                    <span className="font-medium text-gray-700 text-xs">
                      {p.pergunta}
                    </span>
                  </div>
                  <span className="text-gray-900 font-semibold text-xs text-right">
                    {respostas[p.id] || "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleBack}
            variant="secondary"
            className="flex-1 py-3 border-gray-300 hover:border-gray-400"
            disabled={saveQuestionnaire.isPending}
          >
            Editar
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 text-white shadow-lg shadow-green-500/25 flex items-center justify-center gap-2"
            disabled={saveQuestionnaire.isPending}
          >
            {saveQuestionnaire.isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Salvar
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 safe-area-bottom">
      <SEO
        title={t("questionario.seo.title")}
        description={t("questionario.seo.desc")}
      />

      {/* Header moderno */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 backdrop-blur-lg bg-white/95">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 active:scale-95"
              aria-label="Voltar"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>

            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">
                Questionário de Saúde
              </h1>
              <p className="text-xs text-gray-500">
                Etapa {step + 1} de {etapas.length} • {etapas[step]}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Conteúdo principal */}
        <Card className="w-full p-6 md:p-8 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <div className="animate-fade-in">{conteudo}</div>
        </Card>

        {/* Mensagem de incentivo */}
        {!saveQuestionnaire.isPending && step !== 2 && (
          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">
              Leva menos de 2 minutos • Suas informações estão seguras
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionarioPage;
