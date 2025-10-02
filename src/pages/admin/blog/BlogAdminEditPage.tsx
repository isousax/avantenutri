import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/useAuth';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import EditorStats from '../../../components/blog/EditorStats';

interface FormState { title: string; excerpt: string; content_html: string; content_md?: string; category: string; tags: string; cover_image_url: string; status: string; }
const empty: FormState = { title: '', excerpt: '', content_html: '', content_md: '', category: '', tags: '', cover_image_url: '', status: 'draft' };
const API_BASE = import.meta.env.VITE_API_AUTH_BASE || 'https://login-service.avantenutri.workers.dev';

const BlogAdminEditPage: React.FC = () => {
  const { id } = useParams();
  const isNew = id === 'new' || !id;
  const { user, getAccessToken } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(empty);
  const MODE_KEY = 'blogEditorMode';
  const [mode, setMode] = useState<'html'|'md'>('md');
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewDebounce = useRef<any>(null);
  const previewRef = useRef<HTMLDivElement|null>(null);
  const textareaRef = useRef<HTMLTextAreaElement|null>(null);
  const [showSnippets, setShowSnippets] = useState(false);
  const [cursorInfo, setCursorInfo] = useState<{ inFence:boolean; lang?:string }|null>(null);
  const [linkReport, setLinkReport] = useState<{ total:number; broken:number; checking:boolean }>(()=> ({ total:0, broken:0, checking:false }));
  const linkCheckTimeout = useRef<any>(null);
  const [linksDetail, setLinksDetail] = useState<{ url:string; status:'pending'|'ok'|'broken' }[]>([]);
  const [validatingAll, setValidatingAll] = useState(false);
  const undoStack = useRef<string[]>([]);
  const [headings, setHeadings] = useState<{ id:string; text:string; level:number }[]>([]);

  // small inline component for language snippets
  const CodeSnippetButtons: React.FC<{ onInsert:(snippet:string)=>void }> = ({ onInsert }) => {
    const snippets: { label: string; code: string }[] = [
      { label: 'JS', code: '\n```js\nconsole.log("hello");\n```\n' },
      { label: 'TS', code: '\n```ts\nconst x: number = 42;\n```\n' },
      { label: 'JSON', code: '\n```json\n{\n  "key": "value"\n}\n```\n' },
      { label: 'SQL', code: '\n```sql\nSELECT * FROM table;\n```\n' },
      { label: 'Shell', code: '\n```bash\necho "Olá"\n```\n' },
    ];
    return (
      <div className='flex gap-1 flex-wrap'>
        {snippets.map(s => <button key={s.label} type='button' onClick={()=> onInsert(s.code)} className='px-2 py-1 border rounded text-xs bg-white hover:bg-gray-50'>{s.label}</button>)}
      </div>
    );
  };

  // Insert snippet at cursor position instead of append
  const pushUndo = () => { undoStack.current.push(form.content_md || ''); if(undoStack.current.length>50) undoStack.current.shift(); };
  const undoLast = () => { const prev = undoStack.current.pop(); if(prev!==undefined) setForm(f=> ({...f, content_md: prev })); };

  const insertAtCursor = (snippet: string) => {
    pushUndo();
    setForm(f => {
      const content = f.content_md || '';
      const ta = textareaRef.current;
      if(!ta) return { ...f, content_md: (content + snippet) };
      const start = ta.selectionStart ?? content.length;
      const end = ta.selectionEnd ?? content.length;
      const selected = content.slice(start,end);
      let finalSnippet = snippet;
      // if fenced code snippet and selection exists, place selection between opening/closing fences (after first newline)
      if(selected && snippet.startsWith('\n```')){
        const firstNl = snippet.indexOf('\n');
        const lastFence = snippet.lastIndexOf('\n```');
        if(firstNl !== -1 && lastFence !== -1 && lastFence > firstNl){
          finalSnippet = snippet.slice(0, firstNl+1) + selected + '\n' + snippet.slice(lastFence);
        }
      }
      const newValue = content.slice(0,start) + finalSnippet + content.slice(end);
      setTimeout(()=> {
        try {
          ta.focus();
          const cursorPos = start + finalSnippet.length;
          ta.setSelectionRange(cursorPos, cursorPos);
        } catch {}
      }, 0);
      return { ...f, content_md: newValue };
    });
  };

  // Detect fenced block / language for UI hint
  const analyzeCursor = () => {
    const ta = textareaRef.current; if(!ta) return;
    const pos = ta.selectionStart;
    const text = form.content_md || '';
    // Find all fences
    const fenceRegex = /```([^\n]*)\n/g;
    let match: RegExpExecArray|null; const fences: { index:number; lang:string }[] = [];
    while((match = fenceRegex.exec(text))){ fences.push({ index: match.index, lang: (match[1]||'').trim() }); }
    let inside = false; let lang: string|undefined;
    for(let i=0;i<fences.length;i++){
      const open = fences[i];
      const searchFrom = text.indexOf('\n', open.index) + 1;
      if(searchFrom === 0) continue;
      const nextFence = text.indexOf('```', searchFrom);
      if(nextFence !== -1 && pos > searchFrom && pos < nextFence){ inside = true; lang = open.lang || undefined; break; }
    }
    setCursorInfo({ inFence: inside, lang });
  };

  // Extended link & heading stats (simple regex)
  useEffect(()=> {
    if(mode !== 'md') return;
    if(linkCheckTimeout.current) clearTimeout(linkCheckTimeout.current);
    const text = form.content_md || '';
  const links = [...text.matchAll(/\[[^\]]+\]\((https?:[^)\s]+)\)/g)].map(m=> m[1]);
    setLinksDetail(links.map(u=> ({ url:u, status:'pending' })));
    setLinkReport(r=> ({ ...r, total: links.length, checking: links.length>0, broken: 0 }));
    // naive HEAD check for first up to 5 links
    linkCheckTimeout.current = setTimeout(async ()=> {
      let broken = 0; const toCheck = links.slice(0,5);
      await Promise.all(toCheck.map(async url => {
        try { const ctrl = new AbortController(); const t = setTimeout(()=> ctrl.abort(), 4000); const res = await fetch(url, { method:'HEAD', mode:'no-cors', signal: ctrl.signal }); clearTimeout(t); if(res && (res.status >=400 && res.status <600)) broken++; } catch { broken++; }
      }));
      setLinkReport(r=> ({ ...r, broken, checking:false }));
    }, 600);
    return ()=> { if(linkCheckTimeout.current) clearTimeout(linkCheckTimeout.current); };
  }, [form.content_md, mode]);

  // Keyboard shortcut for snippets panel Ctrl+Shift+I
  useEffect(()=> {
    const handler = (e: KeyboardEvent) => {
      if(e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')){ e.preventDefault(); setShowSnippets(s=> !s); }
    };
    window.addEventListener('keydown', handler);
    return ()=> window.removeEventListener('keydown', handler);
  }, []);

  // restore mode from localStorage
  useEffect(()=> {
    try {
      const stored = localStorage.getItem(MODE_KEY);
      if(stored === 'html' || stored === 'md') setMode(stored);
    } catch {}
  }, []);

  // persist mode
  useEffect(()=> { try { localStorage.setItem(MODE_KEY, mode); } catch {} }, [mode]);
  // const [loading, setLoading] = useState(false); // loading simplificado (não usado ainda)
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const canManage = user && user.role === 'admin';

  useEffect(()=> {
    if(!canManage || isNew) return;
    let cancelled = false;
    (async()=> {
      try {
        const token = await getAccessToken?.();
        const headers: Record<string,string> = {};
        if(token) headers['Authorization'] = `Bearer ${token}`;
        const r = await fetch(`${API_BASE}/blog/posts/by-id/${id}`, { headers });
        if(!r.ok) return; // silencioso
        const data = await r.json();
        if(cancelled) return;
        if(data.post) {
          setForm({
            title: data.post.title || '',
            excerpt: data.post.excerpt || '',
            content_html: data.post.content_html || '',
            content_md: data.post.content_md || '',
            category: data.post.category || '',
            tags: (data.post.tags || []).join(', '),
            cover_image_url: data.post.cover_image_url || '',
            status: data.post.status || 'draft'
          });
          if(data.post.content_md){ setMode('md'); }
        }
      } catch {/* ignore */}
    })();
    return ()=> { cancelled = true; };
  }, [id, canManage, isNew, getAccessToken]);

  const update = (k: keyof FormState, v: string)=> setForm(f=> ({...f, [k]: v }));

  // Simple in-memory cache for parsed markdown to avoid re-parsing identical content
  const previewCacheRef = useRef<Map<string,string>>(new Map());

  // Markdown preview + selective syntax highlight (lazy) with caching
  useEffect(() => {
    if (mode === 'html') { setPreviewHtml(form.content_html); return; }
    if (previewDebounce.current) clearTimeout(previewDebounce.current);
    previewDebounce.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const key = (form.content_md || '') + '|md';
        let generated: string | undefined = previewCacheRef.current.get(key);
        if(!generated){
          const mod: any = await import('marked');
          const parseFn = mod.parse || (mod.marked && mod.marked.parse) || mod.marked || ((x: string) => x);
          generated = parseFn(form.content_md || '');
        }
        // Collect languages from fenced blocks to minimize highlight footprint
        const codeLangs = [...(form.content_md || '').matchAll(/```([a-zA-Z0-9_-]+)\n/g)].map(m => (m[1] || '').toLowerCase());
        const unique = Array.from(new Set(codeLangs)).slice(0, 8);
        if (unique.length) {
          try {
            const hlCore: any = await import('highlight.js/lib/core');
            const alias: Record<string, string> = { js: 'javascript', ts: 'typescript', py: 'python', sh: 'bash' };
            for (const raw of unique) {
              const resolved = alias[raw] || raw;
              try {
                const langMod = await import(`highlight.js/lib/languages/${resolved}`);
                hlCore.registerLanguage(resolved, langMod.default);
              } catch { /* skip unknown */ }
            }
            if(generated){
            generated = generated.replace(/<pre><code class="language-([^"]+)">([\s\S]*?)<\/code><\/pre>/g, (_m: string, lang: string, code: string) => {
              const resolved = (alias[lang] || lang).toLowerCase();
              try {
                const dec = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
                const highlighted = hlCore.highlight(dec, { language: resolved }).value;
                return `<pre class="hljs"><code class="language-${resolved}">${highlighted}</code></pre>`;
              } catch { return _m; }
            });
            }
          } catch { /* highlight optional */ }
        }
        if(generated){
          previewCacheRef.current.set(key, generated);
          setPreviewHtml(generated);
        }
      } catch { /* parse error ignored */ } finally { setPreviewLoading(false); }
    }, 300);
  }, [mode, form.content_md, form.content_html]);

  // After preview HTML updates, enhance code blocks with copy buttons
  useEffect(()=> {
    if(mode !== 'md' || previewLoading) return;
    const container = previewRef.current;
    if(!container) return;
    // build heading list & assign IDs
    const hs: { id:string; text:string; level:number }[] = [];
    const slug = (s:string)=> s.toLowerCase().replace(/[^a-z0-9\u00C0-\u017F\s-]/g,'').trim().replace(/\s+/g,'-').slice(0,80);
    container.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((el)=> {
      const txt = (el as HTMLElement).innerText.trim();
      if(!txt) return;
      let id = slug(txt);
      // de-dupe
      let c=1; const base=id; while(hs.find(h=> h.id===id)) { id = base + '-' + (++c); }
      el.id = id;
      const level = Number(el.tagName.substring(1)) || 1;
      hs.push({ id, text: txt, level });
    });
    setHeadings(hs);
    // remove previous buttons (to avoid duplicates)
    const oldBtns = container.querySelectorAll('[data-copy-code-btn]');
    oldBtns.forEach(b => b.remove());
    const pres = container.querySelectorAll('pre');
    pres.forEach((pre)=> {
      const code = pre.querySelector('code');
      if(!code) return;
      (pre as HTMLElement).classList.add('relative','group');
      // collapse large code
      const lineCount = (code.textContent || '').split('\n').length;
      if(lineCount > 20){
        (pre as HTMLElement).style.maxHeight = '300px';
        (pre as HTMLElement).style.overflow = 'hidden';
        const expandBtn = document.createElement('button');
        expandBtn.type='button';
        expandBtn.textContent='Expandir';
        expandBtn.className='opacity-90 absolute bottom-2 left-2 text-xs bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-600';
        expandBtn.addEventListener('click', ()=> {
          if(pre.style.maxHeight){ pre.style.maxHeight=''; pre.style.overflow='auto'; expandBtn.textContent='Recolher'; }
          else { pre.style.maxHeight='300px'; pre.style.overflow='hidden'; expandBtn.textContent='Expandir'; }
        });
        pre.appendChild(expandBtn);
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Copiar';
      btn.setAttribute('data-copy-code-btn','1');
      btn.className = 'opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 text-xs bg-gray-800 text-white px-2 py-1 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500';
      btn.addEventListener('click', async ()=> {
        try { await navigator.clipboard.writeText(code.textContent || ''); btn.textContent = 'Copiado!'; setTimeout(()=> { btn.textContent = 'Copiar'; }, 1500);} catch { btn.textContent = 'Erro'; setTimeout(()=> { btn.textContent = 'Copiar'; }, 1500);} });
      pre.appendChild(btn);
    });
  }, [previewHtml, previewLoading, mode]);

  const validateAllLinks = async () => {
    if(!linksDetail.length) return;
    setValidatingAll(true);
    const updated = [...linksDetail];
    await Promise.all(updated.map(async (item, idx)=> {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(()=> ctrl.abort(), 6000);
        const res = await fetch(item.url, { method:'HEAD', mode:'no-cors', signal: ctrl.signal });
        clearTimeout(t);
        // With no-cors we can't read status reliably -> optimistic OK if no exception
        updated[idx] = { ...item, status: (res && (res.status === 0 || (res.status>=200 && res.status<400))) ? 'ok':'ok' };
      } catch { updated[idx] = { ...item, status:'broken' }; }
    }));
    setLinksDetail(updated);
    setValidatingAll(false);
  };

  const submit = async (publish=false) => {
    if(!canManage) return;
    setSaving(true); setError(null);
    try {
      const token = await getAccessToken?.();
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if(token) headers['Authorization'] = `Bearer ${token}`;
      const body = { ...form, tags: form.tags.split(',').map(t=> t.trim()).filter(Boolean), status: publish? 'published': form.status, content_md: mode==='md'? form.content_md: undefined };
      let resp: Response;
      if(isNew){
        resp = await fetch(`${API_BASE}/blog/posts`, { method: 'POST', headers, body: JSON.stringify(body) });
      } else {
        resp = await fetch(`${API_BASE}/blog/posts/${id}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
      }
      if(!resp.ok) throw new Error('Falha ao salvar');
      navigate('/admin/blog');
    } catch(e:any){ setError(e.message); } finally { setSaving(false); }
  };

  const doDelete = async () => {
    if(isNew) return;
    if(!confirm('Confirmar exclusão permanente?')) return;
    try {
      const token = await getAccessToken?.();
      const headers: Record<string,string> = {};
      if(token) headers['Authorization'] = `Bearer ${token}`;
      const r = await fetch(`${API_BASE}/blog/posts/${id}`, { method: 'DELETE', headers });
      if(!r.ok) throw new Error('Falha ao excluir');
      navigate('/admin/blog');
    } catch(e:any){ setError(e.message); }
  };

  if(!canManage) return <div className='p-8 text-center text-gray-600'>Sem permissão.</div>;

  return <div className='max-w-4xl mx-auto p-6'>
    <h1 className='text-2xl font-bold mb-6'>{isNew? 'Novo Artigo':'Editar Artigo'}</h1>
    {error && <div className='mb-4 text-red-600'>{error}</div>}
    <Card className='p-6 space-y-4'>
      <div>
        <label className='block text-sm font-medium mb-1'>Título</label>
        <input className='w-full border rounded px-3 py-2' value={form.title} onChange={e=> update('title', e.target.value)} />
      </div>
      <div>
        <label className='block text-sm font-medium mb-1'>Resumo (excerpt)</label>
        <textarea rows={2} className='w-full border rounded px-3 py-2' value={form.excerpt} onChange={e=> update('excerpt', e.target.value)} />
      </div>
      <div>
        <label className='block text-sm font-medium mb-1'>Categoria</label>
        <input className='w-full border rounded px-3 py-2' value={form.category} onChange={e=> update('category', e.target.value)} />
      </div>
      <div>
        <label className='block text-sm font-medium mb-1'>Tags (separadas por vírgula)</label>
        <input className='w-full border rounded px-3 py-2' value={form.tags} onChange={e=> update('tags', e.target.value)} />
      </div>
      <div>
        <label className='block text-sm font-medium mb-1'>URL da Imagem de Capa</label>
        <input className='w-full border rounded px-3 py-2' value={form.cover_image_url} onChange={e=> update('cover_image_url', e.target.value)} />
      </div>
      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <label className='block text-sm font-medium'>Conteúdo ({mode === 'md'? 'Markdown':'HTML'})</label>
          <div className='flex gap-2 text-xs'>
            <button type='button' onClick={()=> setMode('md')} className={`px-2 py-1 rounded border ${mode==='md'?'bg-indigo-600 text-white':'bg-white'}`}>Markdown</button>
            <button type='button' onClick={()=> setMode('html')} className={`px-2 py-1 rounded border ${mode==='html'?'bg-indigo-600 text-white':'bg-white'}`}>HTML</button>
          </div>
        </div>
        {mode === 'md' && <>
          <div className='flex flex-col gap-2'>
            <div className='flex justify-between items-center'>
              <textarea
                ref={textareaRef}
                rows={14}
                onClick={analyzeCursor}
                onKeyUp={analyzeCursor}
                onChange={e=> { update('content_md', e.target.value); analyzeCursor(); }}
                className='w-full border rounded px-3 py-2 font-mono text-sm'
                value={form.content_md}
                placeholder='Escreva em Markdown...'
              />
            </div>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <div className='flex items-center gap-2 text-xs'>
                <button type='button' onClick={()=> setShowSnippets(s=> !s)} className='px-2 py-1 border rounded bg-white hover:bg-gray-50'>Snippets {showSnippets? '−':'+'}</button>
                <button type='button' onClick={undoLast} className='px-2 py-1 border rounded bg-white hover:bg-gray-50'>Undo</button>
                {cursorInfo?.inFence && <span className='text-indigo-600'>Dentro de bloco {cursorInfo.lang? `(${cursorInfo.lang})`: ''}</span>}
                {linkReport.total>0 && <span className='text-gray-500'>Links: {linkReport.total} {linkReport.checking? '(verificando...)': linkReport.broken? `(${linkReport.broken} possivelmente quebrado${linkReport.broken>1?'s':''})`: ''}</span>}
                {linksDetail.length>0 && <button type='button' disabled={validatingAll} onClick={validateAllLinks} className='px-2 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-50'>{validatingAll? 'Validando...':'Validar Links'}</button>}
              </div>
              <EditorStats text={form.content_md} />
            </div>
            {showSnippets && <div className='p-2 border rounded bg-white shadow-sm'><CodeSnippetButtons onInsert={insertAtCursor} /></div>}
            {headings.length>0 && <div className='border rounded bg-white/60 p-2 max-h-40 overflow-auto text-xs space-y-1'>
              <div className='font-semibold text-gray-700'>Mapa de Headings</div>
              {headings.map(h=> <a key={h.id} href={'#'+h.id} className='block hover:text-indigo-600' style={{ paddingLeft: (h.level-1)*8 }}>{h.level}. {h.text}</a>)}
            </div>}
          </div>
          <div className='text-xs text-gray-500 flex items-center gap-2'>
            <span>Pré-visualização (HTML sanitizado no backend)</span>
            {previewLoading && <span className='animate-pulse text-gray-400'>renderizando...</span>}
          </div>
          <div className='border rounded p-4 bg-gray-50 min-h-[120px]' ref={previewRef}>
            {previewLoading && <div className='space-y-2'>
              <div className='h-4 bg-gray-200 rounded animate-pulse w-5/6'></div>
              <div className='h-4 bg-gray-200 rounded animate-pulse w-2/3'></div>
              <div className='h-4 bg-gray-200 rounded animate-pulse w-4/5'></div>
              <div className='h-4 bg-gray-200 rounded animate-pulse w-3/5'></div>
            </div>}
            {!previewLoading && <div className='prose max-w-none text-sm' dangerouslySetInnerHTML={{ __html: previewHtml }} />}
          </div>
        </>}
        {mode === 'html' && <textarea rows={14} className='w-full border rounded px-3 py-2 font-mono text-sm' value={form.content_html} onChange={e=> update('content_html', e.target.value)} placeholder='Cole ou edite HTML diretamente' />}
      </div>
      <div className='flex gap-3 flex-wrap'>
        <Button disabled={saving} onClick={()=> submit(false)}>Salvar Rascunho</Button>
        <Button disabled={saving} variant='secondary' onClick={()=> submit(true)}>Publicar</Button>
  {!isNew && <Button disabled={saving} variant='secondary' onClick={doDelete} className='!bg-red-600 hover:!bg-red-700 text-white'>Excluir</Button>}
      </div>
    </Card>
  </div>;
};

export default BlogAdminEditPage;
