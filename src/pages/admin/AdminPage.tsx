import React, { useEffect, useState } from 'react';
import { useI18n, formatDate as fmtDate } from '../../i18n';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts';
import { RoleRoute } from '../../components/RoleRoute';
import { SEO } from '../../components/comum/SEO';
import { API } from '../../config/api';

interface AdminUser { id: string; email: string; role: string; display_name?: string; created_at?: string; last_login_at?: string; plan_id?: string; email_confirmed?: number; }
interface PlanDetail { id: string; name: string; description?: string; versions: any[]; created_at: string; }

const DietManagement: React.FC = () => {
  const { getAccessToken } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [creatingName, setCreatingName] = useState('');
  const [creatingDesc, setCreatingDesc] = useState('');
  const [planFormat, setPlanFormat] = useState<'structured'|'pdf'>('structured');
  const [metaKcal, setMetaKcal] = useState('');
  const [metaProt, setMetaProt] = useState('');
  const [metaCarb, setMetaCarb] = useState('');
  const [metaFat, setMetaFat] = useState('');
  const [pdfBase64, setPdfBase64] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [targetUserQuery, setTargetUserQuery] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [targetUserLabel, setTargetUserLabel] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [userOptions, setUserOptions] = useState<AdminUser[]>([]);
  const [filterUserId, setFilterUserId] = useState('');
  const [filterUserLabel, setFilterUserLabel] = useState('');
  const [detailId, setDetailId] = useState<string|null>(null);
  const [detailIncludeData, setDetailIncludeData] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<PlanDetail | null>(null);
  const [revNotes, setRevNotes] = useState('');
  const [revMode, setRevMode] = useState<'json'|'pdf'>('json');
  const [revPatchJson, setRevPatchJson] = useState('{}');
  const [revPdfName, setRevPdfName] = useState('');
  const [revPdfBase64, setRevPdfBase64] = useState('');
  const [revising, setRevising] = useState(false);

  // Search patients (debounced)
  useEffect(()=> {
    if (!targetUserQuery) { setUserOptions([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const access = await getAccessToken(); if(!access) return;
        const url = `${API.ADMIN_USERS}?page=1&pageSize=6&q=${encodeURIComponent(targetUserQuery)}`;
        const r = await fetch(url, { headers: { authorization: `Bearer ${access}` }, signal: ctrl.signal });
        const data = await r.json().catch(()=>({}));
        setUserOptions(r.ok ? (data.results||[]) : []);
      } catch { if(!ctrl.signal.aborted) setUserOptions([]); }
      finally { setSearchingUsers(false); }
    }, 300);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [targetUserQuery, getAccessToken]);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const access = await getAccessToken(); if(!access) return;
      const qs = new URLSearchParams(); if (filterUserId) qs.set('user_id', filterUserId);
      const r = await fetch(`${API.DIET_PLANS}${qs.toString()?`?${qs.toString()}`:''}`, { headers: { authorization: `Bearer ${access}` }});
      const data = await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(data.error||'Falha');
      setPlans(data.results||[]);
    } catch(e:any) { setError(e.message||'Erro'); }
    finally { setLoading(false); }
  };
  useEffect(()=> { void load(); }, [filterUserId]);

  const openDetail = async (id: string, includeData: boolean) => {
    setDetailId(id); setDetailLoading(true); setDetail(null);
    try {
      const access = await getAccessToken(); if(!access) return;
      const r = await fetch(`${API.dietPlan(id)}${includeData?'?includeData=1':''}`, { headers: { authorization: `Bearer ${access}` }});
      const data = await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(data.error||'Falha');
      setDetail(data.plan);
    } catch(e:any) { setError(e.message||'Erro detalhe'); }
    finally { setDetailLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true); setError(null);
    try {
      const access = await getAccessToken(); if(!access) return;
      let dataObj: any; if (planFormat==='pdf' && pdfBase64) { dataObj = { format:'pdf', file:{ name: pdfName || (creatingName+'.pdf'), mime:'application/pdf', base64: pdfBase64 }, observacoes: creatingDesc||null }; }
      else if (planFormat==='structured' && (metaKcal||metaProt||metaCarb||metaFat)) {
        dataObj = { metas:{ kcal_dia: metaKcal?+metaKcal:null, proteina_g: metaProt?+metaProt:null, carbo_g: metaCarb?+metaCarb:null, gordura_g: metaFat?+metaFat:null }, refeicoes:[], observacoes: creatingDesc||null, format:'structured' };
      }
      let finalDesc = creatingDesc; if (planFormat==='pdf' && finalDesc && !/^[ \t]*\[PDF\]/i.test(finalDesc)) finalDesc = `[PDF] ${finalDesc}`;
      const body = { name: creatingName, description: finalDesc, data: dataObj, user_id: targetUserId || undefined };
      const r = await fetch(API.DIET_PLANS, { method:'POST', headers:{ 'Content-Type':'application/json', authorization:`Bearer ${access}` }, body: JSON.stringify(body) });
      const resp = await r.json().catch(()=>({})); if(!r.ok) throw new Error(resp.error||'Falha');
      await load(); setShowCreate(false);
      setCreatingName(''); setCreatingDesc(''); setPlanFormat('structured'); setMetaKcal(''); setMetaProt(''); setMetaCarb(''); setMetaFat(''); setPdfBase64(''); setPdfName(''); setTargetUserId(''); setTargetUserLabel('');
    } catch(e:any) { setError(e.message||'Erro criar'); }
    finally { setCreating(false); }
  };

  const downloadPdf = (planId: string, version: any) => {
    if (version?.data?.file?.key) {
      const url = `${location.origin}/diet/plans/${planId}/version/${version.id}/file`;
      fetch(url, { headers: { authorization: localStorage.getItem('access_token')?`Bearer ${localStorage.getItem('access_token')}`:'' } })
        .then(async r=> { if(!r.ok) throw new Error(); const blob=await r.blob(); const o=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=o; a.download=version.data.file.name||`plano_v${version.version_number}.pdf`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(o),1500); })
        .catch(()=> alert('Falha PDF'));
      return;
    }
    if (version?.data?.file?.base64) {
      try { const b64=version.data.file.base64; const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0)); const blob=new Blob([bytes],{type:'application/pdf'}); const o=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=o; a.download=version.data.file.name||`plano_v${version.version_number}.pdf`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(o),1500);} catch { alert('Falha PDF'); }
    }
  };

  const handleRevise = async (e: React.FormEvent) => {
    e.preventDefault(); if(!detailId) return; setRevising(true); setError(null);
    try {
      const access = await getAccessToken(); if(!access) return;
      let dataPatch: any; if (revMode==='pdf' && revPdfBase64) { dataPatch = { format:'pdf', file:{ name: revPdfName||'plano_rev.pdf', mime:'application/pdf', base64: revPdfBase64 } }; }
      else if (revMode==='json') { try { dataPatch = JSON.parse(revPatchJson||'{}'); } catch { alert('JSON inválido'); setRevising(false); return; } }
      const payload = { notes: revNotes || undefined, dataPatch };
      const r = await fetch(API.dietPlanRevise(detailId), { method:'POST', headers:{ 'Content-Type':'application/json', authorization:`Bearer ${access}` }, body: JSON.stringify(payload) });
      const resp = await r.json().catch(()=>({})); if(!r.ok) throw new Error(resp.error||'Falha revisão');
      await openDetail(detailId, detailIncludeData); await load(); setRevNotes(''); setRevPatchJson('{}'); setRevPdfBase64(''); setRevPdfName('');
    } catch(e:any) { setError(e.message||'Erro revisão'); }
    finally { setRevising(false); }
  };

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4 border-b flex flex-col md:flex-row gap-4 md:items-center">
        <div className="flex items-center gap-2 flex-1">
          <h3 className="text-lg font-semibold">Dietas dos Pacientes</h3>
          <div className="relative text-xs">
            <input value={targetUserQuery} onChange={e=> setTargetUserQuery(e.target.value)} placeholder="Buscar paciente..." className="border rounded px-2 py-1" />
            {targetUserQuery && (searchingUsers || userOptions.length>0) && (
              <div className="absolute z-20 mt-1 bg-white border rounded shadow w-64 max-h-60 overflow-auto">
                {searchingUsers && <div className="p-2 text-gray-500 text-xs">Buscando...</div>}
                {!searchingUsers && userOptions.map(u => (
                  <button type="button" key={u.id} onClick={()=> { setFilterUserId(u.id); setFilterUserLabel(u.display_name||u.email); setTargetUserQuery(''); }} className="block w-full text-left px-2 py-1 hover:bg-green-50 text-[11px]">{(u.display_name||u.email)} <span className="text-gray-400">· {u.id.slice(0,6)}</span></button>
                ))}
                {!searchingUsers && userOptions.length===0 && <div className="p-2 text-gray-400 text-[11px]">Sem resultados</div>}
              </div>
            )}
          </div>
          {filterUserId && (
            <div className="flex items-center gap-1 text-[11px] bg-green-50 px-2 py-1 rounded">
              <span>{filterUserLabel || filterUserId.slice(0,8)}</span>
              <button onClick={()=> { setFilterUserId(''); setFilterUserLabel(''); }} className="text-red-500">×</button>
            </div>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="secondary" onClick={load} disabled={loading}>Atualizar</Button>
          <Button onClick={()=> setShowCreate(true)}>Nova Dieta</Button>
        </div>
      </div>
      {error && <div className="p-4 text-sm text-red-600">{error}</div>}
      <div className="p-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading && <div className="text-sm text-gray-500">Carregando...</div>}
        {!loading && plans.map(p => (
          <Card key={p.id} className="p-4 space-y-1">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-sm">{p.name}</h4>
                <p className="text-[11px] text-gray-500 line-clamp-2">{p.description || 'Sem descrição'}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${p.status==='active'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600'}`}>{p.status}</span>
            </div>
            <div className="flex gap-2 text-[10px] pt-1 flex-wrap">
              {p.format && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded">{p.format}</span>}
              {p.start_date && <span>Início: {p.start_date.slice(0,10)}</span>}
              {p.user_id && <span className="text-gray-500">User: {p.user_id.slice(0,6)}</span>}
            </div>
            <div className="pt-2"><Button variant="secondary" className="w-full text-xs" onClick={()=> openDetail(p.id, detailIncludeData)}>Detalhes</Button></div>
          </Card>
        ))}
        {!loading && plans.length===0 && <div className="text-sm text-gray-500 col-span-full">Nenhum plano ainda.</div>}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">Criar Dieta</h2>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium mb-1">Paciente</label>
                <div className="flex gap-2 items-center">
                  <input value={targetUserLabel} readOnly placeholder="Selecione abaixo" className="flex-1 border rounded px-2 py-1 bg-gray-50" />
                  {targetUserId && <button type="button" onClick={()=> { setTargetUserId(''); setTargetUserLabel(''); }} className="text-red-600">Limpar</button>}
                </div>
                <div className="mt-2 relative">
                  <input value={targetUserQuery} onChange={e=> setTargetUserQuery(e.target.value)} placeholder="Buscar..." className="w-full border rounded px-2 py-1" />
                  {targetUserQuery && (searchingUsers || userOptions.length>0) && (
                    <div className="absolute z-20 mt-1 bg-white border rounded shadow w-full max-h-48 overflow-auto">
                      {searchingUsers && <div className="p-2 text-gray-500">Buscando...</div>}
                      {!searchingUsers && userOptions.map(u => (
                        <button type="button" key={u.id} onClick={()=> { setTargetUserId(u.id); setTargetUserLabel(u.display_name||u.email); setTargetUserQuery(''); }} className="block w-full text-left px-2 py-1 hover:bg-green-50 text-[11px]">{u.display_name||u.email} <span className="text-gray-400">· {u.id.slice(0,6)}</span></button>
                      ))}
                      {!searchingUsers && userOptions.length===0 && <div className="p-2 text-gray-400 text-[11px]">Sem resultados</div>}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1">Nome</label>
                <input value={creatingName} onChange={e=> setCreatingName(e.target.value)} required className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block font-medium mb-1">Descrição</label>
                <textarea value={creatingDesc} onChange={e=> setCreatingDesc(e.target.value)} className="w-full border rounded px-3 py-2 h-20 resize-none text-sm" />
              </div>
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-1"><input type="radio" value="structured" checked={planFormat==='structured'} onChange={()=> setPlanFormat('structured')} /> Estruturado</label>
                <label className="flex items-center gap-1"><input type="radio" value="pdf" checked={planFormat==='pdf'} onChange={()=> setPlanFormat('pdf')} /> PDF</label>
              </div>
              {planFormat==='pdf' && (
                <div className="space-y-2">
                  <label className="block font-medium mb-1">Arquivo PDF</label>
                  <input type="file" accept="application/pdf" onChange={e=> { const f=e.target.files?.[0]; if(!f){ setPdfBase64(''); setPdfName(''); return;} if(f.size>5*1024*1024){ alert('Limite 5MB'); return;} setPdfName(f.name); const reader=new FileReader(); reader.onload=()=> { const res=reader.result as string; setPdfBase64(res.split(',')[1]||''); }; reader.readAsDataURL(f); }} />
                  {pdfName && <p className="text-[11px] text-gray-600">Selecionado: {pdfName}</p>}
                </div>
              )}
              {planFormat==='structured' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[11px] font-medium mb-1">Kcal/dia</label><input value={metaKcal} onChange={e=> setMetaKcal(e.target.value)} className="w-full border rounded px-2 py-1 text-xs" /></div>
                  <div><label className="block text-[11px] font-medium mb-1">Proteína (g)</label><input value={metaProt} onChange={e=> setMetaProt(e.target.value)} className="w-full border rounded px-2 py-1 text-xs" /></div>
                  <div><label className="block text-[11px] font-medium mb-1">Carbo (g)</label><input value={metaCarb} onChange={e=> setMetaCarb(e.target.value)} className="w-full border rounded px-2 py-1 text-xs" /></div>
                  <div><label className="block text-[11px] font-medium mb-1">Gordura (g)</label><input value={metaFat} onChange={e=> setMetaFat(e.target.value)} className="w-full border rounded px-2 py-1 text-xs" /></div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={()=> setShowCreate(false)}>Cancelar</Button>
                <Button type="submit" disabled={creating}>{creating ? 'Criando...' : 'Criar'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailId && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Plano de Dieta</h2>
              <button onClick={()=> { setDetailId(null); setDetail(null); }} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1"><input type="checkbox" checked={detailIncludeData} onChange={e=> { setDetailIncludeData(e.target.checked); if(detailId) void openDetail(detailId, e.target.checked); }} /> Incluir dados completos</label>
              <button className="text-green-700 underline" onClick={()=> detailId && openDetail(detailId, detailIncludeData)}>Recarregar</button>
            </div>
            {detailLoading && <div className="text-sm text-gray-500">Carregando...</div>}
            {!detailLoading && detail && (
              <div className="space-y-4 text-xs">
                <div>
                  <h3 className="font-semibold text-lg">{detail.name}</h3>
                  <p className="text-sm text-gray-600">{detail.description || 'Sem descrição'}</p>
                  <p className="text-[11px] text-gray-400">Criado em {fmtDate(detail.created_at,'pt',{ dateStyle:'short', timeStyle:'short'})}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Versões</h4>
                  <div className="max-h-72 overflow-y-auto border rounded divide-y">
                    {detail.versions.map(v => (
                      <div key={v.id} className="p-2 space-y-1">
                        <div className="flex justify-between"><span>v{v.version_number}</span><span>{fmtDate(v.created_at,'pt',{ dateStyle:'short'})}</span></div>
                        {v.notes && <div className="italic text-gray-600">{v.notes}</div>}
                        {detailIncludeData && v.data?.format==='pdf' && (v.data?.file?.key || v.data?.file?.base64) && <button type="button" className="text-blue-600 underline" onClick={()=> downloadPdf(detail.id, v)}>Baixar PDF</button>}
                        {detailIncludeData && v.data && <pre className="bg-gray-900 text-gray-100 p-2 rounded overflow-x-auto text-[10px] max-h-40">{JSON.stringify(v.data,null,2)}</pre>}
                      </div>
                    ))}
                  </div>
                </div>
                <form onSubmit={handleRevise} className="space-y-3 border-t pt-4">
                  <h4 className="font-semibold">Nova Revisão</h4>
                  <div>
                    <label className="block font-medium mb-1">Notas</label>
                    <textarea value={revNotes} onChange={e=> setRevNotes(e.target.value)} className="w-full border rounded px-2 py-1 h-16 resize-none" />
                  </div>
                  <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-1"><input type="radio" value="json" checked={revMode==='json'} onChange={()=> setRevMode('json')} /> Patch JSON</label>
                    <label className="flex items-center gap-1"><input type="radio" value="pdf" checked={revMode==='pdf'} onChange={()=> setRevMode('pdf')} /> Novo PDF</label>
                  </div>
                  {revMode==='json' && (
                    <div>
                      <label className="block font-medium mb-1">Patch (JSON)</label>
                      <textarea value={revPatchJson} onChange={e=> setRevPatchJson(e.target.value)} className="w-full border rounded px-2 py-1 font-mono h-40 resize-none" />
                    </div>
                  )}
                  {revMode==='pdf' && (
                    <div className="space-y-2">
                      <label className="block font-medium mb-1">Arquivo PDF</label>
                      <input type="file" accept="application/pdf" onChange={e=> { const f=e.target.files?.[0]; if(!f){ setRevPdfBase64(''); setRevPdfName(''); return;} if(f.size>5*1024*1024){ alert('Limite 5MB'); return;} setRevPdfName(f.name); const reader=new FileReader(); reader.onload=()=> { const res=reader.result as string; setRevPdfBase64(res.split(',')[1]||''); }; reader.readAsDataURL(f); }} />
                      {revPdfName && <p className="text-[11px] text-gray-600">Selecionado: {revPdfName}</p>}
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={()=> { setRevNotes(''); setRevPatchJson('{}'); setRevPdfBase64(''); setRevPdfName(''); }}>Limpar</Button>
                    <Button type="submit" disabled={revising}>{revising?'Salvando...':'Aplicar Revisão'}</Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

const AdminPage: React.FC = () => {
  const { logout } = useAuth();
  const { t } = useI18n();
  return (
    <RoleRoute role="admin">
      <div className="min-h-screen flex flex-col bg-gray-50 p-4">
        <SEO title={t('admin.dashboard.seo.title')} description={t('admin.dashboard.seo.desc')} />
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-green-700">{t('admin.dashboard.title')}</h2>
            <div className="flex gap-3 items-center text-sm">
              <Link to="/admin/entitlements" className="text-green-700 hover:underline">Entitlements</Link>
              <Button variant="secondary" onClick={logout}>Sair</Button>
            </div>
          </div>
          <DietManagement />
        </div>
      </div>
    </RoleRoute>
  );
};

export default AdminPage;
