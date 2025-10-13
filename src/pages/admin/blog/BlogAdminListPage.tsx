import React, { useCallback, useEffect, useState } from "react";
import { fetchPosts, updatePostStatus } from "../../../services/blog";
import { useAuth } from "../../../contexts/useAuth";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Skeleton from "../../../components/ui/Skeleton";
import { Link } from "react-router-dom";
import { SEO } from "../../../components/comum/SEO";
import { useToast } from "../../../components/ui/ToastProvider";
import {
  Plus,
  RefreshCw,
  Eye,
  Edit,
  FileText,
  Calendar,
  Clock,
  BarChart3,
  Folder,
  Search,
  Filter,
  BookOpen,
  Archive,
  RotateCcw,
} from "lucide-react";
import { useI18n, formatDate as fmtDate } from "../../../i18n";

interface PostRow {
  id: string;
  slug: string;
  title: string;
  status?: string;
  published_at?: string;
  read_time_min: number;
  category?: string;
  views?: number;
}

const BlogAdminListPage: React.FC = () => {
  const { user, getAccessToken } = useAuth();
  const { push } = useToast();
  const { locale } = useI18n();

  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all"|"draft"|"published"|"archived">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const limit = 20;
  const canManage = user && user.role === "admin";

  const loadPosts = useCallback(async () => {
    if (!canManage) return;

    setLoading(true);
    setError(null);
    try {
      const accessToken = await getAccessToken?.();
      const data = await fetchPosts({
        page,
        limit,
        preview: true,
        accessToken: accessToken || undefined,
        ...(searchTerm && { search: searchTerm }),
  ...(statusFilter !== "all" && { status: statusFilter }),
        ...(categoryFilter !== "all" && { category: categoryFilter }),
      });
      setPosts(data.results as unknown as PostRow[]);
      setTotal(data.total);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Falha ao carregar posts";
      setError(message);
      push({ type: "error", message });
    } finally {
      setLoading(false);
    }
  }, [canManage, categoryFilter, getAccessToken, limit, page, searchTerm, statusFilter, push]);

  useEffect(() => {
    loadPosts();
  }, [page, canManage, loadPosts]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (page === 1) {
        loadPosts();
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, categoryFilter, page, loadPosts]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-700 border-green-200";
      case "draft":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "archived":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <Eye size={12} />;
      case "draft":
        return <FileText size={12} />;
      case "archived":
        return <BookOpen size={12} />;
      default:
        return <FileText size={12} />;
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setPage(1);
  };

  const handleArchive = async (postId: string) => {
    try {
      const token = await getAccessToken?.();
      if (!token) throw new Error("Sem autorização");
      await updatePostStatus(postId, "archived", token);
      push({ type: "success", message: "Post arquivado" });
      loadPosts();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Falha ao arquivar";
      push({ type: "error", message });
    }
  };

  const handleUnarchive = async (postId: string) => {
    try {
      const token = await getAccessToken?.();
      if (!token) throw new Error("Sem autorização");
      // Ao desarquivar, voltamos para rascunho para revisão rápida
      await updatePostStatus(postId, "draft", token);
      push({ type: "success", message: "Post desarquivado (rascunho)" });
      loadPosts();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Falha ao desarquivar";
      push({ type: "error", message });
    }
  };

  const totalPages = Math.ceil(total / limit);
  const hasFilters =
    searchTerm || statusFilter !== "all" || categoryFilter !== "all";

  // Extract unique categories for filter
  const categories = [
    ...new Set(posts.map((post) => post.category).filter(Boolean)),
  ] as string[];

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50/30 safe-area-bottom flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acesso Restrito
          </h2>
          <p className="text-gray-600">
            Você não tem permissão para acessar esta página.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 safe-area-bottom">
      <SEO
        title="Gerenciar Blog - Admin"
        description="Gerencie artigos e conteúdos do blog"
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 backdrop-blur-lg bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative">
          {/* Refresh Button - Mobile */}
          <div className="absolute top-4 right-4 sm:hidden">
            <Button
              type="button"
              variant="secondary"
              onClick={loadPosts}
              disabled={loading}
              className="flex items-center gap-2"
              noBorder
              noFocus
              noBackground
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <BookOpen size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Gerenciar Blog
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Refresh Button - Desktop */}
              <Button
                type="button"
                variant="secondary"
                onClick={loadPosts}
                disabled={loading}
                className="hidden sm:flex items-center gap-2"
                noBorder
                noFocus
                noBackground
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
              </Button>

              <Link to="/admin/blog/new">
                <Button className="flex items-center gap-2">
                  <Plus size={16} />
                  Novo Artigo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <Card className="p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Search size={14} />
                Buscar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título..."
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Filter size={14} />
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all"|"draft"|"published"|"archived")}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="all">Todos os status</option>
                <option value="published">Publicado</option>
                <option value="draft">Rascunho</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Categoria
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="all">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                type="button"
                onClick={loadPosts}
                className="flex items-center gap-2 flex-1"
              >
                <Search size={14} />
                Buscar
              </Button>
              {hasFilters && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="p-4 border-l-4 border-red-500 bg-red-50 mb-6">
            <div className="flex items-start gap-3">
              <FileText
                size={20}
                className="text-red-500 mt-0.5 flex-shrink-0"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 mb-1">
                  Erro ao carregar posts
                </h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Summary */}
        {!loading && posts.length > 0 && (
          <Card className="p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{total}</div>
                <div className="text-xs text-gray-600">Total de Artigos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {posts.filter((p) => p.status === "published").length}
                </div>
                <div className="text-xs text-gray-600">Publicados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {posts.filter((p) => p.status === "draft").length}
                </div>
                <div className="text-xs text-gray-600">Rascunhos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {posts.reduce((sum, post) => sum + (post.views || 0), 0)}
                </div>
                <div className="text-xs text-gray-600">Visualizações</div>
              </div>
            </div>
          </Card>
        )}

        {/* Posts List */}
        <div className="space-y-4">
          {/* Desktop Table */}
          <Card className="p-0 overflow-hidden hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="p-4 text-left font-semibold text-gray-700">
                      Artigo
                    </th>
                    <th className="p-4 text-left font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="p-4 text-left font-semibold text-gray-700">
                      Categoria
                    </th>
                    <th className="p-4 text-left font-semibold text-gray-700">
                      Publicação
                    </th>
                    <th className="p-4 text-left font-semibold text-gray-700">
                      Métricas
                    </th>
                    <th className="p-4 text-left font-semibold text-gray-700">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={6} className="p-4">
                        <div className="space-y-3">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} lines={1} className="h-12" />
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    posts.map((post) => (
                      <tr
                        key={post.id}
                        className="border-b border-gray-100 last:border-none hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                              <FileText size={14} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-900 break-words">
                                {post.title}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                /blog/{post.slug}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(
                              post.status || "draft"
                            )}`}
                          >
                            {getStatusIcon(post.status || "draft")}
                            <span className="text-xs font-medium capitalize">
                              {post.status || "draft"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          {post.category ? (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Folder size={14} />
                              {post.category}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            {post.published_at ? (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar size={14} />
                                {fmtDate(post.published_at, locale, {
                                  dateStyle: "short",
                                })}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">
                                Não publicado
                              </span>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock size={12} />
                              {post.read_time_min} min
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <BarChart3 size={14} />
                            {post.views || 0} visualizações
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Link to={`/blog/${post.slug}`} target="_blank">
                              <Button
                                variant="secondary"
                                className="flex items-center gap-2"
                                noBorder
                                noFocus
                                noBackground
                              >
                                <Eye size={14} />
                                Ver
                              </Button>
                            </Link>
                            <Link to={`/admin/blog/edit/${post.id}`}>
                              <Button
                                variant="secondary"
                                className="flex items-center gap-2"
                                noBorder
                                noFocus
                                noBackground
                              >
                                <Edit size={14} />
                                Editar
                              </Button>
                            </Link>
                            {post.status !== "archived" ? (
                              <Button
                                variant="secondary"
                                className="flex items-center gap-2 text-gray-600"
                                noBorder
                                noFocus
                                noBackground
                                onClick={() => handleArchive(post.id)}
                                title="Arquivar"
                              >
                                <Archive size={14} />
                                Arquivar
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                className="flex items-center gap-2 text-gray-600"
                                noBorder
                                noFocus
                                noBackground
                                onClick={() => handleUnarchive(post.id)}
                                title="Desarquivar"
                              >
                                <RotateCcw size={14} />
                                Desarquivar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  {!loading && posts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-500">
                          <BookOpen size={48} className="text-gray-300" />
                          <div>
                            <div className="font-medium text-gray-900 mb-1">
                              {hasFilters
                                ? "Nenhum post encontrado"
                                : "Nenhum post criado"}
                            </div>
                            <div className="text-sm">
                              {hasFilters
                                ? "Tente ajustar os filtros de busca"
                                : "Comece criando seu primeiro artigo"}
                            </div>
                          </div>
                          {!hasFilters && (
                            <Link to="/admin/blog/new">
                              <Button className="flex items-center gap-2 mt-2">
                                <Plus size={14} />
                                Criar Primeiro Artigo
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile List */}
          <div className="space-y-4 lg:hidden">
            {loading && (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="p-4">
                    <Skeleton lines={3} />
                  </Card>
                ))}
              </div>
            )}
            {!loading &&
              posts.map((post) => (
                <Card key={post.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                        <FileText size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm break-words">
                          {post.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 break-all">
                          /blog/{post.slug}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${getStatusColor(
                        post.status || "draft"
                      )}`}
                    >
                      {getStatusIcon(post.status || "draft")}
                      <span className="font-medium capitalize">
                        {post.status || "draft"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        Categoria
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Folder size={12} />
                        {post.category || "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        Publicação
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar size={12} />
                        {post.published_at
                          ? fmtDate(post.published_at, locale, {
                              dateStyle: "short",
                            })
                          : "Não publicado"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {post.read_time_min} min
                      </div>
                      <div className="flex items-center gap-1">
                        <BarChart3 size={12} />
                        {post.views || 0} views
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <Link
                      to={`/blog/${post.slug}`}
                      target="_blank"
                      className="flex-1"
                    >
                      <Button
                        variant="secondary"
                        className="w-full flex items-center gap-2 justify-center"
                        noBorder
                        noFocus
                        noBackground
                      >
                        <Eye size={14} />
                        Ver
                      </Button>
                    </Link>
                    <Link to={`/admin/blog/edit/${post.id}`} className="flex-1">
                      <Button
                        variant="secondary"
                        className="w-full flex items-center gap-2 justify-center"
                        noBorder
                        noFocus
                        noBackground
                      >
                        <Edit size={14} />
                        Editar
                      </Button>
                    </Link>
                    {post.status !== "archived" ? (
                      <Button
                        variant="secondary"
                        className="flex-1 w-full flex items-center gap-2 justify-center text-gray-600"
                        noBorder
                        noFocus
                        noBackground
                        onClick={() => handleArchive(post.id)}
                        title="Arquivar"
                      >
                        <Archive size={14} />
                        Arquivar
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        className="flex-1 w-full flex items-center gap-2 justify-center text-gray-600"
                        noBorder
                        noFocus
                        noBackground
                        onClick={() => handleUnarchive(post.id)}
                        title="Desarquivar"
                      >
                        <RotateCcw size={14} />
                        Desarquivar
                      </Button>
                    )}
                  </div>
                </Card>
              ))}

            {!loading && posts.length === 0 && (
              <Card className="p-8 text-center">
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <BookOpen size={48} className="text-gray-300" />
                  <div>
                    <div className="font-medium text-gray-900 mb-1">
                      {hasFilters
                        ? "Nenhum post encontrado"
                        : "Nenhum post criado"}
                    </div>
                    <div className="text-sm">
                      {hasFilters
                        ? "Tente ajustar os filtros de busca"
                        : "Comece criando seu primeiro artigo"}
                    </div>
                  </div>
                  {!hasFilters && (
                    <Link to="/admin/blog/new">
                      <Button className="flex items-center gap-2 mt-2">
                        <Plus size={14} />
                        Criar Primeiro Artigo
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Pagination */}
        {posts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Mostrando <span className="font-semibold">{posts.length}</span>{" "}
              artigos
              {total > 0 && (
                <>
                  {" "}
                  de <span className="font-semibold">{total}</span> no total
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-2"
              >
                Anterior
              </Button>
              <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium">
                Página {page} de {totalPages}
              </span>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                className="flex items-center gap-2"
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogAdminListPage;
