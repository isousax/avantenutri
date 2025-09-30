import Card from "../ui/Card";
import { useState } from "react";

const Consultas: React.FC = () => {
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: "Posso remarcar minha consulta?",
      answer: "Sim, entre na seção 'Consultas' e cancele a consulta atual, depois agende um novo horário disponível."
    },
    {
      question: "O app está com problemas técnicos, o que fazer?",
      answer: "Tente atualizar a página, limpar o cache do navegador ou entre em contato conosco pelo formulário abaixo."
    }
  ];
    
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 pb-20">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Suporte</h1>
        <p className="text-gray-600 text-lg">
          Estamos aqui para ajudar você em sua jornada nutricional
        </p>
      </div>

      {/* FAQ */}
      <Card className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-xl">
            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Perguntas Frequentes</h2>
          </div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setActiveFAQ(activeFAQ === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 pr-4 text-sm">{faq.question}</span>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
                    activeFAQ === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {activeFAQ === index && (
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-gray-700 leading-relaxed text-xs">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Informações Adicionais */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Horário de Atendimento</h3>
          <p className="text-gray-700 mb-1 text-sm">Segunda a Sexta: 8h às 18h</p>
        </div>
      </Card>
    </div>
  );
};

export default Consultas;