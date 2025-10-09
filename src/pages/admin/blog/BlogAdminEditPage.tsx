import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/useAuth";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Skeleton from "../../../components/ui/Skeleton";
import EditorStats from "../../../components/blog/EditorStats";
import { SEO } from "../../../components/comum/SEO";
import { useToast } from "../../../components/ui/ToastProvider";
import {
  Save,
  Send,
  Trash2,
  Eye,
  Code,
  FileText,
  Image,
  Tag,
  Folder,
  Type,
  Undo2,
  Shield,
  Link2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Settings,
} from "lucide-react";

interface FormState {
  title: string;
  excerpt: string;
  content_html: string;
  content_md?: string;
  category: string;
  tags: string;
  cover_image_url: string;
  status: string;
}

const empty: FormState = {
  title: "",
  excerpt: "",
  content_html: "",
  content_md: "",
  category: "",
  tags: "",
  cover_image_url: "",
  status: "draft",
};

const API_BASE =
  import.meta.env.VITE_API_AUTH_BASE ||
  "https://login-service.avantenutri.workers.dev";

const BlogAdminEditPage: React.FC = () => {
  const { id } = useParams();
  const isNew = id === "new" || !id;
  const { user, getAccessToken } = useAuth();
  const navigate = useNavigate();
  const { push } = useToast();

  const [form, setForm] = useState<FormState>(empty);
  const MODE_KEY = "blogEditorMode";
  const [mode, setMode] = useState<"html" | "md">("md");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [showSnippets, setShowSnippets] = useState(false);
  const [cursorInfo, setCursorInfo] = useState<{
    inFence: boolean;
    lang?: string;
  } | null>(null);
  const [linkReport, setLinkReport] = useState<{
    total: number;
    broken: number;
    checking: boolean;
  }>(() => ({ total: 0, broken: 0, checking: false }));
  const linkCheckTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Detalhes de links removidos temporariamente para simplificar build
  const setLinksDetail = (arr: { url: string; status: "pending" | "ok" | "broken" }[]) => { void arr; };
  // const [validatingAll, setValidatingAll] = useState(false); // removido: não utilizado
  const undoStack = useRef<string[]>([]);
  const [headings, setHeadings] = useState<
    { id: string; text: string; level: number }[]
  >([]);
  const [expandedSections, setExpandedSections] = useState({
    metadata: true,
    content: true,
    preview: false,
  });

  // Small inline component for language snippets
  const CodeSnippetButtons: React.FC<{
    onInsert: (snippet: string) => void;
  }> = ({ onInsert }) => {
    const snippets: { label: string; code: string; description: string }[] = [
      {
        label: "JavaScript",
        code: '\n```js\nconsole.log("hello");\n```\n',
        description: "Bloco de código JavaScript",
      },
      {
        label: "TypeScript",
        code: "\n```ts\nconst x: number = 42;\n```\n",
        description: "Bloco de código TypeScript",
      },
      {
        label: "JSON",
        code: '\n```json\n{\n  "key": "value"\n}\n```\n',
        description: "Bloco de código JSON",
      },
      {
        label: "SQL",
        code: "\n```sql\nSELECT * FROM table;\n```\n",
        description: "Bloco de código SQL",
      },
      {
        label: "Shell",
        code: '\n```bash\necho "Olá"\n```\n',
        description: "Bloco de código Shell",
      },
      {
        label: "Python",
        code: '\n```python\nprint("Hello World")\n```\n',
        description: "Bloco de código Python",
      },
      {
        label: "CSS",
        code: "\n```css\n.body { color: red; }\n```\n",
        description: "Bloco de código CSS",
      },
      {
        label: "HTML",
        code: "\n```html\n<div>content</div>\n```\n",
        description: "Bloco de código HTML",
      },
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-gray-50 rounded-lg">
        {snippets.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onInsert(s.code)}
            className="p-3 border border-gray-200 rounded-lg text-left bg-white hover:bg-blue-50 hover:border-blue-200 transition-colors group"
            title={s.description}
          >
            <div className="font-medium text-sm text-gray-900 group-hover:text-blue-700">
              {s.label}
            </div>
            <div className="text-xs text-gray-500 mt-1">{s.description}</div>
          </button>
        ))}
      </div>
    );
  };

  // Insert snippet at cursor position instead of append
  const pushUndo = () => {
    undoStack.current.push(form.content_md || "");
    if (undoStack.current.length > 50) undoStack.current.shift();
  };

  const undoLast = () => {
    const prev = undoStack.current.pop();
    if (prev !== undefined) {
      setForm((f) => ({ ...f, content_md: prev }));
      push({ type: "info", message: "Ação desfeita" });
    }
  };

  const insertAtCursor = (snippet: string) => {
    pushUndo();
    setForm((f) => {
      const content = f.content_md || "";
      const ta = textareaRef.current;
      if (!ta) return { ...f, content_md: content + snippet };
      const start = ta.selectionStart ?? content.length;
      const end = ta.selectionEnd ?? content.length;
      const selected = content.slice(start, end);
      let finalSnippet = snippet;
      // if fenced code snippet and selection exists, place selection between opening/closing fences (after first newline)
      if (selected && snippet.startsWith("\n```")) {
        const firstNl = snippet.indexOf("\n");
        const lastFence = snippet.lastIndexOf("\n```");
        if (firstNl !== -1 && lastFence !== -1 && lastFence > firstNl) {
          finalSnippet =
            snippet.slice(0, firstNl + 1) +
            selected +
            "\n" +
            snippet.slice(lastFence);
        }
      }
      const newValue =
        content.slice(0, start) + finalSnippet + content.slice(end);
      setTimeout(() => {
        try {
          ta.focus();
          const cursorPos = start + finalSnippet.length;
          ta.setSelectionRange(cursorPos, cursorPos);
        } catch {}
      }, 0);
      return { ...f, content_md: newValue };
    });
    push({ type: "success", message: "Snippet inserido" });
  };

  // Detect fenced block / language for UI hint
  const analyzeCursor = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const text = form.content_md || "";
    // Find all fences
    const fenceRegex = /```([^\n]*)\n/g;
    let match: RegExpExecArray | null;
    const fences: { index: number; lang: string }[] = [];
    while ((match = fenceRegex.exec(text))) {
      fences.push({ index: match.index, lang: (match[1] || "").trim() });
    }
    let inside = false;
    let lang: string | undefined;
    for (let i = 0; i < fences.length; i++) {
      const open = fences[i];
      const searchFrom = text.indexOf("\n", open.index) + 1;
      if (searchFrom === 0) continue;
      const nextFence = text.indexOf("```", searchFrom);
      if (nextFence !== -1 && pos > searchFrom && pos < nextFence) {
        inside = true;
        lang = open.lang || undefined;
        break;
      }
    }
    setCursorInfo({ inFence: inside, lang });
  };

  // Extended link & heading stats (simple regex)
  useEffect(() => {
    if (mode !== "md") return;
    if (linkCheckTimeout.current) clearTimeout(linkCheckTimeout.current);
    const text = form.content_md || "";
    const links = [...text.matchAll(/\[[^\]]+\]\((https?:[^)\s]+)\)/g)].map(
      (m) => m[1]
    );
    // Guardar detalhes de links apenas se houver links (evita warning de não uso em certas execuções)
    if (links.length > 0) {
      setLinksDetail(links.map((u) => ({ url: u, status: "pending" })));
    } else {
      setLinksDetail([]);
    }
    setLinkReport((r) => ({
      ...r,
      total: links.length,
      checking: links.length > 0,
      broken: 0,
    }));
    // naive HEAD check for first up to 5 links
  linkCheckTimeout.current = setTimeout(async () => {
      let broken = 0;
      const toCheck = links.slice(0, 5);
      await Promise.all(
        toCheck.map(async (url) => {
          try {
            const ctrl = new AbortController();
            const t = setTimeout(() => ctrl.abort(), 4000);
            const res = await fetch(url, {
              method: "HEAD",
              mode: "no-cors",
              signal: ctrl.signal,
            });
            clearTimeout(t);
            if (res && res.status >= 400 && res.status < 600) broken++;
          } catch {
            broken++;
          }
        })
      );
      setLinkReport((r) => ({ ...r, broken, checking: false }));
    }, 600);
    return () => {
      if (linkCheckTimeout.current) clearTimeout(linkCheckTimeout.current);
    };
  }, [form.content_md, mode]);

  // Keyboard shortcut for snippets panel Ctrl+Shift+I
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i")) {
        e.preventDefault();
        setShowSnippets((s) => !s);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // restore mode from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(MODE_KEY);
      if (stored === "html" || stored === "md") setMode(stored);
    } catch {}
  }, []);

  // persist mode
  useEffect(() => {
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {}
  }, [mode]);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const canManage = user && user.role === "admin";

  useEffect(() => {
    if (!canManage || isNew) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const token = await getAccessToken?.();
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const r = await fetch(`${API_BASE}/blog/posts/by-id/${id}`, {
          headers,
        });
        if (!r.ok) throw new Error("Falha ao carregar artigo");
        const data = await r.json();
        if (cancelled) return;
        if (data.post) {
          setForm({
            title: data.post.title || "",
            excerpt: data.post.excerpt || "",
            content_html: data.post.content_html || "",
            content_md: data.post.content_md || "",
            category: data.post.category || "",
            tags: (data.post.tags || []).join(", "),
            cover_image_url: data.post.cover_image_url || "",
            status: data.post.status || "draft",
          });
          if (data.post.content_md) {
            setMode("md");
          }
        }
        push({ type: "success", message: "Artigo carregado com sucesso" });
      } catch {
        push({ type: "error", message: "Erro ao carregar artigo" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, canManage, isNew, getAccessToken, push]);

  const update = (k: keyof FormState, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Simple in-memory cache for parsed markdown to avoid re-parsing identical content
  const previewCacheRef = useRef<Map<string, string>>(new Map());

  // Markdown preview + selective syntax highlight (lazy) with caching
  useEffect(() => {
    if (mode === "html") {
      setPreviewHtml(form.content_html);
      return;
    }
    if (previewDebounce.current) clearTimeout(previewDebounce.current);
  previewDebounce.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const key = (form.content_md || "") + "|md";
        let generated: string | undefined = previewCacheRef.current.get(key);
        if (!generated) {
          const mod: any = await import("marked");
          const parseFn =
            mod.parse ||
            (mod.marked && mod.marked.parse) ||
            mod.marked ||
            ((x: string) => x);
          generated = parseFn(form.content_md || "");
        }
        // Collect languages from fenced blocks to minimize highlight footprint
        const codeLangs = [
          ...(form.content_md || "").matchAll(/```([a-zA-Z0-9_-]+)\n/g),
        ].map((m) => (m[1] || "").toLowerCase());
        const unique = Array.from(new Set(codeLangs)).slice(0, 8);
        if (unique.length) {
          try {
            const hlCore: any = await import("highlight.js/lib/core");
            const alias: Record<string, string> = {
              js: "javascript",
              ts: "typescript",
              py: "python",
              sh: "bash",
            };
            for (const raw of unique) {
              const resolved = alias[raw] || raw;
              try {
                const langMod = await import(
                  `highlight.js/lib/languages/${resolved}`
                );
                hlCore.registerLanguage(resolved, langMod.default);
              } catch {
                /* skip unknown */
              }
            }
            if (generated) {
              generated = generated.replace(
                /<pre><code class="language-([^"]+)">([\s\S]*?)<\/code><\/pre>/g,
                (_m: string, lang: string, code: string) => {
                  const resolved = (alias[lang] || lang).toLowerCase();
                  try {
                    const dec = code
                      .replace(/&lt;/g, "<")
                      .replace(/&gt;/g, ">")
                      .replace(/&amp;/g, "&");
                    const highlighted = hlCore.highlight(dec, {
                      language: resolved,
                    }).value;
                    return `<pre class="hljs"><code class="language-${resolved}">${highlighted}</code></pre>`;
                  } catch {
                    return _m;
                  }
                }
              );
            }
          } catch {
            /* highlight optional */
          }
        }
        if (generated) {
          previewCacheRef.current.set(key, generated);
          setPreviewHtml(generated);
        }
      } catch {
        /* parse error ignored */
      } finally {
        setPreviewLoading(false);
      }
    }, 300);
  }, [mode, form.content_md, form.content_html]);

  // After preview HTML updates, enhance code blocks with copy buttons
  useEffect(() => {
    if (mode !== "md" || previewLoading) return;
    const container = previewRef.current;
    if (!container) return;
    // build heading list & assign IDs
    const hs: { id: string; text: string; level: number }[] = [];
    const slug = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9\u00C0-\u017F\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 80);
    container.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((el) => {
      const txt = (el as HTMLElement).innerText.trim();
      if (!txt) return;
      let id = slug(txt);
      // de-dupe
      let c = 1;
      const base = id;
      while (hs.find((h) => h.id === id)) {
        id = base + "-" + ++c;
      }
      el.id = id;
      const level = Number(el.tagName.substring(1)) || 1;
      hs.push({ id, text: txt, level });
    });
    setHeadings(hs);
    // remove previous buttons (to avoid duplicates)
    const oldBtns = container.querySelectorAll("[data-copy-code-btn]");
    oldBtns.forEach((b) => b.remove());
    const pres = container.querySelectorAll("pre");
    pres.forEach((pre) => {
      const code = pre.querySelector("code");
      if (!code) return;
      (pre as HTMLElement).classList.add("relative", "group");
      // collapse large code
      const lineCount = (code.textContent || "").split("\n").length;
      if (lineCount > 20) {
        (pre as HTMLElement).style.maxHeight = "300px";
        (pre as HTMLElement).style.overflow = "hidden";
        const expandBtn = document.createElement("button");
        expandBtn.type = "button";
        expandBtn.textContent = "Expandir";
        expandBtn.className =
          "opacity-90 absolute bottom-2 left-2 text-xs bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-600";
        expandBtn.addEventListener("click", () => {
          if (pre.style.maxHeight) {
            pre.style.maxHeight = "";
            pre.style.overflow = "auto";
            expandBtn.textContent = "Recolher";
          } else {
            pre.style.maxHeight = "300px";
            pre.style.overflow = "hidden";
            expandBtn.textContent = "Expandir";
          }
        });
        pre.appendChild(expandBtn);
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Copiar";
      btn.setAttribute("data-copy-code-btn", "1");
      btn.className =
        "opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 text-xs bg-gray-800 text-white px-2 py-1 rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500";
      btn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(code.textContent || "");
          btn.textContent = "Copiado!";
          setTimeout(() => {
            btn.textContent = "Copiar";
          }, 1500);
        } catch {
          btn.textContent = "Erro";
          setTimeout(() => {
            btn.textContent = "Copiar";
          }, 1500);
        }
      });
      pre.appendChild(btn);
    });
  }, [previewHtml, previewLoading, mode]);

  // validateAllLinks removido: não utilizado no fluxo atual.

  const submit = async (publish = false) => {
    if (!canManage) return;
    setSaving(true);
    setError(null);
    try {
      const token = await getAccessToken?.();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const body = {
        ...form,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        status: publish ? "published" : form.status,
        content_md: mode === "md" ? form.content_md : undefined,
      };
      let resp: Response;
      if (isNew) {
        resp = await fetch(`${API_BASE}/blog/posts`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
      } else {
        resp = await fetch(`${API_BASE}/blog/posts/${id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(body),
        });
      }
      if (!resp.ok) throw new Error("Falha ao salvar");
      push({
        type: "success",
        message: publish
          ? "Artigo publicado com sucesso!"
          : "Rascunho salvo com sucesso!",
      });
      navigate("/admin/blog");
    } catch (e: any) {
      setError(e.message);
      push({ type: "error", message: e.message });
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (isNew) return;
    if (!confirm("Confirmar exclusão permanente?")) return;
    try {
      const token = await getAccessToken?.();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const r = await fetch(`${API_BASE}/blog/posts/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!r.ok) throw new Error("Falha ao excluir");
      push({ type: "success", message: "Artigo excluído com sucesso" });
      navigate("/admin/blog");
    } catch (e: any) {
      setError(e.message);
      push({ type: "error", message: e.message });
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (!canManage)
    return (
      <div className="min-h-screen bg-gray-50/30 safe-area-bottom flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Shield size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acesso Restrito
          </h2>
          <p className="text-gray-600">
            Você não tem permissão para acessar esta página.
          </p>
        </Card>
      </div>
    );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/30 safe-area-bottom">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Card className="p-6">
            <Skeleton lines={8} />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 safe-area-bottom">
      <SEO
        title={isNew ? "Novo Artigo - Blog" : "Editar Artigo - Blog"}
        description="Editor de artigos do blog"
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-lg bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <FileText size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {isNew ? "Novo Artigo" : "Editar Artigo"}
                </h1>
                <p className="text-xs text-gray-600 mt-0.5">
                  {isNew
                    ? "Crie um novo artigo para o blog"
                    : "Edite o conteúdo do artigo"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/admin/blog")}
                className="flex items-center gap-2"
                noBorder
                noFocus
                noBackground
              >
                Voltar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-6">
        {error && (
          <Card className="p-4 border-l-4 border-red-500 bg-red-50 mb-6">
            <div className="flex items-start gap-3">
              <FileText
                size={20}
                className="text-red-500 mt-0.5 flex-shrink-0"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 mb-1">
                  Erro ao salvar artigo
                </h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-6">
          {/* Metadata Section */}
          <Card className="p-0 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("metadata")}
              className="w-full p-4 sm:p-6 text-left flex items-center justify-between hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <Settings size={16} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Metadados
                  </h2>
                </div>
              </div>
              {expandedSections.metadata ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>

            {expandedSections.metadata && (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Type size={14} />
                      Título
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.title}
                      onChange={(e) => update("title", e.target.value)}
                      placeholder="Digite o título do artigo..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Folder size={14} />
                      Categoria
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.category}
                      onChange={(e) => update("category", e.target.value)}
                      placeholder="Ex: Tecnologia, Saúde..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FileText size={14} />
                    Resumo (excerpt)
                  </label>
                  <textarea
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={form.excerpt}
                    onChange={(e) => update("excerpt", e.target.value)}
                    placeholder="Breve descrição do artigo..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Tag size={14} />
                      Tags (separadas por vírgula)
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.tags}
                      onChange={(e) => update("tags", e.target.value)}
                      placeholder="Ex: javascript, react, nodejs"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Image size={14} />
                      URL da Imagem de Capa
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.cover_image_url}
                      onChange={(e) =>
                        update("cover_image_url", e.target.value)
                      }
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Content Section */}
          <Card className="p-0 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("content")}
              className="w-full p-4 sm:p-6 text-left flex items-center justify-between hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <BookOpen size={16} className="text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Conteúdo
                  </h2>
                </div>
              </div>
              {expandedSections.content ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>

            {expandedSections.content && (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={mode === "md" ? "primary" : "secondary"}
                      onClick={() => setMode("md")}
                      noFocus
                      className="flex items-center gap-2 text-xs"
                      noBorder={mode !== "md"}
                      noBackground={mode !== "md"}
                    >
                      <FileText size={12} />
                      Markdown
                    </Button>
                    <Button
                      type="button"
                      variant={mode === "html" ? "primary" : "secondary"}
                      onClick={() => setMode("html")}
                      noFocus
                      className="flex items-center gap-2 text-xs"
                      noBorder={mode !== "html"}
                      noBackground={mode !== "html"}
                    >
                      <Code size={12} />
                      HTML
                    </Button>
                  </div>
                </div>

                {mode === "md" && (
                  <>
                    <div className="flex flex-col gap-4">
                      <div className="relative">
                        <textarea
                          ref={textareaRef}
                          rows={16}
                          onClick={analyzeCursor}
                          onKeyUp={analyzeCursor}
                          onChange={(e) => {
                            update("content_md", e.target.value);
                            analyzeCursor();
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={form.content_md}
                          placeholder="Escreva seu artigo em Markdown..."
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setShowSnippets((s) => !s)}
                            className="flex items-center gap-2 text-xs"
                            noBorder
                            noFocus
                            noBackground
                          >
                            <Code size={12} />
                            {showSnippets
                              ? "Ocultar Snippets"
                              : "Mostrar Snippets"}
                          </Button>

                          <Button
                            type="button"
                            variant="secondary"
                            onClick={undoLast}
                            className="flex items-center gap-2 text-xs"
                            noBorder
                            noFocus
                            noBackground
                          >
                            <Undo2 size={12} />
                            Desfazer
                          </Button>

                          {cursorInfo?.inFence && (
                            <div className="flex items-center gap-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              <Code size={12} />
                              {cursorInfo.lang
                                ? `Bloco ${cursorInfo.lang}`
                                : "Dentro de bloco de código"}
                            </div>
                          )}

                          {linkReport.total > 0 && (
                            <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              <Link2 size={12} />
                              {linkReport.checking
                                ? "Verificando links..."
                                : `${linkReport.total} links${
                                    linkReport.broken > 0
                                      ? ` (${linkReport.broken} quebrados)`
                                      : ""
                                  }`}
                            </div>
                          )}
                        </div>

                        <EditorStats text={form.content_md} />
                      </div>

                      {showSnippets && (
                        <div className="border border-gray-200 rounded-lg bg-white">
                          <div className="p-3 border-b border-gray-200 bg-gray-50">
                            <h3 className="font-medium text-gray-900">
                              Snippets de Código
                            </h3>
                            <p className="text-xs text-gray-600 mt-1">
                              Use Ctrl+Shift+I para abrir/fechar rapidamente
                            </p>
                          </div>
                          <CodeSnippetButtons onInsert={insertAtCursor} />
                        </div>
                      )}

                      {headings.length > 0 && (
                        <Card className="p-3">
                          <h3 className="font-medium text-gray-900 mb-2 text-sm">
                            Navegação do Artigo
                          </h3>
                          <div className="space-y-1 max-h-40 overflow-auto">
                            {headings.map((h) => (
                              <a
                                key={h.id}
                                href={`#${h.id}`}
                                className="block text-xs text-gray-600 hover:text-blue-600 py-1 transition-colors"
                                style={{ paddingLeft: (h.level - 1) * 12 }}
                              >
                                {"#".repeat(h.level)} {h.text}
                              </a>
                            ))}
                          </div>
                        </Card>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Eye size={14} />
                      <span>Pré-visualização</span>
                      {previewLoading && (
                        <span className="animate-pulse text-blue-500">
                          renderizando...
                        </span>
                      )}
                    </div>

                    <div
                      className="border border-gray-300 rounded-lg p-4 bg-white min-h-[120px] prose prose-sm max-w-none"
                      ref={previewRef}
                    >
                      {previewLoading ? (
                        <div className="space-y-3">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} lines={1} />
                          ))}
                        </div>
                      ) : (
                        <div
                          dangerouslySetInnerHTML={{ __html: previewHtml }}
                        />
                      )}
                    </div>
                  </>
                )}

                {mode === "html" && (
                  <textarea
                    rows={16}
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={form.content_html}
                    onChange={(e) => update("content_html", e.target.value)}
                    placeholder="Cole ou edite HTML diretamente..."
                  />
                )}
              </div>
            )}
          </Card>

          {/* Actions */}
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="text-sm text-gray-600">
                {isNew
                  ? "Criar novo artigo"
                  : `Editando: ${form.title || "Artigo sem título"}`}
              </div>

              <div className="flex gap-3 flex-wrap justify-center">
                <Button
                  disabled={saving}
                  onClick={() => submit(false)}
                  noFocus
                  className="flex items-center gap-2"
                >
                  <Save size={16} />
                  {saving ? "Salvando..." : "Salvar Rascunho"}
                </Button>

                <Button
                  disabled={saving}
                  variant="secondary"
                  onClick={() => submit(true)}
                  noFocus
                  className="flex items-center gap-2"
                >
                  <Send size={16} />
                  {saving ? "Publicando..." : "Publicar Artigo"}
                </Button>

                {!isNew && (
                  <Button
                    disabled={saving}
                    variant="secondary"
                    onClick={doDelete}
                    noFocus
                    className="flex items-center gap-2 !bg-red-600 hover:!bg-red-700 text-white"
                  >
                    <Trash2 size={16} />
                    Excluir
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BlogAdminEditPage;
