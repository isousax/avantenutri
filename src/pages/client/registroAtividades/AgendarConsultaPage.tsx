import React, { useMemo, useState } from "react";
import type { TranslationKey } from "../../../types/i18n";
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
  Video,
} from "lucide-react";
import { API } from "../../../config/api";

// Componente para slots disponíveis
interface AvailableSlotsProps {
  date: string;
  selectedTime: string;
  onTimeSelect: (time: string) => void;
}

const AvailableSlots: React.FC<AvailableSlotsProps> = ({
  date,
  selectedTime,
  onTimeSelect,
}) => {
  const [slots, setSlots] = useState<
    Array<{ start: string; end: string; taken: boolean }>
  >([]);
  const [loading, setLoading] = useState(false);
  const { authenticatedFetch } = useAuth();

  React.useEffect(() => {
    if (!date) return;

    const loadSlots = async () => {
      setLoading(true);
      try {
        const response = await authenticatedFetch(
          `${API.CONSULTATION_AVAILABLE_SLOTS}?from=${date}&to=${date}`
        );
        const data = await response.json();

        if (data.days && data.days[0]) {
          setSlots(data.days[0].slots || []);
        } else {
          setSlots([]);
        }
      } catch (error) {
        console.error("Erro ao carregar slots:", error);
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
        const timeString = slot.start.split("T")[1].substring(0, 5);
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
                ? "border-blue-500 bg-blue-500 text-white"
                : isAvailable
                ? "border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
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
  const [purchaseLoading, setPurchaseLoading] = useState<null | TipoConsulta>(null);

  function getErrorMessage(err: unknown) {
    if (!err) return "";
    if (typeof err === "string") return err;
    if (typeof err === "object" && err !== null && "message" in err)
      return String((err as { message?: unknown }).message || "");
    return String(err);
  }

  // explicit union for consulta types
  type TipoConsulta = "avaliacao_completa" | "reavaliacao";

  const tiposConsulta: ReadonlyArray<{
    value: TipoConsulta;
    labelKey: TranslationKey;
    durationKey: TranslationKey;
    priceKey: TranslationKey;
    icon: React.ComponentType<Record<string, unknown>>;
    color: string;
  }> = [
    {
      value: "avaliacao_completa",
      labelKey: "consultations.schedule.type.avaliacao_completa.label",
      durationKey: "consultations.schedule.type.avaliacao_completa.duration",
      priceKey: "consultations.schedule.type.avaliacao_completa.price",
      icon: Star,
      color: "from-blue-500 to-cyan-500",
    },
    {
      value: "reavaliacao",
      labelKey: "consultations.schedule.type.reavaliacao.label",
      durationKey: "consultations.schedule.type.reavaliacao.duration",
      priceKey: "consultations.schedule.type.reavaliacao.price",
      icon: Heart,
      color: "from-purple-500 to-pink-500",
    },
  ];

  const { data: creditsSummary } = useConsultationCreditsSummary();
  const { data: pricingData } = useConsultationPricing();
  const { items: consultationHistory } = useConsultations();

  // Verificar elegibilidade para reavaliação
  const canUseReavaliacao = useMemo(() => {
    if (!consultationHistory || consultationHistory.length === 0) return false;

    const now = new Date();
    const twelveMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 12,
      now.getDate()
    );
    const sixMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 6,
      now.getDate()
    );

    // Verificar qualquer consulta nos últimos 12 meses
    const hasRecentConsultation = consultationHistory.some((consultation) => {
      const consultationDate = new Date(consultation.scheduled_at);
      return (
        consultationDate >= twelveMonthsAgo &&
        consultation.status === "completed"
      );
    });

    // Verificar reavaliação nos últimos 6 meses
    const hasRecentReavaliacao = consultationHistory.some((consultation) => {
      const consultationDate = new Date(consultation.scheduled_at);
      return (
        consultation.type === "reavaliacao" &&
        consultationDate >= sixMonthsAgo &&
        consultation.status === "completed"
      );
    });

    return hasRecentConsultation || hasRecentReavaliacao;
  }, [consultationHistory]);

  const priceMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (pricingData?.pricing) {
      for (const p of pricingData.pricing) {
        const formatter = new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: p.currency || "BRL",
        });
        map[p.type] = formatter.format(p.amount_cents / 100);
      }
    }
    return map;
  }, [pricingData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (etapa === 1) {
      // Verificar se tipo de consulta foi selecionado
      if (!formData.tipoConsulta) {
        push({
          type: "error",
          message: "Por favor, selecione um tipo de consulta.",
        });
        return;
      }

      // Verificar se usuário tem créditos antes de avançar
      const needsCredit =
        formData.tipoConsulta === "avaliacao_completa" ||
        formData.tipoConsulta === "reavaliacao";
      const availableCredits =
        creditsSummary?.summary?.[formData.tipoConsulta]?.available || 0;

      if (needsCredit && availableCredits <= 0) {
        setShowCreditModal(true);
        return;
      }

      setEtapa(2);
      return;
    }

    // Etapa 2 - verificar se data e horário foram selecionados
    if (!formData.data || !formData.horario) {
      push({
        type: "error",
        message: "Por favor, selecione uma data e horário para sua consulta.",
      });
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
      if (
        formData.tipoConsulta === "avaliacao_completa" ||
        formData.tipoConsulta === "reavaliacao"
      ) {
        const available =
          creditsSummary?.summary?.[formData.tipoConsulta]?.available || 0;
        if (available <= 0) {
          push({
            type: "error",
            message: t("consultations.credits.required.cta"),
          });
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
      push({ type: "success", message: t("consultations.status.scheduled") });
      navigate("/dashboard");
    } catch (e: unknown) {
      const raw = getErrorMessage(e);
      let mapped: string | null = null;
      if (raw.includes("slot_taken"))
        mapped = t("consultations.error.slotTaken");
      else if (raw.includes("blocked_slot"))
        mapped = t("consultations.error.blocked");
      else if (raw.includes("slot_not_available"))
        mapped = t("consultations.error.notAvailable");
      else if (raw.includes("questionnaire_required"))
        mapped =
          "É necessário completar o questionário antes de agendar uma consulta.";
      const finalMsg = mapped || t("consultations.schedule.error");
      setSubmitError(finalMsg);
      push({ type: "error", message: finalMsg });
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
      setPurchaseLoading(type);
      const res = await authenticatedFetch(API.BILLING_INTENT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, display_name: user?.display_name }),
      });
      const data: { ok?: boolean; checkout_url?: string; error?: string } = await res.json();
      console.log("Billing intent data:", data);
      if (!res.ok || !data?.checkout_url) {
        push({
          type: "error",
          message: data?.error || "Falha ao iniciar pagamento",
        });
        return;
      }
      window.location.href = data.checkout_url;
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      push({ type: "error", message: msg || "Erro inesperado" });
    } finally {
      setPurchaseLoading(null);
    }
  };

  const renderEtapa1 = () => {
    return (
      <div className="space-y-6 max-w-full">
        {/* Header da Etapa */}
        <div className="text-center mb-2">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Calendar size={28} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Escolha o Tipo de Consulta
          </h2>
        </div>

        {/* Cards de Tipo de Consulta */}
        <div className="grid gap-4">
          {tiposConsulta.map((tipo) => {
            const TipoIcon = tipo.icon;
            const needsCredit =
              tipo.value === "avaliacao_completa" ||
              tipo.value === "reavaliacao";
            const availableCredits =
              creditsSummary?.summary?.[tipo.value]?.available || 0;
            const hasCredits = needsCredit && availableCredits > 0;
            const isReavaliacao = tipo.value === "reavaliacao";
            const isEligible = !isReavaliacao || canUseReavaliacao;
            const isDisabled = !isEligible;

            const selected = formData.tipoConsulta === tipo.value;

            return (
              <Card
                key={tipo.value}
                // box-border garante borda+padding contidos no tamanho do elemento
                className={`box-border w-full p-5 border rounded-lg transition-all duration-200 overflow-hidden ${
                  isDisabled
                    ? "border-gray-200 bg-gray-50 opacity-70 cursor-not-allowed"
                    : `cursor-pointer ${
                        selected
                          ? "bg-blue-50 border-blue-300 shadow-sm ring-2 ring-blue-300"
                          : "border-gray-200 hover:shadow-sm hover:border-blue-300"
                      }`
                }`}
                onClick={() => {
                  if (!isDisabled) {
                    setFormData((prev) => ({
                      ...prev,
                      tipoConsulta: tipo.value,
                    }));
                  }
                }}
              >
                {/* Conteúdo principal: ícone + título/preço */}
                <div className="flex items-start gap-4">
                  {TipoIcon ? (
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${
                        tipo.color
                      } rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isDisabled ? "opacity-50" : ""
                      }`}
                    >
                      <TipoIcon size={26} className="text-white" />
                    </div>
                  ) : null}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2 gap-3">
                      <div className="min-w-0">
                        <h3
                          className={`font-bold sm:text-lg ${
                            isDisabled ? "text-gray-400" : "text-gray-900"
                          }`}
                          title={t(tipo.labelKey)}
                        >
                          {t(tipo.labelKey)}
                        </h3>
                      </div>

                      <div className="text-right flex-shrink-0 ml-2">
                        <div
                          className={`font-bold sm:text-lg ${
                            isDisabled ? "text-gray-400" : "text-green-600"
                          }`}
                        >
                          {priceMap[tipo.value] || t(tipo.priceKey)}
                        </div>
                        <div
                          className={`text-xs ${
                            isDisabled ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {t(tipo.durationKey)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BLOCOS DE AVISO (ocupam 100% da largura do card) */}
                <div className="mt-4 w-full">
                  {/* Aviso de não elegibilidade para reavaliação (linha inteira) */}
                  {isReavaliacao && !isEligible && (
                    <div className="flex items-start gap-3 p-3 rounded-lg text-[13px] sm:text-sm bg-yellow-50 text-yellow-800 border border-yellow-200">
                      <div className="mt-0.5">
                        <AlertCircle size={18} />
                      </div>
                      <div className="text-sm leading-tight">
                        <strong>Não elegível</strong>{" "}
                        <span className="text-yellow-800">
                          - {t("consultations.credits.reavaliacao.rule")}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Status de Créditos (linha inteira) */}
                  {needsCredit && isEligible && (
                    <div
                      className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
                        hasCredits
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      <div className="mt-0.5">
                        {hasCredits ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          <AlertCircle size={18} />
                        )}
                      </div>
                      <div className="leading-tight">
                        {hasCredits ? (
                          <span>
                            <strong>{availableCredits}</strong> crédito(s)
                            disponível(is)
                          </span>
                        ) : (
                          <span>Créditos insuficientes</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Regra de Reavaliação (quando elegível mostramos a regra em bloco separado) */}
                  {tipo.value === "reavaliacao" && isEligible && (
                    <div className="mt-3 text-sm text-gray-500 bg-gray-50 p-3 rounded border">
                      {t("consultations.credits.reavaliacao.rule")}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderEtapa2 = () => {
    const selectedTipo = tiposConsulta.find(
      (t) => t.value === formData.tipoConsulta
    );
    const TipoIcon = selectedTipo?.icon || Star;

    return (
      <div className="space-y-6">
        {/* Header da Etapa */}
        <div className="text-center mb-2">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Clock size={28} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Detalhes do Agendamento
          </h2>
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
        <Card className="p-5 bg-gradient-to-r from-blue-50 to-purple-50 border-0">
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${selectedTipo?.color} rounded-xl flex items-center justify-center flex-shrink-0`}
            >
              <TipoIcon size={26} className="text-white" />
            </div>
            <div className="flex-1 min-w-0  ">
              <h3 className="font-bold text-gray-900 sm:text-lg">
                {t(selectedTipo?.labelKey as TranslationKey)}
              </h3>
            </div>
          </div>

          {/* Status de Créditos */}
          {(formData.tipoConsulta === "avaliacao_completa" ||
            formData.tipoConsulta === "reavaliacao") && (
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-blue-500" />
                <span className="text-sm font-medium text-gray-700">
                  Créditos disponíveis:
                </span>
              </div>
              <span
                className={`font-bold ${
                  (creditsSummary?.summary?.[formData.tipoConsulta]
                    ?.available || 0) > 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {creditsSummary?.summary?.[formData.tipoConsulta]?.available ||
                  0}
              </span>
            </div>
          )}
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
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  data: e.target.value,
                  horario: "",
                }))
              }
              min={new Date().toISOString().split("T")[0]}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Seletor de Horário */}
          {formData.data && (
            <div>
              <AvailableSlots
                date={formData.data}
                selectedTime={formData.horario}
                onTimeSelect={(time) =>
                  setFormData((prev) => ({ ...prev, horario: time }))
                }
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
            <div className="space-y-2 text-xs text-green-700">
              <div className="flex items-center gap-2">
                <Shield size={14} />
                <span>Consulta 100% online</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span>Link enviado por e-mail</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span>Reagendamento com 48h de antecedência</span>
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
        title={t("consultations.schedule.seo.title")}
        description={t("consultations.schedule.seo.desc")}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 backdrop-blur-lg bg-white/95">
        <div className="max-w-4xl mx-auto px-4 py-3">
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
              <p className="text-xs text-gray-500">Etapa {etapa} de 2</p>
            </div>

            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Calendar size={20} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Formulário Principal */}
        <Card className="p-6 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <form onSubmit={handleSubmit}>
            {etapa === 1 ? renderEtapa1() : renderEtapa2()}

            {/* Botões de Navegação */}
            <div className="flex flex-col items-center gap-3 pt-6 mt-6 border-t border-gray-200">
              {etapa === 2 ? (
                <>
                  <Button
                    type="submit"
                    noBackground
                    noBorder
                    noFocus
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-700 focus:outline-none"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Agendando...
                      </div>
                    ) : (
                      "Confirmar Agendamento"
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setEtapa(1)}
                    className="p-0 m-0 bg-transparent text-sm font-medium text-green-700 hover:text-green-900 hover:scale-105 focus:outline-none"
                  >
                    Voltar
                  </button>
                </>
              ) : (
                <>
                  <Button
                    type="submit"
                    noBackground
                    noBorder
                    noFocus
                    className="w-full text-white hover:text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-700"
                    disabled={
                      (etapa === 1 && !formData.tipoConsulta) ||
                      (etapa === 2 && (!formData.data || !formData.horario))
                    }
                  >
                    Continuar
                  </Button>
                </>
              )}
            </div>
          </form>
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Créditos Insuficientes
                </h3>
                <p className="text-gray-600">
                  Você precisa de créditos para agendar uma{" "}
                  {formData.tipoConsulta === "avaliacao_completa"
                    ? "avaliação completa"
                    : "reavaliação"}
                  .
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => purchaseCredit("avaliacao_completa")}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600"
                  noFocus
                  disabled={purchaseLoading !== null}
                >
                  {purchaseLoading === "avaliacao_completa" ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Iniciando checkout...
                    </div>
                  ) : (
                    <>
                      <CreditCard size={16} />
                      Comprar Avaliação Completa
                    </>
                  )}
                </Button>

                {canUseReavaliacao && (
                  <Button
                    onClick={() => purchaseCredit("reavaliacao")}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600"
                    noFocus
                    disabled={purchaseLoading !== null}
                  >
                    {purchaseLoading === "reavaliacao" ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Iniciando checkout...
                      </div>
                    ) : (
                      <>
                        <CreditCard size={16} />
                        Comprar Reavaliação
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="mt-6 pt-4 border-t">
                <Button
                  variant="secondary"
                  onClick={() => setShowCreditModal(false)}
                  className="w-full"
                  noBorder
                  noFocus
                  noBackground
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
