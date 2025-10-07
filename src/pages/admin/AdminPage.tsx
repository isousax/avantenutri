
import React, { useEffect, useMemo, useState } from "react";
import Skeleton from "../../components/ui/Skeleton";
import { useI18n, formatDate as fmtDate } from "../../i18n";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useAuth } from "../../contexts";
import { RoleRoute } from "../../components/RoleRoute";
import { SEO } from "../../components/comum/SEO";
import { API } from "../../config/api";
import AdminNotificationSender from "../../components/admin/AdminNotificationSender";
import AdminCreditsPanel from "../../components/admin/AdminCreditsPanel";
import StructuredDietBuilder from "../../components/diet/StructuredDietBuilder";
import StructuredDietView from "../../components/diet/StructuredDietView";
import type { StructuredDietData } from "../../types/structuredDiet";
import { downloadDietJson, printDiet, dietHasItems, copyDietJson, copyDietHtml } from "../../utils/structuredDietExport";
import { exportDietPdf } from "../../utils/structuredDietPdf";

/* --- Types --- */
interface AdminUser {
  id: string;
  email: string;
  role: string;
  display_name?: string;
  created_at?: string;
  last_login_at?: string;
  email_confirmed?: number;
}
interface Consultation {
  id: string;
  user_id: string;
  type: string;
  status: string;
  scheduled_at: string;
  duration_min: number;
  urgency?: string;
}

/* --- Diet types --- */
interface PlanDetail {
  id: string;
  name: string;
  description?: string;
  versions: any[];
  created_at: string;
}

/* ---------------------------
   DietManagement component
   (integrated from the older file)
   --------------------------- */
