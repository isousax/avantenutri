import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import DataSection from '../../../components/ui/DataSection';
import Button from '../../../components/ui/Button';
import { SEO } from '../../../components/comum/SEO';
import { useWeightLogsInteligente } from '../../../hooks/useWeightLogsInteligente';
import { useWeightData } from '../../../hooks/useWeightData';
import { AnalisePesoInteligente } from '../../../components/dashboard/AnalisePesoInteligente';
import Sparkline from '../../../components/ui/Sparkline';
import { usePermissions } from '../../../hooks/usePermissions';
import { CAPABILITIES } from '../../../types/capabilities';
import { useI18n, formatNumber } from '../../../i18n';
import { formatDateSafe } from '../../../utils/formatDate';
import { ArrowLeft, Target, Plus, Check, X } from '../../../components/icons';
import { TrendingUp, BarChart3, Sparkles, Scale, Edit3, History } from 'lucide-react';
import StatusPill, { getStatusTone } from '../../../components/ui/StatusPill';
import { shouldShowSkeleton } from '../../../utils/loadingHelpers';

const PesoRegistroPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'registrar' | 'analise' | 'historico'>('registrar');
  
  const inteligente = useWeightLogsInteligente(90);
  const { latest, logs, diff_kg, series, goal, setGoal, upsert, patch } = useWeightData(90) as any;
  const analiseTendencia = inteligente.analiseTendencia;
  const { t, locale } = useI18n();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const canLog = can(CAPABILITIES.PESO_LOG);
  const [weight, setWeight] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para controle de input do usuário
  const [hasUserInput, setHasUserInput] = useState(false);
  useEffect(() => { 
    if (latest && !weight && !hasUserInput) {
      setWeight(latest.weight_kg.toString()); 
    }
  }, [latest, weight, hasUserInput]);

  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(goal != null ? goal.toString() : '');
  useEffect(() => { 
    setGoalInput(goal != null ? goal.toString() : ''); 
  }, [goal]);

  const saveGoal = async () => { 
    const v = parseFloat(goalInput.replace(',', '.')); 
    if (isFinite(v) && v > 0) { 
      await setGoal(v); 
      setEditingGoal(false);
    } 
  };

  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const startEdit = (date: string, w: number) => { 
    setEditingDate(date); 
    setEditWeight(w.toString()); 
  };
  
  const saveEdit = async () => {
    if (!editingDate) return;
    const v = parseFloat(editWeight.replace(',', '.'));
    if (!isFinite(v) || v <= 0) return;
    await patch({ date: editingDate, data: { weight_kg: v } });
    setEditingDate(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canLog) return;
    const w = parseFloat(weight.replace(',', '.'));
    if (!isFinite(w) || w <= 0) { 
      setError(t('weight.invalid')); 
      return; 
    }
    setError(null); 
    setSaving(true);
    try {
      const today = new Date();
      const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      await upsert({ weight_kg: w, date: localDate });
      setHasUserInput(false);
      setActiveTab('historico'); // Vai para a aba de histórico após salvar
    } catch (e: any) { 
      setError(e.message || t('common.error')); 
    } finally { 
      setSaving(false); 
    }
  };

  // Conteúdo da aba Registrar
  const renderRegistrar = () => (
    <div className="space-y-6">
      {/* Stats Rápidos */}
      <div className="grid grid-cols-2 gap-4">
        <DataSection
          isLoading={shouldShowSkeleton(!latest, latest)}
          error={null}
          skeletonLines={3}
          skeletonClassName="h-28"
        >
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 border-0 shadow-lg rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Scale size={16} className="text-blue-100" />
              <span className="text-blue-100 text-sm font-medium">Peso Atual</span>
            </div>
            <p className="text-2xl font-bold">
              {latest ? formatNumber(+latest.weight_kg.toFixed(1), locale) : '--'}
              <span className="text-lg font-semibold text-blue-100 ml-1">kg</span>
            </p>
          </Card>
        </DataSection>
        
        <DataSection
          isLoading={shouldShowSkeleton(!goal && !latest, goal)}
          error={null}
          skeletonLines={3}
          skeletonClassName="h-28"
        >
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 border-0 shadow-lg rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-purple-100" />
              <span className="text-purple-100 text-sm font-medium">Meta</span>
            </div>
            <p className="text-2xl font-bold">
              {goal ? formatNumber(+goal.toFixed(1), locale) : '--'}
              <span className="text-lg font-semibold text-purple-100 ml-1">kg</span>
            </p>
          </Card>
        </DataSection>
      </div>

      {/* Progresso */}
      {diff_kg !== null && (
        <Card className="bg-white border-0 shadow-lg rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Progresso total</span>
            </div>
            <span className={`text-lg font-bold ${
              diff_kg < 0 ? 'text-green-600' : 
              diff_kg > 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {diff_kg >= 0 ? '+' : ''}{formatNumber(+diff_kg.toFixed(1), locale)} kg
            </span>
          </div>
        </Card>
      )}

      {/* Formulário de Registro */}
      <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Plus size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Registrar peso</h2>
              <p className="text-sm text-gray-500">Adicione sua medida atual</p>
            </div>
          </div>
          
          {!canLog ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 font-medium text-sm">{t('common.noPermission.weight')}</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Peso em kg
                </label>
                <div className="relative">
                  <input 
                    value={weight} 
                    onChange={e => {
                      setWeight(e.target.value);
                      setHasUserInput(true);
                    }} 
                    type="text" 
                    inputMode="decimal" 
                    placeholder="Ex: 72.5" 
                    className="w-full text-4xl font-bold text-center border-2 border-gray-200 rounded-2xl px-4 py-6 text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200" 
                  />
                </div>
              </div>
              
              {/* Meta rápida */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Meta pessoal</span>
                  </div>
                  {!editingGoal ? (
                    <button 
                      type="button" 
                      onClick={() => setEditingGoal(true)} 
                      className="flex items-center gap-2 text-sm bg-white hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg transition-colors duration-200 border border-gray-300"
                    >
                      {goal != null ? `${formatNumber(+goal.toFixed(1), locale)} kg` : 'Definir'}
                      <Edit3 size={14} />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input 
                          value={goalInput} 
                          onChange={e => setGoalInput(e.target.value)} 
                          placeholder="70.0" 
                          className="w-20 border border-blue-300 rounded-lg px-2 py-1.5 text-sm font-medium text-center" 
                          autoFocus
                        />
                      </div>
                      <span className="text-gray-600 text-sm">kg</span>
                      <button 
                        type="button" 
                        onClick={saveGoal} 
                        className="w-8 h-8 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
                      >
                        <Check size={14} />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { 
                          setEditingGoal(false); 
                          setGoalInput(goal != null ? goal.toString() : ''); 
                        }} 
                        className="w-8 h-8 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-700 font-medium text-sm">{error}</p>
                </div>
              )}
              
              <Button 
                disabled={saving || !weight} 
                className="w-full !py-4 !text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl active:scale-[0.98]"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Salvando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Plus size={18} />
                    Registrar Peso
                  </span>
                )}
              </Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );

  // Conteúdo da aba Análise
  const renderAnalise = () => (
    <div className="space-y-6">
      {/* Análise Inteligente */}
      <AnalisePesoInteligente />

      {/* Gráfico e Tendência */}
      {series.length > 0 && (
        <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
          <div className="p-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <BarChart3 size={20} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Sua Evolução</h2>
                <p className="text-sm text-gray-500">Progresso ao longo do tempo</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <Sparkline data={series.slice(-60)} height={140} />
              
              {analiseTendencia.confiabilidade > 50 && (
                <div className="bg-gradient-to-r from-gray-50 to-green-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <Sparkles size={18} className="text-green-600" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-700">Tendência atual</p>
                        <StatusPill
                          label={analiseTendencia.direcao}
                          tone={getStatusTone(analiseTendencia.direcao)}
                          subtle
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        {analiseTendencia.confiabilidade}% de confiabilidade • {analiseTendencia.velocidade}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  // Conteúdo da aba Histórico
  const renderHistorico = () => (
    <div className="space-y-6">
      <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <History size={20} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Histórico</h2>
              <p className="text-sm text-gray-500">Seus registros anteriores</p>
            </div>
            <span className="text-sm bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
              {logs.length}
            </span>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Scale size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-1">Nenhum registro encontrado</p>
              <p className="text-sm text-gray-500">Comece registrando seu peso acima</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log: any, index: number) => (
                <div 
                  key={log.id || log.log_date} 
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    editingDate === log.log_date 
                      ? 'border-blue-300 bg-blue-50 shadow-sm' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  } ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Scale size={16} className="text-blue-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <p className="text-lg font-semibold text-gray-900">
                            {formatNumber(+log.weight_kg.toFixed(1), locale)} kg
                          </p>
                          {goal && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                              log.weight_kg > goal ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {goal > log.weight_kg ? '↓' : '↑'} {Math.abs(goal - log.weight_kg).toFixed(1)}kg
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDateSafe(log.log_date, locale)}
                        </p>
                        {log.note && (
                          <p className="text-sm text-gray-600 mt-2 truncate" title={log.note}>
                            {log.note}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {editingDate === log.log_date ? (
                      <div className="flex items-center gap-2 ml-4">
                        <input 
                          value={editWeight} 
                          onChange={e => setEditWeight(e.target.value)} 
                          className="w-16 border border-blue-300 rounded-lg px-2 py-1.5 text-sm font-medium text-center" 
                          autoFocus
                        />
                        <button 
                          type="button" 
                          onClick={saveEdit} 
                          className="w-8 h-8 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
                        >
                          <Check size={14} />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setEditingDate(null)} 
                          className="w-8 h-8 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        type="button" 
                        onClick={() => startEdit(log.log_date, log.weight_kg)} 
                        className="ml-4 text-sm bg-white hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg transition-colors duration-200 border border-gray-300 flex items-center gap-1"
                      >
                        <Edit3 size={14} />
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 safe-area-bottom">
      <SEO title={t('weight.log.seo.title')} description={t('weight.log.seo.desc')} />
      
      {/* Header compacto e moderno */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 backdrop-blur-lg bg-white/95">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 active:scale-95"
              aria-label="Voltar"
            >
              <ArrowLeft size={18} className="text-gray-700" />
            </button>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                Controle de Peso
              </h1>
            </div>

            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Scale size={18} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Tabs de Navegação */}
        <Card className="bg-white border-0 shadow-lg rounded-2xl mb-6">
          <div className="flex p-1">
            <button
              onClick={() => setActiveTab('registrar')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'registrar'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Plus size={16} />
                Registrar
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('analise')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'analise'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <BarChart3 size={16} />
                Análise
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('historico')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'historico'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <History size={16} />
                Histórico
              </div>
            </button>
          </div>
        </Card>

        {/* Conteúdo das Tabs */}
        <div className="animate-fade-in">
          {activeTab === 'registrar' && renderRegistrar()}
          {activeTab === 'analise' && renderAnalise()}
          {activeTab === 'historico' && renderHistorico()}
        </div>
      </div>
    </div>
  );
};

export default PesoRegistroPage;