import React, { useState, useEffect } from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { SEO } from '../../../components/comum/SEO';
import { useWeightLogs } from '../../../hooks/useWeightLogs';
import Sparkline from '../../../components/ui/Sparkline';
import { usePermissions } from '../../../hooks/usePermissions';
import { CAPABILITIES } from '../../../types/capabilities';
import { useI18n, formatNumber, formatDate } from '../../../i18n';

const PesoRegistroPage: React.FC = () => {
  const { latest, upsert, logs, diff_kg, diff_percent, series, goal, setGoal, patch } = useWeightLogs(90);
  const { t, locale } = useI18n();
  const { can } = usePermissions();
  const canLog = can(CAPABILITIES.PESO_LOG);
  const [weight, setWeight] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(()=> { if (latest && !weight) setWeight(latest.weight_kg.toString()); }, [latest, weight]);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(goal!=null?goal.toString():'');
  useEffect(()=> { setGoalInput(goal!=null?goal.toString():''); }, [goal]);
  const saveGoal = async ()=> { const v=parseFloat(goalInput.replace(',','.')); if(isFinite(v)&&v>0){ await setGoal(v); setEditingGoal(false);} };
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const startEdit = (date:string, w:number) => { setEditingDate(date); setEditWeight(w.toString()); };
  const saveEdit = async ()=> { if(!editingDate) return; const v=parseFloat(editWeight.replace(',','.')); if(!isFinite(v)||v<=0) return; await patch(editingDate,{ weight_kg: v }); setEditingDate(null); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canLog) return;
    const w = parseFloat(weight.replace(',','.'));
  if (!isFinite(w) || w <= 0) { setError(t('weight.invalid')); return; }
    setError(null); setSaving(true);
    try {
      await upsert(w, note || undefined);
  } catch (e:any) { setError(e.message || t('common.error')); }
    finally { setSaving(false); }
  };

  return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-8 px-4">
          <SEO title={t('weight.log.seo.title')} description={t('weight.log.seo.desc')} />
          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="p-6">
              <h1 className="text-2xl font-bold mb-4 text-slate-800">{t('weight.log.title')}</h1>
              {!canLog && <p className="text-sm text-red-600">{t('common.noPermission.weight')}</p>}
              {canLog && (
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('weight.form.weight')}</label>
                    <input value={weight} onChange={e=> setWeight(e.target.value)} type="text" inputMode="decimal" placeholder="Ex: 72.4" className="w-full border rounded px-3 py-2 text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('weight.form.note')}</label>
                    <textarea value={note} onChange={e=> setNote(e.target.value)} maxLength={300} className="w-full border rounded px-3 py-2 text-sm h-24" placeholder="Jejum, pós treino, etc" />
                    <div className="text-xs text-slate-500 text-right">{note.length}/300</div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">{t('weight.goal.label')}</span>
                      {!editingGoal && <button type="button" onClick={()=> setEditingGoal(true)} className="text-xs text-blue-600 hover:underline">{goal!=null?`${t('common.goal')}: ${formatNumber(+goal.toFixed(1), locale)} kg`:t('weight.goal.set')}</button>}
                    </div>
                    {editingGoal && (
                      <div className="flex items-center gap-2 text-xs">
                        <input value={goalInput} onChange={e=> setGoalInput(e.target.value)} placeholder="Ex: 70" className="w-24 border rounded px-2 py-1" />
                        <Button type="button" disabled={!goalInput} onClick={saveGoal} className="!px-2 !py-1 text-xs">{t('common.save')}</Button>
                        <button type="button" onClick={()=> { setEditingGoal(false); setGoalInput(goal!=null?goal.toString():''); }} className="text-red-500">{t('common.cancel')}</button>
                      </div>
                    )}
                    {goal!=null && !editingGoal && latest && (
                      <p className="text-xs text-slate-500 mt-1">{t('weight.goal.currentDiff')}: {(latest.weight_kg-goal>=0?'+':'')+formatNumber(+ (latest.weight_kg-goal).toFixed(1), locale)} kg</p>
                    )}
                  </div>
                  <div aria-live="polite">{error && <p className="text-sm text-red-600">{error}</p>}</div>
                  <Button disabled={saving} className="w-full">{saving ? t('common.saving') : t('weight.save.today')}</Button>
                  {latest && (
                    <p className="text-xs text-slate-500 mt-2">{t('weight.last')}: {formatNumber(+latest.weight_kg.toFixed(1), locale)} kg {t('common.date')} {formatDate((latest as any).date || (latest as any).log_date, locale)}</p>
                  )}
                </form>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center justify-between">{t('weight.history')} <span className="text-xs font-normal text-slate-500">{logs.length} {t('weight.records')}</span></h2>
              <div className="mb-4">
                <Sparkline data={series.slice(-60)} height={40} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-600 border-b">
                      <th className="py-2">{t('common.date')}</th>
                      <th className="py-2">{t('weight.form.weight')}</th>
                      <th className="py-2">{t('common.note')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(l => (
                      <tr key={l.id || l.log_date} className="border-b last:border-none">
                        <td className="py-1">{formatDate(l.log_date, locale)}</td>
                        <td className="py-1 font-medium">
                          {editingDate===l.log_date ? (
                            <span className="flex items-center gap-2">
                              <input value={editWeight} onChange={e=> setEditWeight(e.target.value)} className="w-20 border rounded px-2 py-0.5 text-sm" />
                              <button type="button" onClick={saveEdit} className="text-xs text-green-600">{t('common.confirm')}</button>
                              <button type="button" onClick={()=> setEditingDate(null)} className="text-xs text-red-500">{t('common.cancel')}</button>
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              {formatNumber(+l.weight_kg.toFixed(2), locale)}
                              <button type="button" onClick={()=> startEdit(l.log_date, l.weight_kg)} className="text-[10px] text-blue-600 underline">{t('common.edit')}</button>
                            </span>
                          )}
                        </td>
                        <td className="py-1 max-w-xs truncate" title={l.note || ''}>{l.note || t('common.none')}</td>
                      </tr>
                    ))}
                    {!logs.length && <tr><td colSpan={3} className="py-4 text-center text-slate-500">{t('common.noData')}</td></tr>}
                  </tbody>
                </table>
              </div>
              {diff_kg != null && diff_percent != null && latest && (
                <div className="mt-4 text-sm text-slate-600">Δ {formatNumber(+diff_kg.toFixed(2), locale)} kg ({formatNumber(+diff_percent.toFixed(2), locale)}%)</div>
              )}
            </Card>
          </div>
        </div>
  );
};

export default PesoRegistroPage;