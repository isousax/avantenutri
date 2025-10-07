import React, { useMemo, useState } from "react";
import type { TranslationKey } from '../../../types/i18n';
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { SEO } from "../../../components/comum/SEO";
import { useI18n } from "../../../i18n";
import { useConsultationCreditsSummary } from "../../../hooks/useConsultationCredits";
import { useConsultationPricing } from "../../../hooks/useConsultationPricing";
import { useAuth } from "../../../contexts";
import { useConsultations } from "../../../hooks/useConsultations";
import { useToast } from "../../../components/ui/ToastProvider";
import { useQuestionnaireStatus } from "../../../hooks/useQuestionnaireStatus";
import { QuestionnaireConfirmModal } from "../../../components/dashboard/QuestionnaireConfirmModal";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Zap,
  Star,
  Heart,
  Shield,
  Video
} from "lucide-react";

const AgendarConsultaPage: React.FC = () => {
  const { push } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tipoConsulta: "avaliacao_completa" as TipoConsulta,
    data: "",
    horario: "",
    urgencia: "normal",
  });
  const { authenticatedFetch, user } = useAuth();
  const { create } = useConsultations();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { t } = useI18n();

  const [etapa, setEtapa] = useState(1);

  // Questionnaire modal state
  const { data: questionnaireStatus } = useQuestionnaireStatus();
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);

  function getErrorMessage(err: unknown) {
    if (!err) return '';
    if (typeof err === 'string') return err;
    if (typeof err === 'object' && err !== null && 'message' in err) return String((err as { message?: unknown }).message || '');
    return String(err);
  }

  // explicit union for consulta types
  type TipoConsulta = 'avaliacao_completa' | 'reavaliacao';

  const tiposConsulta: ReadonlyArray<{
    value: TipoConsulta;
    labelKey: TranslationKey;
    descKey: TranslationKey;
    durationKey: TranslationKey;
    priceKey: TranslationKey;
    icon: React.ComponentType<Record<string, unknown>>;
    color: string;
  }> = [
    {
      value: "avaliacao_completa",
      labelKey: 'consultations.schedule.type.avaliacao_completa.label',
      descKey: 'consultations.schedule.type.avaliacao_completa.desc',
      durationKey: 'consultations.schedule.type.avaliacao_completa.duration',
      priceKey: 'consultations.schedule.type.avaliacao_completa.price',
      icon: Star,
      color: "from-blue-500 to-cyan-500"
    },
    {
      value: "reavaliacao",
      labelKey: 'consultations.schedule.type.reavaliacao.label',
      descKey: 'consultations.schedule.type.reavaliacao.desc',
      durationKey: 'consultations.schedule.type.reavaliacao.duration',
      priceKey: 'consultations.schedule.type.reavaliacao.price',
      icon: Heart,
      color: "from-purple-500 to-pink-500"
    },
  ];

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

    await processBooking();
  };

  const processBooking = async () => {
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      // Credit check
      if (formData.tipoConsulta === 'avaliacao_completa' || formData.tipoConsulta === 'reavaliacao') {
        const available = creditsSummary?.summary?.[formData.tipoConsulta]?.available || 0;
        if (available <= 0) {
          push({ type: 'error', message: t('consultations.credits.required.cta') });
          return;
        }
      }

      const { dataIso } = (() => {
        const date = formData.data;
        const time = formData.horario;
        const [h, m] = time.split(":").map(Number);
        if (!isNaN(h!) && !isNaN(m!)) {
          const local = new Date(date + "T" + time + ":00");
          return { dataIso: local.toISOString() };
        }
        return { dataIso: new Date(date + "T" + time + ":00Z").toISOString() };
      })();
      
      await create({ scheduledAt: dataIso, type: formData.tipoConsulta, urgency: formData.urgencia });
      push({ type: 'success', message: t('consultations.status.scheduled') });
      navigate("/dashboard");
    } catch (e: unknown) {
  const raw = getErrorMessage(e);
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
    setShowQuestionnaireModal(false);
    await processBooking();
  };

  const purchaseCredit = async (type: TipoConsulta) => {
    try {
      const data = await authenticatedFetch('/billing/intent', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ type, display_name: user?.display_name }) 
      }) as { checkout_url?: string; error?: string };
      
      if (!data?.checkout_url) {
        push({ type: 'error', message: data?.error || 'Falha ao iniciar pagamento'});
        return;
      }
      window.location.href = data.checkout_url;
    } catch (err: unknown) {
  const msg = getErrorMessage(err);
  push({ type: 'error', message: msg || 'Erro inesperado'});
    }
  };

  const renderEtapa1 = () => {
    
    return (
      <div className="space-y-6">
        {/* Header da Etapa */}
        <div className="text-center mb-2">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Calendar size={28} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Escolha o Tipo de Consulta</h2>
          <p className="text-gray-600">Selecione a consulta que melhor atende suas necessidades</p>
        </div>

        {/* Cards de Tipo de Consulta */}
        <div className="grid gap-4">
          {tiposConsulta.map((tipo) => {
            const TipoIcon = tipo.icon;
            const needsCredit = tipo.value === 'avaliacao_completa' || tipo.value === 'reavaliacao';
            const availableCredits = creditsSummary?.summary?.[tipo.value]?.available || 0;
            const hasCredits = needsCredit && availableCredits > 0;

            return (
              <Card 
                key={tipo.value}
                className={`p-5 border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  formData.tipoConsulta === tipo.value
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 hover:border-blue-300"
                }`}
                onClick={() => setFormData((prev) => ({ ...prev, tipoConsulta: tipo.value }))}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${tipo.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <TipoIcon size={24} className="text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">
                          {t(tipo.labelKey)}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">
                          {t(tipo.descKey)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {priceMap[tipo.value] || t(tipo.priceKey)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {t(tipo.durationKey)}
                        </div>
                      </div>
                    </div>

                    {/* Status de Créditos */}
                    {needsCredit && (
                      <div className={`flex items-center gap-2 mt-3 p-2 rounded-lg text-sm ${
                        hasCredits 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {hasCredits ? (
                          <>
                            <CheckCircle2 size={16} />
                            <span>{availableCredits} crédito(s) disponível(s)</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={16} />
                            <span>Créditos insuficientes</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Regra de Reavaliação */}
                    {tipo.value === 'reavaliacao' && (
                      <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border">
                        {t('consultations.credits.reavaliacao.rule')}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Botões de Compra de Créditos */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => purchaseCredit('avaliacao_completa')}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <CreditCard size={16} />
            Comprar Avaliação
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => purchaseCredit('reavaliacao')}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <CreditCard size={16} />
            Comprar Reavaliação
          </Button>
        </div>
      </div>
    );
  };

  const renderEtapa2 = () => {
    const selectedTipo = tiposConsulta.find(t => t.value === formData.tipoConsulta);
    const TipoIcon = selectedTipo?.icon || Star;

    return (
      <div className="space-y-6">
        {/* Header da Etapa */}
        <div className="text-center mb-2">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Clock size={28} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Detalhes do Agendamento</h2>
          <p className="text-gray-600">Complete as informações para finalizar seu agendamento</p>
        </div>

        {submitError && (
          <Card className="border-l-4 border-red-500 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-red-500" />
              <p className="text-red-700 text-sm">{submitError}</p>
            </div>
          </Card>
        )}

        {/* Resumo da Consulta Selecionada */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
          <div className="p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${selectedTipo?.color} rounded-xl flex items-center justify-center`}>
                <TipoIcon size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg">
                  {t(selectedTipo?.labelKey as TranslationKey)}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t(selectedTipo?.descKey as TranslationKey)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">
                  {priceMap[formData.tipoConsulta] || t(selectedTipo?.priceKey as TranslationKey)}
                </div>
                <div className="text-sm text-gray-500">
                  {t(selectedTipo?.durationKey as TranslationKey)}
                </div>
              </div>
            </div>

            {/* Status de Créditos */}
            {(formData.tipoConsulta === 'avaliacao_completa' || formData.tipoConsulta === 'reavaliacao') && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Créditos disponíveis:</span>
                </div>
                <span className={`font-bold ${
                  (creditsSummary?.summary?.[formData.tipoConsulta]?.available || 0) > 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {creditsSummary?.summary?.[formData.tipoConsulta]?.available || 0}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Nível de Urgência */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-orange-500" />
              Nível de Urgência
            </div>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "baixa", label: t('consultations.schedule.urgency.low'), color: "green", icon: Clock },
              { value: "normal", label: t('consultations.schedule.urgency.normal'), color: "blue", icon: Calendar },
              { value: "alta", label: t('consultations.schedule.urgency.high'), color: "red", icon: AlertCircle },
            ].map((nivel) => {
              const NivelIcon = nivel.icon;
              return (
                <button
                  key={nivel.value}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, urgencia: nivel.value }))}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    formData.urgencia === nivel.value
                      ? `border-${nivel.color}-500 bg-${nivel.color}-50 text-${nivel.color}-700`
                      : "border-gray-200 hover:border-gray-300 text-gray-600"
                  }`}
                >
                  <NivelIcon size={20} />
                  <span className="text-sm font-medium">{nivel.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Informações Adicionais */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-0">
          <div className="p-5">
            <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
              <Video size={18} />
              Informações da Consulta
            </h4>
            <div className="space-y-2 text-sm text-green-700">
              <div className="flex items-center gap-2">
                <Shield size={14} />
                <span>Consulta 100% online e segura</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span>Link de acesso enviado por email</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span>Reagendamento gratuito com 24h de antecedência</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 safe-area-bottom">
      <SEO
        title={t('consultations.schedule.seo.title')}
        description={t('consultations.schedule.seo.desc')}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 backdrop-blur-lg bg-white/95">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 active:scale-95"
              aria-label="Voltar"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">
                Agendar Consulta
              </h1>
              <p className="text-xs text-gray-500">
                Etapa {etapa} de 2 • {etapa === 1 ? 'Tipo de Consulta' : 'Detalhes'}
              </p>
            </div>

            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Calendar size={20} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        
        {/* Formulário Principal */}
        <Card className="p-6 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <form onSubmit={handleSubmit}>
            {etapa === 1 ? renderEtapa1() : renderEtapa2()}
            
            {/* Botões de Navegação */}
            <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
              {etapa === 2 ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEtapa(1)}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Agendando...
                      </div>
                    ) : (
                      'Confirmar Agendamento'
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate("/dashboard")}
                    className="flex-1 border-none hover:bg-transparent hover:border-none"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-700 cursor-not-allowed"
                  >
                    Continuar
                  </Button>
                </>
              )}
            </div>
          </form>
        </Card>

        {/* Informações de Suporte */}
        <Card className="mt-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-0">
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">Suporte e Informações</h3>
                <div className="space-y-2 text-xs text-blue-700">
                  <p>• Consultas 100% online</p>
                  <p>• Receba o link de acesso por email</p>
                  <p>• Reagendamento com 24h de antecedência</p>
                  <p>• Chegue 5 minutos antes</p>
                </div>
              </div>
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