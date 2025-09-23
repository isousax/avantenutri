import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { SEO } from "../../../components/comum/SEO";

const AgendarConsultaPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tipoConsulta: "acompanhamento",
    data: "",
    horario: "",
    urgencia: "normal",
  });

  const [etapa, setEtapa] = useState(1);

  const tiposConsulta = [
    {
      value: "acompanhamento",
      label: "Consulta de Acompanhamento",
      descricao: "Avaliação regular do progresso",
      duracao: "até 40 min",
      valor: "R$ 150",
    },
    {
      value: "reavaliacao",
      label: "Reavaliação Completa",
      descricao: "Avaliação detalhada com novos exames",
      duracao: "60 min",
      valor: "R$ 150",
    },
  ];

  const horariosDisponiveis = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (etapa === 1) {
      setEtapa(2);
      return;
    }

    // Simulação de agendamento
    console.log("Consulta agendada:", formData);

    // Feedback de sucesso
    alert("Consulta agendada com sucesso!");
    navigate("/dashboard");
  };

  const renderEtapa1 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Tipo de Consulta
      </h3>

      <div className="grid gap-4">
        {tiposConsulta.map((tipo) => (
          <div
            key={tipo.value}
            onClick={() =>
              setFormData((prev) => ({ ...prev, tipoConsulta: tipo.value }))
            }
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              formData.tipoConsulta === tipo.value
                ? "border-green-500 bg-green-50"
                : "border-gray-200 hover:border-green-300"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-gray-900">{tipo.label}</h4>
                <p className="text-sm text-gray-600">{tipo.descricao}</p>
              </div>
              <span className="text-lg font-bold text-green-600">
                {tipo.valor}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Duração: {tipo.duracao}</span>
              <span>Online</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEtapa2 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Data e Horário
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="data"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Data da Consulta *
          </label>
          <input
            type="date"
            id="data"
            value={formData.data}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, data: e.target.value }))
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            min={new Date().toISOString().split("T")[0]}
            required
          />
        </div>

        <div>
          <label
            htmlFor="horario"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Horário *
          </label>
          <select
            id="horario"
            value={formData.horario}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, horario: e.target.value }))
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          >
            <option value="">Selecione um horário</option>
            {horariosDisponiveis.map((horario) => (
              <option key={horario} value={horario}>
                {horario}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nível de Urgência
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "baixa", label: "Baixa", cor: "green" },
            { value: "normal", label: "Normal", cor: "blue" },
            { value: "alta", label: "Alta", cor: "red" },
          ].map((nivel) => (
            <button
              key={nivel.value}
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, urgencia: nivel.value }))
              }
              className={`p-3 rounded-lg border-2 transition-all ${
                formData.urgencia === nivel.value
                  ? `border-${nivel.cor}-500 bg-${nivel.cor}-50 text-${nivel.cor}-700`
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {nivel.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resumo */}
      <Card className="p-4 bg-green-50 border border-green-200">
        <h4 className="font-semibold text-green-800 mb-2">
          Resumo do Agendamento
        </h4>
        <div className="text-sm text-green-700 space-y-1">
          <p>
            <strong>Tipo:</strong>{" "}
            {
              tiposConsulta.find((t) => t.value === formData.tipoConsulta)
                ?.label
            }
          </p>
          <p>
            <strong>Data:</strong>{" "}
            {formData.data
              ? new Date(formData.data).toLocaleDateString("pt-BR")
              : "--"}
          </p>
          <p>
            <strong>Horário:</strong> {formData.horario || "--"}
          </p>
          <p>
            <strong>Valor:</strong>{" "}
            {
              tiposConsulta.find((t) => t.value === formData.tipoConsulta)
                ?.valor
            }
          </p>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-25 py-8 px-4">
      <SEO
        title="Agendar Consulta | Avante Nutri"
        description="Agende sua consulta nutricional online de forma rápida e prática. Escolha o melhor horário para seu atendimento."
      />
      <div className="max-w-2xl mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2">
            Agendar Consulta
          </h1>
          <p className="text-gray-600">
            Agende sua consulta com a Dra. Andreina Cawanne
          </p>
        </div>

        {/* Progresso */}
        <div className="flex mb-8">
          {[1, 2].map((step) => (
            <div key={step} className="flex-1 flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  etapa >= step
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step}
              </div>
              {step < 2 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    etapa > step ? "bg-green-500" : "bg-gray-200"
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>

        <Card className="p-6 shadow-xl border border-green-100">
          <form onSubmit={handleSubmit}>
            {etapa === 1 ? renderEtapa1() : renderEtapa2()}

            {/* Botões de Navegação */}
            <div className="flex gap-4 pt-6 mt-6 border-t border-gray-200">
              {etapa === 2 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEtapa(1)}
                  className="flex-1"
                >
                  Voltar
                </Button>
              )}
              {etapa === 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate("/dashboard")}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              )}
              <Button type="submit" className="flex-1">
                {etapa === 1 ? "Continuar" : "Confirmar Agendamento"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Informações */}
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
              <p className="text-lg font-medium text-blue-800">
                Informações importantes:
              </p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>• Consultas online via Google Meet</li>
                <li>• Link será enviado 1 hora antes</li>
                <li>• Reagendamento gratuito até 48h antes da consulta</li>
                <li>• Chegar com 5 minutos de antecedência</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AgendarConsultaPage;
