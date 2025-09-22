import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import ProgressBar from "../components/ProgressBar";
import { useQuestionario } from "../contexts/useQuestionario";

// Dados do questionário
const categorias = [
  {
    label: "Nutrição Infantil",
    value: "infantil",
    icon: "👶",
    description: "Para crianças de 0 a 12 anos",
  },
  {
    label: "Nutrição na Gestação",
    value: "gestante",
    icon: "🤰",
    description: "Acompanhamento pré e pós-parto",
  },
  {
    label: "Nutrição Adulto/Idoso",
    value: "adulto",
    icon: "👩‍💼",
    description: "Para adultos e melhor idade",
  },
  {
    label: "Nutrição Esportiva",
    value: "esportiva",
    icon: "🏃‍♀️",
    description: "Otimização de performance",
  },
];

const perguntasPorCategoria: Record<
  string,
  Array<{ pergunta: string; tipo: string; expansivel?: boolean; placeholderExt?: string; opcoes?: string[] }>
> = {
  infantil: [
    { pergunta: "Nome da criança", tipo: "texto" },
    { pergunta: "Idade", tipo: "numero" },
    { pergunta: "Peso atual (kg)", tipo: "numero" },
    { pergunta: "Altura (cm)", tipo: "numero" },
    {
      pergunta: "Possui alguma restrição alimentar?",
      tipo: "select",      
      expansivel: true,
      placeholderExt: "Descreva a restrição alimentar",
      opcoes: ["Não", "Sim - Lactose", "Sim - Glúten", "Sim - Outras"],
    },
    {
      pergunta: "Objetivo principal",
      tipo: "select",
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
    },
  ],
  gestante: [
    { pergunta: "Nome completo", tipo: "texto" },
    { pergunta: "Idade", tipo: "numero" },
    { pergunta: "Tempo de gestação (semanas)", tipo: "numero" },
    { pergunta: "Peso antes da gravidez (kg)", tipo: "numero" },
    { pergunta: "Peso atual (kg)", tipo: "numero" },
    {
      pergunta: "Possui restrições alimentares?",
      tipo: "select",
      expansivel: true,
      placeholderExt: "Descreva a restrição alimentar",
      opcoes: ["Não", "Sim - Lactose", "Sim - Glúten", "Sim - Outras"],
    },
    {
      pergunta: "Teve algum problema de saúde durante a gestação?",
      tipo: "textarea",
    },
    {
      pergunta: "Objetivo nutricional",
      tipo: "select",
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
    { pergunta: "Nome completo", tipo: "texto" },
    { pergunta: "Idade", tipo: "numero" },
    { pergunta: "Profissão", tipo: "texto" },
    { pergunta: "Peso (kg)", tipo: "numero" },
    { pergunta: "Altura (cm)", tipo: "numero" },
    {
      pergunta: "Nível de atividade física",
      tipo: "select",
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
      expansivel: true,
      placeholderExt: "Descreva a restrição alimentar",
      opcoes: ["Não", "Sim - Lactose", "Sim - Glúten", "Sim - Outras"],
    },
    {
      pergunta: "Objetivo principal",
      tipo: "select",
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
    { pergunta: "Descreva sua rotina alimentar atual", tipo: "textarea" },
  ],
  esportiva: [
    { pergunta: "Nome completo", tipo: "texto" },
    { pergunta: "Idade", tipo: "numero" },
    { pergunta: "Esporte praticado", tipo: "texto" },
    {
      pergunta: "Frequência de treinos",
      tipo: "select",
      expansivel: false,
      opcoes: ["3-4x/semana", "5-6x/semana", "Diário", "Profissional"],
    },
    { pergunta: "Peso (kg)", tipo: "numero" },
    { pergunta: "Altura (cm)", tipo: "numero" },
    {
      pergunta: "Objetivo principal",
      tipo: "select",
      expansivel: false,
      opcoes: [
        "Melhorar performance",
        "Ganho de massa",
        "Definição muscular",
        "Recuperação pós-treino",
        "Competição específica",
      ],
    },
    { pergunta: "Suplementos utilizados atualmente", tipo: "textarea" },
  ],
};

const planos = [
  {
    nome: "Consulta Avulsa",
    preco: 150,
    descricao: "Ideal para uma orientação inicial",
    beneficios: [
      "1 consulta",
      "Plano alimentar personalizado",
      "Acesso por 2 anos",
    ],
  },
  {
    nome: "Plano Premium",
    preco: 250,
    popular: true,
    descricao: "Acompanhamento completo",
    beneficios: [
      "2 consultas (1 por mês)",
      "Plano alimentar personalizado",
      "Ajustes quinzenais",
      "Suporte por WhatsApp",
      "Acesso por 4 anos",
    ],
  },
];

const etapas = ["Contato", "Categoria", "Questionário", "Plano", "Confirmação"];

const formatarTelefone = (value: string) => {
  // Remove tudo que não é número
  const numero = value.replace(/\D/g, '');
  
  // Aplica a máscara conforme o tamanho do número
  if (numero.length <= 10) { // Telefone fixo
    return numero.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3').trim();
  } else { // Celular
    return numero.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3').trim();
  }
};

const limparFormatacaoTelefone = (value: string) => {
  return value.replace(/\D/g, '');
};

const QuestionarioPage: React.FC = () => {
  const navigate = useNavigate();
  const { questionarioData, updateQuestionario } =
    useQuestionario();
  const { step, categoria, planoSelecionado, respostas } = questionarioData;
  const [erros, setErros] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Efeito para rolar para o topo quando mudar de etapa
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const validarEtapa = (etapa: number): boolean => {
    const novosErros: Record<string, string> = {};

    if (etapa === 0) {
      if (!respostas.nome?.trim()) {
        novosErros.nome = "Nome é obrigatório";
      } else if (respostas.nome.trim().length < 2) {
        novosErros.nome = "Nome deve ter pelo menos 2 caracteres";
      }

      if (!respostas.email?.trim()) {
        novosErros.email = "E-mail é obrigatório";
      } else if (!/\S+@\S+\.\S+/.test(respostas.email)) {
        novosErros.email = "E-mail inválido";
      }

      if (!respostas.telefone?.trim()) {
        novosErros.telefone = "Telefone é obrigatório";
      } else {
        const numeroLimpo = limparFormatacaoTelefone(respostas.telefone);
        if (numeroLimpo.length !== 10 && numeroLimpo.length !== 11) {
          novosErros.telefone = "Telefone deve ter 10 ou 11 dígitos";
        }
      }
    }

    if (etapa === 1 && !categoria) {
      return false;
    }

    if (etapa === 2 && categoria) {
      perguntasPorCategoria[categoria].forEach((perguntaObj) => {
        if (!respostas[perguntaObj.pergunta]?.trim()) {
          novosErros[perguntaObj.pergunta] = "Campo obrigatório";
        }
      });
    }

    if (etapa === 3 && planoSelecionado === null) {
      return false;
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
    // Remove erro do campo quando usuário começar a digitar
    if (erros[campo]) {
      setErros((prev) => ({ ...prev, [campo]: "" }));
    }
  };

  const handleSubmit = async () => {
    if (!validarEtapa(step)) return;

    setIsSubmitting(true);

    // Simulação de envio
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Dados enviados:", {
        categoria,
        plano: planos[planoSelecionado!],
        respostas,
      });
      updateQuestionario({ step: etapas.length - 1 });
      // Após o envio bem-sucedido, limpa os dados
      setTimeout(() => {
      }, 5000); // Limpa após 5 segundos para dar tempo de ver a confirmação
    } catch (error) {
      console.error("Erro ao enviar:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderização condicional por etapa
  let conteudo;

  if (step === 0) {
    conteudo = (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Informações Básicas
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome completo *
            </label>
            <input
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                erros.nome ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Seu nome completo"
              value={respostas.nome || ""}
              onChange={(e) => handleInputChange("nome", e.target.value)}
            />
            {erros.nome && (
              <p className="text-red-500 text-sm mt-1">{erros.nome}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-mail *
            </label>
            <input
              type="email"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                erros.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="seu@email.com"
              value={respostas.email || ""}
              onChange={(e) => handleInputChange("email", e.target.value)}
            />
            {erros.email && (
              <p className="text-red-500 text-sm mt-1">{erros.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone/WhatsApp *
            </label>
            <input
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                erros.telefone ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="(61) 99999-9999"
              value={respostas.telefone || ""}
              onChange={(e) => {
                // Formata o valor para exibição
                const formattedValue = formatarTelefone(e.target.value);
                // Salva no estado apenas os números
                const numericValue = limparFormatacaoTelefone(formattedValue);
                // Só atualiza se o número tiver 10 ou 11 dígitos ou estiver vazio
                if (numericValue.length <= 11) {
                  handleInputChange("telefone", formattedValue);
                }
              }}
            />
            {erros.telefone && (
              <p className="text-red-500 text-sm mt-1">{erros.telefone}</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={handleNext} className="flex-1 py-3">
            Continuar
          </Button>
        </div>
      </div>
    );
  } else if (step === 1) {
    conteudo = (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Selecione sua Categoria
          </h2>
          <p className="text-gray-600">
            Escolha o tipo de acompanhamento que melhor se adequa às suas
            necessidades
          </p>
        </div>

        <div className="grid gap-4">
          {categorias.map((cat) => (
            <div
              key={cat.value}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                categoria === cat.value
                  ? "border-green-500 bg-green-50 shadow-md"
                  : "border-gray-200 hover:border-green-300 hover:bg-green-25"
              }`}
              onClick={() => {
                // Atualiza a categoria
                updateQuestionario({ 
                  categoria: cat.value,
                  // Se não for categoria infantil, replica o nome nas respostas
                  respostas: {
                    ...respostas,
                    ...(cat.value !== 'infantil' && respostas.nome 
                      ? { 'Nome completo': respostas.nome }
                      : {})
                  }
                })
              }}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{cat.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{cat.label}</h3>
                  <p className="text-sm text-gray-600">{cat.description}</p>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    categoria === cat.value
                      ? "bg-green-500 border-green-500"
                      : "border-gray-300"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleBack}
            variant="secondary"
            className="flex-1 py-3"
          >
            Voltar
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 py-3"
            disabled={!categoria}
          >
            Continuar
          </Button>
        </div>
      </div>
    );
  } else if (step === 2 && categoria) {
    const perguntas = perguntasPorCategoria[categoria];

    conteudo = (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Questionário de Saúde
          </h2>
          <p className="text-gray-600">
            Preencha as informações para personalizarmos seu plano
          </p>
        </div>

        <div className="space-y-6">
          {perguntas.map((perguntaObj, index) => (
            <div key={index}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {perguntaObj.pergunta} *
              </label>

              {perguntaObj.tipo === "texto" && (
                <input
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                    erros[perguntaObj.pergunta]
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder={`Digite ${perguntaObj.pergunta.toLowerCase()}`}
                  value={respostas[perguntaObj.pergunta] || ""}
                  onChange={(e) =>
                    handleInputChange(perguntaObj.pergunta, e.target.value)
                  }
                />
              )}

              {perguntaObj.tipo === "numero" && (
                <input
                  type="number"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                    erros[perguntaObj.pergunta]
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder={`Digite ${perguntaObj.pergunta.toLowerCase()}`}
                  value={respostas[perguntaObj.pergunta] || ""}
                  onChange={(e) =>
                    handleInputChange(perguntaObj.pergunta, e.target.value)
                  }
                />
              )}

              {perguntaObj.tipo === "select" && (
                <>
                  <select
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                      erros[perguntaObj.pergunta]
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    value={respostas[perguntaObj.pergunta] || ""}
                    onChange={(e) =>
                      handleInputChange(perguntaObj.pergunta, e.target.value)
                    }
                  >
                    <option value="">Selecione uma opção</option>
                    {perguntaObj.opcoes?.map((opcao, idx) => (
                      <option key={idx} value={opcao}>
                        {opcao}
                      </option>
                    ))}
                  </select>
                  {perguntaObj.expansivel &&
                    (respostas[perguntaObj.pergunta] === "Sim - Outras" || respostas[perguntaObj.pergunta] === "Outros") && (
                      <input
                        className={`mt-2 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                          erros[perguntaObj.pergunta]
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder={`${perguntaObj.placeholderExt ? perguntaObj.placeholderExt : ""}`}
                        value={respostas[perguntaObj.pergunta + " - Detalhe"] || ""}
                        onChange={(e) =>
                          handleInputChange(perguntaObj.pergunta + " - Detalhe", e.target.value)
                        }
                      />
                    )}
                </>
              )}

              {perguntaObj.tipo === "textarea" && (
                <textarea
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                    erros[perguntaObj.pergunta]
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder={`Descreva ${perguntaObj.pergunta.toLowerCase()}`}
                  value={respostas[perguntaObj.pergunta] || ""}
                  onChange={(e) =>
                    handleInputChange(perguntaObj.pergunta, e.target.value)
                  }
                />
              )}

              {erros[perguntaObj.pergunta] && (
                <p className="text-red-500 text-sm mt-1">
                  {erros[perguntaObj.pergunta]}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleBack}
            variant="secondary"
            className="flex-1 py-3"
          >
            Voltar
          </Button>
          <Button onClick={handleNext} className="flex-1 py-3">
            Continuar
          </Button>
        </div>
      </div>
    );
  } else if (step === 3) {
    conteudo = (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Escolha seu Plano
          </h2>
          <p className="text-gray-600">
            Selecione a opção que melhor atende suas necessidades
          </p>
        </div>

        <div className="grid gap-6">
          {planos.map((plano, index) => (
            <div
              key={index}
              className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                planoSelecionado === index
                  ? "border-green-500 bg-green-50 shadow-lg transform scale-105"
                  : "border-gray-200 hover:border-green-300 hover:shadow-md"
              } ${plano.popular ? "relative" : ""}`}
              onClick={() => updateQuestionario({ planoSelecionado: index })}
            >
              {plano.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  MAIS POPULAR
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="font-bold text-xl text-green-800">
                  {plano.nome}
                </h3>
                <div className="text-3xl font-bold text-green-600 my-2">
                  R$ {plano.preco}
                  {plano.nome !== "Consulta Avulsa" && (
                    <span className="text-lg font-normal">/mês</span>
                  )}
                </div>
                <p className="text-gray-600">{plano.descricao}</p>
              </div>

              <ul className="space-y-2 mb-4">
                {plano.beneficios.map((beneficio, idx) => (
                  <li
                    key={idx}
                    className="flex items-center text-sm text-gray-700"
                  >
                    <svg
                      className="w-4 h-4 text-green-500 mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {beneficio}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleBack}
            variant="secondary"
            className="flex-1 py-3"
          >
            Voltar
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 py-3"
            disabled={planoSelecionado === null}
          >
            Continuar
          </Button>
        </div>
      </div>
    );
  } else if (step === 4) {
    const plano = planos[planoSelecionado!];

    conteudo = (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Confirmação Final
          </h2>
          <p className="text-gray-600">
            Revise suas informações antes de enviar
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-green-700 mb-2">
              Dados Pessoais
            </h3>
            <p>
              <strong>Nome:</strong> {respostas.nome}
            </p>
            <p>
              <strong>E-mail:</strong> {respostas.email}
            </p>
            <p>
              <strong>Telefone:</strong> {respostas.telefone}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-green-700 mb-2">
              Plano Escolhido
            </h3>
            <p>
              <strong>{plano?.nome}:</strong> R$ {plano?.preco}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-green-700 mb-2">
              Resumo do Questionário
            </h3>
            {categoria &&
              perguntasPorCategoria[categoria]
                .slice(0, 3)
                .map((perguntaObj, index) => (
                  <p key={index}>
                    <strong>{perguntaObj.pergunta}:</strong>{" "}
                    {respostas[perguntaObj.pergunta]}
                  </p>
                ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleBack}
            variant="secondary"
            className="flex-1 py-3"
          >
            Voltar
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 py-3"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Enviando...
              </>
            ) : (
              "Confirmar e Enviar"
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2">Formulário</h1>
          <p className="text-gray-600">
            Preencha o formulário para começarmos seu acompanhamento
          </p>
        </div>

        <Card className="w-full p-6 md:p-8">
          <ProgressBar
            value={step + 1}
            max={etapas.length}
            labels={etapas}
            currentStep={step}
          />

          <div className="mt-8 animate-fade-in">{conteudo}</div>
        </Card>

        {/* Botão para voltar ao início */}
        {step === etapas.length - 1 && !isSubmitting && (
          <div className="text-center mt-6">
            <button
              onClick={() => {
                navigate("/");
              }}
              className="text-green-600 hover:text-green-800 font-medium"
            >
              ← Voltar para a página inicial
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionarioPage;
