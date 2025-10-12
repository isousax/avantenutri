import type { DietExportOptions } from "./structuredDietExport";
import type { StructuredDietData } from "../types/structuredDiet";
import { ALIMENTOS, calcularNutricao } from "../data/alimentos";

// [Manter as interfaces JsPdf, AutoTableOptions, etc. anteriores...]
interface JsPdf {
  internal: {
    pageSize: { getWidth(): number; getHeight(): number };
  };
  setFontSize(n: number): void;
  setTextColor(r: number, g: number, b: number): void;
  setFillColor(r: number, g: number, b: number): void;
  setDrawColor(r: number, g: number, b: number): void;
  text(
    text: string | string[],
    x: number,
    y: number,
    options?: Record<string, unknown>
  ): void;
  addPage(): void;
  save(filename: string): void;
  setFont(font: string, style?: string): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  rect(x: number, y: number, w: number, h: number, style?: string): void;
  splitTextToSize(text: string, maxWidth: number): string[];
  getTextWidth(text: string): number;
  setPage(pageNumber: number): void;
  getNumberOfPages(): number;
  lastAutoTable?: { finalY: number };
  addImage(
    imageData: string,
    format: string,
    x: number,
    y: number,
    w: number,
    h: number,
    alias?: string,
    compression?: string
  ): void;
}

interface AutoTableOptions {
  head: string[][];
  body: unknown[][];
  startY?: number;
  styles?: Record<string, unknown>;
  headStyles?: Record<string, unknown>;
  bodyStyles?: Record<string, unknown>;
  alternateRowStyles?: Record<string, unknown>;
  margin?:
    | number
    | { left?: number; right?: number; top?: number; bottom?: number }
    | Record<string, unknown>;
  theme?: string;
  columnStyles?: Record<string, unknown>;
}

type AutoTableFn = (doc: JsPdf, options: AutoTableOptions) => void;
type AutoTableModule = { default?: AutoTableFn; autoTable?: AutoTableFn };
type JsPdfCtor = new (opts: {
  unit: "mm";
  format: "a4";
  orientation: "portrait";
}) => JsPdf;

interface ExportPdfOptions extends DietExportOptions {
  filename?: string;
  title?: string;
  marginMm?: number;
  onProgress?: (phase: string) => void;
  headerText?: string;
  footerText?: string;
  showPageNumbers?: boolean;
  watermarkText?: string;
  watermarkRepeat?: boolean;
  watermarkOpacity?: number;
  cover?: {
    title?: string;
    subtitle?: string;
    notes?: string;
    showTotals?: boolean;
    date?: Date;
    qrUrl?: string;
    clientInfo?: {
      name: string;
      age?: number;
      gender?: string;
      weight?: number;
      height?: number;
      goal?: string;
      nutritionist?: string;
      crn?: string;
    };
    showMacronutrientChart?: boolean;
    signature?: {
      imageUrl?: string;
      name?: string;
      role?: string;
      license?: string;
    };
  };
  company?: {
    logoUrl?: string;
    logoheader?: string;
    name?: string;
    contact?: string;
    address?: string;
  };
  phaseLabels?: Partial<Record<string, string>>;
  // Novas opções de layout
  compactMode?: boolean;
  showNutritionPerMeal?: boolean;
  colorScheme?: "blue" | "green" | "purple" | "professional";
}

