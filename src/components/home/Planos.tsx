import Button from "../ui/Button";
import Card from "../ui/Card";
import { Link } from "react-router-dom";
import { useState } from "react";

const Planos: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "quarterly" | "annual">("monthly");

  const plans = [
    {
      id: "essencial",
      name: "Plano Essencial",
      tagline: "Para quem busca resultados sólidos",
      description: "Ideal para quem quer começar com acompanhamento profissional",
      prices: {
        monthly: 150,
        quarterly: 400,
        annual: 1200
      },
      features: [
        "Consulta completa",
        "Plano alimentar personalizado",
        "Avaliação física e metabólica",
        "Suporte",
        "Reavaliação"
      ],
      cta: "Começar Agora",
      popular: false,
      color: "green"
    },
    {
      id: "premium",
      name: "Plano Premium",
      tagline: "Resultados acelerados com suporte integral",
      description: "Acompanhamento completo para otimizar seus resultados",
      prices: {
        monthly: 250,
        quarterly: 650,
        annual: 2000
      },
      features: [
        "Tudo do plano Essencial",
        "2 consultas",
        "Suporte prioritário por WhatsApp",
        "Plano de suplementação",
        "Acompanhamento de metas",
        "Receitas exclusivas"
      ],
      cta: "Experimente Grátis",
      popular: true,
      color: "emerald"
    },
    {
      id: "vip",
      name: "Plano VIP",
      tagline: "Experiência personalizada máxima",
      description: "Para quem busca transformação completa com atendimento exclusivo",
      prices: {
        monthly: 450,
        quarterly: 1200,
        annual: 3600
      },
      features: [
        "Tudo do plano Premium",
        "Consultas ilimitadas",
        "Suporte 24/7",
        "Plano de treino personalizado",
        "Consultoria em compras",
        "Análise corporal avançada",
        "Encontros quinzenais",
        "Relatórios detalhados"
      ],
      cta: "Agendar Consultoria",
      popular: false,
      color: "yellow"
    }
  ];

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
            Planos que se Adaptam a Você
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            Escolha o acompanhamento ideal para seus objetivos. Flexibilidade total para mudar quando quiser.
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
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle("quarterly")}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                billingCycle === "quarterly" 
                  ? "bg-green-500 text-white shadow-sm" 
                  : "text-gray-600 hover:text-green-700"
              }`}
            >
              Trimestral
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                billingCycle === "annual" 
                  ? "bg-green-500 text-white shadow-sm" 
                  : "text-gray-600 hover:text-green-700"
              }`}
            >
              Anual
            </button>
          </div>
          
          <p className="text-sm text-gray-500 mt-3">
            {billingCycle === "quarterly" && "Economize até 20% com o plano trimestral"}
            {billingCycle === "annual" && "Economize até 30% com o plano anual"}
            {billingCycle === "monthly" && "Máxima flexibilidade sem compromisso"}
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
                    MAIS POPULAR
                  </div>
                )}
                
                <div className="p-8 flex-1">
                  <div className="text-center mb-6">
                    <h3 className="font-bold text-2xl text-green-800 mb-1">{plan.name}</h3>
                    <p className="text-green-600 font-medium">{plan.tagline}</p>
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
                          Economize {formatPrice(savings.savings)} ({savings.percentage}%)
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Equivale a {formatPrice(plan.prices[billingCycle] / (billingCycle === "quarterly" ? 3 : 12))}/mês
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-center mb-6">{plan.description}</p>
                  
                  <ul className="mb-8 space-y-3 flex-1">
                    {plan.features.map((feature, index) => (
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
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-auto">
                    <Link 
                      to={plan.id === "premium" ? "/questionario" : "/register"} 
                      className="block w-full"
                    >
                      <Button 
                        className={`w-full py-3 ${
                          plan.popular 
                            ? "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600" 
                            : "bg-green-500 hover:bg-green-600"
                        } text-white font-semibold`}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                    
                    {plan.id === "premium" && (
                      <p className="text-center text-xs text-gray-500 mt-2">
                        7 dias de avaliação gratuita
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
            <h4 className="font-semibold text-green-800 mb-2">Dúvidas sobre os planos?</h4>
            <p className="text-gray-600 mb-4">
              Fale conosco para personalizar seu pacote conforme suas necessidades.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button className="border-green-500 text-green-600 hover:bg-green-50" onClick={() => window.location.href = "https://wa.me/+5581986653214"}>
                Falar com Especialista
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Planos;