import { dietToHtml } from './structuredDietExport';
import type { DietExportOptions } from './structuredDietExport';
import type { StructuredDietData } from '../types/structuredDiet';

// Lightweight custom PDF generator using html2canvas + jsPDF for high future flexibility.
// Strategy: inject hidden container with printable HTML (simplified styles), snapshot, paginate.
// Later enhancements: custom header/footer, watermark, per-meal page breaks, table of contents.

interface ExportPdfOptions extends DietExportOptions {
  filename?: string;
  title?: string;
  scale?: number; // canvas scale multiplier for sharpness
  marginMm?: number; // uniform margin in millimeters
  onProgress?: (phase: string) => void;
  headerText?: string; // shown every page (optional)
  footerText?: string; // if provided, appears above page number (or alone)
  showPageNumbers?: boolean; // default true
  watermarkText?: string; // light rotated text across each page
  headerHeightMm?: number; // default 8
  footerHeightMm?: number; // default 8
  cover?: {
    title?: string;
    subtitle?: string;
    notes?: string;
    showTotals?: boolean;
    date?: Date;
    qrUrl?: string; // optional QR code (e.g. link to dashboard)
  };
  phaseLabels?: Partial<Record<string,string>>; // custom labels for UI
  watermarkRepeat?: boolean; // repeat watermark in a grid
  watermarkOpacity?: number; // default 0.08
}