// Função para criar gráfico de macronutrientes
async function createMacronutrientChart(total: {
  proteina?: number;
  carboidratos?: number;
  gordura?: number;
}): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 300; // Mais compacto
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      resolve("");
      return;
    }

    // Fundo branco
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const protein = total.proteina || 0;
    const carbs = total.carboidratos || 0;
    const fat = total.gordura || 0;
    const totalGrams = protein + carbs + fat;

    if (totalGrams === 0) {
      resolve("");
      return;
    }

    // Calcular porcentagens
    const proteinPercent = (protein / totalGrams) * 100;
    const carbsPercent = (carbs / totalGrams) * 100;
    const fatPercent = (fat / totalGrams) * 100;

    // Cores mais suaves
    const colors = ["#3498db", "#2ecc71", "#e74c3c"];

    // Gráfico de pizza melhorado
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 20;
    const radius = 80;

    let startAngle = 0;

    // Desenhar pizza com borda
    [proteinPercent, carbsPercent, fatPercent].forEach((percent, index) => {
      const sliceAngle = (percent / 100) * 2 * Math.PI;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index];
      ctx.fill();

      // Borda
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      startAngle += sliceAngle;
    });

    // Legenda melhorada
    const legendData = [
      {
        label: "Proteínas",
        percent: proteinPercent,
        grams: protein,
        color: colors[0],
      },
      {
        label: "Carboidratos",
        percent: carbsPercent,
        grams: carbs,
        color: colors[1],
      },
      { label: "Gorduras", percent: fatPercent, grams: fat, color: colors[2] },
    ];

    ctx.font = "12px Arial";
    legendData.forEach((item, index) => {
      const y = 230 + index * 25;

      // Marcador colorido
      ctx.fillStyle = item.color;
      ctx.fillRect(50, y - 8, 15, 15);

      // Texto
      ctx.fillStyle = "#2c3e50";
      ctx.font = "bold 12px Arial";
      ctx.fillText(item.label, 75, y);
      ctx.font = "11px Arial";
      ctx.fillStyle = "#7f8c8d";
      ctx.fillText(`${item.percent.toFixed(1)}% (${item.grams}g)`, 75, y + 12);
    });

    resolve(canvas.toDataURL("image/png"));
  });
}

async function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject(new Error("Could not create canvas context"));
      }
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

