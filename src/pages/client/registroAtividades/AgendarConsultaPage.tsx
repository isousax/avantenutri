import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { SEO } from "../../../components/comum/SEO";
import { useI18n, formatDate as fmtDate } from "../../../i18n";
import { API } from "../../../config/api";
import { useAuth } from "../../../contexts";
import { useConsultations } from "../../../hooks/useConsultations";
import { usePermissions } from "../../../hooks/usePermissions";
import { CAPABILITIES } from "../../../types/capabilities";
import { useToast } from "../../../components/ui/ToastProvider";

const AgendarConsultaPage: React.FC = () => {
  const { push } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tipoConsulta: "acompanhamento",
    data: "",
    horario: "",
    urgencia: "normal",
  });
  const { authenticatedFetch } = useAuth();
  const { create, items, loading, error, list } = useConsultations();
  const { can, loading: permsLoading, ready } = usePermissions();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { locale, t } = useI18n();

  const [etapa, setEtapa] = useState(1);

  // Gating: if user cannot schedule consultations redirect to planos with intent marker
  useEffect(()=> {
    if (permsLoading) return; // wait
    if (ready && !can(CAPABILITIES.CONSULTA_AGENDAR)) {
      const intentUrl = `/planos?intent=consultation`;
      navigate(intentUrl, { replace: true });
    }
  }, [permsLoading, ready, can, navigate]);

  const tiposConsulta = [
    {
      value: "acompanhamento",
      labelKey: 'consultations.schedule.type.acompanhamento.label',
      descKey: 'consultations.schedule.type.acompanhamento.desc',
      durationKey: 'consultations.schedule.type.acompanhamento.duration',
      priceKey: 'consultations.schedule.type.acompanhamento.price'
    },
    {
      value: "reavaliacao",
      labelKey: 'consultations.schedule.type.reavaliacao.label',
      descKey: 'consultations.schedule.type.reavaliacao.desc',
      durationKey: 'consultations.schedule.type.reavaliacao.duration',
      priceKey: 'consultations.schedule.type.reavaliacao.price'
    },
  ] as const;

  const [slots, setSlots] = useState<{ date: string; slots: { start: string; end: string; taken: boolean }[] }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Load slots when date changes (fetch a small range around selected date)
  useEffect(()=>{
    if (!formData.data) return;
    const load = async () => {
      try {
        setLoadingSlots(true);
        const from = formData.data;
        const to = formData.data; // single day for now
        const qs = new URLSearchParams({ from, to });
        const r = await authenticatedFetch(`${API.CONSULTATION_AVAILABLE_SLOTS}?${qs.toString()}`);
        if (r.ok) {
          const data = await r.json();
            setSlots(data.days || []);
        }
      } finally { setLoadingSlots(false); }
    }; void load();
  },[formData.data, authenticatedFetch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (etapa === 1) {
      setEtapa(2);
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
      push({ type: 'success', message: t('consultations.status.scheduled') });
      navigate("/dashboard");
    } catch (e: any) {
      const raw = (e?.message || '') as string;
      let mapped: string | null = null;
      if (raw.includes('slot_taken')) mapped = t('consultations.error.slotTaken');
      else if (raw.includes('blocked_slot')) mapped = t('consultations.error.blocked');
      else if (raw.includes('slot_not_available')) mapped = t('consultations.error.notAvailable');
      const finalMsg = mapped || t('consultations.schedule.error');
      setSubmitError(finalMsg);
      push({ type: 'error', message: finalMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const renderEtapa1 = () => (
    <div className="space-y-6">
  <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('consultations.schedule.typeHeading')}</h3>

      <div className="grid gap-4">
        {tiposConsulta.map((tipo) => (
          <div
            key={tipo.value}
            onClick={() =>
              setFormData((prev) => ({ ...prev, tipoConsulta: tipo.value }))
            }
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
              </div>
              <span className="text-lg font-bold text-green-600">
                {t(tipo.priceKey as any)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>{t(tipo.durationKey as any)}</span>
              <span>{t('consultations.schedule.onlineTag')}</span>
            </div>
          </div>
        ))}
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

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="data"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Data da Consulta *
          </label>
          <input
            type="date"
            id="data"
            value={formData.data}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, data: e.target.value }))
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            min={new Date().toISOString().split("T")[0]}
            required
          />
        </div>

        <div>
          <label
            htmlFor="horario"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Horário *
          </label>
          <select
            id="horario"
            value={formData.horario}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, horario: e.target.value }))
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          >
            <option value="">{loadingSlots ? t('consultations.loadingSlots') : t('consultations.selectSlotPlaceholder')}</option>
            {slots.find(d=> d.date===formData.data)?.slots.filter(s=> !s.taken).map(s=> {
              const time = new Date(s.start).toISOString().substring(11,16);
              return <option key={s.start} value={time}>{time}</option>;
            })}
          </select>
        </div>
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
            {t(tiposConsulta.find((t) => t.value === formData.tipoConsulta)!.priceKey as any)}
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
    </div>
  );
};

export default AgendarConsultaPage;
