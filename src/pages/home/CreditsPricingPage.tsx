import React, { useEffect, useMemo, useState } from "react";
import type { TranslationKey } from "../../types/i18n";
import { SEO } from "../../components/comum/SEO";
import { useI18n } from "../../i18n/utils";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Link } from "react-router-dom";
import { useConsultationPricing } from "../../hooks/useConsultationPricing";
import Skeleton from "../../components/ui/Skeleton";
import Tooltip from "../../components/ui/Tooltip";

// Página moderna de preços de créditos
const CreditsPricingPage: React.FC = () => {
  const { t } = useI18n();
  const { data, isLoading, error } = useConsultationPricing();

  // Banner promocional dinâmico (rotaciona mensagens e CTA)
  const promos = [
    {
      icon: "🎉",
      title: "🎉 Promoção Flash!",
      desc: "Desconto especial por tempo limitado",
      cta: "Aproveitar agora",
      color: "from-green-500 to-emerald-600",
      ctaGradient: "from-green-500 to-emerald-600",
      ctaHover: "hover:from-green-600 hover:to-emerald-700",
      to: "/agendar-consulta",
    },
    {
      icon: "⚡",
      title: "💰 Bonus Extra!",
      desc: "Créditos extras na compra de pacotes",
      cta: "Ver pacotes",
      color: "from-amber-500 to-orange-600",
      ctaGradient: "from-amber-500 to-orange-600",
      ctaHover: "hover:from-amber-600 hover:to-orange-700",
      to: "/agendar-consulta",
    },
    {
      icon: "💎",
      title: "🔍 Avaliação Gratuita",
      desc: "Primeira consulta sem custo para novos clientes",
      cta: "Solicitar avaliação",
      color: "from-blue-600 to-cyan-600",
      ctaGradient: "from-blue-600 to-cyan-600",
      ctaHover: "hover:from-blue-700 hover:to-cyan-700",
      to: "/agendar-consulta",
    },
  ] as const;
  const [promoIdx, setPromoIdx] = useState(0);
  useEffect(() => {
    const id = window.setInterval(
      () => setPromoIdx((i) => (i + 1) % promos.length),
      5000
    );
    return () => window.clearInterval(id);
  }, [promos.length]);

  const pricingMap = useMemo(() => {
    const map: Record<string, { amount_cents: number; currency: string }> = {};
    if (data?.ok) {
      for (const p of data.pricing)
        map[p.type] = { amount_cents: p.amount_cents, currency: p.currency };
    }
    return map;
  }, [data]);

  const format = (cents?: number, currency: string = "BRL") => {
    if (cents == null) return "—";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(cents / 100);
  };

  // Lógica de "desconto" artificial
  const fakeOriginal = (
    type: string,
    currentCents?: number
  ): number | undefined => {
    if (!currentCents) return undefined;
    const factor =
      type === "avaliacao_completa" ? 1.2 : type === "only_diet" ? 1.3 : 1.3;
    return Math.round(currentCents * factor);
  };

  // Configurações visuais para cada tipo de consulta
  const planConfig = {
    avaliacao_completa: {
      gradient: "from-green-500 to-emerald-600",
      bgGradient: "from-green-50 to-emerald-50",
      borderColor: "border-green-200",
      glowColor: "green",
      icon: "🔍",
      badge: t('pricing.badge.complete'),
      features: [
        t('pricing.feature.fullEvaluation'),
        t('pricing.feature.bodyAnalysis'),
        t('pricing.feature.personalizedPlan'),
        t('pricing.feature.support30'),
        t('pricing.feature.whatsapp'),
      ],
    },
    only_diet: {
      gradient: "from-blue-500 to-cyan-600",
      bgGradient: "from-blue-50 to-cyan-50",
      borderColor: "border-blue-200",
      glowColor: "blue",
      icon: "📋",
      badge: t('pricing.badge.fast'),
      features: [
        t('pricing.feature.personalizedPlan'),
        t('pricing.feature.weeklyMenu'),
        t('pricing.feature.shoppingList'),
        t('pricing.feature.adjustments15'),
      ],
    },
    reavaliacao: {
      gradient: "from-purple-500 to-pink-600",
      bgGradient: "from-purple-50 to-pink-50",
      borderColor: "border-purple-200",
      glowColor: "purple",
      icon: "🔄",
      badge: t('pricing.badge.clients'),
      features: [
        t('pricing.feature.reevaluation'),
        t('pricing.feature.planAdjustments'),
        t('pricing.feature.newGoals'),
        t('pricing.feature.continuousSupport'),
        t('pricing.feature.schedulingPreference'),
      ],
    },
  };

  const PricingCard = ({
    type,
    titleKey,
    subtitleKey,
    noticeKey,
  }: {
    type: string;
    titleKey: string;
    subtitleKey: string;
    featuresKey: string;
    noticeKey?: string;
  }) => {
    const config = planConfig[type as keyof typeof planConfig];
    const currentPrice = pricingMap[type]?.amount_cents;
    const originalPrice = fakeOriginal(type, currentPrice);
    const discountPercent = originalPrice
      ? Math.round(((originalPrice - currentPrice!) / originalPrice) * 100)
      : 0;

    // helper tipado para aceitar chaves dinâmicas vindas por props
    const tr = (k?: string) => (k ? t(k as unknown as TranslationKey) : "");

    return (
      <Card
        className={`p-0 overflow-hidden relative transition-all duration-500 hover:scale-[1.02] hover:shadow-xl border-2 ${config.borderColor} bg-gradient-to-br ${config.bgGradient}`}
      >
        {/* Badge de Destaque */}
        {config.badge && (
          <div
            className={`absolute top-4 right-4 z-10 bg-gradient-to-r ${config.gradient} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg`}
          >
            {config.badge}
          </div>
        )}

        {/* Header com Gradiente */}
        <div
          className={`bg-gradient-to-r ${config.gradient} p-6 text-white relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-2xl">{config.icon}</div>
              <h2 className="text-xl font-bold">{tr(titleKey)}</h2>
            </div>
            <p className="text-white/90 text-sm">{tr(subtitleKey)}</p>
          </div>
        </div>

        {/* Conteúdo do Preço */}
        <div className="p-6">
          <div className="text-center mb-6">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-32 mx-auto" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
            ) : (
              <div className="space-y-2">
                {/* Preço Original com Desconto */}
                {originalPrice && currentPrice && (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg line-through text-gray-400">
                      {format(originalPrice, pricingMap[type]?.currency)}
                    </span>
                    <span
                      className={`text-sm font-bold text-${config.glowColor}-700 bg-${config.glowColor}-100 px-2 py-1 rounded-full`}
                    >
                      {t("home.credits.promo.percent", {
                        percent: discountPercent,
                      })}
                    </span>
                  </div>
                )}

                {/* Preço Atual */}
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {format(currentPrice, pricingMap[type]?.currency)}
                  </span>
                  {originalPrice && (
                    <Tooltip content={t("home.credits.promo.tooltip")}>
                      <span className="text-xs uppercase tracking-wide text-gray-500 font-medium cursor-help border-b border-dashed border-gray-300">
                        {t("home.credits.promo.label")}
                      </span>
                    </Tooltip>
                  )}
                </div>

                {/* Economia */}
                {originalPrice && currentPrice && (
                  <p className="text-sm text-green-600 font-semibold">
                    Você economiza{" "}
                    {format(
                      originalPrice - currentPrice,
                      pricingMap[type]?.currency
                    )}
                    !
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Lista de Benefícios */}
          <ul className="space-y-3 mb-6">
            {config.features.map((feature, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-sm text-gray-700"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-${config.glowColor}-100 flex items-center justify-center flex-shrink-0 mt-0.5`}
                >
                  <svg
                    className={`w-3 h-3 text-${config.glowColor}-600`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {/* Botão de Ação */}
          <Link to="/agendar-consulta" className="block">
            <Button
              className={`w-full bg-gradient-to-r ${config.gradient} hover:shadow-lg transform hover:scale-105 transition-all duration-300 border-0 text-white font-semibold py-3`}
            >
              <span className="flex items-center justify-center gap-2">
                {tr(`consultations.credits.buy.${type}`)}
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
            </Button>
          </Link>

          {/* Aviso Especial */}
          {noticeKey && (
            <div className="p-2">
              <p className="text-xs text-yellow-800 text-center">
                {tr(noticeKey)}
              </p>
            </div>
          )}
        </div>

        {/* Efeito de Brilho no Hover */}
        <div
          className={`absolute inset-0 rounded-lg bg-gradient-to-r ${config.gradient} opacity-0 hover:opacity-5 transition-opacity duration-300 pointer-events-none`}
        ></div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30">
      {/* Banner topo dinâmico focado em conversão */}
      <div
        className={`sticky top-0 z-20 w-full bg-gradient-to-r ${promos[promoIdx].color} text-white`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <p className="font-bold text-xs md:text-base flex-shrink-0">
                {promos[promoIdx].title}
              </p>
              <p className="text-white/90 text-[11px] md:text-sm ">
                {promos[promoIdx].desc}
              </p>
            </div>
          </div>
          <Link to={promos[promoIdx].to} className="flex-shrink-0">
            <button
              className={`px-6 py-3 rounded-full text-sm font-semibold bg-gradient-to-r ${promos[promoIdx].ctaGradient} text-white ${promos[promoIdx].ctaHover} transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl border-0 relative overflow-hidden group`}
            >
              {/* Efeito de brilho no hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              {promos[promoIdx].cta}
            </button>
          </Link>
        </div>
      </div>
      <SEO title={t("pricing.seo.title")} description={t("pricing.seo.desc")} />

      <div className="max-w-6xl mx-auto mt-8">
        <div className="text-center mb-16">
          <div className="relative mx-auto mb-8">
            <div className="relative w-28 h-28 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-green-300/20 to-emerald-500/30 rounded-full blur-xl animate-pulse"></div>
              <div className="relative w-full h-full bg-gradient-to-br from-green-500 via-emerald-500 to-teal-400 rounded-full flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-6 transition-transform duration-500 group">
                <div className="absolute inset-4 bg-gradient-to-tr from-white/20 to-transparent rounded-full blur-sm"></div>

                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-full border border-white/20"></div>

                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="absolute -inset-10 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 animate-shine"></div>
                </div>

                <span className="text-4xl transform -rotate-3 group-hover:scale-110 transition-transform duration-500 filter drop-shadow-lg">
                  💎
                </span>
              </div>

              {/* Partículas brilhantes ao redor */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-300 rounded-full blur-sm animate-ping"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-300 rounded-full blur-sm animate-pulse delay-1000"></div>
              <div className="absolute -top-3 left-4 w-3 h-3 bg-emerald-300 rounded-full blur-sm animate-bounce delay-500"></div>
            </div>
          </div>

          {/* Texto com melhor hierarquia */}
          <h2 className="text-2xl font-bold bg-gradient-to-br from-green-700 to-emerald-600 bg-clip-text text-transparent">
            Escolha o plano perfeito
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            para sua jornada de saúde e bem-estar
          </p>

          {/* Status de Carregamento/Erro melhorados */}
          <div className="mb-8">
            {isLoading && (
              <div className="flex items-center justify-center gap-3 text-gray-600 bg-gray-50 rounded-full py-3 px-6 max-w-xs mx-auto border border-gray-200">
                <svg
                  className="w-5 h-5 animate-spin text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="font-medium">Carregando preços...</span>
              </div>
            )}
            {!isLoading && error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md mx-auto shadow-sm">
                <div className="flex items-center justify-center gap-3 text-red-800">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">⚠️</span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Falha ao carregar</p>
                    <p className="text-sm text-red-600 mt-1">
                      Tente novamente em alguns instantes
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Grid de Preços */}
        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8 mb-12">
          <PricingCard
            type="avaliacao_completa"
            titleKey="home.credits.avaliacao.title"
            subtitleKey="home.credits.avaliacao.subtitle"
            featuresKey="home.credits.avaliacao.features"
          />

          <PricingCard
            type="only_diet"
            titleKey="home.credits.only_diet.title"
            subtitleKey="home.credits.only_diet.subtitle"
            featuresKey="home.credits.only_diet.features"
          />

          <PricingCard
            type="reavaliacao"
            titleKey="home.credits.reavaliacao.title"
            subtitleKey="home.credits.reavaliacao.subtitle"
            featuresKey="home.credits.reavaliacao.features"
            noticeKey="home.credits.reavaliacao.notice"
          />
        </div>

        {/* Comparação de Planos */}
        {!isLoading && !error && (
          <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
              📊 Compare os Planos
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left pb-4 font-semibold text-gray-900">
                      Recurso
                    </th>
                    <th className="text-center pb-4 font-semibold text-green-700">
                      Avaliação Completa
                    </th>
                    <th className="text-center pb-4 font-semibold text-blue-700">
                      Plano Alimentar
                    </th>
                    <th className="text-center pb-4 font-semibold text-purple-700">
                      Reavaliação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-3 font-medium text-gray-700">
                      Avaliação Física
                    </td>
                    <td className="text-center py-3">✅</td>
                    <td className="text-center py-3">❌</td>
                    <td className="text-center py-3">✅</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium text-gray-700">
                      Plano Personalizado
                    </td>
                    <td className="text-center py-3">✅</td>
                    <td className="text-center py-3">✅</td>
                    <td className="text-center py-3">✅</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium text-gray-700">
                      Acompanhamento
                    </td>
                    <td className="text-center py-3">30 dias</td>
                    <td className="text-center py-3">15 dias</td>
                    <td className="text-center py-3">Contínuo</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium text-gray-700">
                      Suporte WhatsApp
                    </td>
                    <td className="text-center py-3">✅</td>
                    <td className="text-center py-3">❌</td>
                    <td className="text-center py-3">✅</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <div className="text-center mt-12 space-y-6">
          {/* Botão Final */}
          <div className="pt-6 mb-6">
            <Link to="/register">
              <Button variant="secondary" noFocus className="animate-bounce">
                <span className="flex items-center gap-2">
                  {t("landing.final.button")}
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditsPricingPage;