export async function exportDietPdf(
  data: StructuredDietData,
  opts: ExportPdfOptions = {}
) {
  const {
    filename = "plano-alimentar.pdf",
    title = "Plano Alimentar Personalizado",
    showAlternatives,
    marginMm = 20,
    onProgress,
    headerText,
    footerText,
    watermarkText,
    watermarkRepeat = false,
    watermarkOpacity = 0.05,
    showPageNumbers = true,
    cover,
    company,
    phaseLabels,
    compactMode = false,
    showNutritionPerMeal = true,
    colorScheme = "blue",
  } = opts;

  // Esquemas de cores
  const colorSchemes = {
    blue: {
      primary: [41, 128, 185],
      secondary: [52, 152, 219],
      accent: [26, 188, 156],
      light: [236, 240, 241],
      dark: [44, 62, 80],
    },
    green: {
      primary: [39, 174, 96],
      secondary: [46, 204, 113],
      accent: [241, 196, 15],
      light: [234, 245, 239],
      dark: [33, 47, 61],
    },
    purple: {
      primary: [142, 68, 173],
      secondary: [155, 89, 182],
      accent: [230, 126, 34],
      light: [245, 240, 246],
      dark: [52, 31, 61],
    },
    professional: {
      primary: [50, 50, 50],
      secondary: [100, 100, 100],
      accent: [150, 150, 150],
      light: [250, 250, 250],
      dark: [30, 30, 30],
    },
  };

  const colors = colorSchemes[colorScheme];

  const emit = (rawPhase: string) => {
    const nice = phaseLabels?.[rawPhase] || rawPhase;
    onProgress?.(nice);
  };

  emit("prepare");

  // Carregar jsPDF com autoTable
  const jsPdfModule = await import("jspdf");
  const { jsPDF } = jsPdfModule as unknown as { jsPDF: JsPdfCtor };

  const autoTableModule = (await import(
    "jspdf-autotable"
  )) as unknown as AutoTableModule;
  const autoTableFn: AutoTableFn | undefined =
    autoTableModule.default ?? autoTableModule.autoTable;
  if (!autoTableFn)
    throw new Error("jspdf-autotable: função autoTable não encontrada");

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Função para desenhar marca d'água na página atual (antes do conteúdo)
  const drawWatermarkOnPage = () => {
    if (!watermarkText) return;
    pdf.setFontSize(32);
    const clamped = Math.max(0, Math.min(1, watermarkOpacity));
    const gray = Math.max(0, Math.min(255, Math.round(255 - 255 * clamped)));
    pdf.setTextColor(gray, gray, gray);
    pdf.setFont("helvetica", "normal");

    if (!watermarkRepeat) {
      const textWidth = pdf.getTextWidth(watermarkText);
      const x = (pageWidth - textWidth) / 2;
      const y = pageHeight / 2;
      pdf.text(watermarkText, x, y, { angle: 45 });
    } else {
      const spacingX = 120;
      const spacingY = 80;
      for (let y = 30; y < pageHeight; y += spacingY) {
        for (let x = -20; x < pageWidth + 20; x += spacingX) {
          pdf.text(watermarkText, x, y, { angle: 45 });
        }
      }
    }
  };

  // Marca d'água na primeira página, antes de qualquer conteúdo
  drawWatermarkOnPage();

  // Carregar logo da empresa
  let companyLogo: string | null = null;
  let companyLogoHeader: string | null = null;
  if (company?.logoUrl) {
    try {
      emit("carregando-logo");
      companyLogo = await loadImageAsBase64(company.logoUrl);
      if (company.logoheader) {
        companyLogoHeader = await loadImageAsBase64(company.logoheader);
      }
    } catch (error) {
      console.warn("Não foi possível carregar o logo:", error);
    }
  }

  // Função para adicionar Header
  const addHeader = (pageNumber: number) => {
    const totalPages = pdf.getNumberOfPages();

    const headerH = 14;
    pdf.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    pdf.rect(0, 0, pageWidth, headerH, "F");

    if (companyLogoHeader) {
      const logoH = 6;
      const logoY = 4;
      const logoW = 23;
      pdf.addImage(companyLogoHeader, "PNG", marginMm, logoY, logoW, logoH);
    } else if (companyLogo) {
      const logoH = 11;
      const logoY = 3;
      const logoW = 15;
      pdf.addImage(companyLogo, "PNG", marginMm, logoY, logoW, logoH);
    } else if (company?.name) {
      pdf.setFontSize(9);
      pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      pdf.setFont("helvetica", "bold");
      pdf.text(company.name, marginMm, 8);
    }

    if (headerText) {
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont("helvetica", "normal");
      pdf.text(headerText, pageWidth / 2, 8, { align: "center" });
    }

    if (showPageNumbers && pageNumber > 1) {
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`${pageNumber} / ${totalPages}`, pageWidth - marginMm, 8, {
        align: "right",
      });
    }
  };

  // Função para adicionar footer
  const addFooter = () => {
    const footerY = pageHeight - 10;

    pdf.setFontSize(7);
    pdf.setTextColor(120, 120, 120);

    // Linha sutil
    pdf.setDrawColor(220, 220, 220);
    pdf.line(marginMm, footerY - 5, pageWidth - marginMm, footerY - 5);

    if (footerText) {
      // Alinhar à esquerda, início da linha
      pdf.text(footerText, marginMm, footerY);
    }

    // Data de geração
    const dateStr = new Date().toLocaleDateString("pt-BR");
    pdf.text(`Gerado em ${dateStr}`, pageWidth - marginMm, footerY, {
      align: "right",
    });
  };

  // Página de capa melhorada
  if (cover) {
    emit("cover");

    // Fundo clean
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    // Header na capa
    addHeader(1);

    // Conteúdo centralizado
    const centerX = pageWidth / 2;
    let currentY = 30;

    // Logo maior no topo
    if (companyLogo) {
      // Aumentar a logo da capa
      const coverLogoW = 90;
      const coverLogoH = 90;
      pdf.addImage(
        companyLogo,
        "PNG",
        centerX - coverLogoW / 2,
        currentY,
        coverLogoW,
        coverLogoH
      );
      currentY += 100;
    }

    // Título principal
    pdf.setFontSize(24);
    pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.setFont("helvetica", "bold");

    const coverTitle = cover.title || title;
    const titleLines = pdf.splitTextToSize(
      coverTitle,
      pageWidth - marginMm * 2
    );
    pdf.text(titleLines, centerX, currentY, { align: "center" });
    currentY += titleLines.length * 8 + 10;

    // Subtítulo
    if (cover.subtitle) {
      pdf.setFontSize(16);
      pdf.setTextColor(
        colors.secondary[0],
        colors.secondary[1],
        colors.secondary[2]
      );
      pdf.setFont("helvetica", "normal");
      const subtitleLines = pdf.splitTextToSize(
        cover.subtitle,
        pageWidth - marginMm * 2
      );
      pdf.text(subtitleLines, centerX, currentY, { align: "center" });
      currentY += subtitleLines.length * 6 + 20;
    }

    // Container para informações do cliente
    if (cover.clientInfo) {
      const client = cover.clientInfo;

      pdf.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
      pdf.rect(marginMm, currentY, pageWidth - marginMm * 2, 45, "F");
      pdf.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.rect(marginMm, currentY, pageWidth - marginMm * 2, 45, "S");

      pdf.setFontSize(12);
      pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.setFont("helvetica", "bold");
      pdf.text("DADOS DO PACIENTE", centerX, currentY + 8, { align: "center" });

      currentY += 15;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);

      // Duas colunas para informações
      const col1X = marginMm + 10;
      const col2X = pageWidth / 1.7;

      if (client.name) pdf.text(`Nome: ${client.name}`, col1X, currentY);
      if (client.age) pdf.text(`Idade: ${client.age} anos`, col2X, currentY);
      currentY += 6;

      if (client.gender) pdf.text(`Sexo: ${client.gender}`, col1X, currentY);
      if (client.weight) pdf.text(`Peso: ${client.weight} kg`, col2X, currentY);
      currentY += 6;

      

      if (client.goal) {
        pdf.text(`Objetivo Nutricional: ${client.goal}`, col1X, currentY);
      }

      if (client.height)
        pdf.text(`Altura: ${client.height} cm`, col2X, currentY);

      currentY += 21;
    }
    // --- Observações / Notes na capa
    if (cover.notes) {
      // Espaçamento antes do bloco de notas
      currentY += 3;

      // Caixa de notas
      const notesX = marginMm;
      const notesW = pageWidth - marginMm * 2;

      pdf.setFillColor(255, 255, 255);
      pdf.rect(notesX, currentY, notesW, 1, "F"); // fundo branco para garantir legibilidade

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);

      const noteLines = pdf.splitTextToSize(cover.notes, notesW - 10);
      // desenha o texto com pequeno recuo
      pdf.text(noteLines, centerX, currentY, {
        align: "center",
      });

      // ajustar currentY pelo número de linhas desenhadas
      currentY += 12 + noteLines.length * 5 + 6;
    }

    // Informações do nutricionista
    if (cover.clientInfo?.nutritionist || cover.clientInfo?.crn) {
      pdf.setFontSize(10);
      pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      pdf.setFont("helvetica", "bold");

      const nutritionistInfo = [];
      if (cover.clientInfo.nutritionist)
        nutritionistInfo.push(cover.clientInfo.nutritionist);
      if (cover.clientInfo.crn)
        nutritionistInfo.push(`CRN: ${cover.clientInfo.crn}`);

      pdf.text(nutritionistInfo.join(" - "), centerX, currentY + 18, {
        align: "center",
      });
      currentY += 25;
    }

    // Data
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    const dateStr = cover.date
      ? cover.date.toLocaleDateString("pt-BR")
      : new Date().toLocaleDateString("pt-BR");
    pdf.text(`Emitido em ${dateStr}`, centerX, currentY, { align: "center" });

    // Nova página após a capa
    pdf.addPage();
    drawWatermarkOnPage();
  }

  if (cover?.showMacronutrientChart && data.total) {
    emit("gerando-grafico");
    // Se não houve capa, criar página para o gráfico agora
    if (!cover) {
      pdf.addPage();
      drawWatermarkOnPage();
    }

    // Fundo clean
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    const centerX = pageWidth / 2;

    // Título da página do gráfico
    pdf.setFontSize(20);
    pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.setFont("helvetica", "bold");
    pdf.text("Distribuição de Macronutrientes", centerX, 40, {
      align: "center",
    });

    // Subtítulo explicativo
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      "Análise da proporção de proteínas, carboidratos e gorduras",
      centerX,
      50,
      { align: "center" }
    );

    // Gerar e adicionar o gráfico (maior e centralizado)
    const chartImage = await createMacronutrientChart(data.total);

    const chartHeight = 120;
    if (chartImage) {
      // Aproximar do título: posicionar mais acima
      const chartWidth = 190;
      const chartX = centerX - chartWidth / 2;
      const chartY = 65; // Antes: centralizado; agora, mais próximo do título

      pdf.addImage(chartImage, "PNG", chartX, chartY, chartWidth, chartHeight);
    }

    // Informações adicionais abaixo do gráfico
    const total = data.total;
    const totalGrams =
      (total.proteina || 0) + (total.carboidratos || 0) + (total.gordura || 0);

    if (totalGrams > 0) {
      // Ajustar a seção informativa para acompanhar a nova posição do gráfico
      const infoY = 65 + chartHeight + 20;

      pdf.setFontSize(11);
      pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      pdf.setFont("helvetica", "bold");

      // Totais em gramas
      const totalsText = `Totais: ${Math.round(
        total.proteina || 0
      )}g Proteínas • ${Math.round(
        total.carboidratos || 0
      )}g Carboidratos • ${Math.round(total.gordura || 0)}g Gorduras`;
      pdf.text(totalsText, centerX, infoY, { align: "center" });

      // Calorias totais
      pdf.setFontSize(10);
      pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.text(
        `${Math.round(total.calorias || 0)} kcal totais`,
        centerX,
        infoY + 8,
        { align: "center" }
      );
    }

    // Nova página após o gráfico para o conteúdo principal
    pdf.addPage();
    drawWatermarkOnPage();
  }

  emit("render");

  // Conteúdo principal - layout muito melhorado
  let currentY = marginMm + 5;

  data.meals.forEach((meal, mealIndex) => {
    // Nova página para cada refeição (exceto a primeira)
    if (mealIndex > 0) {
      pdf.addPage();
      drawWatermarkOnPage();
      currentY = marginMm + 5;
    }

    // Header da refeição com design moderno
    pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.rect(marginMm, currentY, pageWidth - marginMm * 2, 10, "F");

    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");

    const mealTitle = meal.titulo || `Refeição ${mealIndex + 1}`;
    pdf.text(mealTitle.toUpperCase(), marginMm + 8, currentY + 6.5);

    currentY += 15;

    // Tabela de alimentos com design limpo
    const itens = meal.itens || [];

    if (itens.length === 0) {
      pdf.setFontSize(10);
      pdf.setTextColor(150, 150, 150);
      pdf.setFont("helvetica", "italic");
      pdf.text(
        "Nenhum item cadastrado para esta refeição",
        marginMm + 5,
        currentY
      );
      currentY += 10;
      return;
    }

    const tableData = itens.map((item) => {
      const alimento = ALIMENTOS.find((a) => a.id === item.alimentoId);
      const nome =
        alimento?.nome || item.alimentoId || "Alimento não encontrado";
      const quantidade = item.quantidade || 0;
      const nut = alimento
        ? calcularNutricao(alimento, quantidade, alimento.porcaoPadrao)
        : null;

      // Layout mais limpo com menos informações por linha
      return [
        { content: nome, styles: { fontStyle: "bold" } },
        `${quantidade}g`,
        nut ? `${Math.round(nut.calorias)} kcal` : "-",
        nut ? `${nut.proteina}g` : "-",
        nut ? `${nut.carboidratos}g` : "-",
        nut ? `${nut.gordura}g` : "-",
      ];
    });

    autoTableFn(pdf, {
      startY: currentY,
      head: [
        [
          "Alimento",
          "Qtd.",
          "Calorias",
          "Proteína",
          "Carbo.",
          "Gorduras",
        ],
      ],
      body: tableData,
      styles: {
        fontSize: compactMode ? 8 : 9,
        cellPadding: compactMode ? 2 : 3,
        overflow: "linebreak",
        lineColor: [220, 220, 220],
        lineWidth: 0.3,
        textColor: colors.dark,
      },
      headStyles: {
        fillColor: [
          colors.secondary[0],
          colors.secondary[1],
          colors.secondary[2],
        ],
        textColor: 255,
        fontStyle: "bold",
        fontSize: compactMode ? 8 : 9,
        cellPadding: 4,
      },
      bodyStyles: {
        textColor: colors.dark,
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248],
      },
      margin: { left: marginMm, right: marginMm },
      theme: "grid",
      columnStyles: {
        0: { cellWidth: "auto" }, // Alimento
        1: { cellWidth: 17 }, // Quantidade
        2: { cellWidth: 21 }, // Calorias
        3: { cellWidth: 21 }, // Proteína
        4: { cellWidth: 18 }, // Carboidratos
        5: { cellWidth: 22 }, // Gorduras
      },
    });

    const lastY = (pdf.lastAutoTable?.finalY ?? currentY) as number;
    currentY = lastY + 8;

    // Totais da refeição (se habilitado)
    if (showNutritionPerMeal && itens.length > 0) {
      const mealTotal = itens.reduce(
        (acc, item) => {
          const alimento = ALIMENTOS.find((a) => a.id === item.alimentoId);
          const nut = alimento
            ? calcularNutricao(alimento, item.quantidade, alimento.porcaoPadrao)
            : null;
          if (nut) {
            acc.calorias += nut.calorias || 0;
            acc.proteina += nut.proteina || 0;
            acc.carboidratos += nut.carboidratos || 0;
            acc.gordura += nut.gordura || 0;
          }
          return acc;
        },
        { calorias: 0, proteina: 0, carboidratos: 0, gordura: 0 }
      );

      // Container de totais
      pdf.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
      pdf.rect(marginMm, currentY, pageWidth - marginMm * 2, 12, "F");
      pdf.setDrawColor(
        colors.secondary[0],
        colors.secondary[1],
        colors.secondary[2]
      );
      pdf.rect(marginMm, currentY, pageWidth - marginMm * 2, 12, "S");

      pdf.setFontSize(10);
      pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      pdf.setFont("helvetica", "bold");

      const totalText = `Total da refeição: ${Math.round(
        mealTotal.calorias
      )} kcal | P: ${mealTotal.proteina.toFixed(
        1
      )}g | C: ${mealTotal.carboidratos.toFixed(
        1
      )}g | G: ${mealTotal.gordura.toFixed(1)}g`;
      pdf.text(totalText, marginMm + 8, currentY + 7);

      currentY += 20;
    }

    // Alternativas com design melhorado
    if (showAlternatives) {
      const hasAlternatives = itens.some(
        (item) => item.alternativas && item.alternativas.length > 0
      );

      if (hasAlternatives) {
        // Header das alternativas
        pdf.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
        pdf.rect(marginMm, currentY, pageWidth - marginMm * 2, 8, "F");

        pdf.setFontSize(10);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.text("ALTERNATIVAS SUGERIDAS", marginMm + 8, currentY + 5.5);

        currentY += 12;

        itens.forEach((item) => {
          const alts = item.alternativas || [];
          if (alts.length > 0) {
            const baseAlimento = ALIMENTOS.find(
              (a) => a.id === item.alimentoId
            );
            const baseNome = baseAlimento?.nome || item.alimentoId || "Item";

            pdf.setFontSize(9);
            pdf.setTextColor(
              colors.primary[0],
              colors.primary[1],
              colors.primary[2]
            );
            pdf.setFont("helvetica", "bold");
            pdf.text(`Alternativas para ${baseNome}:`, marginMm + 5, currentY);
            currentY += 4;

            alts.forEach((alt) => {
              const altAlimento = ALIMENTOS.find(
                (a) => a.id === alt.alimentoId
              );
              const altNome =
                altAlimento?.nome || alt.alimentoId || "Alternativa";
              const quantidade = alt.quantidade || 0;
              const nut = altAlimento
                ? calcularNutricao(
                    altAlimento,
                    quantidade,
                    altAlimento.porcaoPadrao
                  )
                : null;
              const kcal = nut ? Math.round(nut.calorias) : "-";

              pdf.setFontSize(8);
              pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
              pdf.setFont("helvetica", "normal");
              pdf.text(
                `   • ${altNome} - ${quantidade}g (${kcal} kcal)`,
                marginMm + 10,
                currentY
              );
              currentY += 4;
            });

            currentY += 3;
          }
        });

        currentY += 5;
      }
    }

    currentY += 10;
  });

  // Página de resumo nutricional (nova)
  if (data.total) {
    pdf.addPage();
  drawWatermarkOnPage();
  currentY = marginMm + 5;

  // Título das recomendações
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(marginMm, currentY, pageWidth - marginMm * 2, 10, "F");

  pdf.setFontSize(12);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.text("RECOMENDAÇÕES GERAIS E NUTRICIONAIS", marginMm + 8, currentY + 6.5);

  currentY += 15;

  // Conteúdo das recomendações
  const recommendations = [
  {
    title: "1. HIGIENIZAÇÃO DE FRUTAS, VERDURAS E HORTALIÇAS",
    content:
      "Utilizar preferencialmente produto específico para higienização de alimentos ou água sanitária sem fragrância, seguindo as instruções do fabricante. Como referência: diluir 1 colher de sopa (~15 mL) de água sanitária em 1 L de água, deixar de molho por ~15 minutos e enxaguar em água corrente. Verificar sempre o rótulo do fabricante."
  },
  {
    title: "2. PREFERÊNCIAS E SUBSTITUIÇÕES DE ALIMENTOS",
    content: [
      "Substituir, quando possível, óleo de soja por azeite extra-virgem, canola ou girassol.",
      "Prefira açúcar mascavo ou demerara no lugar do refinado. Em caso de diabetes, utilizar adoçantes conforme orientação médica (ex.: sucralose, aspartame, esteviol glicosídeos, acessulfame K).",
      "Escolher produtos lácteos desnatados ou semidesnatados de boa procedência.",
      "Optar por molho de tomate caseiro e temperos naturais.",
      "Preferir preparações grelhadas, assadas ou cozidas, evitando excesso de gordura."
    ]
  },
  {
    title: "3. EVITAR O CONSUMO",
    content: [
      "Alimentos com alto teor de gordura (especialmente gorduras saturadas e trans).",
      "Produtos ultraprocessados: refrigerantes, sorvetes, biscoitos industrializados, embutidos (linguiça, mortadela, presunto, salame).",
      "Bebidas alcoólicas.",
      "Excesso de doces e salgados."
    ]
  },
  {
    title: "4. ORIENTAÇÕES GERAIS",
    content: [
      "Fazer as refeições em locais tranquilos, longe de TV e celular; concentre-se ao alimentar-se.",
      "Mastigar devagar e saborear os alimentos.",
      "Evitar líquidos durante as refeições; preferir ingestão de água 1h–1h30 antes ou depois.",
      "Consumir, no mínimo, 2 litros de água por dia (ajustar conforme orientação profissional).",
      "Escolher frutas e verduras de cores variadas para obter diferentes vitaminas e antioxidantes.",
      "Consumir frutas diariamente; atenção com frutas de alto índice glicêmico em jejum (ajustar conforme caso clínico).",
      "Incluir salada no almoço diariamente e, sempre que possível, no jantar.",
      "Quando comer fora, optar por carnes magras e preparações semelhantes às sugeridas no plano."
    ]
  }
];


  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);

  recommendations.forEach((rec) => {
    // Verificar se precisa de nova página
    if (currentY > pageHeight - marginMm - 50) {
      pdf.addPage();
      drawWatermarkOnPage();
      currentY = marginMm + 5;
    }

    // Título da seção
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    const titleLines = pdf.splitTextToSize(rec.title, pageWidth - marginMm * 2 - 10);
    titleLines.forEach((line: string) => {
      pdf.text(line, marginMm + 5, currentY);
      currentY += 5;
    });

    // Conteúdo
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    let contentLines: string[] = [];
    if (typeof rec.content === "string") {
      contentLines = pdf.splitTextToSize(rec.content, pageWidth - marginMm * 2 - 10);
    } else {
      // Se for array, processar cada item
      rec.content.forEach(item => {
        const itemLines = pdf.splitTextToSize(item, pageWidth - marginMm * 2 - 10);
        contentLines = contentLines.concat(itemLines);
      });
    }

    contentLines.forEach((line: string) => {
      // Verificar se precisa de nova página durante o conteúdo
      if (currentY > pageHeight - marginMm - 10) {
        pdf.addPage();
        drawWatermarkOnPage();
        currentY = marginMm + 5;
      }
      pdf.text(line, marginMm + 5, currentY);
      currentY += 4.5;
    });

    currentY += 8; // Espaço entre seções
  });
  }

  // Adicionar headers e footers em todas as páginas
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addHeader(i);
    addFooter();
  }

  // Marca d'água já foi desenhada antes do conteúdo em cada página nova

  emit("finalize");
  pdf.save(filename);
  emit("done");
}
