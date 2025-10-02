import type { StructuredDietData } from '../types/structuredDiet';
import { ALIMENTOS } from '../data/alimentos';

export function dietHasItems(data: StructuredDietData | null | undefined) {
  return !!data && data.meals.some(m => m.itens.length > 0);
}

export interface DietExportOptions { showAlternatives?: boolean }

export function dietToHtml(data: StructuredDietData, title = 'Dieta Estruturada', opts?: DietExportOptions): string {
  const esc = (s: any) => String(s || '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]||c));
  const map = new Map(ALIMENTOS.map(a => [a.id, a] as const));
  let html = `<html><head><meta charset='utf-8'/><title>${esc(title)}</title><style>
  body{font-family:system-ui,Arial;padding:16px;}
  h1{margin:0 0 12px;font-size:20px;}
  h2{margin:16px 0 6px;font-size:15px;}
  table{border-collapse:collapse;width:100%;font-size:12px;margin-bottom:12px;}
  td,th{border:1px solid #ccc;padding:4px;text-align:left;}
  .tot{font-weight:bold;margin-top:12px;}
  .alt{color:#b45309;font-size:11px;margin-top:2px;}
  </style></head><body>`;
  html += `<h1>${esc(title)}</h1>`;
  data.meals.forEach(m => {
    if (!m.itens.length) return;
    html += `<h2>${esc(m.titulo)}</h2>`;
    html += `<table><thead><tr><th>Alimento</th><th>Qtd (g)</th><th>Obs</th></tr></thead><tbody>`;
    m.itens.forEach(i => {
      const base = map.get(i.alimentoId);
      html += `<tr><td>${base ? esc(base.emoji + ' ' + base.nome) : esc(i.alimentoId)}</td><td>${esc(i.quantidade)}</td><td>${esc(i.observacao||'')}</td></tr>`;
      if (opts?.showAlternatives !== false && i.alternativas?.length) {
        const altStr = i.alternativas.map(a => {
          const f = map.get(a.alimentoId);
          return f ? esc(f.emoji + ' ' + f.nome) : esc(a.alimentoId);
        }).join(', ');
        html += `<tr><td colspan='3'><div class='alt'>Alternativas: ${altStr}</div></td></tr>`;
      }
    });
    html += `</tbody></table>`;
  });
  if (data.total) {
    const t = data.total;
    html += `<div class='tot'>Total: ${t.calorias} kcal • P ${t.proteina}g • C ${t.carboidratos}g • G ${t.gordura}g</div>`;
  }
  html += `</body></html>`;
  return html;
}

export function downloadDietJson(data: StructuredDietData, filename = 'dieta.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1200);
}

export function copyDietJson(data: StructuredDietData) {
  try { void navigator.clipboard.writeText(JSON.stringify(data, null, 2)); } catch { /* noop */ }
}

export function copyDietHtml(data: StructuredDietData, title = 'Dieta Estruturada', opts?: DietExportOptions) {
  const html = dietToHtml(data, title, opts);
  try { void navigator.clipboard.writeText(html); } catch { /* noop */ }
}

export function printDiet(data: StructuredDietData, title?: string, opts?: DietExportOptions) {
  const html = dietToHtml(data, title, opts);
  const w = window.open('', '_blank', 'noopener');
  if (!w) return;
  w.document.write(html); w.document.close();
  w.focus();
  w.print();
}
