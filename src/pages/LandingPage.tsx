import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Header from "../components/layout/Header";
import "../styles/placeholder-images.css";

const LandingPage: React.FC = () => {
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Só faz scroll para o topo se não houver âncora na URL
    if (!window.location.hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <Header scrollPosition={scrollPosition} />

      {/* Hero Section */}
      <section className="pt-24 lg:pt-32 pb-16 bg-gradient-to-b from-green-50 to-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl lg:text-7xl font-bold text-green-800 mb-4 leading-tight">
              Transforme sua saúde através da{" "}
              <span className="text-green-600">nutrição</span>
            </h1>
            <p className="sm:text-lg text-gray-700 mb-8 max-w-2xl">
              Descubra o poder de uma alimentação personalizada com a Dra.
              Andreina Cawanne, especialista em nutrição clínica e esportiva com
              mais de 6 anos de experiência.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/questionario">
                <Button className="px-8 py-4 text-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 w-full sm:w-auto">
                  Comece Agora
                </Button>
              </Link>
              <Button
                variant="secondary"
                className="px-8 py-4 text-lg font-semibold w-full sm:w-auto border-green-600 text-green-600 hover:bg-green-50"
                onClick={() =>
                  document
                    .getElementById("planos")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                Ver Planos
              </Button>
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="relative mx-auto max-w-md floating-image">
              <div className="image-container">
                <img
                  src="/nutricionista.png"
                  alt="Dra. Andreina Cawanne - Especialista em Nutrição"
                  className="max-w-xs h-auto"
                />
              </div>
              <div className="absolute -z-10 top-6 -right-6 w-32 h-32 bg-green-50 rounded-full opacity-80"></div>
              <div className="absolute -z-10 bottom-6 -left-6 w-24 h-24 bg-amber-50 rounded-full opacity-80"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Serviços Section */}
      <section id="servicos" className="py-10 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-green-800 mb-4">Serviços</h2>
            <p className="sm:text-lg text-gray-600 max-w-3xl mx-auto">
              Oferecemos soluções completas em nutrição para ajudar você a
              alcançar seus objetivos
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-8 border border-green-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-green-800 mb-4">
                Plano Alimentar Personalizado
              </h3>
              <p className="text-gray-600 sm:text-lg">
                Dietas personalizadas baseadas no seu perfil, objetivos e
                preferências alimentares.
              </p>
            </Card>
            <Card className="text-center p-8 border border-green-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-green-800 mb-4">
                Acompanhamento Contínuo
              </h3>
              <p className="text-gray-600 sm:text-lg">
                Suporte constante e ajustes periódicos para maximizar seus
                resultados.
              </p>
            </Card>
            <Card className="text-center p-8 border border-green-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-green-800 mb-4">
                Consultas Online
              </h3>
              <p className="text-gray-600 sm:text-lg">
                Atendimento flexível e conveniente, onde e quando você precisar.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Planos Section */}
      <section
        id="planos"
        className="py-20 bg-green-50 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-green-800 mb-4">
              Nossos Planos
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Escolha o plano que melhor se adapta às suas necessidades e
              objetivos
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="flex flex-col items-center p-8 border border-green-200 hover:shadow-lg transition-all duration-300">
              <h3 className="font-bold text-2xl text-green-800 mb-2">Básico</h3>
              <div className="text-4xl font-bold text-green-600 mb-4">
                R$150<span className="text-lg font-normal"></span>
              </div>
              <p className="text-gray-600 mb-6 text-center">
                Ideal para quem busca orientação inicial e um plano alimentar
                personalizado.
              </p>
              <ul className="mb-8 space-y-3 flex-1">
                <li className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 flex-shrink-0"
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
                  1 consulta
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 flex-shrink-0"
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
                  Plano alimentar personalizado
                </li>
              </ul>
              <Link to="/questionario" className="w-full">
                <Button
                  variant="secondary"
                  className="w-full py-3 border-green-600 text-green-600 hover:bg-green-50"
                >
                  Começar
                </Button>
              </Link>
            </Card>

            <Card className="flex flex-col items-center p-8 border-2 border-green-500 relative transform hover:scale-105 transition-all duration-300 shadow-lg">
              <div className="absolute -top-4 bg-green-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-md">
                MAIS POPULAR
              </div>
              <h3 className="font-bold text-2xl text-green-800 mb-2">
                Premium
              </h3>
              <div className="text-4xl font-bold text-green-600 mb-4">
                R$250<span className="text-lg font-normal"></span>
              </div>
              <p className="text-gray-600 mb-6 text-center">
                Acompanhamento mensal completo com ajustes e suporte contínuo.
              </p>
              <ul className="mb-8 space-y-3 flex-1">
                <li className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 flex-shrink-0"
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
                  2 consultas
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 flex-shrink-0"
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
                  Plano alimentar personalizado
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 flex-shrink-0"
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
                  Acompanhamento Completo
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 flex-shrink-0"
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
                  Suporte por WhatsApp
                </li>
              </ul>
              <Link to="/questionario" className="w-full">
                <Button className="w-full py-3">Começar</Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Sobre Section */}
      <section id="sobre" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 relative flex justify-center items-center">
              <div className="relative z-10 rounded-2xl overflow-hidden">
                <img
                  src="/nutricionista2.png"
                  alt="Dra. Andreina Cawanne"
                  className="max-w-xs max-h-xs transform hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-green-100 rounded-full -z-10"></div>
              <div className="absolute -top-6 -right-6 w-28 h-28 bg-yellow-100 rounded-full -z-10"></div>
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-green-800 mb-1">
                Dra. Andreina Cawanne
              </h2>

              <p className="text-gray-500 mb-5 text-sm">CRN: 43669/P</p>
              
              <p className="text-gray-700 mb-6 leading-relaxed sm:text-lg">
                Com mais de 6 anos de experiência em nutrição clínica e
                esportiva, ajudo pessoas a alcançarem seus objetivos através de
                uma alimentação equilibrada e sustentável. Minha abordagem
                combina ciência nutricional com um olhar individualizado para
                cada paciente.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0"
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
                  <span className="text-gray-700">
                    Especialista em Nutrição Clínica pela Unibra
                  </span>
                </div>
                <div className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0"
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
                  <span className="text-gray-700">
                    Pós-graduada em Nutrição Esportiva
                  </span>
                </div>
                <div className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0"
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
                  <span className="text-gray-700">
                    Mais de 1000 pacientes atendidos
                  </span>
                </div>
                <div className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0"
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
                  <span className="text-gray-700">
                    Certificação em Nutrição Comportamental
                  </span>
                </div>
              </div>
              <Link to="/questionario">
                <Button className="px-8 py-3 transform hover:scale-105 transition-transform duration-300">
                  Agende sua Consulta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos Section */}
      <section className="py-20 bg-green-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-green-800 mb-4">
              O que nossos pacientes dizem
            </h2>
            <p className="text-gray-700 max-w-3xl mx-auto text-lg">
              Resultados reais de pessoas reais que transformaram sua saúde
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 border border-green-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center text-green-800 font-bold mr-4">
                  MC
                </div>
                <div>
                  <h4 className="font-bold text-green-800">Maria Clara</h4>
                  <p className="text-sm text-gray-600">
                    Perdeu 18kg em 5 meses
                  </p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Com a Dra. Andreina consegui não apenas emagrecer, mas criar
                uma relação saudável com a comida. Me sinto muito melhor!"
              </p>
            </Card>

            <Card className="p-6 border border-green-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center text-green-800 font-bold mr-4">
                  JP
                </div>
                <div>
                  <h4 className="font-bold text-green-800">João Pedro</h4>
                  <p className="text-sm text-gray-600">
                    Melhorou performance esportiva
                  </p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Como corredor amador, a orientação nutricional fez toda
                diferença na minha performance e recuperação pós-treino."
              </p>
            </Card>

            <Card className="p-6 border border-green-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center text-green-800 font-bold mr-4">
                  AS
                </div>
                <div>
                  <h4 className="font-bold text-green-800">Ana Silva</h4>
                  <p className="text-sm text-gray-600">
                    Controlou problemas digestivos
                  </p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Há anos sofria com problemas digestivos. Em 3 meses de
                acompanhamento, consegui resolver 90% dos meus problemas!"
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-pattern"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl font-bold text-white mb-6">
            Pronto para transformar sua alimentação e sua saúde?
          </h2>
          <p className="text-green-100 mb-8 text-xl">
            Comece hoje mesmo sua jornada para uma vida mais saudável com um
            plano nutricional personalizado para suas necessidades.
          </p>
          <Link to="/questionario">
            <Button className="px-8 py-4 bg-white/30 rounded-lg text-green-700 hover:bg-green-800 text-lg font-semibold transform hover:scale-105 transition-transform duration-300">
              Começar Agora
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
