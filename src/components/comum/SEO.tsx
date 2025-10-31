import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  url?: string;
  image?: string;
  schema?: Record<string, unknown>;
  type?: 'website' | 'article';
  publishedTimeISO?: string; // for article
  modifiedTimeISO?: string;
  authorName?: string;
  section?: string; // category
  tags?: string[];
  readTimeMinutes?: number;
  imageWidth?: number;
  imageHeight?: number;
  publisherName?: string;
  publisherLogo?: string;
  breadcrumbItems?: { name: string; url: string }[]; // for BreadcrumbList schema
}

export function SEO({
  title,
  description,
  url,
  image = "https://avantenutri.com.br/logo-social.png",
  schema,
  type = 'website',
  publishedTimeISO,
  modifiedTimeISO,
  authorName,
  section,
  tags,
  readTimeMinutes,
  imageWidth,
  imageHeight,
  publisherName = 'Avante Nutri',
  publisherLogo = 'https://avantenutri.com.br/logo.png',
  breadcrumbItems,
}: SEOProps) {
  const location = useLocation();
  const baseUrl = "https://avantenutri.com.br";
  const canonicalUrl =
    url || `${baseUrl}${location.pathname}`.replace(/\/+$/, "");

  // Structured Data composition (merge base schema + Article if applicable)
  const articleSchema = type === 'article' ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: [image],
    mainEntityOfPage: canonicalUrl,
    author: authorName ? { '@type': 'Person', name: authorName } : undefined,
    datePublished: publishedTimeISO,
    dateModified: modifiedTimeISO || publishedTimeISO,
    articleSection: section,
    keywords: tags && tags.length ? tags.join(', ') : undefined,
    timeRequired: readTimeMinutes ? `PT${Math.max(1, readTimeMinutes)}M` : undefined,
    publisher: {
      '@type': 'Organization',
      name: publisherName,
      logo: {
        '@type': 'ImageObject',
        url: publisherLogo,
      },
    },
  } : null;

  // Breadcrumb schema (optional)
  const breadcrumbSchema = breadcrumbItems && breadcrumbItems.length ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.name,
      item: b.url,
    }))
  } : null;

  const mergedSchema = (schema || articleSchema || breadcrumbSchema) ? {
    ...(schema || {}),
    ...(articleSchema || {}),
    ...(breadcrumbSchema || {})
  } : undefined;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:title" content={title || "Avante Nutri | Alimente-se Bem, Viva Melhor!"} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image || "/avantenutri.png"} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:email" content="avantenutri@gmail.com" />
      <meta property="og:type" content={type === 'article' ? 'article' : 'website'} />
      {type === 'article' && publishedTimeISO && <meta property="article:published_time" content={publishedTimeISO} />}
      {type === 'article' && modifiedTimeISO && <meta property="article:modified_time" content={modifiedTimeISO} />}
      {type === 'article' && section && <meta property="article:section" content={section} />}
      {type === 'article' && tags && tags.map(tag => <meta key={tag} property="article:tag" content={tag} />)}
      {imageWidth && <meta property="og:image:width" content={String(imageWidth)} />}
      {imageHeight && <meta property="og:image:height" content={String(imageHeight)} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image || "/avantenutri.png"} />
      {imageWidth && <meta name="twitter:image:width" content={String(imageWidth)} />}
      {imageHeight && <meta name="twitter:image:height" content={String(imageHeight)} />}
      {mergedSchema && (
        <script type="application/ld+json">{JSON.stringify(mergedSchema)}</script>
      )}
    </Helmet>
  );
}
