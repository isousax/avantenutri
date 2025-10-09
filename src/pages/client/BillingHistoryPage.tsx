import { useCallback, useState } from "react";
import { useI18n } from "../../i18n";
import { SEO } from "../../components/comum/SEO";
import { ArrowLeft, Calendar } from "../../components/icons";
import {
  RefreshCw,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Download,
  Eye,
  Hash,
} from "lucide-react";
import StatusPill, { getStatusTone } from "../../components/ui/StatusPill";
import Card from "../../components/ui/Card";
import { SkeletonCard } from "../../components/ui/Loading";
import DataSection from "../../components/ui/DataSection";
import { shouldShowSkeleton } from "../../utils/loadingHelpers";
import Button from "../../components/ui/Button";
import { useNavigate } from "react-router-dom";
import { useBillingHistory } from "../../hooks/useBillingHistory";
import { useDownloadReceipt } from "../../hooks/useDownloadReceipt";
import { PaymentDetailsModal } from "../../components/billing/PaymentDetailsModal";

export default function BillingHistoryPage() {
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const { payments, loading, error, refetch, isFetching } = useBillingHistory();
  const { downloadReceipt } = useDownloadReceipt();
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const load = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleViewDetails = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setIsModalOpen(true);
  };

  const handleDownloadReceipt = (paymentId: string) => {
    downloadReceipt(paymentId);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPaymentId(null);
  };

  function fmtCurrency(cents: number) {
    return new Intl.NumberFormat(locale === "pt" ? "pt-BR" : "en-US", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  }

  function getStatusConfig(status: string) {
    switch (status.toLowerCase()) {
      case "approved":
      case "completed":
      case "paid":
        return {
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          icon: CheckCircle,
          label: "Pago",
        };
      case "pending":
      case "processing":
        return {
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          icon: Clock,
          label: "Pendente",
        };
      case "failed":
      case "cancelled":
      case "declined":
        return {
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          icon: XCircle,
          label: "Falhou",
        };
      default:
        return {
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          icon: AlertTriangle,
          label: status,
        };
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString(
      locale === "pt" ? "pt-BR" : "en-US",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 safe-area-bottom">
      <SEO
        title={t("billing.history.seo.title")}
        description={t("billing.history.seo.desc")}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-lg bg-white/95">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 active:scale-95"
              aria-label="Voltar"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>

            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                {t("billing.history.title")}
              </h1>
            </div>

            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <CreditCard size={20} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Ações */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={16} />
            <span>Histórico de pagamentos</span>
          </div>

          <Button
            onClick={load}
            variant="secondary"
            className="flex items-center gap-2"
            disabled={loading || isFetching}
            noBorder
            noFocus
            noBackground
          >
            <RefreshCw
              size={16}
              className={(loading || isFetching) ? "animate-spin" : ""}
            />
          </Button>
        </div>

        {/* Lista de Pagamentos - CARDS OTIMIZADOS PARA MOBILE */}
        <DataSection
          isLoading={shouldShowSkeleton(loading, payments)}
          error={error ? error : null}
          skeletonLines={4}
          skeletonClassName="h-32"
          customSkeleton={
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} lines={4} className="h-32" />
              ))}
            </div>
          }
        >
          {error && !loading && (
            <Card className="p-6 border-l-4 border-red-500 bg-red-50">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={20}
                  className="text-red-500 mt-0.5 flex-shrink-0"
                />
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">
                    Erro ao carregar
                  </h3>
                  <p className="text-red-700 text-sm">{String(error)}</p>
                  <Button
                    onClick={load}
                    variant="secondary"
                    className="mt-3 flex items-center gap-2"
                    disabled={loading || isFetching}
                  >
                    <RefreshCw size={14} className={(loading || isFetching) ? "animate-spin" : ""} />
                    Tentar novamente
                  </Button>
                </div>
              </div>
            </Card>
          )}
          {!loading && !error && (
            <>
              {isFetching ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonCard key={i} lines={2} className="h-24" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                {payments.length === 0 ? (
                <Card className="p-6 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      <CreditCard size={20} className="text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {t("billing.history.empty.payments")}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Nenhum pagamento encontrado no seu histórico
                      </p>
                    </div>
                  </div>
                </Card>
              ) : (
                payments.map((payment) => {
                  const statusConfig = getStatusConfig(payment.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <Card
                      key={payment.id}
                      className={`p-4 border-l-4 ${statusConfig.borderColor} hover:shadow-md transition-all duration-200`}
                    >
                      {/* Header Compacto */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className={`w-10 h-10 ${statusConfig.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}
                          >
                            <StatusIcon
                              size={16}
                              className={statusConfig.color}
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 text-sm truncate">
                                {payment.consultation_type
                                  ? payment.consultation_type ===
                                    "avaliacao_completa"
                                    ? "Avaliação Completa"
                                    : payment.consultation_type ===
                                      "reavaliacao"
                                    ? "Reavaliação"
                                    : payment.consultation_type
                                  : payment.purpose === "consultation"
                                  ? "Consulta"
                                  : "Pagamento"}
                              </h3>
                              <StatusPill
                                label={statusConfig.label}
                                tone={getStatusTone(statusConfig.label)}
                              />
                            </div>
                            
                            <div className="text-lg font-bold text-gray-900">
                              {fmtCurrency(payment.amount_cents)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Metadados */}
                      <div className="flex flex-col gap-2 mb-3">
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Hash size={12} />
                            <span className="font-mono truncate">
                              {payment.id.slice(0, 8)}...
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span className="truncate">
                              {formatDate(payment.created_at)}
                            </span>
                          </div>
                        </div>

                        {payment.external_id && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <CreditCard size={12} />
                            <span className="truncate">
                              ID: {payment.external_id}
                            </span>
                          </div>
                        )}

                        {payment.status_detail && (
                          <div className="text-xs text-gray-500">
                            {payment.status_detail}
                          </div>
                        )}
                      </div>

                      {/* Footer com Ações */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-500 capitalize">
                          {payment.currency}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Ver detalhes"
                            onClick={() => handleViewDetails(payment.id)}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Baixar recibo"
                            onClick={() => handleDownloadReceipt(payment.id)}
                            disabled={
                              !["approved", "completed", "paid"].includes(
                                payment.status.toLowerCase()
                              )
                            }
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Data de processamento */}
                      {payment.processed_at && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <CheckCircle size={12} />
                            <span>
                              Processado: {formatDate(payment.processed_at)}
                            </span>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })
                )}
                </div>
              )}
            </>
          )}
        </DataSection>

        {/* Informações de Ajuda */}
        <Card className="mt-6 p-4 bg-gray-50 border-0">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={16}
              className="text-gray-500 mt-0.5 flex-shrink-0"
            />
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-2">
                Precisa de ajuda com um pagamento?
              </h4>
              <p className="text-gray-600 text-xs mb-3">
                Em caso de problemas com pagamentos, entre em contato com nosso
                suporte.
              </p>
              <Button variant="secondary">
                Entrar em contato
              </Button>
            </div>
          </div>
        </Card>

        {/* Modal de Detalhes */}
        <PaymentDetailsModal
          paymentId={selectedPaymentId}
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      </div>
    </div>
  );
}