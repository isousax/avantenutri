import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useI18n } from '../../i18n';
import { Link } from 'react-router-dom';

/**
 * Home page section replacing legacy Planos with credit-based offering.
 * Cards:
 * 1. Free platform usage (core tracking & agenda visibility)
 * 2. Avaliação Completa (purchase credit CTA)
 * 3. Reavaliação (purchase credit CTA)
 */
const CreditsSection: React.FC = () => {
  const { t } = useI18n();

  const cards: Array<{
    id: string;
    title: string;
    subtitle?: string;
    desc: string;
    features: string[];
    cta?: string;
    ctaVariant?: 'primary' | 'outline';
    type?: 'avaliacao' | 'reavaliacao' | 'only_diet';
  }> = [
    {
      id: 'free',
      title: t('home.credits.free.title'),
      subtitle: t('home.credits.free.subtitle'),
      desc: t('home.credits.free.desc'),
      features: [
        'home.credits.free.f1',
        'home.credits.free.f2',
        'home.credits.free.f3',
        'home.credits.free.f4'
      ].map(k => t(k as any))
    },
    {
      id: 'avaliacao',
      title: t('home.credits.avaliacao.title'),
      subtitle: t('home.credits.avaliacao.subtitle'),
      desc: t('home.credits.avaliacao.desc'),
      features: [
        'home.credits.avaliacao.f1',
        'home.credits.avaliacao.f2',
        'home.credits.avaliacao.f3',
        'home.credits.avaliacao.f4',
      ].map(k => t(k as any)),
      cta: t('consultations.credits.buy.avaliacao'),
      ctaVariant: 'primary',
      type: 'avaliacao'
    },
    {
      id: 'only_diet',
      title: t('home.credits.only_diet.title'),
      subtitle: t('home.credits.only_diet.subtitle'),
      desc: t('home.credits.only_diet.desc'),
      features: [
        'home.credits.only_diet.f1',
        'home.credits.only_diet.f2',
        'home.credits.only_diet.f3',
        'home.credits.only_diet.f4'
      ].map(k => t(k as any)),
      cta: t('consultations.credits.buy.only_diet'),
      ctaVariant: 'outline',
      type: 'only_diet'
    },
    {
      id: 'reavaliacao',
      title: t('home.credits.reavaliacao.title'),
      subtitle: t('home.credits.reavaliacao.subtitle'),
      desc: t('home.credits.reavaliacao.desc'),
      features: [
        'home.credits.reavaliacao.f1',
        'home.credits.reavaliacao.f2',
        'home.credits.reavaliacao.f3',
        'home.credits.reavaliacao.f4'
      ].map(k => t(k as any)),
      cta: t('consultations.credits.buy.reavaliacao'),
      ctaVariant: 'outline',
      type: 'reavaliacao'
    }
  ];

  return (
    <section id="creditos" className="py-20 bg-gradient-to-br from-green-50 via-white to-emerald-50 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-green-800 mb-4">
            {t('home.credits.heading')}
          </h2>
          <p className="text-sm sm:text-base text-gray-700 max-w-3xl mx-auto">
            {t('home.credits.subtitle')}
          </p>
        </div>
        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8">
          {cards.map(card => (
            <Card key={card.id} className={`flex flex-col h-full relative border border-green-200 transition-all duration-300 hover:transform hover:scale-105 ${card.id==='avaliacao' ? 'shadow-xl border-emerald-500' : ''}`}>
              {card.id === 'avaliacao' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-md z-10">
                  {t('home.credits.badge.recommended')}
                </div>
              )}
              <div className="p-8 flex-1 flex flex-col">
                <div className="text-center mb-6">
                  <h3 className="font-bold text-2xl text-green-800 mb-1">{card.title}</h3>
                  {card.subtitle && <p className="text-green-600 font-medium">{card.subtitle}</p>}
                </div>
                <p className="text-gray-600 text-center mb-6">{card.desc}</p>
                <ul className="mb-8 space-y-3 flex-1">
                  {card.features.map((f, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {card.cta && (
                  <div className="mt-auto">
                    <Link to="/pricing" className="block w-full">
                      <Button className={`w-full py-3 ${card.ctaVariant === 'primary' ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white' : 'bg-white border border-green-300 text-green-700 hover:bg-green-50'}`}>
                        {card.cta}
                      </Button>
                    </Link>
                    {card.type === 'reavaliacao' && (
                      <p className="text-center text-xs text-gray-500 mt-2">
                        {t('home.credits.reavaliacao.notice')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CreditsSection;
