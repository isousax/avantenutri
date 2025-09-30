import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import ProgressBar from "../../components/ui/ProgressBar";
import { useQuestionario } from "../../contexts/useQuestionario";
import { SEO } from "../../components/comum/SEO";
import { useI18n } from "../../i18n";
import { useSaveQuestionnaire } from "../../hooks/useQuestionnaire";

// Tipos
type CategoriaType = 'infantil' | 'gestante' | 'adulto' | 'esportiva';

interface Pergunta {
  pergunta: string;
  tipo: 'texto' | 'numero' | 'select' | 'textarea';
  icon: string;
  expansivel?: boolean;
  placeholderExt?: string;
  opcoes?: string[];
  required?: boolean;
}

interface Categoria {
  label: string;
  value: CategoriaType;
  icon: string;
  description: string;
  color: string;
  borderColor: string;
  activeColor: string;
}

// Categorias
const categorias: Categoria[] = [
  {
    label: "Nutrição Infantil",
    value: "infantil",
    icon: "👶",
    description: "Para crianças de 0 a 12 anos",
    color: "from-blue-50 to-blue-100",
    borderColor: "border-blue-200",
    activeColor: "border-blue-500 bg-blue-50",
  },
  {
    label: "Nutrição na Gestação",
    value: "gestante",
    icon: "🤰",
    description: "Acompanhamento pré e pós-parto",
    color: "from-pink-50 to-pink-100",
    borderColor: "border-pink-200",
    activeColor: "border-pink-500 bg-pink-50",
  },
  {
    label: "Nutrição Adulto/Idoso",
    value: "adulto",
    icon: "👩‍💼",
    description: "Para adultos e melhor idade",
    color: "from-green-50 to-green-100",
    borderColor: "border-green-200",
    activeColor: "border-green-500 bg-green-50",
  },
  {
    label: "Nutrição Esportiva",
    value: "esportiva",
    icon: "🏃‍♀️",
    description: "Otimização de performance",
    color: "from-orange-50 to-orange-100",
    borderColor: "border-orange-200",
    activeColor: "border-orange-500 bg-orange-50",
  },
];

