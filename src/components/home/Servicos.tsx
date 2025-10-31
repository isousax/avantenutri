import { useState, useRef, useEffect } from "react";
import { useI18n } from '../../i18n/utils';
import Card from "../ui/Card";

const Servicos: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const touchStartX = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const { t } = useI18n();
  const servicosData = [
    { icone: '🍎', tituloKey: 'home.services.item.dieta.title', descKey: 'home.services.item.dieta.desc', categoriaKey: 'home.services.category.core' },
    { icone: '💬', tituloKey: 'home.services.item.acompanhamento.title', descKey: 'home.services.item.acompanhamento.desc', categoriaKey: 'home.services.category.core' },
    { icone: '📱', tituloKey: 'home.services.item.consultas.title', descKey: 'home.services.item.consultas.desc', categoriaKey: 'home.services.category.core' },
    { icone: '⚖️', tituloKey: 'home.services.item.avaliacao.title', descKey: 'home.services.item.avaliacao.desc', categoriaKey: 'home.services.category.avaliacao' },
    { icone: '🥗', tituloKey: 'home.services.item.reeducacao.title', descKey: 'home.services.item.reeducacao.desc', categoriaKey: 'home.services.category.core' },
    { icone: '🛒', tituloKey: 'home.services.item.lista.title', descKey: 'home.services.item.lista.desc', categoriaKey: 'home.services.category.suporte' },
  ] as const;

  const slidesCount = servicosData.length;

  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      setActiveSlide((current) => (current + 1) % slidesCount);
    }, 4000);

    return () => clearInterval(interval);
  }, [autoPlay, slidesCount, activeSlide]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
    setAutoPlay(false);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const touchCurrentX = e.touches[0].clientX;
    const diff = touchCurrentX - touchStartX.current;

    if (Math.abs(diff) > 30) {
      e.currentTarget.style.cursor = "grabbing";
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX.current;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        setActiveSlide((prev) => (prev > 0 ? prev - 1 : slidesCount - 1));
      } else {
        setActiveSlide((prev) => (prev + 1) % slidesCount);
      }
    }

    setIsDragging(false);
    e.currentTarget.style.cursor = "grab";
    setTimeout(() => setAutoPlay(true), 5000);
  };

  return (
    <section
      id="servicos"
      className="py-12 md:py-24 bg-white relative overflow-hidden"
    >
      {/* Elementos decorativos de fundo melhorados */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-10 -left-20 w-64 h-64 bg-gradient-to-r from-green-400/10 to-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 -right-20 w-64 h-64 bg-gradient-to-l from-green-500/10 to-emerald-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header melhorado */}
        <div className="text-center mb-8 md:mb-16 lg:mb-20">
          <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium mb-3">
            {t('home.services.badge')}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-green-900 mb-3 leading-snug">
            {t('home.services.heading.part1')}{" "}
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {t('home.services.heading.highlight')}
            </span>
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {t('home.services.description')}
          </p>
        </div>

        {/* Carrossel Mobile Melhorado */}
        <div className="lg:hidden">
          <div
            className="block md:hidden"
            role="region"
            aria-roledescription="carousel"
            aria-label={t('home.services.carousel.aria')}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseEnter={() => setAutoPlay(false)}
            onMouseLeave={() => setAutoPlay(true)}
          >
            <div className="overflow-hidden px-2">
              <div
                ref={sliderRef}
                className="flex transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
              >
                {servicosData.map((servico, index) => (
                  <div
                    key={index}
                    className="min-w-full flex-shrink-0 px-2"
                    aria-hidden={activeSlide !== index}
                  >
                    <div className="w-full max-w-[310px] mx-auto">
                      <div className="relative flex flex-col justify-center items-center text-center w-full box-border p-6 rounded-2xl bg-gradient-to-br from-white to-green-50 border-2 border-green-100/50 shadow-sm hover:shadow-md transition-all duration-300 hover:border-green-200 group">
                        <div className="text-4xl md:text-5xl mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                          {servico.icone}
                        </div>

                        <div className="inline-block px-3 py-1 bg-green-500/10 text-green-700 rounded-full text-xs font-medium mb-3">
                          {t(servico.categoriaKey as any)}
                        </div>

                        <h3 className="font-bold text-lg md:text-xl text-green-900 mb-3 leading-tight">
                          {t(servico.tituloKey as any)}
                        </h3>
                        <p className="text-gray-600 leading-relaxed text-sm md:text-base whitespace-normal break-words">
                          {t(servico.descKey as any)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Indicadores */}
            <div className="flex justify-center mt-4 mb-12 space-x-2">
              {servicosData.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setActiveSlide(index);
                    setAutoPlay(false);
                    setTimeout(() => setAutoPlay(true), 5000);
                  }}
                  className={`h-2 w-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 ${
                    index === activeSlide
                      ? "bg-green-500 scale-110 shadow-lg"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`${index + 1}`}
                  aria-current={index === activeSlide ? "true" : "false"}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Grid Desktop Melhorado */}
        <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-12 lg:mb-16">
          {servicosData.map((servico, index) => (
            <Card
              key={index}
              className="p-6 border-2 border-green-100/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden h-full bg-gradient-to-br from-white to-green-50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 h-full flex flex-col">
                <div className="text-5xl mb-4 text-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  {servico.icone}
                </div>
                <div className="inline-block px-3 py-1 bg-green-500/10 text-green-700 rounded-full text-xs font-medium mb-3 self-center">
                  {t(servico.categoriaKey as any)}
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-3 text-center leading-tight">
                  {t(servico.tituloKey as any)}
                </h3>
                <p className="text-gray-600 flex-grow text-center leading-relaxed">
                  {t(servico.descKey as any)}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Seção de Especialidades Melhorada */}
        <div className="text-center mb-12">
          <h3 className="text-2xl md:text-3xl font-bold text-green-900 mb-4">
            {t('home.services.specialties.heading')}
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
            {t('home.services.specialties.desc')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { nomeKey: 'home.services.specialties.emagrecimento', icone: '⚡', cor: 'from-yellow-50 to-yellow-100' },
            { nomeKey: 'home.services.specialties.saudeMulher', icone: '🌸', cor: 'from-pink-50 to-pink-100' },
            { nomeKey: 'home.services.specialties.hipertrofia', icone: '💪', cor: 'from-blue-50 to-blue-100' },
            { nomeKey: 'home.services.specialties.nutricaoEsportiva', icone: '🏃‍♀️', cor: 'from-orange-50 to-orange-100' },
            { nomeKey: 'home.services.specialties.fertilidade', icone: '👶', cor: 'from-purple-50 to-purple-100' },
            { nomeKey: 'home.services.specialties.reproducaoHumana', icone: '❤️', cor: 'from-red-50 to-red-100' },
          ].map((especialidade: any, index) => (
            <div
              key={index}
              className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200/50 hover:shadow-md hover:scale-105 transition-all duration-300 group cursor-pointer"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">
                {especialidade.icone}
              </div>
              <span className="text-sm font-semibold text-green-900">
                {t(especialidade.nomeKey as any)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Servicos;
