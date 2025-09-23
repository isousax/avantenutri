import { useLocation } from "react-router-dom";

interface SEOProps {
  title: string;
  description: string;
  url?: string;
  image?: string;
  schema?: Record<string, unknown>;
}

export function SEO({
  title,
  description,
  url,
  image = "https://avantenutri.com.br/logo-social.png",
  schema,
}: SEOProps) {
  const location = useLocation();
  const baseUrl = "https://avantenutri.com.br";
  const canonicalUrl =
    url || `${baseUrl}${location.pathname}`.replace(/\/+$/, "");

  return (
    <div>
      <title>{title}</title>
      <meta name="description" content={description} />

      {/** Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph (Facebook, LinkedIn, etc.) */}
      <meta property="og:title" content={title || "Avante Nutri | Alimente-se Bem, Viva Melhor!"} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image || "/avantenutri.png"} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:email" content="avantenutri@gmail.com" />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image || "/avantenutri.png"} />

      {/* Structured Data */}
      {schema && (
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      )}
    </div>
  );
}
