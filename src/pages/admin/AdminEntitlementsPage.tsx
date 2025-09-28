import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Skeleton from '../../components/ui/Skeleton';
import Card from '../../components/ui/Card';
import PermissionGate from '../../components/auth/PermissionGate';
import { CAPABILITIES } from '../../types/capabilities';
import { usePermissions } from '../../hooks/usePermissions';
import { API } from '../../config/api';
import { useAuth } from '../../contexts';
import UsageBar from '../../components/ui/UsageBar';
import OverridesSection from '../../components/admin/OverridesSection';
import OverrideLogs from '../../components/admin/OverrideLogs';
import { SEO } from '../../components/comum/SEO';
import { useI18n } from '../../i18n';

interface ListedUser { id: string; email: string; display_name?: string; role: string; }
interface UsersResp { results: ListedUser[] }

// Tentativa de endpoint admin para entitlements de outro usuário (assumindo suporte futuro)
async function fetchUserEntitlements(authFetch: any, userId: string){
  const r = await authFetch(`${API.ENTITLEMENTS}?user_id=${encodeURIComponent(userId)}`, { method:'GET', autoLogout:true });
  if(!r.ok) throw new Error('Falha ao obter entitlements do usuário');
  return r.json();
}

const sampleBlocks = [
  { title: 'Montar Dieta', code: CAPABILITIES.DIETA_EDIT },
  { title: 'Registrar Água', code: CAPABILITIES.AGUA_LOG },
  { title: 'Agendar Consulta', code: CAPABILITIES.CONSULTA_AGENDAR },
  { title: 'Chat Nutri', code: CAPABILITIES.CHAT_NUTRI },
];

