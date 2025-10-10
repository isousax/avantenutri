import type { DietExportOptions } from './structuredDietExport';
import type { StructuredDietData } from '../types/structuredDiet';
import { ALIMENTOS, calcularNutricao } from '../data/alimentos';

// [Manter as interfaces JsPdf, AutoTableOptions, etc. anteriores...]

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
    name?: string;
    contact?: string;
    address?: string;
  };
  phaseLabels?: Partial<Record<string,string>>;
  // Novas opções de layout
  compactMode?: boolean;
  showNutritionPerMeal?: boolean;
  colorScheme?: 'blue' | 'green' | 'purple' | 'professional';
}

// Função para criar gráfico de macronutrientes melhorado
async function createMacronutrientChart(total: { proteina?: number; carboidratos?: number; gordura?: number }): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 300; // Mais compacto
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      resolve('');
      return;
    }

    // Fundo branco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const protein = total.proteina || 0;
    const carbs = total.carboidratos || 0;
    const fat = total.gordura || 0;
    const totalGrams = protein + carbs + fat;
    
    if (totalGrams === 0) {
      resolve('');
      return;
    }

    // Calcular porcentagens
    const proteinPercent = (protein / totalGrams) * 100;
    const carbsPercent = (carbs / totalGrams) * 100;
    const fatPercent = (fat / totalGrams) * 100;

    // Cores mais suaves
    const colors = ['#3498db', '#2ecc71', '#e74c3c'];
    
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
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      startAngle += sliceAngle;
    });

    // Legenda melhorada
    const legendData = [
      { label: 'Proteínas', percent: proteinPercent, grams: protein, color: colors[0] },
      { label: 'Carboidratos', percent: carbsPercent, grams: carbs, color: colors[1] },
      { label: 'Gorduras', percent: fatPercent, grams: fat, color: colors[2] }
    ];

    ctx.font = '12px Arial';
    legendData.forEach((item, index) => {
      const y = 230 + index * 25;
      
      // Marcador colorido
      ctx.fillStyle = item.color;
      ctx.fillRect(50, y - 8, 15, 15);
      
      // Texto
      ctx.fillStyle = '#2c3e50';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(item.label, 75, y);
      ctx.font = '11px Arial';
      ctx.fillStyle = '#7f8c8d';
      ctx.fillText(`${item.percent.toFixed(1)}% (${item.grams}g)`, 75, y + 12);
    });

    // Título centralizado
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#2c3e50';
    ctx.textAlign = 'center';
    ctx.fillText('Distribuição de Macronutrientes', centerX, 30);

    resolve(canvas.toDataURL('image/png'));
  });
}

// [Manter loadImageAsBase64...]

