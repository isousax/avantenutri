import React from "react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { SEO } from "../../components/comum/SEO";
import { useI18n } from "../../i18n";

const NotFound: React.FC = () => {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-25 py-8 px-4">
      <SEO title={t('notfound.seo.title')} description={t('notfound.seo.desc')} />
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            {/* Animação do número 404 */}
            <div className="text-9xl font-bold text-gray-700 opacity-20">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center"></div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Ops! Página não encontrada
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Parece que você se perdeu no mundo da nutrição. Vamos te ajudar a
            encontrar o caminho de volta!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Card Principal */}
          <Card className="p-8 text-center shadow-xl border border-green-100">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Voltar ao Início
            </h3>
            <p className="text-gray-600 mb-4">
              Retorne à nossa página principal e explore nossos serviços de
              nutrição
            </p>

            <Link to="/" className="block">
              <Button className="w-full">Página Inicial</Button>
            </Link>
          </Card>

          {/* Card de Navegação */}
          <Card className="p-8 shadow-xl border border-green-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
              Onde você gostaria de ir?
            </h3>

            <div className="space-y-3">
              <Link to="/dashboard">
                <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all cursor-pointer">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Dashboard</p>
                    <p className="text-sm text-gray-600">
                      Entre na página do Paciente
                    </p>
                  </div>
                </div>
              </Link>

              <Link to="/#creditos">
                <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all cursor-pointer">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Créditos e Consultas</p>
                    <p className="text-sm text-gray-600">
                      Veja como funcionam os créditos de consulta
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </Card>
        </div>

        {/* Contato Rápido */}
        <Card className="mt-8 p-6 bg-gradient-to-r from-green-500 to-green-600 text-white text-center">
          <h3 className="text-xl font-semibold mb-2">
            Não encontrou o que procurava?
          </h3>
          <p className="mb-4 opacity-90 text-sm">
            Entre em contato, estamos aqui para ajudar!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
            <a
              href="https://wa.me/5581986653214?text=Olá, não estou encontrando a página que procuro no site."
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="secondary"
                className="bg-white text-green-600 hover:bg-green-50 items-center flex justify-center"
              >
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
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                (81) 98665-3214
              </Button>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;
