import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/useAuth";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Skeleton from "../../../components/ui/Skeleton";
import RichTextEditor from "../../../components/blog/RichTextEditor";
import { SEO } from "../../../components/comum/SEO";
import { useToast } from "../../../components/ui/ToastProvider";
import { API } from "../../../config/api";
import { processImageToJpeg } from "../../../utils/image";
import { deleteBlogMediaByUrl } from "../../../utils/blogMedia";
import {
  Save,
  Send,
  Trash2,
  Code,
  Image,
  Tag,
  Folder,
  Type,
  Shield,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Settings,
  Archive,
  RotateCcw,
  FileText,
} from "lucide-react";
import { Upload } from "lucide-react";

interface FormState {
  title: string;
  excerpt: string;
  content_html: string;
  category: string;
  tags: string;
  cover_image_url: string;
  status: string;
}

const empty: FormState = {
  title: "",
  excerpt: "",
  content_html: "",
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
  // Keep stable refs to avoid triggering data reload effect on function identity changes
  const getAccessTokenRef = useRef<typeof getAccessToken | undefined>(
    getAccessToken
  );
  useEffect(() => {
    getAccessTokenRef.current = getAccessToken;
  }, [getAccessToken]);
  const pushRef = useRef(push);
  useEffect(() => {
    pushRef.current = push;
  }, [push]);

  const [form, setForm] = useState<FormState>(empty);
  const MODE_KEY = "blogEditorMode";
  const NEW_DRAFT_KEY = "blog:new:draft:v1";
  const [mode, setMode] = useState<"html" | "rich">("rich");
  // Markdown e recursos auxiliares removidos
  const [expandedSections, setExpandedSections] = useState({
    metadata: true,
    content: true,
  });

  // restore mode from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(MODE_KEY);
      if (stored === "html" || stored === "rich")
        setMode(stored as "html" | "rich");
      if (stored === "md") setMode("rich");
    } catch {
      /* noop */
    }
  }, []);

  // persist mode
  useEffect(() => {
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      /* noop */
    }
  }, [mode]);

  // Carregar rascunho local (apenas para novo artigo)
  useEffect(() => {
    if (!isNew) return;
    try {
      const raw = localStorage.getItem(NEW_DRAFT_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<FormState> | null;
      if (saved && typeof saved === "object") {
        setForm((prev) => ({
          ...prev,
          ...saved,
          // garantir strings
          title: String(saved.title ?? prev.title ?? ""),
          excerpt: String(saved.excerpt ?? prev.excerpt ?? ""),
          content_html: String(saved.content_html ?? prev.content_html ?? ""),
          category: String(saved.category ?? prev.category ?? ""),
          tags: String(saved.tags ?? prev.tags ?? ""),
          cover_image_url: String(saved.cover_image_url ?? prev.cover_image_url ?? ""),
          status: String(saved.status ?? prev.status ?? "draft"),
        }));
      }
    } catch {
      /* ignore */
    }
  }, [isNew]);

  // Salvar rascunho local conforme usuário digita (apenas novo)
  const draftSaveTimer = useRef<number | null>(null);
  useEffect(() => {
    if (!isNew) return;
    try {
      if (draftSaveTimer.current) window.clearTimeout(draftSaveTimer.current);
      draftSaveTimer.current = window.setTimeout(() => {
        try {
          const payload: FormState = { ...form };
          localStorage.setItem(NEW_DRAFT_KEY, JSON.stringify(payload));
        } catch {
          /* ignore */
        }
      }, 300);
    } catch {
      /* ignore */
    }
    return () => {
      if (draftSaveTimer.current) window.clearTimeout(draftSaveTimer.current);
    };
  }, [isNew, form]);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const canManage = user && user.role === "admin";
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);

  // Helper: abre seletor de arquivo
  const onClickCoverUpload = () => coverInputRef.current?.click();

  // Util compartilhado de extração é usado diretamente onde necessário

  // Util: deletar imagem no R2 por URL (best-effort)
  const deleteFromR2ByUrl = async (src: string) => {
    await deleteBlogMediaByUrl(src, getAccessTokenRef.current);
  };

  // Handler: arquivo de capa selecionado
  const onCoverFileSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const looksImageByExt = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "bmp",
      "svg",
      "avif",
    ].includes(ext);
    if (!(file.type?.startsWith("image/") || looksImageByExt)) {
      push({ type: "error", message: "Por favor selecione uma imagem." });
      inputEl.value = "";
      return;
    }
    try {
      setCoverUploading(true);
      const processed = await processImageToJpeg(file, {
        maxSize: 1600,
        quality: 0.6,
        targetAspect: 16 / 9,
      });
      const token = await getAccessTokenRef.current?.();
      const formData = new FormData();
      formData.append("file", processed);
      const res = await fetch(API.BLOG_MEDIA_UPLOAD, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Falha no upload da capa");
      }
      const data = await res.json();
      const imageUrl: string | undefined = data?.url;
      if (imageUrl) {
        const prev = form.cover_image_url;
        setForm((f) => ({ ...f, cover_image_url: imageUrl }));
        // Deletar a anterior se for do nosso R2
        if (prev) deleteFromR2ByUrl(prev);
        push({ type: "success", message: prev ? "Capa atualizada" : "Capa enviada" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar imagem";
      push({ type: "error", message: msg });
    } finally {
      setCoverUploading(false);
      inputEl.value = "";
    }
  };

  useEffect(() => {
    if (!canManage || isNew) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const token = await getAccessTokenRef.current?.();
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
            category: data.post.category || "",
            tags: (data.post.tags || []).join(", "),
            cover_image_url: data.post.cover_image_url || "",
            status: data.post.status || "draft",
          });
          // Não alterna mais para Markdown
        }
        pushRef.current?.({
          type: "success",
          message: "Artigo carregado com sucesso",
        });
      } catch {
        pushRef.current?.({
          type: "error",
          message: "Erro ao carregar artigo",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, canManage, isNew]);

  const update = (k: keyof FormState, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  // preview removido

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
        // Markdown descontinuado
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
      // Se publicou com sucesso, limpar rascunho local de novo artigo
      if (publish && isNew) {
        try { localStorage.removeItem(NEW_DRAFT_KEY); } catch { /* noop */ }
      }
      push({
        type: "success",
        message: publish
          ? "Artigo publicado com sucesso!"
          : "Rascunho salvo com sucesso!",
      });
      navigate("/admin/blog");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Falha ao salvar";
      setError(message);
      push({ type: "error", message });
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
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Falha ao excluir";
      setError(message);
      push({ type: "error", message });
    }
  };

  const doArchive = async () => {
    if (isNew) return;
    try {
      const token = await getAccessToken?.();
      if (!token) throw new Error("Sem autorização");
      const r = await fetch(`${API_BASE}/blog/posts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "archived" }),
      });
      if (!r.ok) throw new Error("Falha ao arquivar");
      push({ type: "success", message: "Artigo arquivado" });
      navigate("/admin/blog");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro ao arquivar";
      setError(message);
      push({ type: "error", message });
    }
  };

  const doUnarchive = async () => {
    if (isNew) return;
    try {
      const token = await getAccessToken?.();
      if (!token) throw new Error("Sem autorização");
      // Retorna para rascunho ao desarquivar
      const r = await fetch(`${API_BASE}/blog/posts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "draft" }),
      });
      if (!r.ok) throw new Error("Falha ao desarquivar");
      push({ type: "success", message: "Artigo desarquivado (rascunho)" });
      navigate("/admin/blog");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro ao desarquivar";
      setError(message);
      push({ type: "error", message });
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
      <div className="bg-white border-b border-gray-200 sticky top-0 backdrop-blur-lg bg-white/95">
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
              {!isNew && form.status !== "archived" && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={doArchive}
                  className="flex items-center gap-2"
                  noBorder
                  noFocus
                  noBackground
                >
                  <Archive size={16} />
                  Arquivar
                </Button>
              )}
              {!isNew && form.status === "archived" && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={doUnarchive}
                  className="flex items-center gap-2"
                  noBorder
                  noFocus
                  noBackground
                >
                  <RotateCcw size={16} />
                  Desarquivar
                </Button>
              )}
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                      value={form.tags}
                      onChange={(e) => update("tags", e.target.value)}
                      placeholder="Ex: javascript, react, nodejs"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Image size={14} />
                      Capa do artigo
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {!form.cover_image_url && (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={onClickCoverUpload}
                            noBorder
                            noFocus
                            noBackground
                            className="flex items-center gap-2"
                            disabled={coverUploading}
                          >
                            <Upload size={16} />{" "}
                            {coverUploading ? "Enviando..." : "Enviar imagem"}
                          </Button>
                        )}

                        {(coverUploading || form.cover_image_url) && (
                          <div className="h-16 w-28 flex items-center justify-center rounded border border-gray-200 bg-gray-50 overflow-hidden">
                            {coverUploading ? (
                              <div className="animate-pulse w-full h-full bg-gray-200" />
                            ) : (
                              form.cover_image_url && (
                                <img
                                  src={form.cover_image_url}
                                  alt="Capa"
                                  className="h-16 w-auto"
                                />
                              )
                            )}
                          </div>
                        )}

                        {form.cover_image_url && (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={async () => {
                              const prev = form.cover_image_url;
                              setForm((f) => ({ ...f, cover_image_url: "" }));
                              if (prev) await deleteFromR2ByUrl(prev);
                              push({ type: "success", message: "Capa removida" });
                            }}
                            noBorder
                            noFocus
                            noBackground
                            className="flex items-center gap-2 !text-red-600"
                            title="Remover Imagem"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        onChange={onCoverFileSelected}
                        className="sr-only absolute w-px h-px opacity-0"
                      />
                    </div>
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
                    <Button
                      type="button"
                      variant={mode === "rich" ? "primary" : "secondary"}
                      onClick={() => setMode("rich")}
                      noFocus
                      className="flex items-center gap-2 text-xs"
                      noBorder={mode !== "rich"}
                      noBackground={mode !== "rich"}
                    >
                      <Type size={12} />
                      Editor
                    </Button>
                  </div>
                </div>

                {mode === "html" && (
                  <textarea
                    rows={16}
                    className="w-full border border-gray-300 rounded-lg px-3 py-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={form.content_html}
                    onChange={(e) => update("content_html", e.target.value)}
                    placeholder="Cole ou edite HTML diretamente..."
                  />
                )}

                {mode === "rich" && (
                  <div className="space-y-2">
                    <RichTextEditor
                      value={form.content_html}
                      onChange={(html) => update("content_html", html)}
                      placeholder="Escreva seu artigo como em um editor de texto..."
                    />
                  </div>
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
                    noBorder
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
