import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { useConsultations } from "../../hooks/useConsultations";
import { useI18n, formatDate } from "../../i18n";
import React from "react";

const Consultas: React.FC = () => {
  const navigate = useNavigate();
  const { items, loading, error, list, cancel } = useConsultations();
  const [cancelingId, setCancelingId] = React.useState<string | null>(null);
  const { locale, t } = useI18n();
  const upcoming = React.useMemo(() =>
    items
      .filter(c => c.status === 'scheduled')
      .sort((a,b)=> a.scheduled_at.localeCompare(b.scheduled_at))
      .slice(0,5)
  ,[items]);

  const handleCancel = async (id: string) => {
    if (cancelingId) return; // avoid double
    if (!window.confirm(t('consultations.cancel.confirm'))) return;
    setCancelingId(id);
    try {
      await cancel(id);
    } catch (e:any) {
      alert(e.message || t('consultations.cancel.error'));
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('consultations.title')}</h2>
        <Button onClick={() => navigate('/agendar-consulta')}>{t('consultations.schedule')}</Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('consultations.upcoming')}</h3>
          <button onClick={()=>list()} className="text-xs text-green-600 hover:underline">{t('consultations.refresh')}</button>
        </div>
        {loading && <p className="text-sm text-gray-500">{t('consultations.loading')}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && upcoming.length === 0 && (
          <p className="text-sm text-gray-500">{t('consultations.none')}</p>
        )}
        <ul className="space-y-3">
          {upcoming.map(c => (
            <li key={c.id} className="border rounded p-3 flex items-center justify-between">
              <div className="text-sm">
                <p className="font-medium text-gray-800">{formatDate(c.scheduled_at, locale, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                <p className="text-xs text-gray-500 capitalize">{c.type} • {c.duration_min}min</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded bg-${c.status === 'scheduled' ? 'green' : c.status === 'canceled' ? 'red' : 'gray'}-100 text-${c.status === 'scheduled' ? 'green' : c.status === 'canceled' ? 'red' : 'gray'}-700`}>
                  {c.status === 'scheduled' && t('consultations.status.scheduled')}
                  {c.status === 'canceled' && t('consultations.status.canceled')}
                  {c.status === 'completed' && t('consultations.status.completed')}
                </span>
                {c.status === 'scheduled' && (
                  <button disabled={cancelingId===c.id} onClick={()=>handleCancel(c.id)} className="text-xs text-red-600 hover:underline disabled:opacity-50">
                    {cancelingId===c.id ? t('consultations.canceling') : t('consultations.cancel.action')}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        {items.filter(c=> c.status !== 'scheduled').length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-700">{t('consultations.history')}</summary>
            <ul className="mt-2 space-y-2">
              {items.filter(c=> c.status !== 'scheduled').slice(0,10).map(c => (
                <li key={c.id} className="text-xs text-gray-600 flex justify-between border p-2 rounded">
                  <span>{formatDate(c.scheduled_at, locale, { dateStyle: 'short', timeStyle: 'short'})}</span>
                  <span className="uppercase text-[10px] tracking-wide">
                    {c.status === 'scheduled' && t('consultations.status.scheduled')}
                    {c.status === 'canceled' && t('consultations.status.canceled')}
                    {c.status === 'completed' && t('consultations.status.completed')}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </Card>
    </div>
  );
};
export default Consultas;