const DietManagement: React.FC = () => {
  const { getAccessToken } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [creatingName, setCreatingName] = useState("");
  const [creatingDesc, setCreatingDesc] = useState("");
  const [planFormat, setPlanFormat] = useState<"structured" | "pdf">("structured");
  const [structuredCreateData, setStructuredCreateData] = useState<StructuredDietData | null>(null);
  const [pdfBase64, setPdfBase64] = useState("");
  const [pdfName, setPdfName] = useState("");
  const [targetUserQuery, setTargetUserQuery] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [targetUserLabel, setTargetUserLabel] = useState("");
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [userOptions, setUserOptions] = useState<AdminUser[]>([]);
  const [filterUserId, setFilterUserId] = useState("");
  const [filterUserLabel, setFilterUserLabel] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailIncludeData, setDetailIncludeData] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<PlanDetail | null>(null);
  const [revNotes, setRevNotes] = useState("");
  const [revMode, setRevMode] = useState<"json" | "pdf" | "structured">("json");
  const [revStructuredData, setRevStructuredData] = useState<StructuredDietData | null>(null);
  const [revPatchJson, setRevPatchJson] = useState("{}");
  const [revPdfName, setRevPdfName] = useState("");
  const [revPdfBase64, setRevPdfBase64] = useState("");
  const [revising, setRevising] = useState(false);
  const [exportShowAlternatives, setExportShowAlternatives] = useState(true);
  const [pdfExportingVersion, setPdfExportingVersion] = useState<string | null>(null);
  const [pdfExportPhase, setPdfExportPhase] = useState<string>('');
  // PDF advanced options
  const [pdfIncludeCover, setPdfIncludeCover] = useState(true);
  const [pdfIncludeTotalsOnCover, setPdfIncludeTotalsOnCover] = useState(true);
  const [pdfWatermarkRepeat, setPdfWatermarkRepeat] = useState(true);
  const [pdfWatermarkOpacity, setPdfWatermarkOpacity] = useState(0.08);
  const [pdfIncludeQr, setPdfIncludeQr] = useState(false);
  const [showPdfOptions, setShowPdfOptions] = useState(false);

  // Search patients (debounced)
  useEffect(() => {
    if (!targetUserQuery) {
      setUserOptions([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const access = await getAccessToken();
        if (!access) return;
        const url = `${API.ADMIN_USERS}?page=1&pageSize=6&q=${encodeURIComponent(targetUserQuery)}`;
        const r = await fetch(url, { headers: { authorization: `Bearer ${access}` }, signal: ctrl.signal });
        const data = await r.json().catch(() => ({}));
        setUserOptions(r.ok ? data.results || [] : []);
      } catch {
        if (!ctrl.signal.aborted) setUserOptions([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [targetUserQuery, getAccessToken]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const access = await getAccessToken();
      if (!access) return;
      const qs = new URLSearchParams();
      if (filterUserId) qs.set("user_id", filterUserId);
      const r = await fetch(`${API.DIET_PLANS}${qs.toString() ? `?${qs.toString()}` : ""}`, { headers: { authorization: `Bearer ${access}` } });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Falha");
      setPlans(data.results || []);
    } catch (e: any) {
      setError(e.message || "Erro");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterUserId]);

  const openDetail = async (id: string, includeData: boolean) => {
    setDetailId(id);
    setDetailLoading(true);
    setDetail(null);
    try {
      const access = await getAccessToken();
      if (!access) return;
      const r = await fetch(`${API.dietPlan(id)}${includeData ? "?includeData=1" : ""}`, { headers: { authorization: `Bearer ${access}` } });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Falha");
      setDetail(data.plan);
    } catch (e: any) {
      setError(e.message || "Erro detalhe");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (planFormat === 'structured' && !dietHasItems(structuredCreateData)) { alert('Dieta estruturada vazia.'); return; }
    setCreating(true);
    setError(null);
    try {
      const access = await getAccessToken();
      if (!access) return;
      let dataObj: any;
      if (planFormat === "pdf" && pdfBase64) {
        dataObj = { format: "pdf", file: { name: pdfName || (creatingName + ".pdf"), mime: "application/pdf", base64: pdfBase64 }, observacoes: creatingDesc || null };
      } else if (planFormat === "structured" && structuredCreateData) {
        dataObj = structuredCreateData;
      }
      let finalDesc = creatingDesc;
      if (planFormat === "pdf" && finalDesc && !/^[ \t]*\[PDF\]/i.test(finalDesc)) finalDesc = `[PDF] ${finalDesc}`;
      const body = { name: creatingName, description: finalDesc, data: dataObj, user_id: targetUserId || undefined };
      const r = await fetch(API.DIET_PLANS, { method: "POST", headers: { "Content-Type": "application/json", authorization: `Bearer ${access}` }, body: JSON.stringify(body) });
      const resp = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(resp.error || "Falha");
      await load();
      setShowCreate(false);
      setCreatingName("");
      setCreatingDesc("");
  setPlanFormat("structured");
  setStructuredCreateData(null);
   try { localStorage.removeItem('structuredDietDraft'); } catch {}
      setPdfBase64("");
      setPdfName("");
      setTargetUserId("");
      setTargetUserLabel("");
    } catch (e: any) {
      setError(e.message || "Erro criar");
    } finally {
      setCreating(false);
    }
  };

  const downloadPdf = (planId: string, version: any) => {
    if (version?.data?.file?.key) {
      const url = `${API.API_AUTH_BASE}/diet/plans/${planId}/version/${version.id}/file`;
      fetch(url, { headers: { authorization: localStorage.getItem("access_token") ? `Bearer ${localStorage.getItem("access_token")}` : "" } })
        .then(async (r) => {
          if (!r.ok) throw new Error();
          const blob = await r.blob();
          const o = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = o;
          a.download = version.data.file.name || `plano_v${version.version_number}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(o), 1500);
        })
        .catch(() => alert("Falha PDF"));
      return;
    }
    if (version?.data?.file?.base64) {
      try {
        const b64 = version.data.file.base64;
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: "application/pdf" });
        const o = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = o;
        a.download = version.data.file.name || `plano_v${version.version_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(o), 1500);
      } catch {
        alert("Falha PDF");
      }
    }
  };

  const handleRevise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailId) return;
    if (revMode === 'structured' && !dietHasItems(revStructuredData)) { alert('Dieta estruturada vazia.'); return; }
    setRevising(true);
    setError(null);
    try {
      const access = await getAccessToken();
      if (!access) return;
      let dataPatch: any;
      if (revMode === "pdf" && revPdfBase64) {
        dataPatch = { format: "pdf", file: { name: revPdfName || "plano_rev.pdf", mime: "application/pdf", base64: revPdfBase64 } };
      } else if (revMode === "json") {
        try {
          dataPatch = JSON.parse(revPatchJson || "{}");
        } catch {
          alert("JSON inválido");
          setRevising(false);
          return;
        }
      }
      const payload = { notes: revNotes || undefined, dataPatch };
      const r = await fetch(API.dietPlanRevise(detailId), { method: "POST", headers: { "Content-Type": "application/json", authorization: `Bearer ${access}` }, body: JSON.stringify(payload) });
      const resp = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(resp.error || "Falha revisão");
      await openDetail(detailId, detailIncludeData);
      await load();
      setRevNotes("");
      setRevPatchJson("{}");
      setRevPdfBase64("");
      setRevPdfName("");
    } catch (e: any) {
      setError(e.message || "Erro revisão");
    } finally {
      setRevising(false);
    }
  };

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4 border-b flex flex-col md:flex-row gap-4 md:items-center">
        <div className="flex items-center gap-2 flex-1">
          <h3 className="text-lg font-semibold">Dietas dos Pacientes</h3>
          <div className="relative text-xs">
            <input value={targetUserQuery} onChange={(e) => setTargetUserQuery(e.target.value)} placeholder="Buscar paciente..." className="border rounded px-2 py-1" />
            {targetUserQuery && (searchingUsers || userOptions.length > 0) && (
              <div className="absolute z-20 mt-1 bg-white border rounded shadow w-64 max-h-60 overflow-auto">
                {searchingUsers && <div className="p-2 text-gray-500 text-xs">Buscando...</div>}
                {!searchingUsers && userOptions.map((u) => (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => { setFilterUserId(u.id); setFilterUserLabel(u.display_name || u.email); setTargetUserQuery(""); }}
                    className="block w-full text-left px-2 py-1 hover:bg-green-50 text-[11px]"
                  >
                    {u.display_name || u.email} <span className="text-gray-400">· {u.id.slice(0, 6)}</span>
                  </button>
                ))}
                {!searchingUsers && userOptions.length === 0 && <div className="p-2 text-gray-400 text-[11px]">Sem resultados</div>}
              </div>
            )}
          </div>
          {filterUserId && (
            <div className="flex items-center gap-1 text-[11px] bg-green-50 px-2 py-1 rounded">
              <span>{filterUserLabel || filterUserId.slice(0, 8)}</span>
              <button onClick={() => { setFilterUserId(""); setFilterUserLabel(""); }} className="text-red-500">×</button>
            </div>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="secondary" onClick={load} disabled={loading}>Atualizar</Button>
          <Button onClick={() => setShowCreate(true)}>Nova Dieta</Button>
        </div>
      </div>

      {error && <div className="p-4 text-sm text-red-600">{error}</div>}

      <div className="p-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading && <div className="text-sm text-gray-500">Carregando...</div>}
        {!loading && plans.map((p) => (
          <Card key={p.id} className="p-4 space-y-1">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-sm">{p.name}</h4>
                <p className="text-[11px] text-gray-500 line-clamp-2">{p.description || "Sem descrição"}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{p.status}</span>
            </div>
            <div className="flex gap-2 text-[10px] pt-1 flex-wrap">
              {p.format && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded">{p.format}</span>}
              {p.start_date && <span>Início: {p.start_date.slice(0, 10)}</span>}
              {p.user_id && <span className="text-gray-500">User: {p.user_id.slice(0, 6)}</span>}
            </div>
            <div className="pt-2"><Button variant="secondary" className="w-full text-xs" onClick={() => openDetail(p.id, detailIncludeData)}>Detalhes</Button></div>
          </Card>
        ))}
        {!loading && plans.length === 0 && <div className="text-sm text-gray-500 col-span-full">Nenhum plano ainda.</div>}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-2 md:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-6xl my-4 p-4 md:p-6 space-y-4 max-h-[95vh] overflow-y-auto">
            <h2 className="text-lg font-semibold">Criar Dieta</h2>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium mb-1">Paciente</label>
                <div className="flex gap-2 items-center">
                  <input value={targetUserLabel} readOnly placeholder="Selecione abaixo" className="flex-1 border rounded px-2 py-1 bg-gray-50" />
                  {targetUserId && <button type="button" onClick={() => { setTargetUserId(""); setTargetUserLabel(""); }} className="text-red-600">Limpar</button>}
                </div>
                <div className="mt-2 relative">
                  <input value={targetUserQuery} onChange={(e) => setTargetUserQuery(e.target.value)} placeholder="Buscar..." className="w-full border rounded px-2 py-1" />
                  {targetUserQuery && (searchingUsers || userOptions.length > 0) && (
                    <div className="absolute z-20 mt-1 bg-white border rounded shadow w-full max-h-48 overflow-auto">
                      {searchingUsers && <div className="p-2 text-gray-500">Buscando...</div>}
                      {!searchingUsers && userOptions.map((u) => (
                        <button type="button" key={u.id} onClick={() => { setTargetUserId(u.id); setTargetUserLabel(u.display_name || u.email); setTargetUserQuery(""); }} className="block w-full text-left px-2 py-1 hover:bg-green-50 text-[11px]">
                          {u.display_name || u.email} <span className="text-gray-400">· {u.id.slice(0, 6)}</span>
                        </button>
                      ))}
                      {!searchingUsers && userOptions.length === 0 && <div className="p-2 text-gray-400 text-[11px]">Sem resultados</div>}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Nome</label>
                <input value={creatingName} onChange={(e) => setCreatingName(e.target.value)} required className="w-full border rounded px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="block font-medium mb-1">Descrição</label>
                <textarea value={creatingDesc} onChange={(e) => setCreatingDesc(e.target.value)} className="w-full border rounded px-3 py-2 h-20 resize-none text-sm" />
              </div>

              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-1"><input type="radio" value="structured" checked={planFormat === "structured"} onChange={() => setPlanFormat("structured")} /> Estruturado</label>
                <label className="flex items-center gap-1"><input type="radio" value="pdf" checked={planFormat === "pdf"} onChange={() => setPlanFormat("pdf")} /> PDF</label>
              </div>

              {planFormat === "pdf" && (
                <div className="space-y-2">
                  <label className="block font-medium mb-1">Arquivo PDF</label>
                  <input type="file" accept="application/pdf" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) { setPdfBase64(""); setPdfName(""); return; }
                    if (f.size > 5 * 1024 * 1024) { alert("Limite 5MB"); return; }
                    setPdfName(f.name);
                    const reader = new FileReader();
                    reader.onload = () => { const res = reader.result as string; setPdfBase64(res.split(",")[1] || ""); };
                    reader.readAsDataURL(f);
                  }} />
                  {pdfName && <p className="text-[11px] text-gray-600">Selecionado: {pdfName}</p>}
                </div>
              )}

              {planFormat === "structured" && (
                <div className="border rounded p-2 bg-white/60">
                  <h5 className="text-xs font-semibold mb-2">Montar Dieta Estruturada</h5>
                  <StructuredDietBuilder value={structuredCreateData} onChange={setStructuredCreateData} showAlternatives={exportShowAlternatives} onToggleAlternatives={setExportShowAlternatives} />
                  {!structuredCreateData && <p className="text-[10px] text-amber-700 mt-1">Adicione pelo menos um alimento antes de criar.</p>}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
                <Button type="submit" disabled={creating}>{creating ? "Criando..." : "Criar"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detailId && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Plano de Dieta</h2>
              <button onClick={() => { setDetailId(null); setDetail(null); }} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1"><input type="checkbox" checked={detailIncludeData} onChange={(e) => { setDetailIncludeData(e.target.checked); if (detailId) void openDetail(detailId, e.target.checked); }} /> Incluir dados completos</label>
              <button className="text-green-700 underline" onClick={() => detailId && openDetail(detailId, detailIncludeData)}>Recarregar</button>
            </div>

            {detailLoading && <div className="text-sm text-gray-500">Carregando...</div>}

            {!detailLoading && detail && (
              <div className="space-y-4 text-xs">
                <div>
                  <h3 className="font-semibold text-lg">{detail.name}</h3>
                  <p className="text-sm text-gray-600">{detail.description || "Sem descrição"}</p>
                  <p className="text-[11px] text-gray-400">Criado em {fmtDate(detail.created_at, "pt", { dateStyle: "short", timeStyle: "short" })}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Versões</h4>
                  <div className="max-h-72 overflow-y-auto border rounded divide-y">
                    {detail.versions.map((v) => (
                      <div key={v.id} className="p-2 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-2">v{v.version_number}{v === detail.versions[0] && <span className="text-[10px] bg-green-100 text-green-700 px-1 py-0.5 rounded">Atual</span>}</span>
                          <span>{fmtDate(v.created_at, "pt", { dateStyle: "short" })}</span>
                        </div>
                        {v.notes && <div className="italic text-gray-600">{v.notes}</div>}
                        {detailIncludeData && v.data?.format === "pdf" && (v.data?.file?.key || v.data?.file?.base64) && (
                          <button type="button" className="text-blue-600 underline" onClick={() => downloadPdf(detail.id, v)}>Baixar PDF</button>
                        )}
                        {detailIncludeData && v.data && v.data.versao === 1 && Array.isArray(v.data.meals) && (
                          <div className="space-y-1">
                            <StructuredDietView data={v.data} compact />
                            <div className="flex gap-2 flex-wrap text-[10px] items-center">
                              <button type="button" className="px-2 py-1 bg-emerald-600 text-white rounded" onClick={() => downloadDietJson(v.data, `dieta_v${v.version_number}.json`)}>JSON</button>
                              <button type="button" className="px-2 py-1 bg-blue-600 text-white rounded" onClick={() => printDiet(v.data, `Dieta v${v.version_number}`, { showAlternatives: exportShowAlternatives })}>Imprimir / PDF</button>
                              <button
                                type="button"
                                disabled={pdfExportingVersion === v.id}
                                className={`px-2 py-1 rounded text-white ${pdfExportingVersion === v.id ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                onClick={async () => {
                                  if (pdfExportingVersion) return;
                                  setPdfExportingVersion(v.id);
                                  setPdfExportPhase('preparando');
                                  try {
                                    await exportDietPdf(v.data, {
                                      filename: `dieta_v${v.version_number}.pdf`,
                                      title: `Dieta v${v.version_number}`,
                                      showAlternatives: exportShowAlternatives,
                                      headerText: 'Plano Nutricional',
                                      footerText: 'AvanteNutri - Confidencial',
                                      watermarkText: 'AvanteNutri',
                                      watermarkRepeat: pdfWatermarkRepeat,
                                      watermarkOpacity: pdfWatermarkOpacity,
                                      cover: pdfIncludeCover ? {
                                        title: `Plano Nutricional v${v.version_number}`,
                                        subtitle: detail?.name || 'Paciente',
                                        showTotals: pdfIncludeTotalsOnCover,
                                        notes: v.notes || detail?.description || '',
                                        date: new Date(v.created_at),
                                        qrUrl: pdfIncludeQr ? `${location.origin}/plan/${detail?.id || ''}` : undefined
                                      } : undefined,
                                      phaseLabels: {
                                        prepare: 'Preparando',
                                        render: 'Renderizando',
                                        cover: 'Capa',
                                        paginate: 'Paginando',
                                        finalize: 'Finalizando',
                                        done: 'Concluído'
                                      },
                                      onProgress: (ph) => setPdfExportPhase(ph)
                                    });
                                  } catch (err) {
                                    console.error(err);
                                    alert('Falha ao gerar PDF');
                                  } finally {
                                    setPdfExportingVersion(null);
                                    setPdfExportPhase('');
                                  }
                                }}
                              >{pdfExportingVersion === v.id ? `Gerando (${pdfExportPhase})...` : 'PDF Direto'}</button>
                              <button type="button" className="px-2 py-1 bg-amber-600 text-white rounded" onClick={() => copyDietJson(v.data)}>Copiar JSON</button>
                              <button type="button" className="px-2 py-1 bg-amber-700 text-white rounded" onClick={() => copyDietHtml(v.data, `Dieta v${v.version_number}`, { showAlternatives: exportShowAlternatives })}>Copiar HTML</button>
                              <label className="flex items-center gap-1 cursor-pointer select-none ml-2"><input type="checkbox" checked={exportShowAlternatives} onChange={e=>setExportShowAlternatives(e.target.checked)} /> Alternativas</label>
                              <button type="button" className="px-2 py-1 bg-gray-500 text-white rounded" onClick={()=>setShowPdfOptions(s=>!s)}>{showPdfOptions? 'Fechar Opções':'Opções PDF'}</button>
                            </div>
                            {showPdfOptions && (
                              <div className="mt-2 p-2 border rounded bg-gray-50 space-y-2 text-[10px]">
                                <div className="flex flex-wrap gap-4">
                                  <label className="flex items-center gap-1"><input type="checkbox" checked={pdfIncludeCover} onChange={e=>setPdfIncludeCover(e.target.checked)} /> Capa</label>
                                  <label className="flex items-center gap-1"><input type="checkbox" checked={pdfIncludeTotalsOnCover} disabled={!pdfIncludeCover} onChange={e=>setPdfIncludeTotalsOnCover(e.target.checked)} /> Totais na capa</label>
                                  <label className="flex items-center gap-1"><input type="checkbox" checked={pdfWatermarkRepeat} onChange={e=>setPdfWatermarkRepeat(e.target.checked)} /> Repetir watermark</label>
                                  <label className="flex items-center gap-1"><input type="checkbox" checked={pdfIncludeQr} onChange={e=>setPdfIncludeQr(e.target.checked)} /> QR Link</label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="text-[10px]">Opacidade watermark</label>
                                  <input type="range" min={0.02} max={0.3} step={0.01} value={pdfWatermarkOpacity} onChange={e=>setPdfWatermarkOpacity(parseFloat(e.target.value))} />
                                  <span>{pdfWatermarkOpacity.toFixed(2)}</span>
                                </div>
                                <p className="text-gray-500">Essas opções afetam apenas a geração do PDF Direto.</p>
                              </div>
                            )}
                          </div>
                        )}
                        {detailIncludeData && v.data && v.data.versao !== 1 && (
                          <pre className="bg-gray-900 text-gray-100 p-2 rounded overflow-x-auto text-[10px] max-h-40">{JSON.stringify(v.data, null, 2)}</pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleRevise} className="space-y-3 border-t pt-4">
                  <h4 className="font-semibold">Nova Revisão</h4>
                  <div>
                    <label className="block font-medium mb-1">Notas</label>
                    <textarea value={revNotes} onChange={(e) => setRevNotes(e.target.value)} className="w-full border rounded px-2 py-1 h-16 resize-none" />
                  </div>

                  <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-1"><input type="radio" value="json" checked={revMode === "json"} onChange={() => setRevMode("json")} /> Patch JSON</label>
                    <label className="flex items-center gap-1"><input type="radio" value="structured" checked={revMode === "structured"} onChange={() => { setRevMode("structured"); if (detail?.versions?.[0]?.data?.versao === 1) setRevStructuredData(detail.versions[0].data); }} /> Estruturado</label>
                    <label className="flex items-center gap-1"><input type="radio" value="pdf" checked={revMode === "pdf"} onChange={() => setRevMode("pdf")} /> Novo PDF</label>
                  </div>

                  {revMode === "json" && (
                    <div>
                      <label className="block font-medium mb-1">Patch (JSON)</label>
                      <textarea value={revPatchJson} onChange={(e) => setRevPatchJson(e.target.value)} className="w-full border rounded px-2 py-1 font-mono h-40 resize-none" />
                    </div>
                  )}

                  {revMode === "pdf" && (
                    <div className="space-y-2">
                      <label className="block font-medium mb-1">Arquivo PDF</label>
                      <input type="file" accept="application/pdf" onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) { setRevPdfBase64(""); setRevPdfName(""); return; }
                        if (f.size > 5 * 1024 * 1024) { alert("Limite 5MB"); return; }
                        setRevPdfName(f.name);
                        const reader = new FileReader();
                        reader.onload = () => { const res = reader.result as string; setRevPdfBase64(res.split(",")[1] || ""); };
                        reader.readAsDataURL(f);
                      }} />
                      {revPdfName && <p className="text-[11px] text-gray-600">Selecionado: {revPdfName}</p>}
                    </div>
                  )}

                  {revMode === "structured" && (
                    <div className="border rounded p-2 bg-white/60">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-semibold text-xs">Editar Dieta Estruturada</h5>
                        {detail?.versions?.[0]?.data?.versao === 1 && (
                          <button type="button" className="text-[10px] underline text-green-700" onClick={() => setRevStructuredData(detail.versions[0].data)}>Carregar Atual</button>
                        )}
                      </div>
                      <StructuredDietBuilder value={revStructuredData} onChange={setRevStructuredData} />
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={() => { setRevNotes(""); setRevPatchJson("{}"); setRevPdfBase64(""); setRevPdfName(""); }}>Limpar</Button>
                    <Button type="submit" disabled={revising}>{revising ? "Salvando..." : "Aplicar Revisão"}</Button>
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

/* ---------------------------
   AdminPage (main)
   - original new UI merged with DietManagement as a tab
   --------------------------- */
const AdminPage: React.FC = () => {
  const { logout, getAccessToken } = useAuth();
  const [tab, setTab] = useState<"pacientes" | "consultas" | "relatorios" | "dietas" | "notificacoes" | "creditos">("pacientes");
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersHasMore, setUsersHasMore] = useState(false);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [consultLoading, setConsultLoading] = useState(false);
  const [consultFilters, setConsultFilters] = useState<{ status?: string }>({});
  const pageSize = 20;

  // Fetch users (patients). API supports pagination + q filter.
  useEffect(() => {
    if (tab !== "pacientes") return;
    let ignore = false;
    async function load() {
      setUsersLoading(true);
      try {
        const access = await getAccessToken();
        if (!access) {
          if (!ignore) { setUsers([]); }
          return;
        }
        const params = new URLSearchParams({ page: String(usersPage), pageSize: String(pageSize) });
        if (searchTerm) params.set("q", searchTerm);
        const r = await fetch(`${API.ADMIN_USERS}?${params.toString()}`, { headers: { authorization: `Bearer ${access}` } });
        if (!r.ok) throw new Error("fail");
        const data = await r.json();
        if (ignore) return;
        setUsers(data.results || []);
        setUsersHasMore((data.results || []).length === pageSize);
      } catch {
        if (!ignore) setUsers([]);
      } finally {
        if (!ignore) setUsersLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [tab, usersPage, searchTerm, getAccessToken]);

  // Fetch consultations
  useEffect(() => {
    if (tab !== "consultas") return;
    let ignore = false;
    async function load() {
      setConsultLoading(true);
      try {
        const access = await getAccessToken();
        if (!access) { if (!ignore) { setConsultations([]); } return; }
        const params = new URLSearchParams({ page: "1", pageSize: "50" });
        if (consultFilters.status) params.set("status", consultFilters.status);
        const r = await fetch(`${API.ADMIN_CONSULTATIONS}?${params.toString()}`, { headers: { authorization: `Bearer ${access}` } });
        if (!r.ok) throw new Error("fail");
        const data = await r.json();
        if (ignore) return;
        setConsultations(data.results || []);
      } catch {
        if (!ignore) setConsultations([]);
      } finally {
        if (!ignore) setConsultLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [tab, consultFilters, getAccessToken]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const s = searchTerm.toLowerCase();
    return users.filter(u => (u.display_name || "").toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
  }, [users, searchTerm]);

  const stats = useMemo(() => ({
    totalPacientes: users.length,
    pendentes: 0, // backend ainda não fornece pagamento aqui
    emAndamento: 0,
    atrasados: 0
  }), [users]);

  const { t } = useI18n();

  return (
    <RoleRoute role="admin">
      <div className="w-full space-y-6">
        <SEO title={t("admin.dashboard.seo.title")} description={t("admin.dashboard.seo.desc")} />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-green-700">{t("admin.dashboard.title")}</h2>
            <p className="text-gray-600 text-sm">Bem-vinda, Dra. Cawanne</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 items-center text-sm">
            <Link to="/admin/usuarios" className="text-green-700 hover:underline px-2 py-1">{t("admin.users.title")}</Link>
            <Link to="/admin/audit" className="text-green-700 hover:underline px-2 py-1">Auditoria</Link>
            <Button variant="secondary" onClick={logout} className="px-3 py-1">Sair</Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Pacientes</p>
                <p className="text-2xl font-bold text-green-700">{stats.totalPacientes}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </Card>
          <Card className="bg-white p-4 flex flex-col justify-center"><p className="text-sm text-gray-600 mb-1">Planos (indicativo)</p><p className="text-xl font-semibold text-green-700">-</p></Card>
          <Card className="bg-white p-4 flex flex-col justify-center"><p className="text-sm text-gray-600 mb-1">Atividade (mês)</p><p className="text-xl font-semibold text-green-700">-</p></Card>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 md:gap-4">
          <button
            className={`px-3 md:px-4 py-2 font-medium rounded-lg transition-colors text-sm ${tab === "pacientes" ? "bg-green-600 text-white" : "text-green-600 hover:bg-green-50"}`}
            onClick={() => setTab("pacientes")}
          >
            Pacientes
          </button>
          <button
            className={`px-3 md:px-4 py-2 font-medium rounded-lg transition-colors text-sm ${tab === "consultas" ? "bg-green-600 text-white" : "text-green-600 hover:bg-green-50"}`}
            onClick={() => setTab("consultas")}
          >
            Consultas
          </button>
          <button
            className={`px-3 md:px-4 py-2 font-medium rounded-lg transition-colors text-sm ${tab === "dietas" ? "bg-green-600 text-white" : "text-green-600 hover:bg-green-50"}`}
            onClick={() => setTab("dietas")}
          >
            Dietas
          </button>
          <button
            className={`px-3 md:px-4 py-2 font-medium rounded-lg transition-colors text-sm ${tab === "notificacoes" ? "bg-green-600 text-white" : "text-green-600 hover:bg-green-50"}`}
            onClick={() => setTab("notificacoes")}
          >
            Notificações
          </button>
          <button
            className={`px-3 md:px-4 py-2 font-medium rounded-lg transition-colors text-sm ${tab === "relatorios" ? "bg-green-600 text-white" : "text-green-600 hover:bg-green-50"}`}
            onClick={() => setTab("relatorios")}
          >
            Relatórios
          </button>
          <button
            className={`px-3 md:px-4 py-2 font-medium rounded-lg transition-colors text-sm ${tab === "creditos" ? "bg-green-600 text-white" : "text-green-600 hover:bg-green-50"}`}
            onClick={() => setTab("creditos")}
          >
            Créditos
          </button>
        </div>

          {/* --- PACIENTES --- */}
          {tab === "pacientes" && (
            <Card className="p-0 overflow-hidden">
              <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    className="w-full px-3 sm:px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <svg className="absolute right-3 top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" className="text-xs sm:text-sm px-3 py-2">Exportar</Button>
                  <Button className="text-xs sm:text-sm px-3 py-2">Novo Paciente</Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="py-3 px-4 font-medium">Paciente</th>
                      <th className="py-3 px-4 font-medium">Role</th>
                      <th className="py-3 px-4 font-medium">Criado</th>
                      <th className="py-3 px-4 font-medium">Último Login</th>
                      <th className="py-3 px-4 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersLoading && (
                      <tr>
                        <td colSpan={6} className="py-6 px-4">
                          <div className="space-y-4">
                            <Skeleton lines={3} />
                            <Skeleton lines={3} />
                            <Skeleton lines={3} />
                          </div>
                        </td>
                      </tr>
                    )}
                    {!usersLoading && filteredUsers.length === 0 && (
                      <tr><td colSpan={6} className="py-10 text-center text-gray-500">Nenhum usuário encontrado.</td></tr>
                    )}
                    {!usersLoading && filteredUsers.map(u => (
                      <tr key={u.id} className="border-t hover:bg-green-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-semibold">
                              {(u.display_name || u.email).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 leading-tight">{u.display_name || "—"}</p>
                              <p className="text-gray-500 text-xs">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700 uppercase tracking-wide">{u.role}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-xs">{u.created_at ? fmtDate(u.created_at, "pt", { dateStyle: "short" }) : "—"}</td>
                        <td className="py-3 px-4 text-gray-600 text-xs">{u.last_login_at ? fmtDate(u.last_login_at, "pt", { dateStyle: "short" }) : "—"}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button variant="secondary" className="text-xs">Perfil</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t flex items-center justify-between text-sm bg-gray-50">
                <span>Página {usersPage}</span>
                <div className="flex gap-2">
                  <Button variant="secondary" disabled={usersPage === 1 || usersLoading} onClick={() => setUsersPage(p => Math.max(1, p - 1))}>Anterior</Button>
                  <Button variant="secondary" disabled={!usersHasMore || usersLoading} onClick={() => setUsersPage(p => p + 1)}>Próxima</Button>
                </div>
              </div>
            </Card>
          )}

          {/* --- CONSULTAS --- */}
          {tab === "consultas" && (
            <Card className="p-0 overflow-hidden">
              <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
                <div className="flex flex-wrap gap-2 items-center text-sm">
                  <label className="text-gray-600 whitespace-nowrap">Status:</label>
                  <select onChange={(e) => setConsultFilters({ status: e.target.value || undefined })} value={consultFilters.status || ""} className="border rounded px-2 py-1 text-sm focus:ring-green-500 focus:border-green-500 min-w-0">
                    <option value="">Todos</option>
                    <option value="scheduled">Programadas</option>
                    <option value="completed">Concluídas</option>
                    <option value="canceled">Canceladas</option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-2 sm:ml-auto">
                  <Button variant="secondary" className="text-sm">Exportar</Button>
                  <Button className="text-sm">Criar Consulta</Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="py-3 px-4 font-medium">Data/Hora</th>
                      <th className="py-3 px-4 font-medium">Paciente</th>
                      <th className="py-3 px-4 font-medium">Tipo</th>
                      <th className="py-3 px-4 font-medium">Duração</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium">Urgência</th>
                      <th className="py-3 px-4 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultLoading && (
                      <tr>
                        <td colSpan={7} className="py-6 px-4">
                          <div className="space-y-4">
                            <Skeleton lines={3} />
                            <Skeleton lines={3} />
                            <Skeleton lines={3} />
                          </div>
                        </td>
                      </tr>
                    )}
                    {!consultLoading && consultations.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-gray-500">Nenhuma consulta encontrada.</td></tr>}
                    {!consultLoading && consultations.map(c => {
                      const dt = new Date(c.scheduled_at);
                      const dateStr = fmtDate(dt.toISOString(), "pt", { dateStyle: "short" }) + " " + dt.toISOString().slice(11, 16);
                      return (
                        <tr key={c.id} className="border-t hover:bg-green-50">
                          <td className="py-3 px-4 text-gray-800 whitespace-nowrap">{dateStr}</td>
                          <td className="py-3 px-4 text-gray-700">{c.user_id.slice(0, 8)}...</td>
                          <td className="py-3 px-4 capitalize">{c.type}</td>
                          <td className="py-3 px-4 text-gray-600">{c.duration_min} min</td>
                          <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wide ${c.status === "scheduled" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>{c.status}</span></td>
                          <td className="py-3 px-4 text-xs">{c.urgency || "—"}</td>
                          <td className="py-3 px-4 text-right"><Button variant="secondary" className="text-xs">Detalhes</Button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* --- DIETAS (nova aba com DietManagement) --- */}
          {tab === "dietas" && (
            <div>
              <DietManagement />
            </div>
          )}

          {/* --- NOTIFICAÇÕES --- */}
          {tab === "notificacoes" && (
            <div className="space-y-6">
              <AdminNotificationSender />
            </div>
          )}

          {/* --- RELATÓRIOS --- */}
          {tab === "relatorios" && (
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Relatórios e Análises</h3>
              <p className="text-gray-600">Em desenvolvimento...</p>
            </Card>
          )}
          {tab === "creditos" && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Créditos de Consultas</h3>
              <AdminCreditsPanel />
            </Card>
          )}
        </div>
      </RoleRoute>
  );
};

export default AdminPage;