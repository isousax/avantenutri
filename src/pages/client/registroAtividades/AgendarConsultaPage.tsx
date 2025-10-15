import React, { useMemo, useState } from "react";
import type { TranslationKey } from "../../../types/i18n";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { SEO } from "../../../components/comum/SEO";
import { useI18n } from "../../../i18n";
import { useConsultationCreditsSummary } from "../../../hooks/useConsultationCredits";
import { useConsultationPricing } from "../../../hooks/useConsultationPricing";
import { useAuth as useAuthCtx } from "../../../contexts";
import { useConsultations } from "../../../hooks/useConsultations";
import { useToast } from "../../../components/ui/ToastProvider";
import { useQuestionnaireStatus } from "../../../hooks/useQuestionnaireStatus";
import { QuestionnaireConfirmModal } from "../../../components/dashboard/QuestionnaireConfirmModal";
import { useQuestionario } from "../../../contexts/useQuestionario";
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
  onTimeSelect: (time: string, slotIso: string, durationMin: number) => void;
}

const AvailableSlots: React.FC<AvailableSlotsProps> = ({
  date,
  selectedTime,
  onTimeSelect,
}) => {
  const [slots, setSlots] = useState<
    Array<{ start: string; end: string; taken: boolean; available?: boolean }>
  >([]);
  const [loading, setLoading] = useState(false);
  const { authenticatedFetch } = useAuthCtx();

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
            onClick={() => {
              if (!isAvailable) return;
              const dur = Math.max(1, Math.round((new Date(slot.end).getTime() - new Date(slot.start).getTime()) / 60000));
              onTimeSelect(timeString, slot.start, dur);
            }}
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
    horarioIso: "",
    durationMin: 40,
  });
  const { authenticatedFetch, user } = useAuthCtx();
  const { create } = useConsultations();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { t } = useI18n();

  const [etapa, setEtapa] = useState(1);

  // Questionnaire modal state
  const { data: questionnaireStatus, refetch: refetchQuestionnaireStatus } = useQuestionnaireStatus();
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [questionnaireReviewReady, setQuestionnaireReviewReady] = useState(false);
  // Removido modal de créditos; fluxo agora redireciona automaticamente
  // purchaseLoading removido (não é mais necessário com redirecionamento automático)
  const [redirectingCheckout, setRedirectingCheckout] = useState(false);

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
        // Sem créditos: iniciar checkout automaticamente e dar feedback mínimo
        setRedirectingCheckout(true);
        push({ type: "info", message: "Redirecionando para pagamento..." });
        await purchaseCredit(formData.tipoConsulta);
        setRedirectingCheckout(false);
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

    // Forçar refetch rápido do status para garantir estado atualizado
    try {
      await refetchQuestionnaireStatus();
    } catch {
      // Ignorar erros de refetch; seguimos com dados atuais
    }

    // Se não completo -> mostrar modal de exigência
    if (!questionnaireStatus?.is_complete) {
      setQuestionnaireReviewReady(false);
      setShowQuestionnaireModal(true);
      return;
    }

    // Se completo -> buscar dados completos antes de revisão
    const fetchedOk = await fetchFullQuestionnaire();
    if (!fetchedOk) {
      // fallback: permitir prosseguir mesmo sem dados (evita bloquear usuário)
  push({ type: "info", message: "Não foi possível carregar dados do questionário atualizado, prosseguindo." });
      await processBooking();
      return;
    }
    setQuestionnaireReviewReady(true);
    setShowQuestionnaireModal(true);
  };

  const processBooking = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Credit check: iniciar checkout automático se não houver créditos
      if (
        formData.tipoConsulta === "avaliacao_completa" ||
        formData.tipoConsulta === "reavaliacao"
      ) {
        const available =
          creditsSummary?.summary?.[formData.tipoConsulta]?.available || 0;
        if (available <= 0) {
          setRedirectingCheckout(true);
          push({ type: "info", message: "Redirecionando para pagamento..." });
          await purchaseCredit(formData.tipoConsulta);
          setRedirectingCheckout(false);
          return;
        }
      }

      const scheduledAtIso = formData.horarioIso && formData.horarioIso.length > 0
        ? formData.horarioIso
        : (() => {
            const date = formData.data;
            const time = formData.horario;
            const [h, m] = time.split(":").map(Number);
            if (!isNaN(h!) && !isNaN(m!)) {
              const local = new Date(date + "T" + time + ":00");
              return local.toISOString();
            }
            return new Date(date + "T" + time + ":00Z").toISOString();
          })();

  await create({ scheduledAt: scheduledAtIso, type: formData.tipoConsulta, durationMin: formData.durationMin });
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
    // Após revisão confirmada, segue fluxo normal
    await processBooking();
  };

  // Carregar dados completos do questionário (quando completo) antes de mostrar revisão
  const { updateQuestionario } = useQuestionario();
  const fetchFullQuestionnaire = async (): Promise<boolean> => {
    try {
      const r = await authenticatedFetch(API.QUESTIONNAIRE);
      if (!r.ok) return false;
      const raw = await r.json().catch(() => ({}));
      // Payload esperado: { ok, data: { category, answers, updated_at, submitted_at, step }, is_complete }
      const data = raw && raw.data ? raw.data : raw;
      const category = data.category as string | undefined;
      const answers = (data.answers as Record<string, string> | undefined) || {};
      const updatedAt = (data.updated_at as string | undefined) || (data.submitted_at as string | undefined) || undefined;
      // Persistimos no contexto local para modal mostrar conteúdo
      updateQuestionario({
        categoria: category || "",
        respostas: { ...answers, ...(updatedAt ? { updated_at: updatedAt } : {}) },
      });
      return true;
    } catch {
      return false;
    }
  };

  const purchaseCredit = async (type: TipoConsulta) => {
    try {
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
      // Caso não haja redirecionamento (erro), garantimos que o estado de redirecionamento seja liberado
      setRedirectingCheckout(false);
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
            const needsCredit = tipo.value === "avaliacao_completa" || tipo.value === "reavaliacao";
            const creditEntry = creditsSummary?.summary?.[tipo.value];
            const availableCredits = creditEntry?.available || 0;
            const lockedCredits = creditEntry?.locked || 0;
            const hasCredits = needsCredit && availableCredits > 0;
            const isReavaliacao = tipo.value === "reavaliacao";
            const hasLockedReavaliacao = isReavaliacao && lockedCredits > 0 && availableCredits === 0;
            // Elegível para seleção: NÃO permitir seleção se só possui locked (aguardar liberação)
            const isEligible = !isReavaliacao || canUseReavaliacao || hasCredits; // não inclui somente locked
            // Se há reavaliação bloqueada (reservada), não exibir 'Não elegível' banner
            const showNotEligibleBanner = isReavaliacao && !isEligible && !hasLockedReavaliacao;
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
                  if (hasLockedReavaliacao) return; // bloqueia seleção
                  if (!isDisabled) {
                    setFormData((prev) => ({ ...prev, tipoConsulta: tipo.value }));
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
                        {hasCredits || hasLockedReavaliacao ? (
                          <div className="font-semibold text-sm text-green-600">
                            {hasCredits && (
                              <span>
                                {availableCredits} crédito{availableCredits > 1 ? 's' : ''}
                              </span>
                            )}
                            {hasLockedReavaliacao && (
                              <span className="text-amber-600">Reservada</span>
                            )}
                          </div>
                        ) : (
                          <div
                            className={`font-bold sm:text-lg ${
                              isDisabled ? "text-gray-400" : "text-green-600"
                            }`}
                          >
                            {priceMap[tipo.value] || t(tipo.priceKey)}
                          </div>
                        )}
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
                  {showNotEligibleBanner && (
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

                  {/* Status de Créditos (mostrar somente quando houver créditos) */}
                  {needsCredit && isEligible && hasCredits && (
                    <div className="flex items-start gap-3 p-3 rounded-lg text-sm bg-green-50 text-green-700 border border-green-200">
                      <div className="mt-0.5">
                        <CheckCircle2 size={18} />
                      </div>
                      <div className="leading-tight">
                        <span>
                          <strong>{availableCredits}</strong> crédito(s)
                          disponível(is)
                        </span>
                      </div>
                    </div>
                  )}
                  {isReavaliacao && hasLockedReavaliacao && (
                    <div className="flex items-start gap-3 p-3 rounded-lg text-xs sm:text-sm bg-amber-50 text-amber-700 border border-amber-200" role="note" aria-label="Reavaliação reservada">
                      <div className="mt-0.5" aria-hidden="true">
                        <AlertCircle size={18} />
                      </div>
                      <div className="leading-tight">
                        <strong>Reavaliação reservada</strong><br />Será liberada após a sua Avaliação ser <span className="font-semibold">realizada</span>. Agende e participe da avaliação para habilitar.
                      </div>
                    </div>
                  )}

                  {/* Regra de Reavaliação (quando elegível mostramos a regra em bloco separado) */}
                  {tipo.value === "reavaliacao" && isEligible && !hasLockedReavaliacao && (
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
                onTimeSelect={(time, iso, duration) =>
                  setFormData((prev) => ({ ...prev, horario: time, horarioIso: iso, durationMin: duration }))
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
              Atendimento via WhatsApp
            </h4>
            <div className="space-y-2 text-xs text-green-700">
              <div className="flex items-center gap-2">
                <Shield size={14} />
                <span>Atendimento preferencialmente por WhatsApp (mensagens e/ou chamada de vídeo, se necessário)</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span>Você receberá instruções pelo WhatsApp próximo ao horário agendado</span>
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
                    disabled={submitting || redirectingCheckout}
                  >
                    {submitting || redirectingCheckout ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {redirectingCheckout ? "Redirecionando para pagamento..." : "Agendando..."}
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
                      redirectingCheckout ||
                      (etapa === 1 && !formData.tipoConsulta) ||
                      (etapa === 2 && (!formData.data || !formData.horario))
                    }
                  >
                    {redirectingCheckout ? "Redirecionando para pagamento..." : "Continuar"}
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
        isComplete={questionnaireStatus?.is_complete || false}
        hasQuestionnaireData={questionnaireReviewReady}
      />

      {/* Fluxo de compra de créditos: modal removido, redireciono automático */}
    </div>
  );
};

export default AgendarConsultaPage;