export async function exportDietPdf(data: StructuredDietData, opts: ExportPdfOptions = {}) {
  const {
    filename = 'plano-alimentar.pdf',
    title = 'Plano Alimentar Personalizado',
    showAlternatives,
    marginMm = 20, // Margem aumentada
    onProgress,
    headerText,
    footerText,
    watermarkText,
    watermarkRepeat = false,
    watermarkOpacity = 0.05, // Opacidade reduzida
    showPageNumbers = true,
    cover,
    company,
    phaseLabels,
    compactMode = false,
    showNutritionPerMeal = true,
    colorScheme = 'blue'
  } = opts;

  // Esquemas de cores
  const colorSchemes = {
    blue: {
      primary: [41, 128, 185],
      secondary: [52, 152, 219],
      accent: [26, 188, 156],
      light: [236, 240, 241],
      dark: [44, 62, 80]
    },
    green: {
      primary: [39, 174, 96],
      secondary: [46, 204, 113],
      accent: [241, 196, 15],
      light: [234, 245, 239],
      dark: [33, 47, 61]
    },
    purple: {
      primary: [142, 68, 173],
      secondary: [155, 89, 182],
      accent: [230, 126, 34],
      light: [245, 240, 246],
      dark: [52, 31, 61]
    },
    professional: {
      primary: [50, 50, 50],
      secondary: [100, 100, 100],
      accent: [150, 150, 150],
      light: [250, 250, 250],
      dark: [30, 30, 30]
    }
  };

  const colors = colorSchemes[colorScheme];

  const emit = (rawPhase: string) => {
    const nice = phaseLabels?.[rawPhase] || rawPhase;
    onProgress?.(nice);
  };

  emit('prepare');

  // Carregar jsPDF com autoTable
  const jsPdfModule = await import('jspdf');
  const { jsPDF } = jsPdfModule as unknown as { jsPDF: JsPdfCtor };
  
  const autoTableModule = (await import('jspdf-autotable')) as unknown as AutoTableModule;
  const autoTableFn: AutoTableFn | undefined = autoTableModule.default ?? autoTableModule.autoTable;
  if (!autoTableFn) throw new Error('jspdf-autotable: função autoTable não encontrada');

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Carregar logo da empresa
  let companyLogo: string | null = null;
  if (company?.logoUrl) {
    try {
      emit('carregando-logo');
      companyLogo = await loadImageAsBase64(company.logoUrl);
    } catch (error) {
      console.warn('Não foi possível carregar o logo:', error);
    }
  }

  // Função para adicionar header
  const addHeader = (pageNumber: number) => {
    const totalPages = pdf.getNumberOfPages();
    
    // Header mais clean
    pdf.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    pdf.rect(0, 0, pageWidth, 12, 'F');
    
    // Linha colorida no topo
    pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.rect(0, 0, pageWidth, 3, 'F');
    
    if (companyLogo) {
      pdf.addImage(companyLogo, 'PNG', marginMm, 4, 20, 8);
    } else if (company?.name) {
      pdf.setFontSize(9);
      pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.text(company.name, marginMm, 8);
    }
    
    if (headerText) {
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      pdf.text(headerText, pageWidth / 2, 8, { align: 'center' });
    }
    
    if (showPageNumbers && pageNumber > 1) {
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`${pageNumber} / ${totalPages}`, pageWidth - marginMm, 8, { align: 'right' });
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
      pdf.text(footerText, pageWidth / 2, footerY, { align: 'center' });
    }
    
    // Data de geração
    const dateStr = new Date().toLocaleDateString('pt-BR');
    pdf.text(`Gerado em ${dateStr}`, pageWidth - marginMm, footerY, { align: 'right' });
  };

  // Página de capa melhorada
  if (cover) {
    emit('cover');
    
    // Fundo clean
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Header na capa
    addHeader(1);
    
    // Conteúdo centralizado
    const centerX = pageWidth / 2;
    let currentY = 60;

    // Logo maior no topo
    if (companyLogo) {
      pdf.addImage(companyLogo, 'PNG', centerX - 25, currentY, 50, 25);
      currentY += 40;
    }

    // Título principal
    pdf.setFontSize(24);
    pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.setFont('helvetica', 'bold');
    
    const coverTitle = cover.title || title;
    const titleLines = pdf.splitTextToSize(coverTitle, pageWidth - (marginMm * 2));
    pdf.text(titleLines, centerX, currentY, { align: 'center' });
    currentY += titleLines.length * 8 + 10;

    // Subtítulo
    if (cover.subtitle) {
      pdf.setFontSize(16);
      pdf.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
      pdf.setFont('helvetica', 'normal');
      const subtitleLines = pdf.splitTextToSize(cover.subtitle, pageWidth - (marginMm * 2));
      pdf.text(subtitleLines, centerX, currentY, { align: 'center' });
      currentY += subtitleLines.length * 6 + 20;
    }

    // Container para informações do cliente
    if (cover.clientInfo) {
      const client = cover.clientInfo;
      
      pdf.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
      pdf.rect(marginMm, currentY, pageWidth - (marginMm * 2), 45, 'F');
      pdf.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.rect(marginMm, currentY, pageWidth - (marginMm * 2), 45, 'S');
      
      pdf.setFontSize(12);
      pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DADOS DO CLIENTE', centerX, currentY + 8, { align: 'center' });
      
      currentY += 15;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      
      // Duas colunas para informações
      const col1X = marginMm + 10;
      const col2X = pageWidth / 2;
      
      if (client.name) pdf.text(`Nome: ${client.name}`, col1X, currentY);
      if (client.age) pdf.text(`Idade: ${client.age} anos`, col2X, currentY);
      currentY += 6;
      
      if (client.gender) pdf.text(`Sexo: ${client.gender}`, col1X, currentY);
      if (client.weight) pdf.text(`Peso: ${client.weight} kg`, col2X, currentY);
      currentY += 6;
      
      if (client.height) pdf.text(`Altura: ${client.height} cm`, col1X, currentY);
      currentY += 6;
      
      if (client.goal) {
        pdf.text(`Objetivo:`, col1X, currentY);
        const goalLines = pdf.splitTextToSize(client.goal, (pageWidth / 2) - 20);
        pdf.text(goalLines, col1X + 20, currentY);
        currentY += goalLines.length * 4;
      }
      
      currentY += 15;
    }

    // Gráfico de macronutrientes
    if (cover.showMacronutrientChart && data.total) {
      emit('gerando-grafico');
      const chartImage = await createMacronutrientChart(data.total);
      if (chartImage) {
        pdf.addImage(chartImage, 'PNG', centerX - 75, currentY, 150, 90);
        currentY += 100;
      }
    }

    // Informações do nutricionista
    if (cover.clientInfo?.nutritionist || cover.clientInfo?.crn) {
      pdf.setFontSize(10);
      pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      pdf.setFont('helvetica', 'bold');
      
      const nutritionistInfo = [];
      if (cover.clientInfo.nutritionist) nutritionistInfo.push(cover.clientInfo.nutritionist);
      if (cover.clientInfo.crn) nutritionistInfo.push(`CRN: ${cover.clientInfo.crn}`);
      
      pdf.text(nutritionistInfo.join(' - '), centerX, currentY, { align: 'center' });
      currentY += 8;
    }

    // Data
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    const dateStr = cover.date ? cover.date.toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
    pdf.text(`Emitido em ${dateStr}`, centerX, currentY, { align: 'center' });
    
    pdf.addPage();
  }

  emit('render');

  // Conteúdo principal - layout muito melhorado
  let currentY = marginMm + 5;
  
  data.meals.forEach((meal, mealIndex) => {
    // Nova página para cada refeição (exceto a primeira)
    if (mealIndex > 0) {
      pdf.addPage();
      currentY = marginMm + 5;
    }

    // Header da refeição com design moderno
    pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.rect(marginMm, currentY, pageWidth - (marginMm * 2), 10, 'F');
    
    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    
    const mealTitle = meal.titulo || `Refeição ${mealIndex + 1}`;
    pdf.text(mealTitle.toUpperCase(), marginMm + 8, currentY + 6.5);
    
    currentY += 15;

    // Tabela de alimentos com design limpo
    const itens = meal.itens || [];
    
    if (itens.length === 0) {
      pdf.setFontSize(10);
      pdf.setTextColor(150, 150, 150);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Nenhum item cadastrado para esta refeição', marginMm + 5, currentY);
      currentY += 10;
      return;
    }

    const tableData = itens.map((item, index) => {
      const alimento = ALIMENTOS.find(a => a.id === item.alimentoId);
      const nome = alimento?.nome || item.alimentoId || 'Alimento não encontrado';
      const quantidade = item.quantidade || 0;
      const nut = alimento ? calcularNutricao(alimento, quantidade, alimento.porcaoPadrao) : null;
      
      // Layout mais limpo com menos informações por linha
      return [
        { content: nome, styles: { fontStyle: 'bold' } },
        `${quantidade}g`,
        nut ? `${Math.round(nut.calorias)} kcal` : '-',
        nut ? `${nut.proteina}g` : '-',
        nut ? `${nut.carboidratos}g` : '-',
        nut ? `${nut.gordura}g` : '-'
      ];
    });

    autoTableFn(pdf, {
      startY: currentY,
      head: [['Alimento', 'Quantidade', 'Calorias', 'Proteína', 'Carbo.', 'Gorduras']],
      body: tableData,
      styles: {
        fontSize: compactMode ? 8 : 9,
        cellPadding: compactMode ? 2 : 3,
        overflow: 'linebreak',
        lineColor: [220, 220, 220],
        lineWidth: 0.3,
        textColor: colors.dark
      },
      headStyles: {
        fillColor: [colors.secondary[0], colors.secondary[1], colors.secondary[2]],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: compactMode ? 8 : 9,
        cellPadding: 4
      },
      bodyStyles: {
        textColor: colors.dark
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248]
      },
      margin: { left: marginMm, right: marginMm },
      theme: 'grid',
      tableWidth: 'wrap',
      columnStyles: {
        0: { cellWidth: 'auto' }, // Alimento
        1: { cellWidth: 20 },     // Quantidade
        2: { cellWidth: 20 },     // Calorias
        3: { cellWidth: 18 },     // Proteína
        4: { cellWidth: 18 },     // Carboidratos
        5: { cellWidth: 18 }      // Gorduras
      }
    });

    const lastY = (pdf.lastAutoTable?.finalY ?? currentY) as number;
    currentY = lastY + 8;

    // Totais da refeição (se habilitado)
    if (showNutritionPerMeal && itens.length > 0) {
      const mealTotal = itens.reduce((acc, item) => {
        const alimento = ALIMENTOS.find(a => a.id === item.alimentoId);
        const nut = alimento ? calcularNutricao(alimento, item.quantidade, alimento.porcaoPadrao) : null;
        if (nut) {
          acc.calorias += nut.calorias || 0;
          acc.proteina += nut.proteina || 0;
          acc.carboidratos += nut.carboidratos || 0;
          acc.gordura += nut.gordura || 0;
        }
        return acc;
      }, { calorias: 0, proteina: 0, carboidratos: 0, gordura: 0 });

      // Container de totais
      pdf.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
      pdf.rect(marginMm, currentY, pageWidth - (marginMm * 2), 12, 'F');
      pdf.setDrawColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
      pdf.rect(marginMm, currentY, pageWidth - (marginMm * 2), 12, 'S');
      
      pdf.setFontSize(10);
      pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      pdf.setFont('helvetica', 'bold');
      
      const totalText = `Total da refeição: ${Math.round(mealTotal.calorias)} kcal | P: ${mealTotal.proteina.toFixed(1)}g | C: ${mealTotal.carboidratos.toFixed(1)}g | G: ${mealTotal.gordura.toFixed(1)}g`;
      pdf.text(totalText, marginMm + 8, currentY + 7);
      
      currentY += 20;
    }

    // Alternativas com design melhorado
    if (showAlternatives) {
      const hasAlternatives = itens.some(item => item.alternativas && item.alternativas.length > 0);
      
      if (hasAlternatives) {
        // Header das alternativas
        pdf.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
        pdf.rect(marginMm, currentY, pageWidth - (marginMm * 2), 8, 'F');
        
        pdf.setFontSize(10);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.text('ALTERNATIVAS SUGERIDAS', marginMm + 8, currentY + 5.5);
        
        currentY += 12;

        itens.forEach((item) => {
          const alts = item.alternativas || [];
          if (alts.length > 0) {
            const baseAlimento = ALIMENTOS.find(a => a.id === item.alimentoId);
            const baseNome = baseAlimento?.nome || item.alimentoId || 'Item';
            
            pdf.setFontSize(9);
            pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`Alternativas para ${baseNome}:`, marginMm + 5, currentY);
            currentY += 4;

            alts.forEach((alt) => {
              const altAlimento = ALIMENTOS.find(a => a.id === alt.alimentoId);
              const altNome = altAlimento?.nome || alt.alimentoId || 'Alternativa';
              const quantidade = alt.quantidade || 0;
              const nut = altAlimento ? calcularNutricao(altAlimento, quantidade, altAlimento.porcaoPadrao) : null;
              const kcal = nut ? Math.round(nut.calorias) : '-';
              
              pdf.setFontSize(8);
              pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
              pdf.setFont('helvetica', 'normal');
              pdf.text(`   • ${altNome} - ${quantidade}g (${kcal} kcal)`, marginMm + 10, currentY);
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
    currentY = marginMm + 5;

    // Título do resumo
    pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.rect(marginMm, currentY, pageWidth - (marginMm * 2), 10, 'F');
    
    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RESUMO NUTRICIONAL TOTAL', marginMm + 8, currentY + 6.5);
    
    currentY += 15;

    // Card de totais
    const total = data.total;
    pdf.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    pdf.rect(marginMm, currentY, pageWidth - (marginMm * 2), 40, 'F');
    pdf.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.rect(marginMm, currentY, pageWidth - (marginMm * 2), 40, 'S');
    
    pdf.setFontSize(16);
    pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${Math.round(total.calorias)} kcal`, pageWidth / 2, currentY + 12, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Total de Calorias', pageWidth / 2, currentY + 17, { align: 'center' });
    
    currentY += 25;
    
    // Macros em colunas
    const colWidth = (pageWidth - (marginMm * 2)) / 3;
    const macros = [
      { label: 'Proteínas', value: total.proteina, unit: 'g', color: colors.primary },
      { label: 'Carboidratos', value: total.carboidratos, unit: 'g', color: colors.secondary },
      { label: 'Gorduras', value: total.gordura, unit: 'g', color: colors.accent }
    ];
    
    macros.forEach((macro, index) => {
      const x = marginMm + (colWidth * index);
      
      pdf.setFontSize(12);
      pdf.setTextColor(macro.color[0], macro.color[1], macro.color[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${macro.value.toFixed(1)}${macro.unit}`, x + colWidth / 2, currentY, { align: 'center' });
      
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(macro.label, x + colWidth / 2, currentY + 5, { align: 'center' });
    });
  }

  // Adicionar headers e footers em todas as páginas
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addHeader(i);
    addFooter();
  }

  // Watermark mais sutil
  if (watermarkText) {
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(32); // Menor e mais discreto
      const clamped = Math.max(0, Math.min(1, watermarkOpacity));
      const gray = Math.max(0, Math.min(255, Math.round(255 - 255 * clamped)));
      pdf.setTextColor(gray, gray, gray);
      pdf.setFont('helvetica', 'normal');
      
      if (!watermarkRepeat) {
        const textWidth = pdf.getTextWidth(watermarkText);
        const x = (pageWidth - textWidth) / 2;
        const y = pageHeight / 2;
        pdf.text(watermarkText, x, y, { angle: 45, opacity: clamped });
      } else {
        // Pattern mais espaçado
        const spacingX = 120;
        const spacingY = 80;
        for (let y = 30; y < pageHeight; y += spacingY) {
          for (let x = -20; x < pageWidth + 20; x += spacingX) {
            pdf.text(watermarkText, x, y, { angle: 45, opacity: clamped });
          }
        }
      }
    }
  }

  emit('finalize');
  pdf.save(filename);
  emit('done');
}