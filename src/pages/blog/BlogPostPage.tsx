import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Footer from "../../components/layout/Footer";
import { useI18n, formatDate as fmtDate } from "../../i18n";
import { SEO } from "../../components/comum/SEO";
import { useAuth } from "../../contexts/useAuth";

const BlogPostPage: React.FC = () => {
  const { slug } = useParams();

  const { locale, t } = useI18n();

  const [post, setPost] = useState<any | null>(null);
  const [relatedPosts, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const canPreview = !!user && (user.role === 'admin' || (user as any).role === 'nutri');

  useEffect(() => {
    if(!slug) return;
    let ignore = false;
    async function load(){
      setLoading(true); setError(null);
      try {
        const base = import.meta.env.VITE_API_AUTH_BASE || 'https://login-service.avantenutri.workers.dev';
  const r = await fetch(`${base}/blog/posts/${slug}${canPreview ? '?preview=1':''}`);
        if(r.status === 404){ if(!ignore) { setError('NOT_FOUND'); setLoading(false);} return; }
        if(!r.ok) throw new Error('fail');
        const data = await r.json();
        if(ignore) return;
        setPost(data.post);
        const rr = await fetch(`${base}/blog/posts/${slug}/related?limit=3`);
        if(rr.ok){ const rd = await rr.json(); setRelated(rd.results || []); }
      } catch(e:any){
        if(!ignore) setError('Erro ao carregar');
      } finally {
        if(!ignore) setLoading(false);
      }
    }
    load();
    return ()=> { ignore = true; };
  }, [slug, canPreview]);

  const publishDate = post?.published_at || post?.created_at;
  const seoTitle = post?.title ? `${post.title} | ${t('seo.brand')}` : t('blog.post.seo.title.fallback');
  // Prefer explicit excerpt if exists, else derive from content_html text content
  const rawText = post?.excerpt || (post?.content_html ? post.content_html.replace(/<[^>]+>/g,' ') : '');
  const normalized = rawText.replace(/\s+/g,' ').trim();
  const finalDesc = normalized ? (normalized.length > 155 ? normalized.slice(0,152).trim() + '...' : normalized) : t('blog.post.seo.desc.fallback');
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-25 py-8">
      <SEO
        title={seoTitle}
        description={finalDesc}
        type="article"
        authorName={post?.author_name || 'Avante Nutri'}
        publishedTimeISO={publishDate ? new Date(publishDate).toISOString() : undefined}
        modifiedTimeISO={post?.updated_at ? new Date(post.updated_at).toISOString() : undefined}
        section={post?.category}
        tags={post?.tags || []}
        readTimeMinutes={post?.read_time_min}
        image={post?.cover_image_url || 'https://avantenutri.com.br/logo-social.png'}
        imageWidth={1200}
        imageHeight={630}
        breadcrumbItems={[
          { name: 'Início', url: 'https://avantenutri.com.br/' },
          { name: 'Blog', url: 'https://avantenutri.com.br/blog' },
          ...(post?.title ? [{ name: post.title, url: `https://avantenutri.com.br/blog/${post.slug}` }] : [])
        ]}
      />
      <div className="max-w-4xl mx-auto px-4">
        {loading && <div className="py-16 text-center text-gray-600">Carregando...</div>}
        {!loading && error === 'NOT_FOUND' && <div className="py-16 text-center text-gray-600">Artigo não encontrado.</div>}
        {!loading && error && error !== 'NOT_FOUND' && <div className="py-16 text-center text-red-600">Erro ao carregar.</div>}
  {!loading && !error && post && (
  <> {/* Cabeçalho do Artigo */}
  <article className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <img
            src={post.cover_image_url || '/blog/placeholder.jpg'}
            alt={post.title}
            className="w-full h-64 object-cover"
          />

          <div className="p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                {post.category || 'geral'}
              </span>
              <span className="text-gray-500 text-sm">
                {post.read_time_min || 1} min de leitura
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>

            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 font-bold">DA</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{post.author_name || 'Avante Nutri'}</p>
                <p className="text-sm text-gray-500">
                  {publishDate ? `Publicado em ${fmtDate(publishDate, locale, { dateStyle: 'long' })}`: null}
                </p>
              </div>
              {canPreview && (
                <span className={`ml-4 text-xs uppercase tracking-wide px-2 py-1 rounded-full ${post.status==='published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{post.status || 'draft'}</span>
              )}
            </div>

            {/* Conteúdo do Artigo */}
            <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content_html }} />

            {/* Tags */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {(post.tags || []).map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
  </article>
  </>) }

        {/* Compartilhamento */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Compartilhe este artigo
          </h3>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </Button>
            <Button variant="secondary" className="flex-1">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
              Twitter
            </Button>
            <Button variant="secondary" className="flex-1">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </Button>
          </div>
        </Card>

        {/* Artigos Relacionados */}
        {!loading && !error && relatedPosts.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Artigos Relacionados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((relatedPost) => (
              <Card
                key={relatedPost.id}
                className="p-4 hover:shadow-lg transition-shadow"
              >
                <Link to={`/blog/${relatedPost.slug}`} className="block">
                  <h3 className="font-semibold text-gray-900 mb-2 hover:text-green-600 transition-colors">
                    {relatedPost.title}
                  </h3>
                  <span className="text-green-600 text-sm">
                    {relatedPost.category || 'geral'}
                  </span>
                </Link>
              </Card>
            ))}
          </div>
        </section>
        )}

        {/* Call-to-Action */}
        <Card className="p-8 text-center bg-gradient-to-r from-green-500 to-green-600 text-white">
          <h3 className="text-2xl sm:text-3xl font-bold mb-4">
            Pronto para Transformar sua Saúde?
          </h3>
          <p className="text-green-100 mb-6">
            Comece hoje mesmo sua jornada para uma vida mais saudável
          </p>
          <Link to="/questionario">
            <Button className="bg-white/30 text-green-600 hover:bg-green-50 px-8">
              Começar
            </Button>
          </Link>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default BlogPostPage;
