import React, { useMemo } from 'react';
import { SEO } from '../../components/comum/SEO';
import { useI18n } from '../../i18n';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Link } from 'react-router-dom';
import { useConsultationPricing } from '../../hooks/useConsultationPricing';
import Skeleton from '../../components/ui/Skeleton';
import Tooltip from '../../components/ui/Tooltip';

// Página simples de preços de créditos (substitui antigo modelo de planos)
const CreditsPricingPage: React.FC = () => {
  const { t } = useI18n();
  const { data, isLoading, error } = useConsultationPricing();

  const pricingMap = useMemo(() => {
    const map: Record<string, { amount_cents: number; currency: string }> = {};
    if (data?.ok) {
      for (const p of data.pricing) map[p.type] = { amount_cents: p.amount_cents, currency: p.currency };
    }
    return map;
  }, [data]);

  const format = (cents?: number, currency: string = 'BRL') => {
    if (cents == null) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(cents / 100);
  };

  // Lógica de "desconto" artificial baseada no preço atual
  // Estratégia: mostrar preço riscado = preço_atual * fator (ex: 1.15 avaliação, 1.12 reavaliação)
  // Render apenas quando dados carregados para evitar flash inconsistente.
  const fakeOriginal = (type: string, currentCents?: number): number | undefined => {
    if (!currentCents) return undefined;
    const factor = type === 'avaliacao_completa' ? 1.15 : 1.12;
    return Math.round(currentCents * factor);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO title={t('pricing.seo.title')} description={t('pricing.seo.desc')} />
      <h1 className="text-3xl font-bold mb-2 text-green-800">{t('billing.credits.title')}</h1>
      <p className="text-gray-600 mb-8 text-sm leading-relaxed">
        {t('home.credits.subtitle')}
      </p>
      <div className="mb-6 text-sm min-h-5">
        {isLoading && <Skeleton className="h-4 w-48" />}
        {!isLoading && error && <span className="text-red-600">Falha ao carregar preços.</span>}
        {!isLoading && !error && data?.ok && (
          <span className="text-gray-500">Última atualização: {new Date(data.pricing[0]?.updated_at || Date.now()).toLocaleString('pt-BR')}</span>
        )}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
  <Card className={`p-6 flex flex-col relative transition-all duration-300 border rounded-xl ${pricingMap['avaliacao_completa'] ? 'border-green-200 shadow-sm' : 'border-gray-200'} ${pricingMap['avaliacao_completa']?.amount_cents ? 'after:absolute after:inset-0 after:rounded-xl after:pointer-events-none after:border after:border-green-300/40 motion-safe:after:animate-[pulse_3s_ease-in-out_infinite]' : ''}`}>        
          <h2 className="text-xl font-semibold text-green-800 mb-1">{t('home.credits.avaliacao.title')}</h2>
          <p className="text-sm text-green-600 mb-4">{t('home.credits.avaliacao.subtitle')}</p>
          <div className="mb-4">
            {isLoading ? (
              <Skeleton className="h-6 w-28" />
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                {(() => { const orig = fakeOriginal('avaliacao_completa', pricingMap['avaliacao_completa']?.amount_cents); const curr = pricingMap['avaliacao_completa']?.amount_cents; if (orig && curr) { const pct = Math.round(((orig - curr) / orig) * 100); return (
                  <div className="flex items-center gap-2">
                    <span className="text-xs line-through text-gray-400">{format(orig, pricingMap['avaliacao_completa']?.currency)}</span>
                    <span className="text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">{t('home.credits.promo.percent',{percent:pct})}</span>
                  </div>
                ); } return null; })()}
                <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                  {format(pricingMap['avaliacao_completa']?.amount_cents, pricingMap['avaliacao_completa']?.currency)}
                </span>
                {fakeOriginal('avaliacao_completa', pricingMap['avaliacao_completa']?.amount_cents) && (
                  <Tooltip content={t('home.credits.promo.tooltip')}>
                    <span className="text-[10px] uppercase tracking-wide text-green-600 font-medium cursor-help">{t('home.credits.promo.label')}</span>
                  </Tooltip>
                )}
              </div>
            )}
          </div>
          <ul className="text-sm text-gray-700 space-y-2 mb-6">
            <li>• {t('home.credits.avaliacao.f1')}</li>
            <li>• {t('home.credits.avaliacao.f2')}</li>
            <li>• {t('home.credits.avaliacao.f3')}</li>
            <li>• {t('home.credits.avaliacao.f4')}</li>
          </ul>
          <Link to="/agendar-consulta" className="mt-auto">
            <Button className="w-full">{t('consultations.credits.buy.avaliacao')}</Button>
          </Link>
        </Card>
  <Card className={`p-6 flex flex-col relative transition-all duration-300 border rounded-xl ${pricingMap['reavaliacao'] ? 'border-emerald-200 shadow-sm' : 'border-gray-200'} ${pricingMap['reavaliacao']?.amount_cents ? 'after:absolute after:inset-0 after:rounded-xl after:pointer-events-none after:border after:border-emerald-300/40 motion-safe:after:animate-[pulse_3s_ease-in-out_infinite]' : ''}`}>        
          <h2 className="text-xl font-semibold text-green-800 mb-1">{t('home.credits.reavaliacao.title')}</h2>
          <p className="text-sm text-green-600 mb-4">{t('home.credits.reavaliacao.subtitle')}</p>
          <div className="mb-4">
            {isLoading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                {(() => { const orig = fakeOriginal('reavaliacao', pricingMap['reavaliacao']?.amount_cents); const curr = pricingMap['reavaliacao']?.amount_cents; if (orig && curr) { const pct = Math.round(((orig - curr) / orig) * 100); return (
                  <div className="flex items-center gap-2">
                    <span className="text-xs line-through text-gray-400">{format(orig, pricingMap['reavaliacao']?.currency)}</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">{t('home.credits.promo.percent',{percent:pct})}</span>
                  </div>
                ); } return null; })()}
                <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                  {format(pricingMap['reavaliacao']?.amount_cents, pricingMap['reavaliacao']?.currency)}
                </span>
                {fakeOriginal('reavaliacao', pricingMap['reavaliacao']?.amount_cents) && (
                  <Tooltip content={t('home.credits.promo.tooltip')}>
                    <span className="text-[10px] uppercase tracking-wide text-emerald-600 font-medium cursor-help">{t('home.credits.promo.label')}</span>
                  </Tooltip>
                )}
              </div>
            )}
          </div>
          <ul className="text-sm text-gray-700 space-y-2 mb-4">
            <li>• {t('home.credits.reavaliacao.f1')}</li>
            <li>• {t('home.credits.reavaliacao.f2')}</li>
            <li>• {t('home.credits.reavaliacao.f3')}</li>
            <li>• {t('home.credits.reavaliacao.f4')}</li>
          </ul>
          <p className="text-xs text-gray-500 mb-4">{t('home.credits.reavaliacao.notice')}</p>
          <Link to="/agendar-consulta" className="mt-auto">
            <Button variant="secondary" className="w-full">{t('consultations.credits.buy.reavaliacao')}</Button>
          </Link>
        </Card>
      </div>
      <div className="mt-10 text-center">
        <Link to="/">
          <Button variant="secondary">{t('landing.final.button')}</Button>
        </Link>
      </div>
    </div>
  );
};

export default CreditsPricingPage;