import Button from "../ui/Button";
import Card from "../ui/Card";
import { Link, useNavigate  } from "react-router-dom";
import { useState } from "react";
import { useI18n } from '../../i18n';

const Planos: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "quarterly" | "annual">("monthly");
  const navigate = useNavigate();
  const { t } = useI18n();

  const plans = [
    {
      id: 'essencial',
      nameKey: 'home.plans.essencial.name',
      taglineKey: 'home.plans.essencial.tagline',
      descKey: 'home.plans.essencial.desc',
      prices: { monthly: 150, quarterly: 400, annual: 1200 },
      featureKeys: [
        'home.plans.essencial.f1',
        'home.plans.essencial.f2',
        'home.plans.essencial.f3',
        'home.plans.essencial.f4',
        'home.plans.essencial.f5'
      ],
      ctaKey: 'home.plans.cta.essencial',
      popular: false,
      color: 'green'
    },
    {
      id: 'premium',
      nameKey: 'home.plans.premium.name',
      taglineKey: 'home.plans.premium.tagline',
      descKey: 'home.plans.premium.desc',
      prices: { monthly: 250, quarterly: 650, annual: 2000 },
      featureKeys: [
        'home.plans.premium.f1',
        'home.plans.premium.f2',
        'home.plans.premium.f3',
        'home.plans.premium.f4',
        'home.plans.premium.f5',
        'home.plans.premium.f6'
      ],
      ctaKey: 'home.plans.cta.premium',
      popular: true,
      color: 'emerald'
    },
    {
      id: 'vip',
      nameKey: 'home.plans.vip.name',
      taglineKey: 'home.plans.vip.tagline',
      descKey: 'home.plans.vip.desc',
      prices: { monthly: 450, quarterly: 1200, annual: 3600 },
      featureKeys: [
        'home.plans.vip.f1',
        'home.plans.vip.f2',
        'home.plans.vip.f3',
        'home.plans.vip.f4',
        'home.plans.vip.f5',
        'home.plans.vip.f6',
        'home.plans.vip.f7',
        'home.plans.vip.f8'
      ],
      ctaKey: 'home.plans.cta.vip',
      popular: false,
      color: 'yellow'
    }
  ] as const;

  const getSavings = (monthlyPrice: number, cyclePrice: number, cycle: string) => {
    const months = cycle === "quarterly" ? 3 : 12;
    const totalMonthly = monthlyPrice * months;
    const savings = totalMonthly - cyclePrice;
    const percentage = Math.round((savings / totalMonthly) * 100);
    
    return { savings, percentage };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
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
          <h2 className="text-4xl font-bold text-green-800 mb-4">
            {t('home.plans.heading')}
          </h2>
          <p className="text-sm sm:text-base text-gray-700 max-w-3xl mx-auto mb-8">
            {t('home.plans.subtitle')}
          </p>
          
          {/* Billing Cycle Toggle */}
          <div className="inline-flex bg-white rounded-lg p-1 shadow-md border border-green-100">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                billingCycle === "monthly" 
                  ? "bg-green-500 text-white shadow-sm" 
                  : "text-gray-600 hover:text-green-700"
              }`}
            >
              {t('home.plans.cycle.monthly')}
            </button>
            <button
              onClick={() => setBillingCycle("quarterly")}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                billingCycle === "quarterly" 
                  ? "bg-green-500 text-white shadow-sm" 
                  : "text-gray-600 hover:text-green-700"
              }`}
            >
              {t('home.plans.cycle.quarterly')}
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                billingCycle === "annual" 
                  ? "bg-green-500 text-white shadow-sm" 
                  : "text-gray-600 hover:text-green-700"
              }`}
            >
              {t('home.plans.cycle.annual')}
            </button>
          </div>
          
          <p className="text-sm text-gray-500 mt-3">
            {billingCycle === "quarterly" && t('home.plans.cycle.note.quarterly')}
            {billingCycle === "annual" && t('home.plans.cycle.note.annual')}
            {billingCycle === "monthly" && t('home.plans.cycle.note.monthly')}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8">
          {plans.map((plan) => {
            const savings = getSavings(plan.prices.monthly, plan.prices[billingCycle], billingCycle);
            
            return (
              <Card 
                key={plan.id}
                className={`flex flex-col h-full relative transition-all duration-300 hover:transform hover:scale-105 ${
                  plan.popular ? "border-2 border-emerald-500 shadow-xl" : "border border-green-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-md z-10">
                    {t('home.plans.badge.popular')}
                  </div>
                )}
                
                <div className="p-8 flex-1">
                  <div className="text-center mb-6">
                    <h3 className="font-bold text-2xl text-green-800 mb-1">{t(plan.nameKey as any)}</h3>
                    <p className="text-green-600 font-medium">{t(plan.taglineKey as any)}</p>
                  </div>
                  
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-green-600">
                        {formatPrice(plan.prices[billingCycle])}
                      </span>
                      {/*<span className="text-gray-500 ml-2">
                        {billingCycle === "monthly" ? "/mês" : 
                         billingCycle === "quarterly" ? "/trimestre" : "/ano"}
                      </span>*/}
                    </div>
                    
                    {billingCycle !== "monthly" && savings.savings > 0 && (
                      <div className="mt-2">
                        <span className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                          {t('home.plans.savings', { amount: formatPrice(savings.savings), percent: savings.percentage })}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {t('home.plans.equivalentPerMonth', { price: formatPrice(plan.prices[billingCycle] / (billingCycle === "quarterly" ? 3 : 12)) })}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-center mb-6">{t(plan.descKey as any)}</p>
                  
                  <ul className="mb-8 space-y-3 flex-1">
                    {plan.featureKeys.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5"
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
                        <span>{t(feature as any)}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-auto">
                    <Link 
                      to={"/register"} 
                      className="block w-full"
                    >
                      <Button 
                        className={`w-full py-3 ${
                          plan.popular 
                            ? "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600" 
                            : "bg-green-500 hover:bg-green-600"
                        } text-white font-semibold`}
                      >
                        {t(plan.ctaKey as any)}
                      </Button>
                    </Link>
                    
                    {plan.id === "premium" && (
                      <p className="text-center text-xs text-gray-500 mt-2">
                        {t('home.plans.trial.premium')}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        
        {/* Additional Info */}
        <div className="text-center mt-12">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-green-100 max-w-2xl mx-auto">
            <h4 className="font-semibold text-green-800 mb-2">{t('home.plans.faq.heading')}</h4>
            <p className="text-gray-600 mb-4">
              {t('home.plans.faq.desc')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button className="border-green-500 text-green-600 hover:bg-green-50" onClick={() => navigate('/faq')}>
                {t('home.plans.faq.button')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Planos;