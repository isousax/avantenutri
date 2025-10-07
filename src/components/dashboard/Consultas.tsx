import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { useConsultations } from "../../hooks/useConsultations";
import { useI18n, formatDate } from "../../i18n";
import React from "react";
import StatusPill, { getStatusTone } from "../ui/StatusPill";
import { useConsultationCreditsSummary } from "../../hooks/useConsultationCredits";
import { useToast } from "../ui/ToastProvider";

const Consultas: React.FC = () => {
  const navigate = useNavigate();
  const { items, loading, error, list, cancel } = useConsultations();
  const [cancelingId, setCancelingId] = React.useState<string | null>(null);
  const { locale, t } = useI18n();
  const { data: creditsSummaryData } = useConsultationCreditsSummary();
  const summary = creditsSummaryData?.summary || {};
  const { push } = useToast();
  
  const upcoming = React.useMemo(() =>
    items
      .filter(c => c.status === 'scheduled')
      .sort((a,b) => a.scheduled_at.localeCompare(b.scheduled_at))
      .slice(0,5)
  ,[items]);

  const history = React.useMemo(() =>
    items
      .filter(c => c.status !== 'scheduled')
      .sort((a,b) => b.scheduled_at.localeCompare(a.scheduled_at))
      .slice(0,10)
  ,[items]);

  const handleCancel = async (id: string) => {
    if (cancelingId) return;
    if (!window.confirm(t('consultations.cancel.confirm'))) return;
    setCancelingId(id);
    try {
      await cancel(id);
      push({ type: 'success', message: t('consultations.cancel.action') });
    } catch (e: any) {
      push({ type: 'error', message: e.message || t('consultations.cancel.error') });
    } finally {
      setCancelingId(null);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'scheduled':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: '🟢',
          text: t('consultations.status.scheduled')
        };
      case 'canceled':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: '🔴', 
          text: t('consultations.status.canceled')
        };
      case 'completed':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: '🔵',
          text: t('consultations.status.completed')
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '⚪',
          text: status
        };
    }
  };

  function handleSchedule() {
    // If no credit for any paid type and user tries to schedule, send them anyway (they can pick type first)
    navigate('/agendar-consulta');
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-green-50 text-green-700 border border-green-200">
              Avaliação: {summary.avaliacao_completa?.available || 0}
            </span>
            <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Reavaliação: {summary.reavaliacao?.available || 0}
            </span>
          </div>
          <Button 
            onClick={handleSchedule}
            className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-0 text-white shadow-lg shadow-blue-500/25"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {t('consultations.schedule')}
          </Button>
        </div>
      </div>

      {/* Próximas Consultas */}
      <Card className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t('consultations.upcoming')}</h2>
              <p className="text-sm text-gray-600">Suas consultas agendadas</p>
            </div>
          </div>
          <button 
            onClick={() => list()}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium p-2 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('consultations.refresh')}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <svg className="w-8 h-8 text-blue-500 animate-spin mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm text-gray-500">{t('consultations.loading')}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && upcoming.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('consultations.none')}</h3>
            <p className="text-gray-600 text-sm mb-4">Não há consultas agendadas no momento</p>
            <Button 
              onClick={() => navigate('/agendar-consulta')}
              variant="secondary"
              className="border border-gray-300 hover:border-gray-400"
            >
              Agendar Primeira Consulta
            </Button>
          </div>
        )}

        {/* Consultas Agendadas */}
        {!loading && upcoming.length > 0 && (
          <div className="space-y-4">
            {upcoming.map(consultation => {
              const statusConfig = getStatusConfig(consultation.status);
              return (
                <div key={consultation.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📅</span>
                          <span className="font-semibold text-gray-900 text-sm">
                            {formatDate(consultation.scheduled_at, locale, { 
                              dateStyle: 'medium', 
                              timeStyle: 'short' 
                            })}
                          </span>
                        </div>
                        <StatusPill
                          label={statusConfig.text}
                          icon={<span>{statusConfig.icon}</span>}
                          tone={getStatusTone(statusConfig.text)}
                          subtle={consultation.status === 'scheduled'}
                        />
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1 capitalize">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          {consultation.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {consultation.duration_min} min
                        </span>
                      </div>
                    </div>
                    
                    {consultation.status === 'scheduled' && (
                      <div className="flex sm:flex-col gap-2 sm:gap-1">
                        <button
                          disabled={cancelingId === consultation.id}
                          onClick={() => handleCancel(consultation.id)}
                          className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {cancelingId === consultation.id ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {t('consultations.canceling')}
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              {t('consultations.cancel.action')}
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Histórico de Consultas */}
      {history.length > 0 && (
        <Card className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-100 rounded-xl">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t('consultations.history')}</h2>
              <p className="text-sm text-gray-600">Consultas anteriores</p>
            </div>
          </div>

          <div className="space-y-3">
            {history.map(consultation => {
              const statusConfig = getStatusConfig(consultation.status);
              return (
                <div key={consultation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm">
                        {formatDate(consultation.scheduled_at, locale, { 
                          dateStyle: 'short', 
                          timeStyle: 'short'
                        })}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                        {statusConfig.text}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 capitalize">
                      {consultation.type} • {consultation.duration_min}min
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Consultas;