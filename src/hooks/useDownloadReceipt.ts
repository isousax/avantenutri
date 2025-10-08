import { useCallback } from 'react';
import { useAuth } from '../contexts';
import { useToast } from '../components/ui/ToastProvider';
import { API } from '../config/api';

export function useDownloadReceipt() {
  const { authenticatedFetch } = useAuth();
  const { push } = useToast();

  const downloadReceipt = useCallback(async (paymentId: string) => {
    try {
      const response = await authenticatedFetch(API.billingPaymentReceipt(paymentId));
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao baixar recibo');
      }

      // Obter o conteúdo HTML
      const htmlContent = await response.text();
      
      // Criar blob e download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      
      // Criar link temporário para download
      const link = document.createElement('a');
      link.href = url;
      link.download = `recibo-${paymentId}.html`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      push({ 
        type: 'success', 
        message: 'Recibo baixado com sucesso!' 
      });
      
    } catch (error: any) {
      console.error('Error downloading receipt:', error);
      push({ 
        type: 'error', 
        message: error.message || 'Falha ao baixar recibo' 
      });
    }
  }, [authenticatedFetch, push]);

  return { downloadReceipt };
}