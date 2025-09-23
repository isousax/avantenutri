import { useEffect, useRef, useState } from "react";

const stats = [
  { title: "Anos de Experiência", value: "6+" },
  { title: "Pacientes Atendidos", value: "1000+" },
  { title: "Satisfação", value: "98%" },
  { title: "CRN", value: "43669/P" },
];

export default function StatsSectionSimple() {
  const [active, setActive] = useState(0);
  const slidesCount = stats.length;

  // Touch/swipe handlers simples
  const startX = useRef(0);
  const moved = useRef(false);

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    startX.current = e.touches?.[0]?.clientX ?? 0;
    moved.current = false;
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const endX = e.changedTouches?.[0]?.clientX ?? 0;
    const diff = endX - startX.current;
    const threshold = 40; // px mínima para trocar slide
    if (diff > threshold && active > 0) {
      setActive((a) => Math.max(0, a - 1));
    } else if (diff < -threshold && active < slidesCount - 1) {
      setActive((a) => Math.min(slidesCount - 1, a + 1));
    }
  };

  // keyboard left/right for accessibility (quando focado no componente)
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "ArrowLeft") setActive((a) => Math.max(0, a - 1));
      if (ev.key === "ArrowRight")
        setActive((a) => Math.min(slidesCount - 1, a + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slidesCount]);

  return (
    <section className="py-8 md:py-14 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-4xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/80 via-white/60 to-emerald-50/80 backdrop-blur-xl rounded-3xl border border-emerald-100/50 shadow-2xl"></div>
          <div className="absolute -top-2 -left-2 w-20 h-20 bg-gradient-to-br from-emerald-400/20 to-green-600/20 rounded-full blur-xl"></div>
          <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full blur-xl"></div>

          <div className="relative p-12">
            {/* MOBILE: 1 slide por vez */}
            <div
              className="block md:hidden"
              role="region"
              aria-roledescription="carousel"
              aria-label="Estatísticas"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {/* viewport que "mascara" os slides */}
              <div className="overflow-hidden">
                {/* track: transform desloca conforme active */}
                <div
                  className="flex transition-transform duration-500"
                  style={{ transform: `translateX(-${active * 100}%)` }}
                >
                  {stats.map((s, idx) => (
                    // cada slide ocupa 100% do viewport do track
                    <div
                      key={idx}
                      className="min-w-full flex justify-center px-6"
                    >
                      {/* card centrado */}
                      <div className="text-center group w-full max-w-xs">
                        <div className="relative">
                          {/* fundo/blur: z-0 (abaixo do card) */}
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-green-600/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500 z-0"></div>

                          {/* card: z-10 (acima do fundo) */}
                          <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-emerald-200/50 group-hover:border-emerald-300/70 transition-all duration-300 group-hover:shadow-lg group-hover:scale-105 z-10">
                            <div className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-emerald-600 to-green-800 bg-clip-text text-transparent group-hover:from-emerald-500 group-hover:to-green-700 transition-all duration-300">
                              {s.value}
                            </div>
                            <div className="mt-2 text-sm font-medium text-zinc-500 group-hover:text-emerald-700 transition-colors duration-300">
                              {s.title}
                            </div>

                            {/* bolinha: z-20 (acima de tudo) — sem z negativo */}
                            <div className="absolute -top-1 -right-1 z-20 w-5 h-5 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* dots */}
              <div
                className="flex justify-center mt-4 space-x-3"
                aria-hidden={false}
              >
                {stats.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    aria-label={`Ir para o slide ${i + 1}`}
                    className={`h-2 w-2 rounded-full transition-all duration-300 ${
                      i === active ? "bg-emerald-500 scale-125" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* DESKTOP: grid (mantive sua estrutura) */}
            <div className="hidden md:grid md:grid-cols-4 gap-4 md:gap-8">
              {stats.map((s, idx) => (
                <div key={idx} className="text-center group">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-green-600/10 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                    <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-emerald-200/50 group-hover:border-emerald-300/70 transition-all duration-300 group-hover:shadow-lg group-hover:scale-105">
                      <div className="text-2xl md:text-3xl font-bold bg-gradient-to-br from-emerald-600 to-green-800 bg-clip-text text-transparent">
                        {s.value}
                      </div>
                      <div className="mt-1 text-xs md:text-sm font-medium text-gray-600">
                        {s.title}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
