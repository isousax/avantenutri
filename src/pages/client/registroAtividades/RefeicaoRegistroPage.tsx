import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { SEO } from '../../../components/comum/SEO';
import { useMealLogs } from '../../../hooks/useMealLogs';
import MiniSparkline from '../../../components/ui/MiniSparkline';
import { usePermissions } from '../../../hooks/usePermissions';
import { CAPABILITIES } from '../../../types/capabilities';
import { useI18n, formatNumber, formatDate } from '../../../i18n';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

const mealTypes = ['breakfast','lunch','dinner','snack','other'] as const;

const RefeicaoRegistroPage: React.FC = () => {
  const navigate = useNavigate();
  const { create, logs, stats, days, goals, setGoals, progress, patch, remove } = useMealLogs(7);
  const { t, locale, setLocale } = useI18n();
  const [editingGoals, setEditingGoals] = useState(false);
  const [gCal, setGCal] = useState(goals.calories?.toString()||'');
  const [gProt, setGProt] = useState(goals.protein_g?.toString()||'');
  const [gCarb, setGCarb] = useState(goals.carbs_g?.toString()||'');
  const [gFat, setGFat] = useState(goals.fat_g?.toString()||'');
  React.useEffect(()=> { setGCal(goals.calories?.toString()||''); setGProt(goals.protein_g?.toString()||''); setGCarb(goals.carbs_g?.toString()||''); setGFat(goals.fat_g?.toString()||''); }, [goals]);
  const saveGoals = async ()=> {
    await setGoals({
      calories_goal_kcal: gCal? Number(gCal): null,
      protein_goal_g: gProt? Number(gProt): null,
      carbs_goal_g: gCarb? Number(gCarb): null,
      fat_goal_g: gFat? Number(gFat): null
    });
    setEditingGoals(false);
  };
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editCal, setEditCal] = useState('');
  const [editProtein, setEditProtein] = useState('');
  const [editCarbs, setEditCarbs] = useState('');
  const [editFat, setEditFat] = useState('');
  const startEdit = (log: any) => { setEditingId(log.id); setEditDesc(log.description||''); setEditCal(log.calories?.toString()||''); setEditProtein(log.protein_g?.toString()||''); setEditCarbs(log.carbs_g?.toString()||''); setEditFat(log.fat_g?.toString()||''); };
  const saveEdit = async ()=> { if(!editingId) return; await patch(editingId,{ description: editDesc, calories: editCal?Number(editCal):undefined, protein_g: editProtein?Number(editProtein):undefined, carbs_g: editCarbs?Number(editCarbs):undefined, fat_g: editFat?Number(editFat):undefined }); setEditingId(null); };
  const [pendingDelete, setPendingDelete] = useState<string|null>(null);
  const { can } = usePermissions();
  const canLog = can(CAPABILITIES.REFEICAO_LOG);
  const [meal_type, setMealType] = useState('lunch');
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canLog) return;
    setError(null); setSaving(true);
    try {
      const body: any = { meal_type };
      if (description.trim()) body.description = description.trim();
      const num = (v:string)=> { const n = parseFloat(v.replace(',','.')); return isFinite(n)? n : undefined; };
      if (calories) body.calories = Math.round(num(calories) || 0);
      if (protein) body.protein_g = +(num(protein)||0).toFixed(2);
      if (carbs) body.carbs_g = +(num(carbs)||0).toFixed(2);
      if (fat) body.fat_g = +(num(fat)||0).toFixed(2);
      await create(body);
      setDescription(''); setCalories(''); setProtein(''); setCarbs(''); setFat('');
  } catch (e:any) { setError(e.message || t('common.error', { msg: '' })); }
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 py-8 px-4">
  <SEO title={t('meal.log.seo.title')} description={t('meal.log.seo.desc')} />
      <div className="max-w-5xl mx-auto space-y-6">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-slate-800">{t('meal.log.title')}</h1>
              <button type="button" onClick={()=> navigate(-1)} className="text-xs text-blue-600 hover:underline self-start">{t('common.back')}</button>
            </div>
            <select value={locale} onChange={e=> setLocale(e.target.value as any)} className="text-xs border rounded px-1 py-0.5 h-6">
              <option value="pt">PT</option>
              <option value="en">EN</option>
            </select>
          </div>
          {!canLog && <p className="text-sm text-red-600">{t('common.noPermission.meal')}</p>}
          {canLog && (
            <form onSubmit={submit} className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">{t('meal.form.type')}</label>
                <select value={meal_type} onChange={e=> setMealType(e.target.value)} className="w-full border rounded px-3 py-2">
                  {mealTypes.map(m => <option key={m} value={m}>{t(`meal.type.${m}`)}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">{t('meal.form.description')}</label>
                <textarea value={description} onChange={e=> setDescription(e.target.value)} placeholder={t('meal.form.exampleDescription')} className="w-full border rounded px-3 py-2 h-24 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t('meal.form.calories')}</label>
                <input value={calories} onChange={e=> setCalories(e.target.value)} className="w-full border rounded px-2 py-1" placeholder={t('meal.form.exampleCalories')} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t('meal.form.protein')}</label>
                <input value={protein} onChange={e=> setProtein(e.target.value)} className="w-full border rounded px-2 py-1" placeholder={t('meal.form.exampleProtein')} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t('meal.form.carbs')}</label>
                <input value={carbs} onChange={e=> setCarbs(e.target.value)} className="w-full border rounded px-2 py-1" placeholder={t('meal.form.exampleCarbs')} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">{t('meal.form.fat')}</label>
                <input value={fat} onChange={e=> setFat(e.target.value)} className="w-full border rounded px-2 py-1" placeholder={t('meal.form.exampleFat')} />
              </div>
              <div className="md:col-span-2" aria-live="polite">
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
              <div className="md:col-span-2">
                <Button disabled={saving}>{saving? t('common.saving') : t('meal.form.save')}</Button>
              </div>
            </form>
          )}
        </Card>
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">{t('meal.stats.lastDays',{days:String(days.length)})}</h2>
            <div className="text-right space-y-1">
              {!editingGoals && <button onClick={()=> setEditingGoals(true)} className="text-xs text-blue-600 underline">{goals.calories? t('meal.goal.edit'):t('meal.goal.define')}</button>}
              {editingGoals && (
                <div className="flex flex-wrap gap-2 text-[10px] items-end">
                  <div><label className="block">{t('meal.goal.kcal')}</label><input value={gCal} onChange={e=> setGCal(e.target.value)} className="w-16 border rounded px-1 py-0.5" /></div>
                  <div><label className="block">{t('meal.goal.protein')}</label><input value={gProt} onChange={e=> setGProt(e.target.value)} className="w-14 border rounded px-1 py-0.5" /></div>
                  <div><label className="block">{t('meal.goal.carbs')}</label><input value={gCarb} onChange={e=> setGCarb(e.target.value)} className="w-14 border rounded px-1 py-0.5" /></div>
                  <div><label className="block">{t('meal.goal.fat')}</label><input value={gFat} onChange={e=> setGFat(e.target.value)} className="w-14 border rounded px-1 py-0.5" /></div>
                  <button onClick={saveGoals} className="text-green-600">OK</button>
                  <button onClick={()=> { setEditingGoals(false); }} className="text-red-500">X</button>
                </div>
              )}
            </div>
          </div>
          {stats ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center text-sm">
                <div><div className="font-semibold">{t('meal.stats.calories')}</div><div>{formatNumber(stats.totalCalories, locale)}</div></div>
                <div><div className="font-semibold">{t('meal.goal.protein')} (g)</div><div>{formatNumber(stats.totalProtein, locale)}</div></div>
                <div><div className="font-semibold">{t('meal.goal.carbs')} (g)</div><div>{formatNumber(stats.totalCarbs, locale)}</div></div>
                <div><div className="font-semibold">{t('meal.goal.fat')} (g)</div><div>{formatNumber(stats.totalFat, locale)}</div></div>
                <div><div className="font-semibold">{t('meal.stats.avgPerDay')}</div><div>{formatNumber(stats.avgCalories, locale)}</div></div>
              </div>
              <div className="mt-6 grid md:grid-cols-4 gap-4 text-xs">
                <div className="p-3 border rounded">
                  <div className="flex justify-between mb-1"><span>{t('meal.goal.kcal')}</span><span>{progress.calories!=null?progress.calories+'%':t('common.none')}</span></div>
                  <MiniSparkline values={days.map(d=> d.calories)} stroke="#f97316" />
                  <div className="mt-1 text-[10px] text-slate-500">{t('meal.goal.meta')}: {goals.calories||t('common.none')}</div>
                  {goals.calories && <div className="h-1 mt-2 bg-slate-200 rounded"><div className="h-1 bg-orange-500 rounded" style={{width: Math.min(100, progress.calories||0)+ '%'}} /></div>}
                </div>
                <div className="p-3 border rounded">
                  <div className="flex justify-between mb-1"><span>{t('meal.goal.protein')}</span><span>{progress.protein_g!=null?progress.protein_g+'%':t('common.none')}</span></div>
                  <MiniSparkline values={days.map(d=> d.protein_g)} stroke="#10b981" />
                  <div className="mt-1 text-[10px] text-slate-500">{t('meal.goal.meta')}: {goals.protein_g||t('common.none')}</div>
                  {goals.protein_g && <div className="h-1 mt-2 bg-slate-200 rounded"><div className="h-1 bg-emerald-500 rounded" style={{width: Math.min(100, progress.protein_g||0)+ '%'}} /></div>}
                </div>
                <div className="p-3 border rounded">
                  <div className="flex justify-between mb-1"><span>{t('meal.goal.carbs')}</span><span>{progress.carbs_g!=null?progress.carbs_g+'%':t('common.none')}</span></div>
                  <MiniSparkline values={days.map(d=> d.carbs_g)} stroke="#3b82f6" />
                  <div className="mt-1 text-[10px] text-slate-500">{t('meal.goal.meta')}: {goals.carbs_g||t('common.none')}</div>
                  {goals.carbs_g && <div className="h-1 mt-2 bg-slate-200 rounded"><div className="h-1 bg-blue-500 rounded" style={{width: Math.min(100, progress.carbs_g||0)+ '%'}} /></div>}
                </div>
                <div className="p-3 border rounded">
                  <div className="flex justify-between mb-1"><span>{t('meal.goal.fat')}</span><span>{progress.fat_g!=null?progress.fat_g+'%':t('common.none')}</span></div>
                  <MiniSparkline values={days.map(d=> d.fat_g)} stroke="#ec4899" />
                  <div className="mt-1 text-[10px] text-slate-500">{t('meal.goal.meta')}: {goals.fat_g||t('common.none')}</div>
                  {goals.fat_g && <div className="h-1 mt-2 bg-slate-200 rounded"><div className="h-1 bg-pink-500 rounded" style={{width: Math.min(100, progress.fat_g||0)+ '%'}} /></div>}
                </div>
              </div>
            </>
          ) : <p className="text-sm text-slate-500">{t('meal.data.insufficient')}</p>}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600 border-b">
                  <th className="py-2">{t('meal.table.date')}</th>
                  <th className="py-2">{t('meal.table.type')}</th>
                  <th className="py-2">{t('meal.table.description')}</th>
                  <th className="py-2">{t('meal.table.calories')}</th>
                  <th className="py-2">{t('meal.table.protein')}</th>
                  <th className="py-2">{t('meal.table.carbs')}</th>
                  <th className="py-2">{t('meal.table.fat')}</th>
                  <th className="py-2">{t('meal.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} className="border-b last:border-none align-top">
                    <td className="py-1 whitespace-nowrap text-xs">{formatDate(l.log_datetime, locale, { dateStyle: 'short' })} {new Date(l.log_datetime).toLocaleTimeString(locale==='pt'?'pt-BR':'en-US',{hour:'2-digit',minute:'2-digit'})}</td>
                    <td className="py-1 capitalize text-xs">{t((`meal.type.${mealTypes.includes(l.meal_type as any)? l.meal_type : 'other'}`) as any)}</td>
                    <td className="py-1 max-w-xs text-xs">
                      {editingId===l.id ? (
                        <textarea value={editDesc} onChange={e=> setEditDesc(e.target.value)} className="w-full border rounded px-1 py-0.5 text-[10px] h-12" />
                      ) : (
                        <span title={l.description || ''}>{l.description || t('common.none')}</span>
                      )}
                    </td>
                    <td className="py-1 text-xs">
                      {editingId===l.id ? (
                        <input value={editCal} onChange={e=> setEditCal(e.target.value)} className="w-14 border rounded px-1 py-0.5 text-[10px]" />
                      ) : (l.calories != null ? formatNumber(l.calories, locale) : t('common.none'))}
                    </td>
                    <td className="py-1 text-xs">{editingId===l.id ? (<input value={editProtein} onChange={e=> setEditProtein(e.target.value)} className="w-14 border rounded px-1 py-0.5 text-[10px]" />) : (l.protein_g!=null? formatNumber(+l.protein_g.toFixed(1), locale): t('common.none'))}</td>
                    <td className="py-1 text-xs">{editingId===l.id ? (<input value={editCarbs} onChange={e=> setEditCarbs(e.target.value)} className="w-14 border rounded px-1 py-0.5 text-[10px]" />) : (l.carbs_g!=null? formatNumber(+l.carbs_g.toFixed(1), locale): t('common.none'))}</td>
                    <td className="py-1 text-xs">{editingId===l.id ? (<input value={editFat} onChange={e=> setEditFat(e.target.value)} className="w-14 border rounded px-1 py-0.5 text-[10px]" />) : (l.fat_g!=null? formatNumber(+l.fat_g.toFixed(1), locale): t('common.none'))}</td>
                    <td className="py-1 text-[10px] whitespace-nowrap">
                      {editingId===l.id ? (
                        <>
                          <button onClick={saveEdit} className="text-green-600 mr-2">{t('common.confirm')}</button>
                          <button onClick={()=> setEditingId(null)} className="text-red-500 mr-2">{t('common.cancel')}</button>
                        </>
                      ) : (
                        <>
                          <button onClick={()=> startEdit(l)} className="text-blue-600 mr-2">{t('common.edit')}</button>
                          <button onClick={()=> setPendingDelete(l.id)} className="text-rose-600">{t('common.delete')}</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {!logs.length && <tr><td colSpan={8} className="py-4 text-center text-slate-500">{t('common.noData')}</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
        <ConfirmDialog
          open={!!pendingDelete}
          title={t('common.confirm.delete')}
          description={`${t('meal.table.description')}: ${logs.find(l=> l.id===pendingDelete)?.description || t('common.none')}`}
          confirmLabel={t('common.delete')}
          cancelLabel={t('common.cancel')}
          danger
          onClose={()=> setPendingDelete(null)}
          onConfirm={()=> { if(pendingDelete){ remove(pendingDelete); setPendingDelete(null);} }}
        />
      </div>
    </div>
  );
};

export default RefeicaoRegistroPage;