const AdminEntitlementsPage: React.FC = () => {
  const { capabilities, loading, error, limits, usage } = usePermissions(); // entitlements do admin logado
  const { authenticatedFetch } = useAuth();

  // Busca / seleção de usuário
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<ListedUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ListedUser | null>(null);
  const [selLoading, setSelLoading] = useState(false);
  const [selError, setSelError] = useState<string | null>(null);
  const [selCaps, setSelCaps] = useState<string[]>([]);
  const [selLimits, setSelLimits] = useState<Record<string, number | null>>({});
  const [selUsage, setSelUsage] = useState<Record<string, any>>({});
  // Overrides (mock local até backend)
  interface LocalOverride { id: string; type: 'capability-grant' | 'capability-revoke' | 'limit-set'; key: string; value?: number | null; expires_at?: string | null; reason?: string; created_at: string; }
  const [overrides, setOverrides] = useState<LocalOverride[]>([]);
  const [ovFilter, setOvFilter] = useState<string>('');
  const [ovForm, setOvForm] = useState<{ type:'capability-grant'|'capability-revoke'|'limit-set'; key:string; value?: string; days?: string; reason?: string }>({ type:'capability-grant', key:'', value:'', days:'', reason:'' });

  function addOverride(){
    const id = 'ov_'+Math.random().toString(36).slice(2,9);
    let expires_at: string | null = null;
    const daysNum = ovForm.days ? parseInt(ovForm.days,10) : NaN;
    if(!isNaN(daysNum) && daysNum>0){
      expires_at = new Date(Date.now()+ daysNum*86400000).toISOString();
    }
    const valueNum = ovForm.value && ovForm.value!=='' ? Number(ovForm.value) : undefined;
    const newOv: LocalOverride = {
      id,
      type: ovForm.type,
      key: ovForm.key.trim(),
      value: ovForm.type==='limit-set'? (isNaN(valueNum||NaN)? null : valueNum) : undefined,
      expires_at,
      reason: ovForm.reason?.trim() || undefined,
      created_at: new Date().toISOString()
    };
    setOverrides(prev => [newOv, ...prev]);
    setOvForm({ type:'capability-grant', key:'', value:'', days:'', reason:'' });
  }
  function removeOverride(id:string){ setOverrides(prev => prev.filter(o=> o.id!==id)); }
  const filteredOverrides = overrides.filter(o => !ovFilter || o.key.toLowerCase().includes(ovFilter.toLowerCase()));

  // Debounce simples
  useEffect(()=> {
    if(!userQuery){ setUserResults([]); return; }
    const id = setTimeout(async () => {
      try {
        setSearching(true);
        const qs = new URLSearchParams({ page:'1', pageSize:'10', q: userQuery });
        const r = await authenticatedFetch(`${API.ADMIN_USERS}?${qs.toString()}`, { method:'GET', autoLogout:true });
        if(!r.ok) throw new Error('HTTP '+r.status);
        const data: UsersResp = await r.json();
        setUserResults(data.results || []);
      } catch(e:any) {
        // swallow error in search context
      } finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(id);
  }, [userQuery, authenticatedFetch]);

  const loadSelectedEntitlements = useCallback(async (u: ListedUser) => {
    try {
      setSelLoading(true); setSelError(null);
      const data = await fetchUserEntitlements(authenticatedFetch, u.id);
      setSelCaps(data.capabilities || []);
      setSelLimits(data.limits || {});
      setSelUsage(data.usage || {});
    } catch(e:any){ setSelError(e.message || 'Erro'); } finally { setSelLoading(false); }
  }, [authenticatedFetch]);

  // Quando selecionar usuário
  useEffect(()=> { if(selectedUser) loadSelectedEntitlements(selectedUser); }, [selectedUser, loadSelectedEntitlements]);

  const sortedSelLimits = useMemo(()=> Object.entries(selLimits).sort(([a],[b]) => a.localeCompare(b)), [selLimits]);
  const sortedOwnLimits = useMemo(()=> Object.entries(limits||{}).sort(([a],[b]) => a.localeCompare(b)), [limits]);

  const { t } = useI18n();
  return (
    <div className="p-6 space-y-8">
      <SEO title={t('admin.entitlements.seo.title')} description={t('admin.entitlements.seo.desc')} />
      <div>
        <h1 className="text-2xl font-semibold mb-1">Entitlements / Capabilities (Admin)</h1>
        <p className="text-sm text-gray-600 max-w-3xl leading-relaxed">
          Visão dupla: (1) Suas capabilities atuais / uso (2) Inspeção de um usuário específico. Esta página crescerá para
          incluir overrides, histórico e ajustes temporários. Caso o backend ainda não suporte entitlements de outro usuário
          via query parameter, a segunda seção retornará erro.
        </p>
      </div>
      <Card className="p-4 space-y-4">
        <h2 className="font-medium text-lg">Seus Entitlements</h2>
        {loading && (
          <div className="space-y-3">
            <Skeleton lines={1} className="w-48" />
            <Skeleton lines={3} />
            <Skeleton lines={2} />
          </div>
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {!loading && !error && (
          <div className="space-y-3">
            <div className="text-sm">Capabilities ({capabilities.length}): {capabilities.length === 0 ? <span className="italic text-gray-500">(vazio)</span> : capabilities.map(c => <code key={c} className="text-[11px] bg-slate-200 px-1 rounded mr-1">{c}</code>)}</div>
            <div className="text-sm">Limits:</div>
            {sortedOwnLimits.length > 0 ? (
              <>
                <table className="w-full text-[11px] border">
                  <thead><tr className="bg-slate-100"><th className="text-left p-1">Limite</th><th className="text-left p-1">Uso</th></tr></thead>
                  <tbody>
                    {sortedOwnLimits.map(([k,v]) => {
                      const u = (usage && typeof usage[k] === 'number') ? usage[k] : null;
                      return (
                        <tr key={k} className="odd:bg-slate-50 align-top">
                          <td className="p-1 font-mono w-40">{k}{' '}<span className="text-[10px] text-gray-500">{v==null?'∞':v}</span></td>
                          <td className="p-1"><UsageBar value={u} limit={v} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="pt-4 mt-4 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-xs">Overrides (mock)</h4>
                    <div className="flex gap-2 items-center">
                      <input value={ovFilter} onChange={e=> setOvFilter(e.target.value)} placeholder="filtrar" className="border rounded px-2 py-1 text-[11px]" />
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500">Simulação local antes do backend: adicione grants / revokes de capability ou override de limite com expiração opcional.</p>
                  <div className="border rounded p-3 bg-slate-50 space-y-2">
                    <div className="grid md:grid-cols-5 gap-2 items-end">
                      <div className="flex flex-col">
                        <label className="text-[10px] font-medium mb-0.5">Tipo</label>
                        <select value={ovForm.type} onChange={e=> setOvForm(f=> ({...f, type:e.target.value as any}))} className="border rounded px-2 py-1 text-[11px]">
                          <option value="capability-grant">capability-grant</option>
                          <option value="capability-revoke">capability-revoke</option>
                          <option value="limit-set">limit-set</option>
                        </select>
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[10px] font-medium mb-0.5">Key</label>
                        <input value={ovForm.key} onChange={e=> setOvForm(f=> ({...f, key:e.target.value}))} placeholder={ovForm.type.startsWith('capability')? 'capability code':'limit key'} className="border rounded px-2 py-1 text-[11px]" />
                      </div>
                      {ovForm.type==='limit-set' && (
                        <div className="flex flex-col">
                          <label className="text-[10px] font-medium mb-0.5">Valor</label>
                          <input value={ovForm.value} onChange={e=> setOvForm(f=> ({...f, value:e.target.value}))} placeholder="ex: 50" className="border rounded px-2 py-1 text-[11px]" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <label className="text-[10px] font-medium mb-0.5">Expira (dias)</label>
                        <input value={ovForm.days} onChange={e=> setOvForm(f=> ({...f, days:e.target.value}))} placeholder="opcional" className="border rounded px-2 py-1 text-[11px]" />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[10px] font-medium mb-0.5">Razão</label>
                        <input value={ovForm.reason} onChange={e=> setOvForm(f=> ({...f, reason:e.target.value}))} placeholder="motivo" className="border rounded px-2 py-1 text-[11px]" />
                      </div>
                      <div className="md:col-span-5 flex justify-end">
                        <button type="button" onClick={addOverride} disabled={!ovForm.key} className="px-3 py-1.5 rounded bg-blue-600 text-white text-[11px] disabled:opacity-50">Adicionar</button>
                      </div>
                    </div>
                    <table className="w-full text-[11px] border">
                      <thead>
                        <tr className="bg-slate-100 text-left">
                          <th className="p-1">ID</th>
                          <th className="p-1">Tipo</th>
                          <th className="p-1">Key/Valor</th>
                          <th className="p-1">Expira</th>
                          <th className="p-1">Razão</th>
                          <th className="p-1">Criado</th>
                          <th className="p-1">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOverrides.length === 0 && (
                          <tr><td colSpan={7} className="p-2 text-center text-[11px] text-gray-500">Nenhum override</td></tr>
                        )}
                        {filteredOverrides.map(o => {
                          const exp = o.expires_at ? new Date(o.expires_at) : null;
                          const isExpired = exp ? exp.getTime() < Date.now() : false;
                          return (
                            <tr key={o.id} className={`odd:bg-white even:bg-slate-100/60 ${isExpired ? 'opacity-60' : ''}`}>
                              <td className="p-1 font-mono select-all">{o.id}</td>
                              <td className="p-1">{o.type}</td>
                              <td className="p-1 font-mono text-[10px]">{o.key}{o.type==='limit-set' ? ' = '+(o.value ?? 'null') : ''}</td>
                              <td className="p-1 text-[10px]">{o.expires_at ? exp?.toLocaleDateString() : '—'}</td>
                              <td className="p-1 text-[10px] max-w-[120px] truncate" title={o.reason}>{o.reason || '—'}</td>
                              <td className="p-1 text-[10px]">{new Date(o.created_at).toLocaleString()}</td>
                              <td className="p-1">
                                <button type="button" onClick={()=> removeOverride(o.id)} className="text-[10px] text-red-600 hover:underline">Remover</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <p className="text-[10px] text-gray-400">Mock local — ao integrar backend: substituir add/remove por chamadas e recarregar lista.</p>
                  </div>
                </div>
              </>
            ) : <p className="text-xs text-gray-500">Nenhum limite.</p>}
          </div>
        )}
      </Card>

      {/* Seção: busca usuário */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">Buscar Usuário (email ou parte)</label>
            <input
              value={userQuery}
              onChange={e => setUserQuery(e.target.value)}
              placeholder="ex: maria@"
              className="border rounded px-3 py-2 w-full text-sm"
            />
            {searching && (
              <div className="mt-2 space-y-2">
                <Skeleton lines={1} className="w-40" />
                <Skeleton lines={1} className="w-56" />
              </div>
            )}
            {!searching && userQuery && userResults.length === 0 && <div className="text-[11px] text-gray-500 mt-1">Sem resultados.</div>}
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">Resultados</label>
            <div className="border rounded p-2 h-32 overflow-auto text-xs space-y-1 bg-white">
              {userResults.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelectedUser(u)}
                  className={`block w-full text-left px-2 py-1 rounded hover:bg-blue-50 ${selectedUser?.id===u.id ? 'bg-blue-100' : ''}`}
                >{u.display_name || u.email} <span className="text-[10px] text-gray-500">({u.role})</span></button>
              ))}
              {userResults.length === 0 && <div className="text-[11px] text-gray-400">Digite para buscar...</div>}
            </div>
          </div>
        </div>
        {selectedUser && (
          <div className="mt-4 border-t pt-4 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-medium text-sm">Usuário Selecionado</h3>
              <div className="text-xs text-gray-600 font-mono select-all">id: {selectedUser.id}</div>
            </div>
            <div className="text-sm"><span className="font-medium">Email:</span> {selectedUser.email}</div>
            <div className="text-sm"><span className="font-medium">Role:</span> {selectedUser.role}</div>
            {selLoading && (
              <div className="space-y-3">
                <Skeleton lines={1} className="w-64" />
                <Skeleton lines={2} />
                <Skeleton lines={3} />
              </div>
            )}
            {selError && <div className="text-xs text-red-600">{selError}</div>}
            {!selLoading && !selError && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-xs mb-1">Capabilities ({selCaps.length})</h4>
                  {selCaps.length > 0 ? (
                    <ul className="flex flex-wrap gap-1">
                      {selCaps.map(c => <li key={c} className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">{c}</li>)}
                    </ul>
                  ) : <p className="text-[11px] text-gray-500">Nenhuma capability.</p>}
                </div>
                <div>
                  <h4 className="font-medium text-xs mb-1">Limits</h4>
                  {sortedSelLimits.length > 0 ? (
                    <table className="w-full text-[11px] border">
                      <thead><tr className="bg-slate-100"><th className="text-left p-1">Limite</th><th className="text-left p-1">Uso</th></tr></thead>
                      <tbody>
                        {sortedSelLimits.map(([k,v]) => {
                          const u = (selUsage && typeof selUsage[k] === 'number') ? selUsage[k] : null;
                          const near = (typeof v === 'number' && typeof u === 'number' && v>0) ? (u / v) >= 0.8 : false;
                          return (
                            <tr key={k} className={`odd:bg-slate-50 ${near ? 'bg-amber-50' : ''} align-top`}>
                              <td className="p-1 font-mono w-40">{k}{' '}<span className="text-[10px] text-gray-500">{v==null?'∞':v}</span></td>
                              <td className="p-1"><UsageBar value={u} limit={v} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : <p className="text-[11px] text-gray-500">Nenhum limite.</p>}
                </div>
                <OverridesSection userId={selectedUser.id} />
                <OverrideLogs userId={selectedUser.id} />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Seção de demonstração PermissionGate antiga mantida abaixo */}
      <Card className="p-4 space-y-3">
        <h2 className="font-medium text-sm">Exemplo PermissionGate</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {sampleBlocks.map(b => (
            <Card key={b.code} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{b.title}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-mono">{b.code}</span>
              </div>
              <PermissionGate anyOf={[b.code]} fallback={<div className="text-xs text-red-500">Sem acesso (capability não presente)</div>}>
                <div className="text-xs text-green-600">Acesso concedido (capability ativa)</div>
              </PermissionGate>
            </Card>
          ))}
        </div>
        <p className="text-[11px] text-gray-500">Referência de uso para componentes condicionais.</p>
      </Card>
    </div>
  );
};

export default AdminEntitlementsPage;
