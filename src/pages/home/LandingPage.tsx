import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Header from "../../components/layout/Header";
import "../../styles/placeholder-images.css";
import { SEO } from "../../components/comum/SEO";
import StatsSectionSimple from "../../components/home/StatsSectionSimple";
import { motion, AnimatePresence } from "framer-motion";
import CreditsSection from "../../components/home/CreditsSection";
import Servicos from "../../components/home/Servicos";
import Footer from "../../components/layout/Footer";
import { useI18n } from '../../i18n';
import { testimonials } from '../../data/testimonials';
import type { TranslationKey } from '../../types/i18n';

const linesKeys: TranslationKey[] = [
  'landing.hero.line1',
  'landing.hero.line2',
  'landing.hero.line3'
];

const LandingPage: React.FC = () => {
  const { t } = useI18n();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [active, setActive] = useState(0);
  const interval = 3500;

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

  useEffect(() => {
    const t = setInterval(() => {
  setActive((i) => (i + 1) % linesKeys.length);
    }, interval);
    return () => clearInterval(t);
  }, [interval]);

  const variants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <SEO
        title={t('landing.seo.title')}
        description={t('landing.seo.desc')}
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
      <section className="relative pt-24 lg:pt-32 flex items-center justify-center overflow-hidden">
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
                <span className="text-xs lg:text-sm font-light text-green-800 animate-slide-in">{t('landing.badge')}</span>
              </div>

              <div className="hidden md:block">
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight text-green-800">{t('landing.hero.title.part1')} <span className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 bg-clip-text text-transparent animate-gradient">{t('landing.hero.title.highlight')}</span></h1>
                <p className="text-xl lg:text-2xl xl:text-3xl font-light text-gray-700 mt-2 lg:mt-3">{t('landing.hero.subtitle')}</p>
                <div className="mt-6 lg:mt-8 flex justify-center md:justify-start">
                  <Link to="/register">
                    <Button className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 py-3 bg-[#16a34a] hover:bg-[#15803d] text-white px-8 lg:px-10 xl:px-12 h-12 lg:h-12 xl:h-14 text-sm lg:text-sm xl:text-base font-normal transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                      {t('landing.cta.primary')}
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
                <h1 className="text-3xl font-bold tracking-tight leading-tight mb-2 text-green-800">{t('landing.hero.mobile.title')}</h1>
                <p className="text-lg font-light text-gray-700 mb-6">{t('landing.hero.mobile.subtitle')}</p>
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
                      {t('landing.cta.startNow')}
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
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.55, ease: "easeInOut" }}
                  className="absolute inset-0 flex items-center justify-center px-4"
                  aria-live="polite"
                >
                  <p className="text-center">{t(linesKeys[active])}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSectionSimple />

      {/* Serviços Section */}
      <Servicos />

  {/* Créditos Section (substitui planos) */}
  <CreditsSection />

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
              <h2 className="text-3xl font-bold text-green-800 mb-1">{t('landing.about.name')}</h2>

              <p className="text-gray-500 mb-5 text-sm">{t('landing.about.crn',{crn:'43669/P'})}</p>

              <p className="text-gray-700 mb-6 leading-relaxed sm:text-lg">{t('landing.about.bio')}</p>
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
                  <span className="text-gray-700">{t('landing.about.point1')}</span>
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
                  <span className="text-gray-700">{t('landing.about.point2')}</span>
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
                  <span className="text-gray-700">{t('landing.about.point3')}</span>
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
                  <span className="text-gray-700">{t('landing.about.point4')}</span>
                </div>
              </div>
              <Link to="/register">
                <Button className="px-8 py-3 transform hover:scale-105 transition-transform duration-300">{t('landing.about.button')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos Section */}
      <section className="py-20 bg-green-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-green-800 mb-4">{t('landing.testimonials.title')}</h2>
            <p className="text-gray-700 max-w-3xl mx-auto text-lg">{t('landing.testimonials.subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map(item => (
              <Card key={item.id} className="p-6 border border-green-200">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center text-green-800 font-bold mr-4">
                    {item.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-green-800">{t(item.nameKey)}</h4>
                    <p className="text-sm text-gray-600">{t(item.subtitleKey)}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">{t(item.textKey)}</p>
              </Card>
            ))}
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
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">{t('landing.final.title')}</h2>
          <p className="text-green-100 mb-8 text-lg md:text-xl">{t('landing.final.subtitle')}</p>
          <Link to="/register">
            <Button className="inline-flex items-center px-8 py-4 bg-white/30 text-green-700 hover:bg-green-50 text-sm sm:text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
              {t('landing.final.button')}
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

      <Footer />
    </div>
  );
};

export default LandingPage;
