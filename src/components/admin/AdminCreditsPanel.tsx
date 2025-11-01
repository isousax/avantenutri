import React, { useState } from 'react';
import SpinnerLoading from '../ui/SpinnerLoading';
import { useAdminCredits, useAdjustCredits } from '../../hooks/useAdminCredits';

const badge = (num: number, cls: string) => (
  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${cls}`}>{num}</span>
);

const AdminCreditsPanel: React.FC = () => {
  const { data, isLoading, error } = useAdminCredits();
  const adjust = useAdjustCredits();
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<string|null>(null);
  const [delta, setDelta] = useState(1);
  const [type, setType] = useState<'avaliacao_completa'|'reavaliacao'>('avaliacao_completa');
  const [reason, setReason] = useState('Ajuste manual');
  const [adjustError, setAdjustError] = useState<string|null>(null);

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustError(null);
    
    adjust.mutate(
      { userId: selected!, type, delta, reason },
      {
        onSuccess: () => {
          setSelected(null);
          setDelta(1);
          setReason('Ajuste manual');
        },
        onError: (error) => {
          setAdjustError(error.message);
        }
      }
    );
  };

  const rows = (data?.rows||[]).filter(r => !filter || r.email?.toLowerCase().includes(filter.toLowerCase()) || r.name?.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filtrar por nome/email" className="border rounded px-2 py-1 text-sm" />
        {adjust.isPending && <span className="text-xs text-amber-600 animate-pulse">Salvando ajuste...</span>}
      </div>
  {isLoading && <div className="py-12 text-center"><SpinnerLoading text="Carregando créditos..." /></div>}
      {error && (
        <div className="border border-red-200 bg-red-50 rounded p-3">
          <div className="text-sm text-red-600 font-medium">Erro ao carregar dados de créditos</div>
          <div className="text-xs text-red-500 mt-1">
            {error.message || 'Erro desconhecido. Tente recarregar a página.'}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="text-xs text-red-700 underline hover:text-red-800 mt-2"
          >
            Recarregar página
          </button>
        </div>
      )}
      <div className="overflow-x-auto border rounded bg-white/70">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-100 text-[11px] uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-2 py-1 text-left">Usuário</th>
              <th className="px-2 py-1 text-left">Email</th>
              <th className="px-2 py-1">Avaliação (Disp / Usados / Exp)</th>
              <th className="px-2 py-1">Reavaliação (Disp / Usados / Exp)</th>
              <th className="px-2 py-1">Ajustar</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(r => (
              <tr key={r.user_id} className="hover:bg-emerald-50/60">
                <td className="px-2 py-1 font-medium">{r.name||'-'}</td>
                <td className="px-2 py-1 text-gray-600">{r.email||'-'}</td>
                <td className="px-2 py-1 text-center space-x-1 whitespace-nowrap">
                  {badge(r.avaliacao_completa.available,'bg-emerald-100 text-emerald-700')} 
                  {badge(r.avaliacao_completa.used,'bg-amber-100 text-amber-700')} 
                  {badge(r.avaliacao_completa.expired,'bg-gray-200 text-gray-600')}
                </td>
                <td className="px-2 py-1 text-center space-x-1 whitespace-nowrap">
                  {badge(r.reavaliacao.available,'bg-blue-100 text-blue-700')} 
                  {badge(r.reavaliacao.used,'bg-amber-100 text-amber-700')} 
                  {badge(r.reavaliacao.expired,'bg-gray-200 text-gray-600')}
                </td>
                <td className="px-2 py-1 text-center">
                  <button onClick={()=>setSelected(r.user_id)} className="text-[11px] text-emerald-700 underline">Selecionar</button>
                </td>
              </tr>
            ))}
            {rows.length===0 && !isLoading && (
              <tr><td colSpan={5} className="px-2 py-4 text-center text-gray-500 text-xs">Nenhum resultado</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <form className="border rounded p-3 bg-white/80 space-y-2 max-w-md" onSubmit={handleAdjustSubmit}>
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-sm">Ajustar Créditos</h4>
            <button type="button" onClick={()=>{setSelected(null); setAdjustError(null);}} className="text-[11px] text-gray-500 hover:underline">Fechar</button>
          </div>
          
          {adjustError && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <div className="text-xs text-red-600">{adjustError}</div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="space-y-1">
              <span className="block font-medium">Tipo</span>
              <select value={type} onChange={e=>setType(e.target.value as any)} className="border rounded px-2 py-1 text-xs">
                <option value="avaliacao_completa">Avaliação Completa</option>
                <option value="reavaliacao">Reavaliação</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="block font-medium">Delta</span>
              <input type="number" value={delta} onChange={e=>setDelta(Number(e.target.value)||0)} className="border rounded px-2 py-1 text-xs" />
            </label>
            <label className="col-span-2 space-y-1">
              <span className="block font-medium">Motivo</span>
              <input value={reason} onChange={e=>setReason(e.target.value)} className="border rounded px-2 py-1 text-xs w-full" />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button 
              type="submit" 
              disabled={adjust.isPending} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adjust.isPending ? 'Aplicando...' : 'Aplicar'}
            </button>
          </div>
          {adjust.error && <div className="text-[11px] text-red-600">Erro ao ajustar.</div>}
        </form>
      )}
    </div>
  );
};

export default AdminCreditsPanel;
