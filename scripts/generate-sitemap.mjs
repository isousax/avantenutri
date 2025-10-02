#!/usr/bin/env node
/**
 * Gera sitemap.xml dinamicamente com <lastmod> baseado em mtimes de arquivos relevantes ou git.
 * Estratégia:
 * 1. Define lista de rotas estáticas.
 * 2. Para cada rota, tenta inferir lastmod a partir de arquivos associados (ex: páginas React).
 * 3. Se git disponível, usa última data de commit (fallback para mtime do FS).
 * 4. Escreve em public/sitemap.xml preservando changefreq / priority heurísticos.
 */
import { execSync } from 'node:child_process';
import { writeFileSync, statSync, existsSync } from 'node:fs';
import https from 'node:https';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const publicDir = resolve(root, 'public');
const outFile = resolve(publicDir, 'sitemap.xml');

// Helper: tenta obter data ISO YYYY-MM-DD da última modificação via git ou FS
function getLastModFor(fileCandidates) {
  for (const file of fileCandidates) {
    const abs = resolve(root, file);
    if (!existsSync(abs)) continue;
    // Tentar git
    try {
      const gitDate = execSync(`git log -1 --format=%cs -- "${abs}"`, { stdio: ['ignore','pipe','ignore'] })
        .toString().trim();
      if (gitDate) return gitDate; // %cs já é YYYY-MM-DD
    } catch {}
    // Fallback FS mtime
    try {
      const st = statSync(abs);
      if (st.mtime) {
        return st.mtime.toISOString().slice(0,10);
      }
    } catch {}
  }
  // fallback global (hoje)
  return new Date().toISOString().slice(0,10);
}

// Definição das rotas (públicas + autenticadas se desejar manter). Ajuste conforme estratégia.
// map: path -> { files: [...], changefreq, priority }
const routes = {
  '/': { files: ['src/pages/home/LandingPage.tsx'], changefreq: 'daily', priority: 1.0 },
  '/blog': { files: ['src/pages/blog/BlogPage.tsx'], changefreq: 'daily', priority: 0.9 },
  '/termos': { files: ['src/pages/legal/TermosServicoPage.tsx'], changefreq: 'yearly', priority: 0.4 },
  '/privacidade': { files: ['src/pages/legal/PoliticaPrivacidadePage.tsx'], changefreq: 'yearly', priority: 0.4 },
  '/login': { files: ['src/pages/login/LoginPage.tsx'], changefreq: 'monthly', priority: 0.2 },
  '/register': { files: ['src/pages/login/RegisterPage.tsx'], changefreq: 'monthly', priority: 0.2 },
  '/recuperar-senha': { files: ['src/pages/login/ForgotPasswordPage.tsx'], changefreq: 'monthly', priority: 0.1 },
  '/redefinir-senha': { files: ['src/pages/login/ResetPasswordPage.tsx'], changefreq: 'monthly', priority: 0.1 },
  '/verify-email': { files: ['src/pages/login/VerifyEmailPage.tsx'], changefreq: 'monthly', priority: 0.1 },
  '/confirm-email': { files: ['src/pages/login/ConfirmEmailPage.tsx'], changefreq: 'monthly', priority: 0.1 },
  '/dashboard': { files: ['src/pages/client/DashboardPage.tsx'], changefreq: 'weekly', priority: 0.3 },
  '/questionario': { files: ['src/pages/client/QuestionarioPage.tsx'], changefreq: 'monthly', priority: 0.3 },
  '/billing/historico': { files: ['src/pages/client/BillingHistoryPage.tsx'], changefreq: 'monthly', priority: 0.1 },
  '/registro-refeicao': { files: ['src/pages/client/registroAtividades/RefeicaoRegistroPage.tsx'], changefreq: 'daily', priority: 0.2 },
  '/registro-peso': { files: ['src/pages/client/registroAtividades/PesoRegistroPage.tsx'], changefreq: 'daily', priority: 0.2 },
  '/registro-agua': { files: ['src/pages/client/registroAtividades/AguaRegistroPage.tsx'], changefreq: 'daily', priority: 0.2 },
  '/agendar-consulta': { files: ['src/pages/client/registroAtividades/AgendarConsultaPage.tsx'], changefreq: 'monthly', priority: 0.5 },
};

async function fetchBlogPosts() {
  const api = process.env.SITEMAP_BLOG_API || 'https://login-service.avantenutri.workers.dev';
  const all = [];
  let page = 1;
  const limit = 100;
  while (page < 50) { // safety cap
    const url = `${api}/blog/posts?limit=${limit}&page=${page}`;
    // eslint-disable-next-line no-await-in-loop
    const batch = await new Promise(resolve => {
      https.get(url, res => {
        let data='';
        res.on('data', d=> data += d);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json && Array.isArray(json.results)) {
              resolve(json.results.filter(p=> p.status === 'published').map(p=> ({
                slug: p.slug,
                lastmod: (p.published_at||'').slice(0,10),
                cover_image_url: p.cover_image_url,
                title: p.title,
                excerpt: p.excerpt
              })));
              return;
            }
          } catch {}
          resolve([]);
        });
      }).on('error', () => resolve([]));
    });
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < limit) break;
    page++;
  }
  return all;
}

const base = 'https://avantenutri.com.br';

const baseEntries = Object.entries(routes).map(([path, meta]) => {
  const lastmod = getLastModFor(meta.files);
  return { loc: base + path, lastmod, changefreq: meta.changefreq, priority: meta.priority };
});

let dynamicBlogEntries = [];
try {
  dynamicBlogEntries = (await fetchBlogPosts()).map(p => ({
    loc: `${base}/blog/${p.slug}`,
    lastmod: p.lastmod || new Date().toISOString().slice(0,10),
    changefreq: 'weekly',
    priority: 0.7,
    image: p.cover_image_url || null,
    imageTitle: p.title || null,
    imageCaption: p.excerpt || null,
  }));
} catch {}

const entries = [...baseEntries, ...dynamicBlogEntries];

function escapeXml(str='') { return str.replace(/[&<>"]+/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function buildXml(entries) {
  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">');
  for (const e of entries) {
    lines.push('  <url>');
    lines.push(`    <loc>${e.loc}</loc>`);
    if (e.lastmod) lines.push(`    <lastmod>${e.lastmod}</lastmod>`);
    if (e.changefreq) lines.push(`    <changefreq>${e.changefreq}</changefreq>`);
    if (e.priority != null) lines.push(`    <priority>${e.priority.toFixed(1)}</priority>`);
    if (e.image) {
      lines.push('    <image:image>');
      lines.push(`      <image:loc>${escapeXml(e.image)}</image:loc>`);
      if (e.imageTitle) lines.push(`      <image:title>${escapeXml(e.imageTitle).slice(0,200)}</image:title>`);
      if (e.imageCaption) lines.push(`      <image:caption>${escapeXml(String(e.imageCaption)).slice(0,300)}</image:caption>`);
      lines.push('    </image:image>');
    }
    lines.push('  </url>');
  }
  lines.push('</urlset>');
  return lines.join('\n');
}

const xml = buildXml(entries);
writeFileSync(outFile, xml, 'utf8');
console.log(`✔ Sitemap atualizado (${entries.length} URLs, ${dynamicBlogEntries.length} posts) -> ${outFile}`);
