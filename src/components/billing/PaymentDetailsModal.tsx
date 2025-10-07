import { X, Calendar, CreditCard, CheckCircle, Clock, Download } from 'lucide-react';
import { usePaymentDetails } from '../../hooks/usePaymentDetails';
import { useDownloadReceipt } from '../../hooks/useDownloadReceipt';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';

interface PaymentDetailsModalProps {
  paymentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentDetailsModal({ paymentId, isOpen, onClose }: PaymentDetailsModalProps) {
  const { paymentDetails, loading, error } = usePaymentDetails(paymentId);
  const { downloadReceipt } = useDownloadReceipt();

  if (!isOpen) return null;

  const handleDownloadReceipt = () => {
    if (paymentId) {
      downloadReceipt(paymentId);
    }
  };

  const canDownloadReceipt = paymentDetails && 
    ['approved', 'completed', 'paid'].includes(paymentDetails.status.toLowerCase());

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Detalhes do Pagamento</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}

          {error && (
            <Card className="p-4 border-l-4 border-red-500 bg-red-50">
              <p className="text-red-700">{error.message}</p>
            </Card>
          )}

          {paymentDetails && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    ['approved', 'completed', 'paid'].includes(paymentDetails.status.toLowerCase())
                      ? 'bg-green-50 text-green-600'
                      : ['pending', 'processing'].includes(paymentDetails.status.toLowerCase())
                      ? 'bg-yellow-50 text-yellow-600'
                      : 'bg-red-50 text-red-600'
                  }`}>
                    {['approved', 'completed', 'paid'].includes(paymentDetails.status.toLowerCase()) ? (
                      <CheckCircle size={24} />
                    ) : (
                      <Clock size={24} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{paymentDetails.status_description}</h3>
                    <p className="text-sm text-gray-600">{paymentDetails.formatted_date}</p>
                  </div>
                </div>
                
                {canDownloadReceipt && (
                  <Button 
                    onClick={handleDownloadReceipt}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <Download size={16} />
                    Baixar Recibo
                  </Button>
                )}
              </div>

              {/* Service Details */}
              <Card className="p-5 bg-gray-50">
                <h4 className="font-semibold text-gray-900 mb-3">Serviço</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-medium">{paymentDetails.service_description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor:</span>
                    <span className="font-bold text-green-600">{paymentDetails.formatted_amount}</span>
                  </div>
                </div>
              </Card>

              {/* Payment Details */}
              <Card className="p-5">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CreditCard size={18} />
                  Detalhes do Pagamento
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID do Pagamento:</span>
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {paymentDetails.id}
                    </span>
                  </div>
                  
                  {paymentDetails.payment_method && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Forma de Pagamento:</span>
                      <span>{paymentDetails.payment_method}</span>
                    </div>
                  )}

                  {paymentDetails.external_id && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID Externo:</span>
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {paymentDetails.external_id}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      ['approved', 'completed', 'paid'].includes(paymentDetails.status.toLowerCase())
                        ? 'bg-green-100 text-green-800'
                        : ['pending', 'processing'].includes(paymentDetails.status.toLowerCase())
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {paymentDetails.status.toUpperCase()}
                    </span>
                  </div>

                  {paymentDetails.status_detail && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Detalhes:</span>
                      <span className="text-sm">{paymentDetails.status_detail}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Timeline */}
              <Card className="p-5">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar size={18} />
                  Histórico
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">Pagamento criado em</span>
                    <span className="font-medium">
                      {new Date(paymentDetails.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  {paymentDetails.processed_at && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">Processado em</span>
                      <span className="font-medium">
                        {new Date(paymentDetails.processed_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <Button onClick={onClose} variant="secondary" className="w-full">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}