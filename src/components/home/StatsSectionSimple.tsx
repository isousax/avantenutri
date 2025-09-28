import { useEffect, useRef, useState } from "react";
import { useI18n } from '../../i18n';

const stats: { titleKey: import('../../types/i18n').TranslationKey; value: string }[] = [
  { titleKey: 'home.stats.patients.title', value: "+1.000" },
  { titleKey: 'home.stats.satisfaction.title', value: "98%" },
  { titleKey: 'home.stats.crn.title', value: "43669/P" },
];

const StatsSectionSimple: React.FC = () => {
  const [active, setActive] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const slidesCount = stats.length;
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (autoPlay) {
      autoPlayRef.current = setInterval(() => {
        setActive((current) => (current + 1) % slidesCount);
      }, 4000);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlay, slidesCount]);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isSwiping = useRef(false);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
    isSwiping.current = true;
    setAutoPlay(false);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isSwiping.current) return;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;

    const diff = touchEndX.current - touchStartX.current;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0 && active > 0) {
        setActive(active - 1);
      } else if (diff < 0 && active < slidesCount - 1) {
        setActive(active + 1);
      }
    }

    isSwiping.current = false;
    setTimeout(() => setAutoPlay(true), 8000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setActive((a) => Math.max(0, a - 1));
        setAutoPlay(false);
      } else if (e.key === "ArrowRight") {
        setActive((a) => Math.min(slidesCount - 1, a + 1));
        setAutoPlay(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slidesCount]);

  const goToSlide = (index: number) => {
    setActive(index);
    setAutoPlay(false);
    setTimeout(() => setAutoPlay(true), 8000);
  };

  const { t } = useI18n();

  return (
    <section className="py-14 md:py-14 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-4xl mx-auto">
          {/* Background gradient e efeitos visuais */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/80 via-white/60 to-emerald-50/80 backdrop-blur-xl rounded-3xl border border-emerald-100/50 shadow-2xl"></div>
          <div className="absolute -top-2 -left-2 w-20 h-20 bg-gradient-to-br from-emerald-400/20 to-green-600/20 rounded-full blur-xl"></div>
          <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full blur-xl"></div>
          <div className="absolute top-4 left-1/4 w-2 h-2 bg-emerald-400/40 rounded-full animate-bounce"></div>
          <div className="absolute bottom-4 right-1/3 w-1.5 h-1.5 bg-green-500/40 rounded-full animate-bounce delay-700"></div>

          <div className="relative p-6 md:p-12">
            {/* Versão Mobile - Carrossel */}
            <div
              className="block md:hidden"
              role="region"
              aria-roledescription="carousel"
              aria-label={t('home.stats.carousel.aria')}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseEnter={() => setAutoPlay(false)}
              onMouseLeave={() => setAutoPlay(true)}
            >
              {/* Viewport do carrossel */}
              <div className="overflow-hidden rounded-2xl">
                {/* Track animado */}
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${active * 100}%)` }}
                >
                  {stats.map((stat, index) => (
                    <div
                      key={index}
                      className="min-w-full flex-shrink-0 px-4 py-2"
                      role="group"
                      aria-roledescription="slide"
                      aria-label={`Slide ${index + 1} de ${slidesCount}`}
                    >
                      <div className="text-center group h-full">
                        <div className="relative h-full">
                          {/* Efeito de fundo gradiente */}
                          <div className="absolute inset-0 bg-white rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>

                          {/* Card principal */}
                          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200/50 group-hover:border-emerald-300/70 transition-all duration-300 group-hover:shadow-xl group-hover:scale-105 h-full flex flex-col justify-center">
                            <div className="text-4xl font-bold bg-gradient-to-br from-emerald-600 to-green-800 bg-clip-text text-transparent group-hover:from-emerald-500 group-hover:to-green-700 transition-all duration-300 mb-2">
                              {stat.value}
                            </div>
                            <div className="text-sm font-medium text-gray-600 group-hover:text-emerald-700 transition-colors duration-300">
                              {t(stat.titleKey)}
                            </div>

                            {/* Indicador animado */}
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Indicadores de slide (dots) */}
              <div
                className="flex justify-center mt-4 space-x-2"
                role="tablist"
              >
                {stats.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-2 w-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 ${
                      index === active
                        ? "bg-emerald-500 scale-110 shadow-lg"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    role="tab"
                    aria-selected={index === active}
                    aria-label={t('home.stats.gotoSlide', { index: index + 1 })}
                    title={t('home.stats.show', { title: t(stats[index].titleKey) })}
                  />
                ))}
              </div>
            </div>

            {/* Versão Desktop - Grid */}
            <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="relative">
                    {/* Efeito de fundo gradiente */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-green-600/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>

                    {/* Card principal */}
                    <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200/50 group-hover:border-emerald-300/70 transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
                      <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-br from-emerald-600 to-green-800 bg-clip-text text-transparent group-hover:from-emerald-500 group-hover:to-green-700 transition-all duration-300 mb-2">
                        {stat.value}
                      </div>
                      <div className="text-sm font-medium text-gray-500 group-hover:text-emerald-700 transition-colors duration-300">
                        {t(stat.titleKey)}
                      </div>

                      {/* Indicador animado com delay diferente para cada card */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                        <div
                          className="w-2 h-2 bg-white rounded-full animate-pulse"
                          style={{ animationDelay: `${index * 300}ms` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent rounded-full"></div>
        </div>
      </div>
    </section>
  );
};

export default StatsSectionSimple;
