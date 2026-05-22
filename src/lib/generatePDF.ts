import { PDFDocument, rgb, StandardFonts, type PDFFont } from "pdf-lib";

export interface PDFItem {
  nome: string;
  descricao: string;
  valorUnitario: number;
  quantidade: number;
}

export interface PDFData {
  clienteNome: string;
  clienteEmpresa: string;
  clienteEmail: string;
  clienteWhatsapp: string;
  clienteEndereco?: string;
  clienteCpfCnpj?: string;
  nota?: string;
  itens: PDFItem[];
  valorTotal: number;
  propostaNumero?: string;
}

// ── Cores ────────────────────────────────────────────────────
const DARK = rgb(0.12, 0.12, 0.12);
const RED = rgb(0.86, 0.13, 0.16);
const GRAY = rgb(0.40, 0.40, 0.40);
const WHITE = rgb(1, 1, 1);
const LIGHT_GRAY = rgb(0.85, 0.85, 0.85);

// ── Coordenadas (page 612 × 858.75) ──────────────────────────
const Y_DATA          = 754.40;
const Y_CLIENTE_NOME  = 690;

const COL_NO_X       = 55;
const COL_DESC_X     = 98;
const COL_VALOR_X    = 365;
const COL_QTY_CENTER = 457;
const COL_SUBTOTAL_X = 508;
const RIGHT_EDGE     = 595;
const MAX_DESC_WIDTH = 240;

const Y_TABLE_TOP    = 590;
const Y_TABLE_BOTTOM = 395;
const Y_TOTAL        = 376;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function sanitizeForPDF(text: string): string {
  return text.replace(/[^\x20-\x7E\xA0-\xFF]/g, "").trim();
}

function drawTextRight(
  page: ReturnType<typeof PDFDocument.prototype.getPages>[0],
  text: string, rightX: number, y: number,
  size: number, font: PDFFont, color: ReturnType<typeof rgb>,
) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: rightX - w, y, size, font, color });
}

