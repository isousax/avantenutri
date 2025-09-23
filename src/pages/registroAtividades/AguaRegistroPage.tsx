import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { SEO } from "../../components/comum/SEO";

const AguaRegistroPage: React.FC = () => {
  useEffect(() => {
    document.title = "Registro de Hidratação - Avante Nutris";
    // Adiciona meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Registre e acompanhe seu consumo diário de água com nossa ferramenta de controle de hidratação."
      );
    }
  }, []);
  const navigate = useNavigate();
  const [coposHoje, setCoposHoje] = useState(0);
  const [metaDiaria] = useState(8);
  interface RegistroAgua {
    data: string;
    copos: number;
    meta: number;
  }

  const [historico, setHistorico] = useState<RegistroAgua[]>([]);

  // Simulação de histórico
  useEffect(() => {
    const historicoSimulado = [
      { data: "2025-09-01", copos: 7, meta: 8 },
      { data: "2025-08-31", copos: 8, meta: 8 },
      { data: "2025-08-30", copos: 6, meta: 8 },
      { data: "2025-08-29", copos: 9, meta: 8 },
    ];
    setHistorico(historicoSimulado);
  }, []);

  const adicionarCopo = () => {
    if (coposHoje < 20) {
      // Limite razoável
      setCoposHoje(coposHoje + 1);
    }
  };

  const removerCopo = () => {
    if (coposHoje > 0) {
      setCoposHoje(coposHoje - 1);
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      // Simulação de salvamento
      console.log("Registro de água:", { copos: coposHoje, data: new Date() });

      // Simula um delay de requisição
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Feedback de sucesso usando um toast ou notificação mais elegante
      // Por enquanto usaremos um alert, mas idealmente deveria ser substituído
      alert("Registro de água salvo com sucesso!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar o registro. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const calcularProgresso = () => {
    return Math.min((coposHoje / metaDiaria) * 100, 100);
  };

  interface MensagemMotivacional {
    mensagem: string;
    cor: string;
  }

  const getMensagemMotivacional = (): MensagemMotivacional => {
    const progresso = calcularProgresso();
    if (progresso >= 100)
      return { mensagem: "Parabéns! Meta atingida! 🎉", cor: "text-green-600" };
    if (progresso >= 75)
      return { mensagem: "Quase lá! Continue assim! 💪", cor: "text-blue-600" };
    if (progresso >= 50)
      return {
        mensagem: "Bom trabalho! Metade do caminho! 👍",
        cor: "text-yellow-600",
      };
    return {
      mensagem: "Vamos começar! Cada copo conta! 💧",
      cor: "text-orange-600",
    };
  };

  const mensagem = getMensagemMotivacional();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-8 px-4">
      <SEO
        title="Registro de Hidratação | Avante Nutri"
        description="Mantenha o controle da sua hidratação diária. Registre e acompanhe seu consumo de água para uma vida mais saudável."
      />
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">
            Controle de Hidratação
          </h1>
          <p className="text-gray-600">Acompanhe seu consumo de água diário</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Contador Principal */}
          <Card className="p-6 shadow-xl border border-blue-100">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">💧</span>
              </div>
              <h2 className="text-2xl font-bold text-blue-800">Hoje</h2>
              <p className="text-gray-600">
                {new Date().toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>

            {/* Contador */}
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-blue-600 mb-2">
                {coposHoje}
              </div>
              <p className="text-gray-600">copos de água</p>
            </div>

            {/* Barra de Progresso */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-blue-800 mb-2">
                <span>Progresso</span>
                <span>{calcularProgresso().toFixed(0)}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-4">
                <div
                  className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${calcularProgresso()}%` }}
                ></div>
              </div>
              <p className="text-center text-sm text-blue-600 mt-2">
                {coposHoje} de {metaDiaria} copos
              </p>
            </div>

            {/* Mensagem Motivacional */}
            <div
              className={`text-center p-4 rounded-lg mb-6 ${
                mensagem.cor === "text-green-600"
                  ? "bg-green-600"
                  : mensagem.cor === "text-blue-600"
                  ? "bg-blue-600"
                  : mensagem.cor === "text-yellow-600"
                  ? "bg-yellow-600"
                  : "bg-orange-600"
              } bg-opacity-10`}
            >
              <p className="font-medium">{mensagem.mensagem}</p>
            </div>

            {/* Controles */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Button
                onClick={removerCopo}
                variant="secondary"
                className="w-full flex items-center justify-center"
                disabled={coposHoje === 0}
                aria-label="Remover um copo de água"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
                Remover
              </Button>
              <Button
                onClick={adicionarCopo}
                className="w-full flex items-center justify-center"
                aria-label="Adicionar um copo de água"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Adicionar
              </Button>
            </div>

            {/* Botão Salvar */}
            <Button
              onClick={handleSubmit}
              className="w-full flex items-center justify-center"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <svg
                    className="w-5 h-5 mr-2 animate-spin"
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
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Salvando...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
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
                  Salvar Registro
                </>
              )}
            </Button>
          </Card>

          {/* Estatísticas e Histórico */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Estatísticas da Semana
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-800">Média diária</span>
                  <span className="font-bold text-blue-800">7.5 copos</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-800">Dias na meta</span>
                  <span className="font-bold text-green-800">3/7 dias</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-purple-800">Melhor dia</span>
                  <span className="font-bold text-purple-800">9 copos</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Histórico de Consumo de Água da Última Semana
              </h3>
              <div
                className="space-y-3"
                role="list"
                aria-label="Histórico de consumo de água"
              >
                {historico.map((registro, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 border border-gray-100 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(registro.data).toLocaleDateString("pt-BR", {
                          weekday: "short",
                        })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(registro.data).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          registro.copos >= registro.meta
                            ? "text-green-600"
                            : "text-orange-600"
                        }`}
                      >
                        {registro.copos} copos
                      </p>
                      <p className="text-sm text-gray-500">
                        meta: {registro.meta}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Dicas */}
            <Card className="p-6 bg-cyan-50 border border-cyan-100">
              <h3 className="text-lg font-semibold text-cyan-800 mb-3">
                💡 Dicas de Hidratação
              </h3>
              <ul className="space-y-2 text-sm text-cyan-700">
                <li>• Beba 1 copo ao acordar</li>
                <li>• Mantenha uma garrafa sempre por perto</li>
                <li>• Use lembretes no celular</li>
                <li>• Água com limão ajuda no hábito</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AguaRegistroPage;
