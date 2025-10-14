import React, { useMemo, useState } from "react";
import { fetchPosts, fetchCategories } from "../../services/blog";
import type { BlogListItem, BlogListResponse } from "../../services/blog";
import { useAuth } from "../../contexts/useAuth";
import { Link, useSearchParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { useI18n, formatDate as fmtDate } from "../../i18n";
import { SEO } from "../../components/comum/SEO";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Footer from "../../components/layout/Footer";

// Tipos e dados mock (depois pode vir de uma API)
interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  publishDate: string;
  readTime: number;
  category: string;
  tags: string[];
  imageUrl: string;
  featured?: boolean;
}

const BlogPage: React.FC = () => {
  // Habilita leitura/atualização de query string (?category=...)
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const { locale, t } = useI18n();

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 9;
  const [categoriesApi, setCategoriesApi] = useState<
    { category: string; count: number }[]
  >([]);
  const { user, getAccessToken } = useAuth();
  const canPreview: boolean =
    !!user &&
    (user.role === "admin" ||
      (user as unknown as { role?: string }).role === "nutri");
  const [tagFilter, setTagFilter] = useState("");
  const queryClient = useQueryClient();

  // Aplicar categoria vinda da URL automaticamente (ex: /blog?category=geral)
  const categoriesSectionRef = React.useRef<HTMLDivElement | null>(null);
  const appliedQueryRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    const fromQuery = searchParams.get("category");
    if (!fromQuery) return;
    // Evitar reaplicar para o mesmo valor
    if (appliedQueryRef.current === fromQuery && selectedCategory === fromQuery) return;
    appliedQueryRef.current = fromQuery;
    if (fromQuery !== selectedCategory) setSelectedCategory(fromQuery);
    // Rolagem suave até a seção de categorias
    requestAnimationFrame(() => {
      categoriesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [searchParams, selectedCategory]);

  // Debounce leve para busca/tag (memória estável da key)
  const debouncedSearch = useMemo(() => searchTerm.trim(), [searchTerm]);
  const debouncedTag = useMemo(() => tagFilter.trim(), [tagFilter]);

  // Categorias com cache
  React.useEffect(() => {
    let mounted = true;
    fetchCategories()
      .then((res) => {
        if (mounted) setCategoriesApi(res.categories);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const {
    data: listResp,
    isLoading,
    error: listErr,
  } = useQuery<BlogListResponse>({
    queryKey: [
      "blog",
      "list",
      {
        page,
        limit,
        category: selectedCategory,
        search: debouncedSearch,
        tag: debouncedTag,
        mode: canPreview ? "preview" : "public",
      },
    ],
    queryFn: async () => {
      const token = canPreview
        ? (await getAccessToken?.()) || undefined
        : undefined;
      return fetchPosts({
        page,
        limit,
        category: selectedCategory,
        search: debouncedSearch || undefined,
        tag: debouncedTag || undefined,
        preview: canPreview || undefined,
        accessToken: token,
      });
    },
  });

  React.useEffect(() => {
    // Prefetch da próxima página para navegação suave
    const nextPage = page + 1;
    const tokenPromise = canPreview
      ? getAccessToken?.()
      : Promise.resolve(undefined);
    tokenPromise?.then((token) => {
      queryClient.prefetchQuery({
        queryKey: [
          "blog",
          "list",
          {
            page: nextPage,
            limit,
            category: selectedCategory,
            search: debouncedSearch,
            tag: debouncedTag,
            mode: canPreview ? "preview" : "public",
          },
        ],
        queryFn: () =>
          fetchPosts({
            page: nextPage,
            limit,
            category: selectedCategory,
            search: debouncedSearch || undefined,
            tag: debouncedTag || undefined,
            preview: canPreview || undefined,
            accessToken: (token || undefined) as string | undefined,
          }),
      });
    });
  }, [
    page,
    limit,
    selectedCategory,
    debouncedSearch,
    debouncedTag,
    canPreview,
    getAccessToken,
    queryClient,
  ]);

  React.useEffect(() => {
    // Prefetch do post ao passar mouse no card (delegado via evento)
    const handler = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest(
        'a[href^="/blog/"]'
      ) as HTMLAnchorElement | null;
      if (!a) return;
      const slug = a.getAttribute("href")?.split("/blog/")[1];
      if (!slug) return;
      const tokenPromise = canPreview
        ? getAccessToken?.()
        : Promise.resolve(undefined);
      tokenPromise?.then((token) => {
        queryClient.prefetchQuery({
          queryKey: ["blog", "post", slug, canPreview ? "preview" : "public"],
          queryFn: async () => {
            const access = canPreview ? token || undefined : undefined;
            const mod = await import("../../services/blog");
            return mod.fetchPost(slug, canPreview || false, access);
          },
        });
      });
    };
    document.addEventListener("mouseover", handler);
    return () => document.removeEventListener("mouseover", handler);
  }, [canPreview, getAccessToken, queryClient]);

  React.useEffect(() => {
    // Atualizar estados derivados quando a query resolver
    if (!listResp) return;
    const results: BlogListItem[] = (listResp.results || []) as BlogListItem[];
    const mapped: BlogPost[] = results.map((r: BlogListItem) => ({
      id: r.slug,
      title: r.title,
      excerpt: r.excerpt || "",
      author: "Avante Nutri",
      publishDate: r.published_at || "",
      readTime: r.read_time_min || 1,
      category: r.category || "geral",
      tags: r.tags || [],
      imageUrl: r.cover_image_url || "/blog/placeholder.jpg",
      featured: false,
    }));
    setBlogPosts(mapped);
    setTotal(listResp.total ?? 0);
    setLoading(false);
    setError(null);
  }, [listResp]);

  React.useEffect(() => {
    setLoading(isLoading);
    setError(listErr ? "Erro ao carregar artigos" : null);
  }, [isLoading, listErr]);

  const categories = [
    { id: "todos", name: "Todos os Artigos", count: total },
    ...categoriesApi.map((c) => ({
      id: c.category,
      name: c.category[0].toUpperCase() + c.category.slice(1),
      count: c.count,
    })),
  ];

  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory =
      selectedCategory === "todos" || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  const featuredPost = blogPosts[0];
  const recentPosts = blogPosts.slice(0, 3);

  const BlogPostCard: React.FC<{ post: BlogPost }> = ({ post }) => (
    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 group border border-gray-100 bg-white rounded-2xl">
      <Link to={`/blog/${post.id}`} className="block h-full">
        <div className="relative overflow-hidden">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-semibold rounded-full shadow-sm">
              {categories.find((cat) => cat.id === post.category)?.name}
            </span>
          </div>
          {canPreview && post.publishDate === "" && (
            <span className="absolute top-4 right-4 text-xs px-2 py-1 bg-amber-500 text-white rounded-full shadow-lg">
              Rascunho
            </span>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 font-medium">
              {fmtDate(post.publishDate, locale, { dateStyle: "medium" })}
            </span>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {post.readTime} min
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-700 transition-colors duration-300 line-clamp-2 leading-tight">
            {post.title}
          </h3>
          <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
            {post.excerpt}
          </p>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {post.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-3 shadow-sm shrink-0">
                <span className="text-white font-bold text-sm">AC</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  Andreina Cawanne
                </p>
                <p className="text-xs text-gray-500">Nutricionista</p>
              </div>
            </div>
            <button className="text-green-600 hover:text-green-700 font-semibold flex items-center justify-center hover:scale-105 transition-all duration-300">
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </button>
          </div>
        </div>
      </Link>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <SEO
        title={t("blog.list.seo.title")}
        description={t("blog.list.seo.desc")}
      />

      {/* Header Corporativo */}
      <section className="relative bg-gradient-to-r from-gray-900 to-green-900 text-white py-10 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-green-600/20 to-transparent"></div>

        <div className="relative max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-4 border border-white/20">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                Blog
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Conhecimento que
                <span className="text-green-400"> Transforma</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-300 leading-relaxed max-w-2xl">
                Insights baseados em ciência, estratégias e tendências do setor
                de nutrição e saúde, para ajudar você na jornada de uma
                alimentação mais saudável e consciente.
              </p>

              {/* Busca Avançada */}
              <div className="space-y-4 pt-4">
                <div className="relative max-w-2xl">
                  <input
                    type="text"
                    placeholder="Buscar artigos, pesquisas, white papers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 pr-10 py-2 border border-white/30 bg-white/10 backdrop-blur-sm rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="text-2xl font-bold text-green-400">
                      {total}+
                    </div>
                    <div className="text-sm text-gray-300">
                      Artigos Publicados
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="text-2xl font-bold text-green-400">
                      {categories.length}+
                    </div>
                    <div className="text-sm text-gray-300">Especialidades</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="text-2xl font-bold text-green-400">
                      100%
                    </div>
                    <div className="text-sm text-gray-300">Base Científica</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="text-2xl font-bold text-green-400">A+</div>
                    <div className="text-sm text-gray-300">Qualidade</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Conteúdo Principal */}
          <main className="lg:w-3/4">
            {/* Post em Destaque */}
            {featuredPost && (
              <section className="mb-16">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Destaque do Mês
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse  "></span>
                    Em Alta
                  </div>
                </div>

                <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 border border-gray-100 rounded-3xl">
                  <Link to={`/blog/${featuredPost.id}`} className="block">
                    <div className="grid lg:grid-cols-2 gap-0">
                      <div className="relative overflow-hidden">
                        <img
                          src={featuredPost.imageUrl}
                          alt={featuredPost.title}
                          className="w-full h-64 lg:h-full object-cover hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute top-6 left-6">
                          <span className="px-4 py-2 bg-white/95 backdrop-blur-sm text-gray-800 text-sm font-semibold rounded-full shadow-lg">
                            {
                              categories.find(
                                (cat) => cat.id === featuredPost.category
                              )?.name
                            }
                          </span>
                        </div>
                      </div>
                      <div className="p-4 lg:p-8 flex flex-col justify-center">
                        <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                          <span>
                            {fmtDate(featuredPost.publishDate, locale, {
                              dateStyle: "long",
                            })}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 truncate text-xs">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {featuredPost.readTime} min
                          </span>
                        </div>

                        <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                          {featuredPost.title}
                        </h3>
                        <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                          {featuredPost.excerpt}
                        </p>

                        {/* Tags do Featured */}
                        {featuredPost.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-6">
                            {featuredPost.tags.slice(0, 4).map((tag, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-4 shadow-md shrink-0">
                              <span className="text-white font-bold">AN</span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                Andreina Cawanne
                              </p>
                              <p className="text-sm text-gray-500">
                                Nutricionista
                              </p>
                            </div>
                          </div>
                          <button className="text-green-600 hover:text-green-700 font-semibold flex items-center justify-center hover:scale-105 transition-all duration-300">
                            <svg
                              className="w-4 h-4 ml-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </Card>
              </section>
            )}

            {/* Filtros de Categoria */}
            <section className="mb-12" ref={categoriesSectionRef}>
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      // Atualiza a URL para compartilhar o filtro atual
                      const params = new URLSearchParams(window.location.search);
                      if (category.id === "todos") {
                        params.delete("category");
                      } else {
                        params.set("category", category.id);
                      }
                      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
                      window.history.replaceState({}, "", newUrl);
                    }}
                    className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      selectedCategory === category.id
                        ? "bg-green-600 text-white shadow-lg shadow-green-600/25"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md"
                    }`}
                  >
                    {category.name}
                    <span
                      className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        selectedCategory === category.id
                          ? "bg-white/20 text-white/90"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Grid de Artigos */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedCategory === "todos"
                    ? "Todos os Artigos"
                    : categories.find((cat) => cat.id === selectedCategory)
                        ?.name}
                </h2>
                <span className="text-green-600 font-semibold">
                  {filteredPosts.length}{" "}
                  {filteredPosts.length === 1 ? "resultado" : "resultados"}
                </span>
              </div>

              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse rounded-2xl">
                      <div className="h-48 bg-gray-200 rounded-t-2xl"></div>
                      <div className="p-6 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {!loading && error && (
                <Card className="text-center py-16 rounded-2xl border-2 border-dashed border-gray-200">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Erro ao Carregar
                  </h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <Button onClick={() => window.location.reload()}>
                    Tentar Novamente
                  </Button>
                </Card>
              )}

              {!loading && !error && filteredPosts.length === 0 ? (
                <Card className="text-center py-16 rounded-2xl border-2 border-dashed border-gray-200">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Nenhum artigo encontrado
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Tente ajustar os filtros ou termos de busca
                  </p>
                  <Button
                    onClick={() => {
                      setSearchTerm("");
                      setTagFilter("");
                      setSelectedCategory("todos");
                    }}
                    variant="secondary"
                  >
                    Limpar Filtros
                  </Button>
                </Card>
              ) : (
                !loading &&
                !error && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredPosts.map((post) => (
                      <BlogPostCard key={post.id} post={post} />
                    ))}
                  </div>
                )
              )}

              {/* Paginação */}
              {!loading && !error && total > limit && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 pt-8 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Mostrando {(page - 1) * limit + 1}-
                    {Math.min(page * limit, total)} de {total} artigos
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Anterior
                    </Button>

                    <div className="flex gap-1">
                      {[...Array(Math.min(5, Math.ceil(total / limit)))].map(
                        (_, i) => {
                          const pageNumber = i + 1;
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => setPage(pageNumber)}
                              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                                page === pageNumber
                                  ? "bg-green-600 text-white"
                                  : "text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        }
                      )}
                    </div>

                    <Button
                      variant="secondary"
                      disabled={page >= Math.ceil(total / limit)}
                      onClick={() => setPage((p) => p + 1)}
                      className="flex items-center gap-2"
                    >
                      Próxima
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Button>
                  </div>
                </div>
              )}

              {canPreview && (
                <div className="mt-6 text-center text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <strong>Modo Preview Ativo</strong> - Visualizando rascunhos e
                  conteúdo não publicado
                </div>
              )}
            </section>
          </main>

          {/* Sidebar Corporativa */}
          <aside className="lg:w-1/4 flex flex-col gap-8">
            {/* Sobre a Empresa */}
            <Card className="p-6 rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white order-3 lg:order-1">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                  <span className="text-white font-bold text-xl">AN</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Sobre o Blog
                </h3>
              </div>

              <p className="text-gray-600 text-sm mb-6 text-center leading-relaxed">
                Espaço dedicado à compartilhar conhecimento sobre nutrição,
                saúde e bem-estar de forma acessível e prática.
              </p>

              <div className="mt-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lgflex items-center justify-center">
                  <img
                    src="/avatarBlog.png"
                    alt="Autor"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Andreina Cawwane</p>
                  <p className="text-sm text-gray-500">Nutricionista 43669/P</p>
                </div>
              </div>
            </Card>

            {/* Categorias Corporativas */}
            <Card className="p-6 rounded-2xl border border-gray-100 order-1 lg:order-2">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                Especialidades
              </h3>
              <div className="space-y-3">
                {categories
                  .filter((cat) => cat.id !== "todos")
                  .map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className="flex justify-between items-center w-full text-left p-3 rounded-xl hover:bg-green-50 transition-colors group"
                    >
                      <span
                        className={`font-medium ${
                          selectedCategory === category.id
                            ? "text-green-700"
                            : "text-gray-700 group-hover:text-green-600"
                        }`}
                      >
                        {category.name}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedCategory === category.id
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600 group-hover:bg-green-100 group-hover:text-green-700"
                        }`}
                      >
                        {category.count}
                      </span>
                    </button>
                  ))}
              </div>
            </Card>

            {/* Posts Recentes */}
            <Card className="p-6 rounded-2xl border border-gray-100 order-2 lg:order-3">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Publicações Recentes
              </h3>
              <div className="space-y-4">
                {recentPosts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.id}`}
                    className="flex items-start gap-3 group p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-green-600 transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {fmtDate(post.publishDate, locale, {
                          dateStyle: "short",
                        })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BlogPage;