function drawTextCenter(
  page: ReturnType<typeof PDFDocument.prototype.getPages>[0],
  text: string, centerX: number, y: number,
  size: number, font: PDFFont, color: ReturnType<typeof rgb>,
) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: centerX - w / 2, y, size, font, color });
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const w = font.widthOfTextAtSize(testLine, fontSize);
    if (w > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function calcItemHeight(
  item: PDFItem,
  font: PDFFont,
  lineHeight: number,
  descFontSize: number,
  separatorGap: number,
): number {
  let h = lineHeight + 3;
  const subItems = (item.descricao || "")
    .split("\n").map(l => l.trim()).filter(l => l.length > 0);
  for (const raw of subItems) {
    const text = sanitizeForPDF(raw.startsWith("-") ? raw : `- ${raw}`);
    if (!text) continue;
    const lines = wrapText(text, font, descFontSize, MAX_DESC_WIDTH);
    h += lines.length * lineHeight;
  }
  h += 4 + separatorGap;
  return h;
}

export async function generatePDF(data: PDFData) {
  const templateBytes = await fetch("/Orcamento_MODELO_MG.pdf").then((res) => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templateBytes);

  const page = pdfDoc.getPages()[0];

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // ══════════════════════════════════════════════════════════
  // WHITEOUT — zona da tabela (apaga 01/02/separador estáticos)
  // Vai de y=400 até y=610 (acima do "01." estático em y≈590).
  // NÃO inclui linha do TOTAL (y≈376-388) porque "03." está lá.
  // ══════════════════════════════════════════════════════════
  page.drawRectangle({
    x: 40, y: 400, width: 555, height: 210,
    color: WHITE, borderWidth: 0,
  });
  // "03." estático sozinho na linha do TOTAL — apaga só o texto, preserva "TOTAL:"
  page.drawRectangle({
    x: 50, y: 375, width: 28, height: 15,
    color: WHITE, borderWidth: 0,
  });
  // "R$" estático sozinho na linha do TOTAL
  page.drawRectangle({
    x: 500, y: Y_TOTAL - 4, width: 22, height: 18,
    color: WHITE, borderWidth: 0,
  });
  // "CPF /CNPJ: ..." estático do template (não usamos mais)
  page.drawRectangle({
    x: 275, y: 673, width: 170, height: 14,
    color: WHITE, borderWidth: 0,
  });

  // ══════════════════════════════════════════════════════════
  // DATA — texto branco no header dark band
  // ══════════════════════════════════════════════════════════
  const hoje = new Date();
  const diasSemana = [
    "Domingo", "Segunda Feira", "Terça Feira", "Quarta Feira",
    "Quinta Feira", "Sexta Feira", "Sábado",
  ];
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  const dataStr = sanitizeForPDF(
    `${diasSemana[hoje.getDay()]}, ${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`,
  );
  page.drawText(dataStr, { x: 78, y: Y_DATA, size: 9, font: helvetica, color: WHITE });

  // ══════════════════════════════════════════════════════════
  // CLIENTE NOME (vermelho, bold, grande)
  // ══════════════════════════════════════════════════════════
  const clienteNome = sanitizeForPDF(data.clienteEmpresa || data.clienteNome);
  if (clienteNome) {
    page.drawText(clienteNome.toUpperCase(), {
      x: 38, y: Y_CLIENTE_NOME, size: 18, font: helveticaBold, color: RED,
    });
  }

  // ══════════════════════════════════════════════════════════
  // TABELA — auto-compacta para caber em Y_TABLE_TOP → Y_TABLE_BOTTOM
  // ══════════════════════════════════════════════════════════
  const available = Y_TABLE_TOP - Y_TABLE_BOTTOM;
  const levels = [
    { lineHeight: 12, descFontSize: 8, separatorGap: 18, topGap: 4 },
    { lineHeight: 11, descFontSize: 8, separatorGap: 16, topGap: 4 },
    { lineHeight: 10, descFontSize: 7, separatorGap: 14, topGap: 3 },
    { lineHeight: 9,  descFontSize: 7, separatorGap: 12, topGap: 3 },
    { lineHeight: 8,  descFontSize: 6, separatorGap: 10, topGap: 2 },
    { lineHeight: 7,  descFontSize: 6, separatorGap: 8,  topGap: 2 },
    { lineHeight: 6,  descFontSize: 5, separatorGap: 6,  topGap: 1 },
  ];

  let chosen = levels[0];
  for (const level of levels) {
    const total = data.itens.reduce(
      (sum, it) => sum + calcItemHeight(it, helvetica, level.lineHeight, level.descFontSize, level.separatorGap),
      0,
    );
    chosen = level;
    if (total + level.topGap <= available) break;
  }
  const { lineHeight, descFontSize, separatorGap, topGap } = chosen;

  let currentY = Y_TABLE_TOP - topGap;

  data.itens.forEach((item, index) => {
    const num = String(index + 1).padStart(2, "0") + ".";
    const subtotal = item.valorUnitario * item.quantidade;

    page.drawText(num, {
      x: COL_NO_X, y: currentY, size: 10, font: helveticaBold, color: DARK,
    });

    page.drawText(sanitizeForPDF(item.nome), {
      x: COL_DESC_X, y: currentY, size: 10, font: helveticaBold, color: DARK,
    });

    page.drawText(formatCurrency(item.valorUnitario), {
      x: COL_VALOR_X, y: currentY, size: 9, font: helvetica, color: DARK,
    });
    drawTextCenter(page, String(item.quantidade), COL_QTY_CENTER, currentY, 9, helvetica, DARK);
    page.drawText(formatCurrency(subtotal), {
      x: COL_SUBTOTAL_X, y: currentY, size: 9, font: helvetica, color: DARK,
    });

    currentY -= lineHeight + 3;

    const subItems = (item.descricao || "")
      .split("\n").map(l => l.trim()).filter(l => l.length > 0);
    for (const raw of subItems) {
      const text = sanitizeForPDF(raw.startsWith("-") ? raw : `- ${raw}`);
      if (!text) continue;
      const wrapped = wrapText(text, helvetica, descFontSize, MAX_DESC_WIDTH);
      for (const line of wrapped) {
        page.drawText(line, {
          x: COL_DESC_X + 4, y: currentY, size: descFontSize, font: helvetica, color: GRAY,
        });
        currentY -= lineHeight;
      }
    }

    if (index < data.itens.length - 1) {
      // Linha colada ao fim do item atual, folga grande antes do próximo
      currentY += 4;
      page.drawLine({
        start: { x: 50, y: currentY }, end: { x: RIGHT_EDGE - 25, y: currentY },
        thickness: 0.4, color: rgb(0.82, 0.82, 0.82),
      });
      currentY -= separatorGap + 4;
    }
  });

  // ══════════════════════════════════════════════════════════
  // TOTAL — só o valor (label "TOTAL:" estático)
  // ══════════════════════════════════════════════════════════
  drawTextRight(
    page, formatCurrency(data.valorTotal),
    RIGHT_EDGE - 38, Y_TOTAL, 12, helveticaBold, RED,
  );

  // ══════════════════════════════════════════════════════════
  // SAVE & DOWNLOAD
  // ══════════════════════════════════════════════════════════
  const pdfBytes = await pdfDoc.save();
  const base = (data.clienteEmpresa || data.clienteNome || "orcamento")
    .replace(/\s+/g, "-").toLowerCase();
  const fileName = `orcamento-${base}.pdf`;
  const blob = new Blob([pdfBytes as unknown as ArrayBuffer], { type: "application/pdf" });

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile && navigator.share) {
    const file = new File([blob], fileName, { type: "application/pdf" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: fileName });
      return;
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
