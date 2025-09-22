import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";

const RefeicaoRegistroPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tipoRefeicao: "cafe_manha",
    alimentos: "",
    quantidade: "",
    horario: new Date().toTimeString().slice(0, 5),
    observacoes: "",
    nivelFome: 3,
    satisfacao: 3,
  });

  const tiposRefeicao = [
    { value: "cafe_manha", label: "Café da Manhã", emoji: "☕" },
    { value: "lanche_manha", label: "Lanche da Manhã", emoji: "🍎" },
    { value: "almoco", label: "Almoço", emoji: "🍲" },
    { value: "lanche_tarde", label: "Lanche da Tarde", emoji: "🥪" },
    { value: "jantar", label: "Jantar", emoji: "🍽️" },
    { value: "ceia", label: "Ceia", emoji: "🥛" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulação de salvamento
    console.log("Refeição registrada:", formData);

    // Feedback de sucesso
    alert("Refeição registrada com sucesso!");
    navigate("/dashboard");
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-25 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2">
            Registrar Refeição
          </h1>
          <p className="text-gray-600">
            Registre o que você consumiu para acompanhar sua alimentação
          </p>
        </div>

        <Card className="p-6 shadow-xl border border-green-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Refeição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Refeição
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {tiposRefeicao.map((tipo) => (
                  <button
                    key={tipo.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        tipoRefeicao: tipo.value,
                      }))
                    }
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      formData.tipoRefeicao === tipo.value
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-green-300"
                    }`}
                  >
                    <div className="text-2xl mb-1">{tipo.emoji}</div>
                    <div className="text-sm font-medium">{tipo.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Horário */}
            <div>
              <label
                htmlFor="horario"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Horário da Refeição
              </label>
              <input
                type="time"
                id="horario"
                name="horario"
                value={formData.horario}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            {/* Alimentos */}
            <div>
              <label
                htmlFor="alimentos"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Alimentos Consumidos
              </label>
              <textarea
                id="alimentos"
                name="alimentos"
                rows={4}
                value={formData.alimentos}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Descreva os alimentos que consumiu, quantidades etc..."
              />
            </div>

            {/* Nível de Fome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Nível de Fome antes da Refeição
              </label>
              <div className="flex justify-center items-end space-x-4 sm:space-x-8">
                {[1, 2, 3, 4, 5].map((nivel) => (
                  <div
                    key={nivel}
                    className="text-center flex flex-col items-center"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, nivelFome: nivel }))
                      }
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all ${
                        formData.nivelFome === nivel
                          ? "bg-green-500 text-white transform scale-110"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {nivel}
                    </button>
                    <span className="text-[11px] text-gray-500 mt-1 block h-4">
                      {nivel === 1
                        ? "Sem fome"
                        : nivel === 5
                        ? "Faminto"
                        : "\u00A0"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Satisfação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Nível de Satisfação após a Refeição
              </label>
              <div className="flex justify-center items-end space-x-4 sm:space-x-8">
                {[1, 2, 3, 4, 5].map((nivel) => (
                  <div
                    key={nivel}
                    className="text-center flex flex-col items-center"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, satisfacao: nivel }))
                      }
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all ${
                        formData.satisfacao === nivel
                          ? "bg-green-500 text-white transform scale-110"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {nivel}
                    </button>
                    <span className="text-[11px] text-gray-500 mt-1 block h-4">
                      {nivel === 1
                        ? "Insatisfeito"
                        : nivel === 5
                        ? "Muito Satisfeito"
                        : "\u00A0"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/dashboard")}
                className="flex-1 text-sm"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 flex justify-center items-center text-sm"
              >
                <svg
                  className="w-4 h-4  mr-2"
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
                Salvar Refeição
              </Button>
            </div>
          </form>
        </Card>

        {/* Dica */}
        <Card className="mt-6 p-4 bg-blue-50 border border-blue-100">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800">
                Dica para um registro preciso:
              </p>
              <p className="text-xs text-blue-700">
                Descreva os alimentos com detalhes (ex: "1 pão integral com 2
                fatias de peito de peru e 1 fatia de queijo branco")
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RefeicaoRegistroPage;