export async function exportDietPdf(data: StructuredDietData, opts: ExportPdfOptions = {}) {
  const {
    filename = 'dieta.pdf',
    title = 'Dieta Estruturada',
    showAlternatives,
    scale = 2,
    marginMm = 12,
    onProgress,
    headerText,
    footerText,
    watermarkText,
    showPageNumbers = true,
    headerHeightMm = headerText ? 8 : 0,
    footerHeightMm = (footerText || showPageNumbers) ? 8 : 0,
    cover,
    phaseLabels,
    watermarkRepeat = false,
    watermarkOpacity = 0.08,
  } = opts;

  const emit = (rawPhase: string) => {
    const nice = phaseLabels?.[rawPhase] || rawPhase;
    onProgress?.(nice);
  };

  emit('prepare');
  const html = dietToHtml(data, title, { showAlternatives });

  // Container offscreen
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-10000px';
  wrapper.style.top = '0';
  wrapper.style.width = '800px'; // approximate A4 portrait printable width reference
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  // Wait fonts (optional)
  try { if ((document as any).fonts) await (document as any).fonts.ready; } catch {}

  emit('render');
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    // @ts-ignore - runtime dynamic import; types may be optional
    import('html2canvas'),
    // @ts-ignore
    import('jspdf') as any
  ]);

  // We'll split by natural sections (each <h2> indicates a potential soft break) if content is tall.
  const contentEl = wrapper.querySelector('body') || wrapper;

  // Single pass canvas render
  const canvas = await html2canvas(contentEl as HTMLElement, {
    scale,
    backgroundColor: '#ffffff'
  });

  // We will slice directly; no need to keep full image data string.

  // jsPDF dimensions for A4 in mm
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const usableWidth = pageWidth - marginMm * 2;
  const usableHeight = pageHeight - marginMm * 2 - headerHeightMm - footerHeightMm;

  // Canvas pixel to mm ratio
  const pxPerMm = canvas.width / usableWidth; // width basis
  const totalHeightMm = canvas.height / pxPerMm;

  const sliceHeightMmBase = usableHeight; // per page image area
  const totalPages = Math.max(1, Math.ceil(totalHeightMm / sliceHeightMmBase));

  // Optional cover page
  if (cover) {
    emit('cover');
    const coverTitle = cover.title || title;
    const dateStr = cover.date ? cover.date.toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
    pdf.setFontSize(22);
    pdf.setTextColor(30,30,30);
    pdf.text(coverTitle, pageWidth/2, 40, { align: 'center' } as any);
    if (cover.subtitle) {
      pdf.setFontSize(14);
      pdf.setTextColor(70,70,70);
      pdf.text(cover.subtitle, pageWidth/2, 52, { align: 'center' } as any);
    }
    pdf.setFontSize(11);
    pdf.setTextColor(90,90,90);
    pdf.text(`Gerado em: ${dateStr}`, pageWidth/2, 66, { align: 'center' } as any);
    if (cover.showTotals && (data.total || (data as any).total)) {
      const t = data.total;
      if (t) {
        pdf.setFontSize(12);
        pdf.setTextColor(40,40,40);
        pdf.text(`Totais: ${t.calorias} kcal  •  P ${t.proteina}g  •  C ${t.carboidratos}g  •  G ${t.gordura}g`, pageWidth/2, 82, { align: 'center' } as any);
      }
    }
    if (cover.notes) {
      pdf.setFontSize(10);
      pdf.setTextColor(80,80,80);
      const split = (pdf as any).splitTextToSize?.(cover.notes, pageWidth - marginMm*2) || [cover.notes];
      let y = 100;
      split.forEach((line: string) => {
        if (y > pageHeight - 30) return; // basic overflow guard
        pdf.text(line, marginMm, y);
        y += 5;
      });
    }
    // QR Code (optional)
    if (cover.qrUrl) {
      try {
  // @ts-ignore - dynamic import without types
  const { default: QRCode } = await import('qrcode');
        const qrDataUrl = await QRCode.toDataURL(cover.qrUrl, { margin: 0, scale: 4 });
        const size = 32; // mm
        pdf.addImage(qrDataUrl, 'PNG', pageWidth - marginMm - size, pageHeight - marginMm - size, size, size);
        pdf.setFontSize(8);
        pdf.setTextColor(90,90,90);
        pdf.text('Acesse online', pageWidth - marginMm - size/2, pageHeight - marginMm - size - 2, { align: 'center' } as any);
      } catch (e) {
        // ignore QR issues silently
      }
    }
    // Prepare to add normal pages
    pdf.addPage();
  }

  // Slice loop
  let offsetMm = 0;
  let pageIndex = 0;
  emit('paginate');
  while (offsetMm < totalHeightMm) {
    if (pageIndex > 0) pdf.addPage();

    const sliceHeightMm = Math.min(sliceHeightMmBase, totalHeightMm - offsetMm);
    const sY = Math.round(offsetMm * pxPerMm);
    const sH = Math.round(sliceHeightMm * pxPerMm);
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sH;
    const ctx = sliceCanvas.getContext('2d');
    if (ctx) ctx.drawImage(canvas, 0, sY, canvas.width, sH, 0, 0, canvas.width, sH);
    const sliceData = sliceCanvas.toDataURL('image/png');

    // Draw header
    if (headerText) {
      pdf.setFontSize(11);
      pdf.setTextColor(40,40,40);
      pdf.text(headerText, marginMm, marginMm - 2 + headerHeightMm/2, { baseline: 'middle' as any });
    }
    // Watermark (under content) – add on each page
    if (watermarkText) {
      pdf.saveGraphicsState?.();
      (pdf as any).setGState?.(pdf as any).GState?.({ opacity: watermarkOpacity });
      pdf.setTextColor(160,160,160);
      pdf.setFontSize(48);
      if (!watermarkRepeat) {
        const cx = pageWidth/2; const cy = pageHeight/2;
        pdf.text(watermarkText, cx, cy, { align: 'center', angle: 45 } as any);
      } else {
        const stepX = 70; const stepY = 70;
        for (let x = 20; x < pageWidth; x += stepX) {
          for (let y = 40; y < pageHeight; y += stepY) {
            pdf.text(watermarkText, x, y, { angle: 45 } as any);
          }
        }
      }
      pdf.setTextColor(0,0,0);
      pdf.restoreGraphicsState?.();
    }

    // Add image (content)
    pdf.addImage(sliceData, 'PNG', marginMm, marginMm + headerHeightMm, usableWidth, sliceHeightMm, undefined, 'FAST');

    // Footer
    if (footerText || showPageNumbers) {
      pdf.setFontSize(9);
      pdf.setTextColor(80,80,80);
      const footerY = pageHeight - marginMm - (footerHeightMm/2) + 2;
      if (footerText) {
        pdf.text(footerText, marginMm, footerY, { baseline: 'alphabetic' } as any);
      }
      if (showPageNumbers) {
        // Adjust displayed page number if cover page consumed one slot
        const effectivePage = cover ? pageIndex + 1 : pageIndex + 1;
        const pn = `${effectivePage} / ${totalPages}`;
        pdf.text(pn, pageWidth - marginMm, footerY, { align: 'right' } as any);
      }
    }

    offsetMm += sliceHeightMm;
    pageIndex++;
  }

  emit('finalize');
  pdf.save(filename);
  wrapper.remove();
  emit('done');
}
