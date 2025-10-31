import React from "react";
import { ensureAdSenseLoaded } from "../../utils/adsense";
import { Link, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Footer from "../../components/layout/Footer";
import { useI18n, formatDate as fmtDate } from "../../i18n/utils";
import { SEO } from "../../components/comum/SEO";
import { useAuth } from "../../contexts/useAuth";
import { fetchPost, fetchRelated } from "../../services/blog";
import type { BlogPostDetail } from "../../services/blog";
import { useQuery } from "@tanstack/react-query";

const BlogPostPage: React.FC = () => {
  // Carrega AdSense apenas nas páginas do blog
  React.useEffect(() => {
    ensureAdSenseLoaded();
  }, []);
  const { slug } = useParams();
  const { locale, t } = useI18n();
  const { user, getAccessToken } = useAuth();

  const canPreview = !!user && (user.role === "admin" || user.role === "nutri");

  const {
    data: postResp,
    isLoading: postLoading,
    error: postErr,
  } = useQuery({
    queryKey: ["blog", "post", slug, canPreview ? "preview" : "public"],
    enabled: !!slug,
    queryFn: async () => {
      const access = canPreview
        ? (await getAccessToken?.()) || undefined
        : undefined;
      return fetchPost(slug!, canPreview || false, access);
    },
  });

  const post = (postResp?.post as BlogPostDetail) || null;

  const { data: relatedResp, isLoading: relatedLoading } = useQuery({
    queryKey: ["blog", "post", slug, "related"],
    enabled: !!slug && !!post,
    queryFn: () => fetchRelated(slug!),
  });

  const relatedPosts = (relatedResp?.results as BlogPostDetail[]) || [];
  const loading = postLoading || (relatedLoading && relatedPosts.length === 0);
  const error = postErr ? "Erro ao carregar" : null;

  const publishDate = post?.published_at || post?.created_at;

  // SEO Optimization
  const seoTitle = post?.title
    ? `${post.title} | ${t("seo.brand")}`
    : t("blog.post.seo.title.fallback");
  const rawText =
    post?.excerpt ||
    (post?.content_html ? post.content_html.replace(/<[^>]+>/g, " ") : "");
  const normalized = rawText.replace(/\s+/g, " ").trim();
  const finalDesc = normalized
    ? normalized.length > 155
      ? normalized.slice(0, 152).trim() + "..."
      : normalized
    : t("blog.post.seo.desc.fallback");

  // Reading progress (imperativo para evitar re-render em scroll)
  const progressRef = React.useRef<HTMLDivElement | null>(null);
  // Share helpers
  const canonicalUrl = React.useMemo(() => {
    if (post?.slug) return `https://avantenutri.com.br/blog/${post.slug}`;
    try {
      return window.location.href;
    } catch {
      return "https://avantenutri.com.br/blog";
    }
  }, [post?.slug]);
  const openPopup = React.useCallback((url: string) => {
    const w = 600;
    const h = 550;
    const dualScreenLeft = window.screenLeft ?? window.screenX ?? 0;
    const dualScreenTop = window.screenTop ?? window.screenY ?? 0;
    const width =
      window.innerWidth || document.documentElement.clientWidth || screen.width;
    const height =
      window.innerHeight ||
      document.documentElement.clientHeight ||
      screen.height;
    const left = dualScreenLeft + (width - w) / 2;
    const top = dualScreenTop + (height - h) / 2;
    window.open(
      url,
      "share",
      `scrollbars=yes,width=${w},height=${h},top=${top},left=${left},noopener,noreferrer`
    );
  }, []);
  const shareFacebook = React.useCallback(() => {
    const u = encodeURIComponent(canonicalUrl);
    openPopup(`https://www.facebook.com/sharer/sharer.php?u=${u}`);
  }, [canonicalUrl, openPopup]);
  const shareTwitter = React.useCallback(() => {
    const u = encodeURIComponent(canonicalUrl);
    const text = encodeURIComponent(post?.title || "");
    openPopup(`https://twitter.com/intent/tweet?url=${u}&text=${text}`);
  }, [canonicalUrl, post?.title, openPopup]);
  const shareLinkedIn = React.useCallback(() => {
    const u = encodeURIComponent(canonicalUrl);
    openPopup(`https://www.linkedin.com/sharing/share-offsite/?url=${u}`);
  }, [canonicalUrl, openPopup]);
  const shareOther = React.useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post?.title || "Avante Nutri",
          text: finalDesc,
          url: canonicalUrl,
        });
        return;
      }
    } catch {
      // continua para fallback
    }
    try {
      await navigator.clipboard?.writeText?.(canonicalUrl);
    } catch {
      const mailto = `mailto:?subject=${encodeURIComponent(
        post?.title || "Avante Nutri"
      )}&body=${encodeURIComponent(canonicalUrl)}`;
      window.location.href = mailto;
    }
  }, [canonicalUrl, finalDesc, post?.title]);
  React.useEffect(() => {
    let raf: number | null = null;
    const update = () => {
      raf = null;
      const docHeight = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const scrollTop = window.scrollY;
      const pct =
        docHeight > 0
          ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100))
          : 0;
      if (progressRef.current) progressRef.current.style.width = pct + "%";
    };
    const onScroll = () => {
      if (raf != null) return;
      raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    // inicial
    update();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <SEO
        title={seoTitle}
        description={finalDesc}
        type="article"
        authorName="Andreina Cawwane"
        publishedTimeISO={
          publishDate ? new Date(publishDate).toISOString() : undefined
        }
        modifiedTimeISO={
          post?.updated_at ? new Date(post.updated_at).toISOString() : undefined
        }
        section={post?.category}
        tags={post?.tags || []}
        readTimeMinutes={post?.read_time_min}
        image={
          post?.cover_image_url || "https://avantenutri.com.br/logo-social.png"
        }
        imageWidth={1200}
        imageHeight={630}
        breadcrumbItems={[
          { name: "Início", url: "https://avantenutri.com.br/" },
          { name: "Blog", url: "https://avantenutri.com.br/blog" },
          ...(post?.title
            ? [
                {
                  name: post.title,
                  url: `https://avantenutri.com.br/blog/${post.slug}`,
                },
              ]
            : []),
        ]}
      />

      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-gray-200 z-50">
        <div
          ref={progressRef}
          className="h-full bg-gradient-to-r from-green-600 to-emerald-700 transition-all duration-150 shadow-lg"
          style={{ width: "0%" }}
        />
      </div>

      <div className="relative">
        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-16">
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

        {/* Error State */}
        {!loading && !post && (
          <div className="min-h-screen flex items-center justify-center py-16">
            <div className="text-center max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Conteúdo Não Encontrado
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                O artigo que você está procurando não está disponível no
                momento. Pode ter sido movido ou está em processo de
                atualização.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/blog">
                  <Button className="bg-green-600 hover:bg-green-700 text-white px-8">
                    Explorar Blog
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="secondary" className="px-8">
                    Página Inicial
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Article Content */}
        {!loading && !error && post && (
          <>
            {/* Hero Section */}
            <section className="relative bg-gradient-to-r from-gray-900 to-green-900 text-white overflow-hidden">
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-green-600/30 to-transparent"></div>

              <div className="relative max-w-6xl mx-auto px-4 py-20">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6 min-w-0">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm text-green-200 mb-6 min-w-0">
                      <Link
                        to="/"
                        className="hover:text-white transition-colors shrink-0"
                      >
                        Início
                      </Link>
                      <span className="text-green-400 shrink-0">/</span>
                      <Link
                        to="/blog"
                        className="hover:text-white transition-colors shrink-0"
                      >
                        Blog
                      </Link>
                      <span className="text-green-400 shrink-0">/</span>
                      <Link
                        to={{ pathname: "/blog", search: `?${new URLSearchParams({ category: post.category || '' }).toString()}` }}
                        className="hover:text-white transition-colors truncate min-w-0 max-w-[40vw] sm:max-w-[50vw] md:max-w-none"
                        title={post.category || undefined}
                      >
                        {post.category}
                      </Link>
                      <span className="text-green-400 shrink-0">/</span>
                      <span
                        className="text-white font-medium truncate min-w-0 flex-1"
                        title={post.title || undefined}
                      >
                        {post.title}
                      </span>
                    </nav>

                    {/* Categoria e Status */}
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-2 text-green-200 text-xs">
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
                        {post.read_time_min || 5} min de leitura
                      </span>
                      {canPreview && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                            post.status === "published"
                              ? "bg-green-600 text-white"
                              : "bg-amber-500 text-white"
                          }`}
                        >
                          {post.status || "rascunho"}
                        </span>
                      )}
                    </div>

                    {/* Título Principal */}
                    <h1 className="text-2xl md:text-5xl lg:text-6xl font-bold leading-tight text-white drop-shadow-2xl break-words max-w-full">
                      {post.title}
                    </h1>

                    {/* Metadados do Artigo (desktop) */}
                    <div className="hidden lg:flex items-center gap-6 pt-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-green-300 to-emerald-600 flex items-center justify-center">
                          <img
                            src="/avatarBlog.png"
                            alt="Autor"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (
                                e.currentTarget as HTMLImageElement
                              ).style.display = "none";
                              const sib = e.currentTarget
                                .nextElementSibling as HTMLElement | null;
                              if (sib) sib.classList.remove("hidden");
                            }}
                          />
                          <span className="hidden text-white font-bold text-sm">
                            AN
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            Andreina Cawwane
                          </p>
                          <p className="text-green-200 text-xs">
                            {publishDate &&
                              fmtDate(publishDate, locale, {
                                dateStyle: "long",
                              })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Imagem Destacada */}
                  <div className="relative min-w-0">
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl max-w-full">
                      <img
                        src={post.cover_image_url || "/blog/placeholder.jpg"}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    </div>
                    {/* Metadados do Artigo (mobile) */}
                    <div className="mt-4 flex items-center gap-3 lg:hidden">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-green-300 to-emerald-600 flex items-center justify-center">
                        <img
                          src="/avatarBlog.png"
                          alt="Autor"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (
                              e.currentTarget as HTMLImageElement
                            ).style.display = "none";
                            const sib = e.currentTarget
                              .nextElementSibling as HTMLElement | null;
                            if (sib) sib.classList.remove("hidden");
                          }}
                        />
                        <span className="hidden text-white font-bold text-sm">
                          AN
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">
                          Andreina Cawwane
                        </p>
                        <p className="text-green-200 text-[11px]">
                          {publishDate &&
                            fmtDate(publishDate, locale, { dateStyle: "long" })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Conteúdo Principal */}
            <div className="max-w-4xl mx-auto px-2 py-4">
              <div>
                {/* Conteúdo do Artigo */}
                <main className="lg:col-span-3">
                  <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Conteúdo HTML */}
                    <div className="px-4 py-2">
                      <div
                        className="prose prose-lg max-w-none 
                        prose-headings:font-bold prose-headings:text-gray-900 
                        prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                        prose-a:text-green-600 prose-a:no-underline hover:prose-a:underline
                        prose-strong:text-gray-900 prose-strong:font-semibold
                        prose-ul:text-gray-700 prose-ol:text-gray-700
                        prose-blockquote:border-green-300 prose-blockquote:bg-green-50 
                        prose-blockquote:italic prose-blockquote:text-gray-700 prose-blockquote:p-6
                        prose-blockquote:rounded-xl prose-blockquote:border-l-4
                        prose-table:border-gray-200 prose-table:rounded-lg
                        prose-img:rounded-xl prose-img:shadow-md
                        prose-pre:bg-gray-900 prose-pre:text-gray-100
                        md:[&_.text-xs]:text-sm md:[&_.text-sm]:text-base
                        [&_a.cta]:inline-block [&_a.cta]:px-5 [&_a.cta]:py-3 [&_a.cta]:rounded-xl
                        [&_a.cta]:bg-green-600 [&_a.cta]:text-white [&_a.cta]:font-semibold
                        hover:[&_a.cta]:bg-green-700 [&_a.cta]:no-underline"
                      >
                        <div
                          dangerouslySetInnerHTML={{
                            __html: post.content_html,
                          }}
                        />
                      </div>

                      {/* Tags Corporativas */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="mt-12 pt-8 border-t border-gray-200">
                          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-green-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                              />
                            </svg>
                            Palavras-chave
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {post.tags.map((tag: string) => (
                              <span
                                key={tag}
                                className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 text-sm rounded-xl font-semibold border border-gray-200 hover:border-green-300 transition-colors shadow-sm"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>

                  {/* Compartilhamento */}
                  <Card className="p-8 mt-8 border border-gray-200 rounded-2xl">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        Gostou deste artigo?
                      </h3>
                      <p className="text-gray-600 mb-6 text-sm sm:text-base">
                        Compartilhe com amigos e familiares que podem se
                        beneficiar
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
                        <Button
                          variant="secondary"
                          className="flex items-center justify-center gap-2"
                          noFocus
                          noBackground
                          noBorder
                          onClick={shareFacebook}
                        >
                          <svg
                            className="w-4 h-4 text-blue-600"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                          Facebook
                        </Button>

                        <Button
                          variant="secondary"
                          className="flex items-center justify-center gap-2"
                          noFocus
                          noBackground
                          noBorder
                          onClick={shareTwitter}
                        >
                          <svg
                            className="w-4 h-4 text-blue-400"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                          </svg>
                          Twitter
                        </Button>

                        <Button
                          variant="secondary"
                          className="flex items-center justify-center gap-2"
                          noFocus
                          noBackground
                          noBorder
                          onClick={shareLinkedIn}
                        >
                          <svg
                            className="w-4 h-4 text-blue-700"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                          LinkedIn
                        </Button>

                        <Button
                          variant="secondary"
                          className="flex items-center justify-center gap-2"
                          noFocus
                          noBackground
                          noBorder
                          onClick={shareOther}
                        >
                          <svg
                            className="w-4 h-4 text-green-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                            />
                          </svg>
                          Outras
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Autor e Credenciais */}
                  <Card className="p-8 mt-8 bg-gradient-to-br from-gray-50 to-white border border-gray-200">
                    <div className="flex flex-col md:flex-row items-start gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                          <svg
                            className="w-10 h-10 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                          </svg>
                        </div>
                      </div>

                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          Sobre a Avante Nutri
                        </h3>
                        <p className="text-gray-700 leading-relaxed mb-4 text-sm">
                          Somos uma equipe de nutricionistas especializados em
                          transformar vidas através da alimentação saudável. Com
                          mais de 6 anos de experiência, já ajudamos milhares de
                          pacientes a alcançarem seus objetivos de saúde e
                          bem-estar.
                        </p>

                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <svg
                              className="w-4 h-4 text-green-600"
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
                            +6 anos de experiência
                          </div>
                          <div className="flex items-center gap-1">
                            <svg
                              className="w-4 h-4 text-green-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            +5.000 pacientes
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </main>
              </div>
            </div>
          </>
        )}

        {/* Artigos Relacionados */}
        {!loading && relatedPosts.length > 0 && (
          <section className="bg-gray-50 py-16">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Conteúdo Relacionado
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
                  Continue explorando artigos que podem te interessar
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedPosts.map((relatedPost) => (
                  <Card
                    key={relatedPost.id}
                    className="group hover:shadow-2xl transition-all duration-500 border border-gray-200 rounded-2xl overflow-hidden bg-white"
                  >
                    <Link to={`/blog/${relatedPost.slug}`} className="block">
                      <div className="relative overflow-hidden">
                        <img
                          src={
                            relatedPost.cover_image_url ||
                            "/blog/placeholder.jpg"
                          }
                          alt={relatedPost.title}
                          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm text-gray-800 text-xs font-semibold rounded-full shadow-sm">
                            {relatedPost.category || "Pesquisa"}
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-gray-500 font-medium">
                            {relatedPost.published_at ?? relatedPost.created_at
                              ? fmtDate(
                                  (relatedPost.published_at ??
                                    relatedPost.created_at) as string,
                                  locale,
                                  { dateStyle: "short" }
                                )
                              : null}
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
                            {relatedPost.read_time_min || 5} min
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-700 transition-colors line-clamp-2 leading-tight">
                          {relatedPost.title}
                        </h3>

                        <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                          {relatedPost.excerpt ||
                            "Estudo aprofundado sobre nutrição e saúde..."}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-3 shadow-sm shrink-0">
                              <span className="text-white font-bold text-sm">
                                AC
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                Andreina Cawanne
                              </p>
                              <p className="text-xs text-gray-500">
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
                                strokeWidth="2"
                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                              ></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>

              <div className="flex justify-center text-center mt-12">
                <Link to="/blog">
                  <Button
                    variant="secondary"
                    className="px-8 py-3 font-semibold flex items-center justify-center"
                  >
                    Explorar Todos os Artigos
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
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* CTA Corporativo */}
        {!loading && post && (
          <section className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-12">
            <div className="max-w-4xl mx-auto px-4 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <h2 className="text-2xl md:text-4xl font-bold mb-6">
                Pronto para Transformar sua Saúde?
              </h2>

              <p className="text-green-200 mb-6 text-sm sm:text-base">
                Mais de 5.000 pacientes já transformaram suas vidas conosco
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/dashboard">
                  <Button className=" px-8 py-3 font-semibold rounded-lg shadow-lg">
                    Iniciar Avaliação
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-12 pt-12 border-t border-green-500/30">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-2">A+</div>
                  <div className="text-green-200 text-xs">Avaliação</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-2">100%</div>
                  <div className="text-green-200 text-xs">Base Científica</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-2">24/7</div>
                  <div className="text-green-200 text-xs">Suporte Dedicado</div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default BlogPostPage;
