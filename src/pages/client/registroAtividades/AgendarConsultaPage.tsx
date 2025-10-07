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
  Star,
  Heart,
  Shield,
  Video
} from "lucide-react";

// Componente para slots disponíveis
interface AvailableSlotsProps {
  date: string;
  selectedTime: string;
  onTimeSelect: (time: string) => void;
}

const AvailableSlots: React.FC<AvailableSlotsProps> = ({ date, selectedTime, onTimeSelect }) => {
  const [slots, setSlots] = useState<Array<{ start: string; end: string; taken: boolean }>>([]);
  const [loading, setLoading] = useState(false);
  const { authenticatedFetch } = useAuth();

  React.useEffect(() => {
    if (!date) return;
    
    const loadSlots = async () => {
      setLoading(true);
      try {
        const response = await authenticatedFetch(`/consultations/available?from=${date}&to=${date}`);
        const data = await response.json();
        
        if (data.days && data.days[0]) {
          setSlots(data.days[0].slots || []);
        } else {
          setSlots([]);
        }
      } catch (error) {
        console.error('Erro ao carregar slots:', error);
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    loadSlots();
  }, [date, authenticatedFetch]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <Clock size={24} className="mx-auto mb-2" />
        <p>Nenhum horário disponível para esta data</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot, index) => {
        const timeString = slot.start.split('T')[1].substring(0, 5);
        const isSelected = selectedTime === timeString;
        const isAvailable = !slot.taken;
        
        return (
          <button
            key={index}
            type="button"
            disabled={!isAvailable}
            onClick={() => isAvailable && onTimeSelect(timeString)}
            className={`p-3 rounded-lg border text-sm font-medium transition-all ${
              isSelected
                ? 'border-blue-500 bg-blue-500 text-white'
                : isAvailable
                ? 'border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {timeString}
          </button>
        );
      })}
    </div>
  );
};

const AgendarConsultaPage: React.FC = () => {
  const { push } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tipoConsulta: "avaliacao_completa" as TipoConsulta,
    data: "",
    horario: "",
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
  const [showCreditModal, setShowCreditModal] = useState(false);

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
  const { items: consultationHistory } = useConsultations();
  
  // Verificar elegibilidade para reavaliação
  const canUseReavaliacao = useMemo(() => {
    if (!consultationHistory || consultationHistory.length === 0) return false;
    
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    
    // Verificar qualquer consulta nos últimos 12 meses
    const hasRecentConsultation = consultationHistory.some(consultation => {
      const consultationDate = new Date(consultation.scheduled_at);
      return consultationDate >= twelveMonthsAgo && consultation.status === 'completed';
    });
    
    // Verificar reavaliação nos últimos 6 meses
    const hasRecentReavaliacao = consultationHistory.some(consultation => {
      const consultationDate = new Date(consultation.scheduled_at);
      return consultation.type === 'reavaliacao' && consultationDate >= sixMonthsAgo && consultation.status === 'completed';
    });
    
    return hasRecentConsultation || hasRecentReavaliacao;
  }, [consultationHistory]);
  
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
      // Verificar se usuário tem créditos antes de avançar
      const needsCredit = formData.tipoConsulta === 'avaliacao_completa' || formData.tipoConsulta === 'reavaliacao';
      const availableCredits = creditsSummary?.summary?.[formData.tipoConsulta]?.available || 0;
      
      if (needsCredit && availableCredits <= 0) {
        setShowCreditModal(true);
        return;
      }
      
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
      
      await create({ scheduledAt: dataIso, type: formData.tipoConsulta });
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
            const isReavaliacao = tipo.value === 'reavaliacao';
            const isEligible = !isReavaliacao || canUseReavaliacao;
            const isDisabled = !isEligible;

            return (
              <Card 
                key={tipo.value}
                className={`p-5 border-2 transition-all duration-300 ${
                  isDisabled 
                    ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed" 
                    : `cursor-pointer hover:shadow-lg ${
                        formData.tipoConsulta === tipo.value
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-gray-200 hover:border-blue-300"
                      }`
                }`}
                onClick={() => {
                  if (!isDisabled) {
                    setFormData((prev) => ({ ...prev, tipoConsulta: tipo.value }));
                  }
                }}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${tipo.color} rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isDisabled ? 'opacity-50' : ''
                  }`}>
                    <TipoIcon size={24} className="text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className={`font-bold text-lg ${isDisabled ? 'text-gray-400' : 'text-gray-900'}`}>
                          {t(tipo.labelKey)}
                        </h3>
                        <p className={`text-sm mt-1 ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
                          {t(tipo.descKey)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${isDisabled ? 'text-gray-400' : 'text-green-600'}`}>
                          {priceMap[tipo.value] || t(tipo.priceKey)}
                        </div>
                        <div className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
                          {t(tipo.durationKey)}
                        </div>
                      </div>
                    </div>

                    {/* Aviso de não elegibilidade para reavaliação */}
                    {isReavaliacao && !isEligible && (
                      <div className="flex items-center gap-2 mt-3 p-2 rounded-lg text-sm bg-yellow-50 text-yellow-700 border border-yellow-200">
                        <AlertCircle size={16} />
                        <span>Não elegível - {t('consultations.credits.reavaliacao.rule')}</span>
                      </div>
                    )}

                    {/* Status de Créditos */}
                    {needsCredit && isEligible && (
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
                    {tipo.value === 'reavaliacao' && isEligible && (
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

        {/* Seleção de Data e Horário */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" />
              Selecione Data e Horário
            </div>
          </label>
          
          {/* Seletor de Data */}
          <div className="mb-4">
            <input
              type="date"
              value={formData.data}
              onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value, horario: '' }))}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Seletor de Horário */}
          {formData.data && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Horários disponíveis para {new Date(formData.data).toLocaleDateString('pt-BR')}
              </label>
              <AvailableSlots 
                date={formData.data}
                selectedTime={formData.horario}
                onTimeSelect={(time) => setFormData(prev => ({ ...prev, horario: time }))}
              />
            </div>
          )}
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
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-700"
                    disabled={etapa === 2 && (!formData.data || !formData.horario)}
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

      {/* Credits Purchase Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Créditos Insuficientes</h3>
              <p className="text-gray-600">
                Você precisa de créditos para agendar uma {formData.tipoConsulta === 'avaliacao_completa' ? 'avaliação completa' : 'reavaliação'}.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => purchaseCredit('avaliacao_completa')}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600"
              >
                <CreditCard size={16} />
                Comprar Avaliação Completa
              </Button>
              
              {canUseReavaliacao && (
                <Button
                  onClick={() => purchaseCredit('reavaliacao')}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600"
                >
                  <CreditCard size={16} />
                  Comprar Reavaliação
                </Button>
              )}
            </div>

            <div className="mt-6 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => setShowCreditModal(false)}
                className="w-full"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgendarConsultaPage;