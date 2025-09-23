import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Header from "../../components/layout/Header";
import "../../styles/placeholder-images.css";
import { SEO } from "../../components/comum/SEO";
import StatsSectionSimple from "../../components/home/StatsSectionSimple";

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
    if (!window.location.hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <SEO
        title="Avante Nutri | Alimente-se Bem, Viva Melhor!"
        description="Transforme sua saúde com acompanhamento nutricional personalizado. Planos alimentares exclusivos, consultas online e acompanhamento contínuo para uma vida mais saudável."
        schema={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Avante Nutri",
          description: "Consultoria nutricional personalizada",
          url: "https://avantenutri.com.br",
        }}
      />
      <Header scrollPosition={scrollPosition} />

      {/* Hero Section Inspirada */}
      <section className="relative pt-24 lg:pt-32 pb-16 md:pb-20 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-green-50/60 to-white"></div>

        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="md:flex md:items-center md:gap-8 max-w-7xl mx-auto">
            {/* Imagem - lado esquerdo no desktop */}
            <div className="hidden md:flex md:w-2/5 lg:w-2/5 xl:w-2/5 justify-center items-center self-end mb-8 md:mb-0">
              <div className="relative floating-image">
                <div className="image-container">
                  <img
                    alt="Dra. Andreina Cawanne - Especialista em Nutrição"
                    width="400"
                    height="500"
                    decoding="async"
                    className="object-contain mx-auto shadow-lg transform hover:scale-105 transition-transform duration-700"
                    src="/nutricionista.webp"
                    style={{ color: "transparent" }}
                  />
                </div>
                <div className="absolute -z-10 top-6 -right-2 w-32 h-32 bg-green-100 rounded-full opacity-50 animate-pulse"></div>
                <div className="absolute -z-10 bottom-6 -left-6 w-24 h-24 bg-amber-50 rounded-full opacity-100"></div>
              </div>
            </div>

            {/* Conteúdo principal - lado direito no desktop */}
            <div className="md:w-3/5 lg:w-3/5 xl:w-3/5 text-center md:text-left">
              <div className="inline-flex items-center space-x-2 mb-4 lg:mb-6 animate-fade-in">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-sparkles h-4 w-4 lg:h-5 lg:w-5 text-green-800 animate-pulse"
                >
                  <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
                  <path d="M20 3v4"></path>
                  <path d="M22 5h-4"></path>
                  <path d="M4 17v2"></path>
                  <path d="M5 18H3"></path>
                </svg>
                <span className="text-xs lg:text-sm font-light text-green-800 animate-slide-in">
                  Nutrição personalizada com resultados comprovados
                </span>
              </div>

              <div className="hidden md:block">
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight text-green-800">
                  Transforme sua saúde com uma{" "}
                  <span className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 bg-clip-text text-transparent animate-gradient">
                    nutrição inteligente
                  </span>
                </h1>
                <p className="text-xl lg:text-2xl xl:text-3xl font-light text-gray-700 mt-2 lg:mt-3">
                  sua dieta, do seu jeito!
                </p>
                <div className="mt-6 lg:mt-8 flex justify-center md:justify-start">
                  <Link to="/register">
                    <Button className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 py-3 bg-[#16a34a] hover:bg-[#15803d] text-white px-8 lg:px-10 xl:px-12 h-12 lg:h-12 xl:h-14 text-sm lg:text-sm xl:text-base font-normal transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                      Começar minha transformação
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-arrow-right ml-2 h-4 w-4"
                      >
                        <path d="M5 12h14"></path>
                        <path d="m12 5 7 7-7 7"></path>
                      </svg>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Versão Mobile */}
              <div className="md:hidden text-center">
                <h1 className="text-3xl font-bold tracking-tight leading-tight mb-2 text-green-800">
                  Transforme sua saúde
                </h1>
                <p className="text-lg font-light text-gray-700 mb-6">
                  com nutrição personalizada
                </p>
                <div className="mt-4 mb-0 relative w-full mx-auto overflow-hidden">
                  <img
                    alt="Dra. Andreina Cawanne"
                    width="300"
                    height="300"
                    decoding="async"
                    className="rounded-2xl mx-auto"
                    src="/nutricionista.webp"
                    style={{ color: "transparent" }}
                  />
                </div>
                <div className="flex pt-6 justify-center">
                  <Link to="/register">
                    <Button className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white px-8 h-12 text-sm font-normal">
                      Começar agora
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-arrow-right ml-2 h-4 w-4"
                      >
                        <path d="M5 12h14"></path>
                        <path d="m12 5 7 7-7 7"></path>
                      </svg>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Texto animado abaixo do hero */}
          <div className="mt-8 lg:mt-12 text-base sm:text-lg lg:text-lg xl:text-xl font-light text-gray-800 max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto text-center">
            <div className="relative h-16 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out opacity-100 transform translate-y-0">
                <p className="text-center">
                  Acompanhamento personalizado com Dra. Andreina Cawanne
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSectionSimple />

      {/* Serviços Section */}
      <section id="servicos" className="py-12 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-green-800 mb-4">
              Funcionalidades Incríveis
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Soluções completas para ajudar você a alcançar seus
              objetivos de saúde e bem-estar.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-8 border border-green-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors duration-300">
                  <span className="text-2xl">🍎</span>
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-4">
                  Plano Alimentar Personalizado
                </h3>
                <p className="text-gray-600">
                  Dietas elaboradas especialmente para seu perfil, objetivos e
                  preferências alimentares.
                </p>
              </div>
            </Card>

            <Card className="text-center p-8 border border-green-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors duration-300">
                  <span className="text-2xl">💬</span>
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-4">
                  Acompanhamento Contínuo
                </h3>
                <p className="text-gray-600">
                  Suporte constante e ajustes periódicos para maximizar seus
                  resultados e manter a motivação.
                </p>
              </div>
            </Card>

            <Card className="text-center p-8 border border-green-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors duration-300">
                  <span className="text-2xl">📱</span>
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-4">
                  Consultas Online
                </h3>
                <p className="text-gray-600">
                  Atendimento flexível e conveniente, onde e quando você
                  precisar, com toda comodidade.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Planos Section */}
      <section
        id="planos"
        className="py-20 bg-gradient-to-br from-green-50 via-white to-emerald-50 relative overflow-hidden"
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
              <Link to="/register" className="w-full">
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
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-1 relative flex justify-center items-center floating-image-sobre">
              <div className="relative z-10 rounded-2xl overflow-hidden image-container">
                <img
                  src="/nutricionista2.webp"
                  alt="Dra. Andreina Cawanne"
                  className="max-w-xs max-h-xs transform hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-green-100 rounded-full -z-11 opacity-40"></div>
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
              <Link to="/register">
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

      {/* Faq Section <Faq /> */}

      {/* CTA Final */}
      <section className="py-16 bg-gradient-to-br from-green-600 to-emerald-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para transformar sua saúde?
          </h2>
          <p className="text-green-100 mb-8 text-lg md:text-xl">
            Comece hoje mesmo sua jornada para uma vida mais saudável
          </p>
          <Link to="/register">
            <Button className="inline-flex items-center px-8 py-4 bg-white/30 text-green-700 hover:bg-green-50 text-sm sm:text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
              Criar minha conta gratuita
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-2.5 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
