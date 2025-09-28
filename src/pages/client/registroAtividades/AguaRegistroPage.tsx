import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { SEO } from "../../../components/comum/SEO";
import { useWaterLogs } from "../../../hooks/useWaterLogs";
import { usePermissions } from "../../../hooks/usePermissions";
import { CAPABILITIES } from "../../../types/capabilities";
import { useI18n, formatNumber } from '../../../i18n';
import { useToast } from '../../../components/ui/ToastProvider';

const AguaRegistroPage: React.FC = () => {
  const { t } = useI18n();
  const { push } = useToast();
  useEffect(() => { document.title = t('water.log.title') + ' - Avante Nutri'; }, [t]);
  const navigate = useNavigate();
  const { logs, add, totalToday, avgPerDay, bestDay, summaryDays, dailyGoalCups, goalSource, cupSize, updateGoal, updateCupSize, limit } = useWaterLogs(7);
  const { can } = usePermissions();
  const canLog = can(CAPABILITIES.AGUA_LOG);
  const [metaDiaria, setMetaDiaria] = useState<number>(8);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('8');

  // Sync persisted goal when loaded
  useEffect(()=> {
    if (dailyGoalCups && dailyGoalCups !== metaDiaria) {
      setMetaDiaria(dailyGoalCups);
      setGoalInput(String(dailyGoalCups));
    }
  }, [dailyGoalCups]);
  const mlPorCopo = cupSize || 250; // conversão personalizada
  const coposHoje = Math.round(totalToday / mlPorCopo);
  const historico = useMemo(() => {
    if (summaryDays) {
      return summaryDays.map(d => ({ data: d.date, copos: Math.round(d.total_ml / mlPorCopo), meta: metaDiaria }));
    }
    const byDate: { date: string; amount: number }[] = [];
    const map = logs.reduce<Record<string, number>>((acc,l)=> { acc[l.log_date] = (acc[l.log_date]||0)+l.amount_ml; return acc; }, {});
    Object.entries(map).forEach(([date, amount])=> byDate.push({ date, amount }));
    return byDate.sort((a,b)=> a.date.localeCompare(b.date)).map(d => ({ data: d.date, copos: Math.round(d.amount / mlPorCopo), meta: metaDiaria }));
  }, [logs, metaDiaria, summaryDays]);

  const [pendingCops, setPendingCops] = useState(0); // incrementos locais antes do push
  const adicionarCopo = () => { if (pendingCops + coposHoje < 40) setPendingCops(p => p + 1); };
  const removerCopo = () => { if (pendingCops > 0) setPendingCops(p => p - 1); };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
  if (!canLog) { push({ type:'error', message: t('water.plan.blocked')}); return; }
  if (pendingCops <= 0) { navigate('/dashboard'); return; }
    try {
      setIsSaving(true);
  const totalMl = pendingCops * mlPorCopo;
      const ok = await add(totalMl);
      if (ok) {
        push({ type:'success', message: t('water.toast.saved') });
        setPendingCops(0);
        navigate('/dashboard');
      } else {
        push({ type:'error', message: t('water.toast.partial') });
      }
    } catch (err) {
      console.error('Erro ao registrar água', err);
      push({ type:'error', message: t('water.toast.error') });
    } finally { setIsSaving(false); }
  };

  const calcularProgresso = () => {
    return Math.min((coposHoje / metaDiaria) * 100, 100);
  };

  interface MensagemMotivacional {
    mensagem: string;
    cor: string;
  }

  const getMensagemMotivacional = (): MensagemMotivacional => {
    const progresso = calcularProgresso();
    if (progresso >= 100) return { mensagem: t('water.mot.100'), cor: 'text-green-600'};
    if (progresso >= 75) return { mensagem: t('water.mot.75'), cor: 'text-blue-600'};
    if (progresso >= 50) return { mensagem: t('water.mot.50'), cor: 'text-yellow-600'};
    return { mensagem: t('water.mot.start'), cor: 'text-orange-600'};
  };

  const mensagem = getMensagemMotivacional();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-8 px-4">
  <SEO title={t('water.log.seo.title')} description={t('water.log.seo.desc')} />
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">{t('water.log.heading')}</h1>
          <p className="text-gray-600">{t('water.log.subheading')}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Contador Principal */}
          <Card className="p-6 shadow-xl border border-blue-100">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">💧</span>
              </div>
              <h2 className="text-2xl font-bold text-blue-800">{t('common.today')}</h2>
              <p className="text-gray-600">
                {new Date().toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>

            {/* Contador / Meta */}
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-blue-600 mb-2">
                {coposHoje + pendingCops}
              </div>
              <p className="text-gray-600 flex items-center justify-center gap-2">
                {t('water.cups')}
                {goalSource && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase tracking-wide">
                    {goalSource === 'user' && t('water.goal.source.user')}
                    {goalSource === 'plan' && t('water.goal.source.plan')}
                    {goalSource === 'default' && t('water.goal.source.default')}
                  </span>
                )}
              </p>
              <div className="mt-3 space-y-2">
                {!editingGoal && (
                  <button type="button" onClick={()=> { setGoalInput(String(metaDiaria)); setEditingGoal(true); }} className="text-xs text-blue-600 underline">
                    {t('water.goal.edit')}: {metaDiaria}
                  </button>
                )}
                {editingGoal && (
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <label className="text-slate-600">
                      {t('water.goal.daily')}
                      <input value={goalInput} onChange={e=> setGoalInput(e.target.value.replace(/[^0-9]/g,''))} className="ml-1 w-14 border rounded px-1 py-0.5 text-center" />
                    </label>
                    <button type="button" onClick={async ()=> {
                      const v = Math.max(1, Math.min(40, Number(goalInput||'0')));
                      if (v === metaDiaria) { setEditingGoal(false); return; }
                      const ok = await updateGoal(v);
                      if (ok) { setMetaDiaria(v); push({ type:'success', message: t('water.goal.updated')}); }
                      setEditingGoal(false);
                    }} className="text-green-600">{t('water.goal.save')}</button>
                    <button type="button" onClick={()=> setEditingGoal(false)} className="text-red-500">{t('water.goal.cancel')}</button>
                  </div>
                )}
                <CupSizeEditor current={mlPorCopo} onSave={async (newSize)=> { const ok = await updateCupSize(newSize); if (ok) push({ type:'success', message: t('water.cup.updated').replace('{ml}', String(newSize)) }); }} />
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-blue-800 mb-2">
                <span>{t('water.progress')}</span>
                <span>{Math.min(((coposHoje + pendingCops)/ metaDiaria)*100,100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-4">
                <div
                  className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(((coposHoje + pendingCops)/ metaDiaria)*100,100)}%` }}
                ></div>
              </div>
              <p className="text-center text-sm text-blue-600 mt-2">
                {coposHoje + pendingCops} / {metaDiaria} {t('water.cups')} ({mlPorCopo}ml)
                {limit != null && (
                  <span className="block text-[11px] text-slate-500 mt-1">
                    {t('water.limit.plan')}: {t('water.limit.plan.ml').replace('{ml}', String(limit)).replace('{cups}', String(Math.max(1, Math.round(limit/250))))}
                  </span>
                )}
              </p>
            </div>

            {/* Mensagem Motivacional */}
            <div
              className={`text-center p-4 rounded-lg mb-6 ${
                mensagem.cor === "text-green-600"
                  ? "bg-green-600"
                  : mensagem.cor === "text-blue-600"
                  ? "bg-blue-600"
                  : mensagem.cor === "text-yellow-600"
                  ? "bg-yellow-600"
                  : "bg-orange-600"
              } bg-opacity-10`}
            >
              <p className="font-medium">{mensagem.mensagem}</p>
            </div>

            {/* Controles */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Button
                onClick={removerCopo}
                variant="secondary"
                className="w-full flex items-center justify-center"
                disabled={pendingCops === 0}
                aria-label="Remover um copo de água"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
                {t('water.remove.pending')}
              </Button>
              <Button
                onClick={adicionarCopo}
                className="w-full flex items-center justify-center"
                aria-label="Adicionar um copo de água"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {t('water.add250')}
              </Button>
            </div>

            {/* Botão Salvar */}
            <Button onClick={handleSubmit} className="w-full flex items-center justify-center" disabled={!canLog || isSaving}>
              {isSaving ? t('common.saving') : t('water.save')}
            </Button>
          {/* Estatísticas e Histórico */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('water.stats.week')}
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-800">{t('water.stats.dailyAvg')}</span>
                  <span className="font-bold text-blue-800">{avgPerDay ? formatNumber(+ (avgPerDay / mlPorCopo).toFixed(1), 'pt') : '0'} {t('water.cups')}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-800">{t('water.stats.daysOnTarget')}</span>
                  <span className="font-bold text-green-800">{historico.filter(h => h.copos >= metaDiaria).length}/{historico.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-purple-800">{t('water.stats.bestDay')}</span>
                  <span className="font-bold text-purple-800">{bestDay ? formatNumber(Math.round(bestDay.amount / mlPorCopo), 'pt') : 0} {t('water.cups')}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('water.history.week')}
              </h3>
              <div
                className="space-y-3"
                role="list"
                aria-label="Histórico de consumo de água"
              >
                {historico.map((registro, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 border border-gray-100 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(registro.data).toLocaleDateString("pt-BR", {
                          weekday: "short",
                        })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(registro.data).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          registro.copos >= registro.meta
                            ? "text-green-600"
                            : "text-orange-600"
                        }`}
                      >
                        {formatNumber(registro.copos, 'pt')} {t('water.cups')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {t('common.goal')}: {registro.meta}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Dicas */}
            <Card className="p-6 bg-cyan-50 border border-cyan-100">
              <h3 className="text-lg font-semibold text-cyan-800 mb-3">
                💡 {t('water.tips.title')}
              </h3>
              <ul className="space-y-2 text-sm text-cyan-700">
                <li>• {t('water.tip.1')}</li>
                <li>• {t('water.tip.2')}</li>
                <li>• {t('water.tip.3')}</li>
                <li>• {t('water.tip.4')}</li>
              </ul>
            </Card>
          </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

interface CupSizeEditorProps { current: number; onSave: (n: number) => void | Promise<void>; }
const CupSizeEditor: React.FC<CupSizeEditorProps> = ({ current, onSave }) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(current));
  useEffect(()=> { setValue(String(current)); }, [current]);
  return (
    <div className="text-xs text-slate-600 flex flex-col items-center gap-1">
      {!open && (
        <button type="button" onClick={()=> setOpen(true)} className="underline text-blue-600">
          {t('water.cup.adjust')} ({current}ml)
        </button>
      )}
      {open && (
        <div className="flex items-center gap-2">
          <input value={value} onChange={e=> setValue(e.target.value.replace(/[^0-9]/g,''))} className="w-16 border rounded px-1 py-0.5 text-center" />
          <span>ml</span>
          <button type="button" className="text-green-600" onClick={async ()=> { const n = Math.max(50, Math.min(1000, Number(value||'0'))); if (!n) return; await onSave(n); setOpen(false); }}>{t('common.save')}</button>
          <button type="button" className="text-red-500" onClick={()=> setOpen(false)}>{t('common.cancel')}</button>
        </div>
      )}
    </div>
  );
};

export default AguaRegistroPage;
