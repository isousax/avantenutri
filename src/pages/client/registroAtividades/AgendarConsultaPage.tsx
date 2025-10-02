import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { SEO } from "../../../components/comum/SEO";
import { useI18n, formatDate as fmtDate } from "../../../i18n";
import { useConsultationCreditsSummary } from "../../../hooks/useConsultationCredits";
import { useConsultationPricing } from "../../../hooks/useConsultationPricing";
import { useAuth } from "../../../contexts";
import { useConsultations } from "../../../hooks/useConsultations";
import { useToast } from "../../../components/ui/ToastProvider";
import { useQuestionnaireStatus } from "../../../hooks/useQuestionnaireStatus";
import { QuestionnaireConfirmModal } from "../../../components/dashboard/QuestionnaireConfirmModal";

const AgendarConsultaPage: React.FC = () => {
  const { push } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tipoConsulta: "avaliacao_completa",
    data: "",
    horario: "",
    urgencia: "normal",
  });
  const { authenticatedFetch } = useAuth();
  const { create, items, loading, error, list } = useConsultations();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { locale, t } = useI18n();

  const [etapa, setEtapa] = useState(1);

  // Questionnaire modal state
  const { data: questionnaireStatus } = useQuestionnaireStatus();
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);

  // Simplified: everyone can schedule consultations
  // Remove plan restrictions as per new business model

  const tiposConsulta = [
    {
      value: "avaliacao_completa",
      labelKey: 'consultations.schedule.type.avaliacao_completa.label',
      descKey: 'consultations.schedule.type.avaliacao_completa.desc',
      durationKey: 'consultations.schedule.type.avaliacao_completa.duration',
      priceKey: 'consultations.schedule.type.avaliacao_completa.price'
    },
    {
      value: "reavaliacao",
      labelKey: 'consultations.schedule.type.reavaliacao.label',
      descKey: 'consultations.schedule.type.reavaliacao.desc',
      durationKey: 'consultations.schedule.type.reavaliacao.duration',
      priceKey: 'consultations.schedule.type.reavaliacao.price'
    },
  ] as const;

      const { data: creditsSummary } = useConsultationCreditsSummary();
  const { data: pricingData } = useConsultationPricing();
  const priceMap = useMemo(() => {
    const map: Record<string,string> = {};
    if (pricingData?.pricing) {
      for (const p of pricingData.pricing) {
        const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: p.currency || 'BRL' });
        map[p.type] = formatter.format(p.amount_cents / 100);
      }
    }
    return map;
  }, [pricingData]);
  // Slots fetching logic moved / may be reintroduced; removing unused state

  // Load slots when date changes (fetch a small range around selected date)
  // Slot loading removed for credit gating iteration

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (etapa === 1) {
      setEtapa(2);
      return;
    }

    // Check questionnaire status before proceeding
    if (!questionnaireStatus?.is_complete) {
      setShowQuestionnaireModal(true);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const { dataIso } = (() => {
        const date = formData.data; // YYYY-MM-DD
        const time = formData.horario; // HH:MM
        const [h, m] = time.split(":").map(Number);
        const dt = new Date(date + "T" + time + ":00Z");
        // If user local timezone, adjust: assume date/time is local, convert to UTC
        if (!isNaN(h!) && !isNaN(m!)) {
          const local = new Date(date + "T" + time + ":00");
          return { dataIso: local.toISOString() };
        }
        return { dataIso: dt.toISOString() };
      })();
      await create({ scheduledAt: dataIso, type: formData.tipoConsulta, urgency: formData.urgencia });
          // Gating: require credit for paid types
          if (formData.tipoConsulta === 'avaliacao_completa' || formData.tipoConsulta === 'reavaliacao') {
            const available = creditsSummary?.summary?.[formData.tipoConsulta]?.available || 0;
            if (available <= 0) {
              push({ type: 'error', message: t('consultations.credits.required.cta') });
              return; // stop here
            }
          }
          setEtapa(2);
      navigate("/dashboard");
    } catch (e: any) {
      const raw = (e?.message || '') as string;
      let mapped: string | null = null;
      if (raw.includes('slot_taken')) mapped = t('consultations.error.slotTaken');
      else if (raw.includes('blocked_slot')) mapped = t('consultations.error.blocked');
      else if (raw.includes('slot_not_available')) mapped = t('consultations.error.notAvailable');
      else if (raw.includes('questionnaire_required')) mapped = 'É necessário completar o questionário antes de agendar uma consulta.';
      const finalMsg = mapped || t('consultations.schedule.error');
      setSubmitError(finalMsg);
      push({ type: 'error', message: finalMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuestionnaireConfirm = async () => {
    // Proceed with consultation booking after questionnaire confirmation
    setShowQuestionnaireModal(false);
    
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { dataIso } = (() => {
        const date = formData.data; // YYYY-MM-DD
        const time = formData.horario; // HH:MM
        const [h, m] = time.split(":").map(Number);
        const dt = new Date(date + "T" + time + ":00Z");
        // If user local timezone, adjust: assume date/time is local, convert to UTC
        if (!isNaN(h!) && !isNaN(m!)) {
          const local = new Date(date + "T" + time + ":00");
          return { dataIso: local.toISOString() };
        }
        return { dataIso: dt.toISOString() };
      })();
      await create({ scheduledAt: dataIso, type: formData.tipoConsulta, urgency: formData.urgencia });
      push({ type: 'success', message: t('consultations.status.scheduled') });
      navigate("/dashboard");
    } catch (e: any) {
      const raw = (e?.message || '') as string;
      let mapped: string | null = null;
      if (raw.includes('slot_taken')) mapped = t('consultations.error.slotTaken');
      else if (raw.includes('blocked_slot')) mapped = t('consultations.error.blocked');
      else if (raw.includes('slot_not_available')) mapped = t('consultations.error.notAvailable');
      else if (raw.includes('questionnaire_required')) mapped = 'É necessário completar o questionário antes de agendar uma consulta.';
      const finalMsg = mapped || t('consultations.schedule.error');
      setSubmitError(finalMsg);
  push({ type: 'error', message: finalMsg });
    } finally {
      setSubmitting(false);
    }
  };

  async function purchaseCredit(type: 'avaliacao_completa' | 'reavaliacao') {
    const { user } = useAuth();
    try {
      const data: any = await authenticatedFetch('/billing/intent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, display_name: user?.display_name }) });
      if (!data?.checkout_url) {
        push({ type: 'error', message: data?.error || 'Falha ao iniciar pagamento'});
        return;
      }
      window.location.href = data.checkout_url; // redirect to Mercado Pago
    } catch (e:any) {
      push({ type: 'error', message: e?.message || 'Erro inesperado'});
    }
  }

  const renderEtapa1 = () => (
    <div className="space-y-6">
  <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('consultations.schedule.typeHeading')}</h3>

      <div className="grid gap-4">
        {tiposConsulta.map((tipo) => {
          const needsCredit = tipo.value === 'avaliacao_completa' || tipo.value === 'reavaliacao';
            const availableCredits = creditsSummary?.summary?.[tipo.value]?.available || 0;
            const lacks = needsCredit && availableCredits <= 0;
          return (
            <div
              key={tipo.value}
              onClick={() => setFormData((prev) => ({ ...prev, tipoConsulta: tipo.value }))}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                formData.tipoConsulta === tipo.value
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-green-300"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">{t(tipo.labelKey as any)}</h4>
                  <p className="text-sm text-gray-600">{t(tipo.descKey as any)}</p>
                  {needsCredit && (
                    <p className="mt-1 text-xs">
                      <span className={lacks ? 'text-rose-600' : 'text-green-600'}>
                        {lacks ? t('consultations.credits.missing.short') : `${availableCredits} crédito(s)`}
                      </span>
                    </p>
                  )}
                  {tipo.value === 'reavaliacao' && (
                    <div className="mt-2 text-[11px] text-gray-500 border-t pt-2">
                      {t('consultations.credits.reavaliacao.rule')}
                    </div>
                  )}
                </div>
                <span className="text-lg font-bold text-green-600">
                  {priceMap[tipo.value] || t(tipo.priceKey as any)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{t(tipo.durationKey as any)}</span>
                <span>{t('consultations.schedule.onlineTag')}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={()=> purchaseCredit('avaliacao_completa')} className="text-xs px-3 py-2 rounded bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700">{t('consultations.credits.buy.avaliacao')}</button>
        <button type="button" onClick={()=> purchaseCredit('reavaliacao')} className="text-xs px-3 py-2 rounded bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700">{t('consultations.credits.buy.reavaliacao')}</button>
      </div>
    </div>
  );

  // locale already obtained above
  const renderEtapa2 = () => (
    <div className="space-y-6">
  <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('consultations.schedule.step2.title')}</h3>
      {submitError && (
        <div className="p-3 rounded bg-red-100 text-red-700 text-sm mb-2">
          {submitError}
        </div>
      )}

      <div className="grid gap-4">
        {tiposConsulta.map((tipo) => {
          const needsCredit = tipo.value === 'avaliacao_completa' || tipo.value === 'reavaliacao';
          const availableCredits = creditsSummary?.summary?.[tipo.value]?.available || 0;
          const lacks = needsCredit && availableCredits <= 0;
          return (
            <div
              key={tipo.value}
              onClick={() => setFormData((prev) => ({ ...prev, tipoConsulta: tipo.value }))}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                formData.tipoConsulta === tipo.value
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-green-300"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">{t(tipo.labelKey as any)}</h4>
                  <p className="text-sm text-gray-600">{t(tipo.descKey as any)}</p>
                  {needsCredit && (
                    <p className="mt-1 text-xs">
                      <span className={lacks ? 'text-rose-600' : 'text-green-600'}>
                        {lacks ? t('consultations.credits.missing.short') : `${availableCredits} crédito(s)`}
                      </span>
                    </p>
                  )}
                </div>
                <span className="text-lg font-bold text-green-600">
                  {priceMap[tipo.value] || t(tipo.priceKey as any)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{t(tipo.durationKey as any)}</span>
                <span>{t('consultations.schedule.onlineTag')}</span>
              </div>
              {tipo.value === 'reavaliacao' && (
                <div className="mt-2 text-[11px] text-gray-500 border-t pt-2">
                  {t('consultations.credits.reavaliacao.rule')}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('consultations.schedule.urgency.heading')}
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "baixa", label: t('consultations.schedule.urgency.low'), cor: "green" },
            { value: "normal", label: t('consultations.schedule.urgency.normal'), cor: "blue" },
            { value: "alta", label: t('consultations.schedule.urgency.high'), cor: "red" },
          ].map((nivel) => (
            <button
              key={nivel.value}
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, urgencia: nivel.value }))
              }
              className={`p-3 rounded-lg border-2 transition-all ${
                formData.urgencia === nivel.value
                  ? `border-${nivel.cor}-500 bg-${nivel.cor}-50 text-${nivel.cor}-700`
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {nivel.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resumo */}
      <Card className="p-4 bg-green-50 border border-green-200">
  <h4 className="font-semibold text-green-800 mb-2">{t('consultations.schedule.summary.title')}</h4>
        <div className="text-sm text-green-700 space-y-1">
          <p>
            <strong>{t('consultations.schedule.summary.type')}:</strong>{" "}
            {t(tiposConsulta.find((t) => t.value === formData.tipoConsulta)!.labelKey as any)}
          </p>
          <p>
            <strong>{t('consultations.schedule.summary.date')}:</strong>{" "}
            {formData.data ? fmtDate(formData.data, locale, { dateStyle: 'medium'}) : "--"}
          </p>
          <p>
            <strong>{t('consultations.schedule.summary.time')}:</strong> {formData.horario || "--"}
          </p>
          <p>
            <strong>{t('consultations.schedule.summary.price')}:</strong>{" "}
            {priceMap[formData.tipoConsulta] || t(tiposConsulta.find((t) => t.value === formData.tipoConsulta)!.priceKey as any)}
          </p>
        </div>
      </Card>
      <div>
  <h4 className="mt-6 font-semibold text-gray-800 mb-2">{t('consultations.schedule.nextConsultations')}</h4>
  {loading && <p className="text-sm text-gray-500">{t('consultations.loading')}</p>}
  {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && items && items.length === 0 && (
          <p className="text-sm text-gray-500">{t('consultations.none')}</p>
        )}
        <ul className="mt-2 space-y-2">
          {items.slice(0, 5).map((c) => (
            <li key={c.id} className="text-xs text-gray-600 flex justify-between border p-2 rounded">
              <span>{fmtDate(c.scheduled_at, locale, { dateStyle: 'short', timeStyle: 'short' })}</span>
              <span className="uppercase text-[10px] tracking-wide">{c.status}</span>
            </li>
          ))}
        </ul>
  <button type="button" onClick={() => list()} className="mt-2 text-xs text-green-600 hover:underline">{t('consultations.schedule.update')}</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-25 py-8 px-4">
      <SEO
        title={t('consultations.schedule.seo.title')}
        description={t('consultations.schedule.seo.desc')}
      />
      <div className="max-w-2xl mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2">{t('consultations.schedule')}</h1>
          <p className="text-gray-600">Avante Nutri</p>
          <button type="button" onClick={()=> navigate(-1)} className="mt-3 text-sm text-green-700 hover:underline">{t('common.back')}</button>
        </div>
        {/* Progress */}
        <div className="flex mb-8">
          {[1, 2].map((step) => (
            <div key={step} className="flex-1 flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  etapa >= step
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step}
              </div>
              {step < 2 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    etapa > step ? "bg-green-500" : "bg-gray-200"
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>
        <Card className="p-6 shadow-xl border border-green-100">
          <form onSubmit={handleSubmit}>
            {etapa === 1 ? renderEtapa1() : renderEtapa2()}
            <div className="flex gap-4 pt-6 mt-6 border-t border-gray-200">
              {etapa === 2 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEtapa(1)}
                  className="flex-1"
                >
                  {t('consultations.schedule.buttons.back')}
                </Button>
              )}
              {etapa === 1 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate("/dashboard")}
                  className="flex-1"
                >
                  {t('consultations.schedule.buttons.cancel')}
                </Button>
              )}
              <Button type="submit" className="flex-1" disabled={submitting}>
                {etapa === 1 ? t('consultations.schedule.buttons.continue') : submitting ? t('consultations.scheduling') : t('consultations.schedule.buttons.confirm')}
              </Button>
            </div>
          </form>
        </Card>
        {/* Informações */}
        <Card className="mt-6 p-4 bg-blue-50 border border-blue-100">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-lg font-medium text-blue-800">{t('consultations.info.title')}</p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>• {t('consultations.info.item.online')}</li>
                <li>• {t('consultations.info.item.linkBefore')}</li>
                <li>• {t('consultations.info.item.reschedule')}</li>
                <li>• {t('consultations.info.item.early')}</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Questionnaire Confirmation Modal */}
      <QuestionnaireConfirmModal
        isOpen={showQuestionnaireModal}
        onClose={() => setShowQuestionnaireModal(false)}
        onConfirm={handleQuestionnaireConfirm}
        hasQuestionnaire={questionnaireStatus?.has_data || false}
      />
    </div>
  );
};

export default AgendarConsultaPage;