// Perguntas por categoria
const perguntasPorCategoria: Record<CategoriaType, Pergunta[]> = {
  infantil: [
    { pergunta: "Nome da criança", tipo: "texto", icon: "👧" },
    { pergunta: "Idade", tipo: "numero", icon: "🎂" },
    { pergunta: "Peso atual (kg)", tipo: "numero", icon: "⚖️" },
    { pergunta: "Altura (cm)", tipo: "numero", icon: "📏" },
    {
      pergunta: "Possui alguma restrição alimentar?",
      tipo: "select",
      icon: "🚫",
      expansivel: true,
      placeholderExt: "Descreva a restrição alimentar",
      opcoes: ["Não", "Sim - Lactose", "Sim - Glúten", "Sim - Outras"],
    },
    {
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
    {
      pergunta: "Descreva brevemente os hábitos alimentares atuais",
      tipo: "textarea",
      icon: "📝",
    },
  ],
  gestante: [
    { pergunta: "Idade", tipo: "numero", icon: "🎂" },
    { pergunta: "Tempo de gestação (semanas)", tipo: "numero", icon: "📅" },
    { pergunta: "Peso antes da gravidez (kg)", tipo: "numero", icon: "⚖️" },
    { pergunta: "Peso atual (kg)", tipo: "numero", icon: "⚖️" },
    {
      pergunta: "Possui restrições alimentares?",
      tipo: "select",
      icon: "🚫",
      expansivel: true,
      placeholderExt: "Descreva a restrição alimentar",
      opcoes: ["Não", "Sim - Lactose", "Sim - Glúten", "Sim - Outras"],
    },
    {
      pergunta: "Teve algum problema de saúde durante a gestação?",
      tipo: "textarea",
      icon: "🏥",
    },
    {
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
    { pergunta: "Idade", tipo: "numero", icon: "🎂" },
    { pergunta: "Profissão", tipo: "texto", icon: "💼" },
    { pergunta: "Peso (kg)", tipo: "numero", icon: "⚖️" },
    { pergunta: "Altura (cm)", tipo: "numero", icon: "📏" },
    {
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
      pergunta: "Possui restrições alimentares?",
      tipo: "select",
      icon: "🚫",
      expansivel: true,
      placeholderExt: "Descreva a restrição alimentar",
      opcoes: ["Não", "Sim - Lactose", "Sim - Glúten", "Sim - Outras"],
    },
    {
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
    {
      pergunta: "Descreva sua rotina alimentar atual",
      tipo: "textarea",
      icon: "📝",
      required: false
    },
  ],
  esportiva: [
    { pergunta: "Idade", tipo: "numero", icon: "🎂" },
    { pergunta: "Esporte praticado", tipo: "texto", icon: "⚽" },
    {
      pergunta: "Frequência de treinos",
      tipo: "select",
      icon: "📊",
      expansivel: false,
      opcoes: ["3-4x/semana", "5-6x/semana", "Diário", "Profissional"],
    },
    { pergunta: "Peso (kg)", tipo: "numero", icon: "⚖️" },
    { pergunta: "Altura (cm)", tipo: "numero", icon: "📏" },
    {
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
      pergunta: "Suplementos utilizados atualmente",
      tipo: "textarea",
      icon: "💊",
    },
  ],
};

const etapas = ["", "", ""];

const QuestionarioPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { questionarioData, updateQuestionario } = useQuestionario();
  const { step, categoria, respostas } = questionarioData;
  const [erros, setErros] = useState<Record<string, string>>({});
  const saveQuestionnaire = useSaveQuestionnaire();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const validarEtapa = (etapa: number): boolean => {
    const novosErros: Record<string, string> = {};

    if (etapa === 0 && !categoria) return false;

    if (etapa === 1 && categoria) {
      const perguntas = perguntasPorCategoria[categoria as CategoriaType];
      perguntas.forEach((perguntaObj: Pergunta) => {
        if (!respostas[perguntaObj.pergunta]?.trim()) {
          novosErros[perguntaObj.pergunta] = "Campo obrigatório";
        }
      });
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleNext = () => {
    if (validarEtapa(step)) {
      updateQuestionario({ step: Math.min(step + 1, etapas.length - 1) });
    }
  };

  const handleBack = () => {
    updateQuestionario({ step: Math.max(step - 1, 0) });
  };

  const handleInputChange = (campo: string, valor: string) => {
    updateQuestionario({ respostas: { ...respostas, [campo]: valor } });
    if (erros[campo]) setErros((prev) => ({ ...prev, [campo]: "" }));
  };

  const handleSubmit = async () => {
    if (!validarEtapa(step) || !categoria) return;

    try {
      await saveQuestionnaire.mutateAsync({
        categoria,
        respostas
      });
      
      // Limpar dados locais após salvar com sucesso
      updateQuestionario({ step: etapas.length - 1 });
      
      // Exibir sucesso
      console.log("Questionário salvo com sucesso!");
      
      // Opcional: redirecionar para dashboard após alguns segundos
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
      
    } catch (error) {
      console.error("Erro ao salvar questionário:", error);
      // Aqui você poderia mostrar uma mensagem de erro para o usuário
    }
  };

  // Render por etapa
  let conteudo;

  if (step === 0) {
    conteudo = (
      <div className="space-y-8">
        <div className="text-center mb-6">
          <p className="text-gray-600 text-lg">
            Selecione a categoria que melhor se adequa às suas necessidades
          </p>
        </div>
        <div className="grid gap-4 md:gap-6">
          {categorias.map((cat) => (
            <div
              key={cat.value}
              className={`p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                categoria === cat.value
                  ? `${cat.activeColor} shadow-lg scale-105`
                  : `${cat.borderColor} ${cat.color} hover:shadow-md`
              }`}
              onClick={() => updateQuestionario({ categoria: cat.value as CategoriaType })}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white shadow-sm">
                  <span className="text-2xl">{cat.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800">
                    {cat.label}
                  </h3>
                  <p className="text-gray-600 text-sm">{cat.description}</p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    categoria === cat.value
                      ? "bg-green-500 border-green-500"
                      : "border-gray-300"
                  }`}
                >
                  {categoria === cat.value && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-6">
          <Button
            onClick={handleBack}
            variant="secondary"
            className="flex-1 py-4 border-gray-300 hover:border-gray-400"
          >
            Voltar
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-0 text-white shadow-lg shadow-green-500/25"
            disabled={!categoria}
          >
            Continuar
          </Button>
        </div>
      </div>
    );
  } else if (step === 1 && categoria) {
    const perguntas = perguntasPorCategoria[categoria as CategoriaType] || [];
    conteudo = (
      <div className="space-y-8">
        <div className="text-center mb-6">
          <p className="text-gray-600 text-lg">Conte-nos mais</p>
        </div>
        <div className="space-y-6">
          {perguntas.map((p: Pergunta, idx: number) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm"
            >
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                {p.icon && <span className="text-lg">{p.icon}</span>}
                {p.pergunta}
                <span className="text-red-500 ml-1">*</span>
              </label>
              {p.tipo === "texto" && (
                <input
                  className={`w-full px-4 py-3 border-2 rounded-xl ${
                    erros[p.pergunta]
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200"
                  }`}
                  value={respostas[p.pergunta] || ""}
                  onChange={(e) =>
                    handleInputChange(p.pergunta, e.target.value)
                  }
                  placeholder={`Digite ${p.pergunta.toLowerCase()}`}
                />
              )}
              {p.tipo === "numero" && (
                <input
                  type="number"
                  className={`w-full px-4 py-3 border-2 rounded-xl ${
                    erros[p.pergunta]
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200"
                  }`}
                  value={respostas[p.pergunta] || ""}
                  onChange={(e) =>
                    handleInputChange(p.pergunta, e.target.value)
                  }
                  placeholder={`Digite ${p.pergunta.toLowerCase()}`}
                />
              )}
              {p.tipo === "select" && (
                <div className="space-y-3">
                  <select
                    className={`w-full px-4 py-3 border-2 rounded-xl ${
                      erros[p.pergunta]
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200"
                    }`}
                    value={respostas[p.pergunta] || ""}
                    onChange={(e) =>
                      handleInputChange(p.pergunta, e.target.value)
                    }
                  >
                    <option value="">Selecione uma opção</option>
                    {p.opcoes?.map((o: string, i: number) => (
                      <option key={i} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  {p.expansivel &&
                    (respostas[p.pergunta] === "Sim - Outras" ||
                      respostas[p.pergunta] === "Outros") && (
                      <input
                        className="w-full px-4 py-3 border-2 rounded-xl"
                        placeholder={
                          p.placeholderExt || "Por favor, especifique"
                        }
                        value={respostas[p.pergunta + " - Detalhe"] || ""}
                        onChange={(e) =>
                          handleInputChange(
                            p.pergunta + " - Detalhe",
                            e.target.value
                          )
                        }
                      />
                    )}
                </div>
              )}
              {p.tipo === "textarea" && (
                <textarea
                  rows={4}
                  className={`w-full px-4 py-3 border-2 rounded-xl resize-none ${
                    erros[p.pergunta]
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200"
                  }`}
                  placeholder={`${p.pergunta.toLowerCase()}`}
                  value={respostas[p.pergunta] || ""}
                  onChange={(e) =>
                    handleInputChange(p.pergunta, e.target.value)
                  }
                />
              )}
              {erros[p.pergunta] && (
                <p className="text-red-500 text-sm mt-2">
                  ⚠️ {erros[p.pergunta]}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-6">
          <Button
            onClick={handleBack}
            variant="secondary"
            className="flex-1 py-4 border-gray-300 hover:border-gray-400"
          >
            Voltar
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-0 text-white shadow-lg shadow-green-500/25"
          >
            Continuar
          </Button>
        </div>
      </div>
    );
  } else if (step === 2) {
    // Resumo final
    const perguntas = categoria ? perguntasPorCategoria[categoria as CategoriaType] : [];
    conteudo = (
      <div className="space-y-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
            Tudo Pronto!
          </h2>
          <p className="text-gray-600 text-lg">
            Confira suas respostas antes de enviar
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4 border border-gray-200">
          {perguntas.map((p: Pergunta, idx: number) => (
            <div key={idx} className="flex justify-between">
              <span className="font-medium text-gray-700">{p.pergunta}:</span>
              <span className="text-gray-900">
                {respostas[p.pergunta] || "—"}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-6">
          <Button
            onClick={handleBack}
            variant="secondary"
            className="flex-1 py-4 border-gray-300 hover:border-gray-400"
            disabled={saveQuestionnaire.isPending}
          >
            Voltar
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-0 text-white shadow-lg shadow-green-500/25"
            disabled={saveQuestionnaire.isPending}
          >
            {saveQuestionnaire.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8 px-4">
      <SEO
        title={t("questionario.seo.title")}
        description={t("questionario.seo.desc")}
      />
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-3">
            Vamos criar juntos o plano perfeito para sua saúde
          </p>
        </div>

        <Card className="w-full p-6 md:p-8 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <div className="mb-8">
            <ProgressBar
              value={step + 1}
              max={etapas.length}
              labels={etapas}
              currentStep={step}
            />
          </div>
          <div className="mt-8 animate-fade-in">{conteudo}</div>
        </Card>

        {!saveQuestionnaire.isPending && (
          <div className="text-center mt-8">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-green-600 hover:text-green-800 font-medium flex items-center justify-center gap-2 mx-auto transition-colors"
            >
              Voltar para o início
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionarioPage;