import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  PageBreak
} from 'docx';
import { salaryService } from './salaryService';

const STATUS_LABELS: Record<string, string> = {
  '1': 'Nao Iniciado',
  '2': 'Em Planejamento',
  '3': 'Em Andamento',
  '4': 'Quase Concluido',
  '5': 'Concluido'
};

const PRAZO_LABELS: Record<string, string> = {
  curto: 'Curto Prazo (3 meses)',
  medio: 'Medio Prazo (3-6 meses)',
  longo: 'Longo Prazo (6-12 meses)'
};

const COLORS = {
  primary: '#3F2A1D',
  primaryAccent: '#6B4A33',
  text: '#1F2937',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  bgSoft: '#F9FAFB',
  white: '#FFFFFF'
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  '1': { bg: '#FEE2E2', fg: '#991B1B' },
  '2': { bg: '#FFEDD5', fg: '#9A3412' },
  '3': { bg: '#FEF3C7', fg: '#92400E' },
  '4': { bg: '#DBEAFE', fg: '#1E40AF' },
  '5': { bg: '#D1FAE5', fg: '#065F46' }
};

const PRAZO_COLORS: Record<string, string> = {
  curto: '#15803D',
  medio: '#6B7280',
  longo: '#78716C'
};

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 50;
const CONTENT_X = MARGIN;
const CONTENT_W = PAGE_W - MARGIN * 2;
const CONTENT_BOTTOM = PAGE_H - 70; // limite para conteudo (deixa espaco para o footer)
const FOOTER_Y = PAGE_H - 30;       // posicao do footer (precisa ficar dentro da margem usavel)
const PDI_DOC_OPTIONS = {
  size: 'A4' as const,
  margins: { top: 50, bottom: 0, left: 50, right: 50 },
  bufferPages: true
};

// Remove acentos para evitar problemas de encoding na fonte padrao do pdfkit
const sanitize = (text: any): string => {
  if (text === null || text === undefined) return '';
  return String(text).normalize('NFD').replace(/[̀-ͯ]/g, '');
};

const drawFooter = (doc: PDFKit.PDFDocument) => {
  const now = new Date();
  doc.save();
  doc.fillColor(COLORS.textMuted).fontSize(8).font('Helvetica');
  doc.text(
    `Gerado em ${now.toLocaleDateString('pt-BR')} as ${now.toLocaleTimeString('pt-BR')}`,
    CONTENT_X,
    FOOTER_Y,
    { width: CONTENT_W, align: 'center', lineBreak: false }
  );
  doc.restore();
};

const drawHeaderBanner = (doc: PDFKit.PDFDocument, title: string, subtitle?: string) => {
  doc.save();
  doc.rect(0, 0, PAGE_W, 90).fill(COLORS.primary);
  doc.rect(0, 90, PAGE_W, 4).fill(COLORS.primaryAccent);
  doc.fillColor(COLORS.white).fontSize(18).font('Helvetica-Bold')
    .text(title, 0, 32, { width: PAGE_W, align: 'center', lineBreak: false });
  if (subtitle) {
    doc.fontSize(10).font('Helvetica')
      .text(subtitle, 0, 58, { width: PAGE_W, align: 'center', lineBreak: false });
  }
  doc.restore();
};

const drawInfoBox = (
  doc: PDFKit.PDFDocument,
  rows: Array<[string, string, string, string]>,
  startY: number
): number => {
  const boxH = rows.length * 32 + 16;
  doc.save();
  doc.roundedRect(CONTENT_X, startY, CONTENT_W, boxH, 6)
    .fillAndStroke(COLORS.bgSoft, COLORS.border);
  doc.fillColor(COLORS.text);
  const colW = CONTENT_W / 2;
  let cy = startY + 12;
  rows.forEach(([l1, v1, l2, v2]) => {
    doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.textMuted)
      .text(l1.toUpperCase(), CONTENT_X + 14, cy, { width: colW - 20, lineBreak: false });
    doc.fontSize(11).font('Helvetica').fillColor(COLORS.text)
      .text(v1 || '-', CONTENT_X + 14, cy + 11, { width: colW - 20, lineBreak: false, ellipsis: true });
    if (l2) {
      doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.textMuted)
        .text(l2.toUpperCase(), CONTENT_X + colW + 14, cy, { width: colW - 28, lineBreak: false });
      doc.fontSize(11).font('Helvetica').fillColor(COLORS.text)
        .text(v2 || '-', CONTENT_X + colW + 14, cy + 11, { width: colW - 28, lineBreak: false, ellipsis: true });
    }
    cy += 32;
  });
  doc.restore();
  return startY + boxH + 14;
};

const drawPrazoHeader = (doc: PDFKit.PDFDocument, prazo: 'curto' | 'medio' | 'longo', count: number, y: number): number => {
  const h = 28;
  const color = PRAZO_COLORS[prazo];
  doc.save();
  doc.roundedRect(CONTENT_X, y, CONTENT_W, h, 4).fill(color);
  doc.fillColor(COLORS.white).fontSize(12).font('Helvetica-Bold')
    .text(PRAZO_LABELS[prazo].toUpperCase(), CONTENT_X + 14, y + 9, { lineBreak: false });
  const countText = `${count} ${count === 1 ? 'item' : 'itens'}`;
  doc.fontSize(10).font('Helvetica')
    .text(countText, CONTENT_X, y + 9, { width: CONTENT_W - 14, align: 'right', lineBreak: false });
  doc.restore();
  return y + h + 10;
};

const drawStatusBadge = (doc: PDFKit.PDFDocument, status: string, x: number, y: number): number => {
  const colors = STATUS_COLORS[status] || STATUS_COLORS['1'];
  const label = STATUS_LABELS[status] || 'Indefinido';
  doc.fontSize(8).font('Helvetica-Bold');
  const tw = doc.widthOfString(label);
  const w = tw + 14;
  const h = 16;
  doc.save();
  doc.roundedRect(x, y, w, h, 8).fill(colors.bg);
  doc.fillColor(colors.fg).text(label, x + 7, y + 4, { lineBreak: false });
  doc.restore();
  return w;
};

const measureItemHeight = (doc: PDFKit.PDFDocument, item: any, innerW: number): number => {
  const padding = 12;
  doc.fontSize(11).font('Helvetica-Bold');
  const titleH = doc.heightOfString(`1. ${sanitize(item.competencia || 'Sem competencia')}`, { width: innerW - 100 });

  let bodyH = 0;
  const fields: Array<[string, string]> = [];
  if (item.calendarizacao) fields.push(['Calendarizacao', sanitize(item.calendarizacao)]);
  if (item.comoDesenvolver) fields.push(['Como Desenvolver', sanitize(item.comoDesenvolver)]);
  if (item.resultadosEsperados) fields.push(['Resultados Esperados', sanitize(item.resultadosEsperados)]);
  if (item.observacao) fields.push(['Observacoes', sanitize(item.observacao)]);

  fields.forEach(([_, val]) => {
    bodyH += 11;
    doc.fontSize(9).font('Helvetica');
    bodyH += doc.heightOfString(val, { width: innerW });
    bodyH += 6;
  });

  return titleH + 10 + bodyH + padding * 2;
};

const drawItemCard = (
  doc: PDFKit.PDFDocument,
  item: any,
  index: number,
  prazo: 'curto' | 'medio' | 'longo',
  startY: number
): number => {
  const padding = 12;
  const innerOffset = 14;
  const innerW = CONTENT_W - 2 * padding - innerOffset;
  const cardH = measureItemHeight(doc, item, innerW);
  const color = PRAZO_COLORS[prazo];

  doc.save();
  doc.roundedRect(CONTENT_X, startY, CONTENT_W, cardH, 6)
    .fillAndStroke(COLORS.white, COLORS.border);
  doc.rect(CONTENT_X, startY, 4, cardH).fill(color);
  doc.restore();

  let cy = startY + padding;
  const textX = CONTENT_X + innerOffset;

  // Titulo + badge
  doc.save();
  doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.text);
  const title = `${index + 1}. ${sanitize(item.competencia || 'Sem competencia')}`;
  doc.text(title, textX, cy, { width: innerW - 100 });
  const titleH = doc.heightOfString(title, { width: innerW - 100 });
  doc.restore();

  // Badge alinhado a direita do topo
  const status = item.status || '1';
  const label = STATUS_LABELS[status] || 'Indefinido';
  doc.fontSize(8).font('Helvetica-Bold');
  const badgeW = doc.widthOfString(label) + 14;
  const badgeX = CONTENT_X + CONTENT_W - padding - badgeW;
  drawStatusBadge(doc, status, badgeX, startY + padding);

  cy += titleH + 8;

  const fields: Array<[string, string]> = [];
  if (item.calendarizacao) fields.push(['Calendarizacao', sanitize(item.calendarizacao)]);
  if (item.comoDesenvolver) fields.push(['Como Desenvolver', sanitize(item.comoDesenvolver)]);
  if (item.resultadosEsperados) fields.push(['Resultados Esperados', sanitize(item.resultadosEsperados)]);
  if (item.observacao) fields.push(['Observacoes', sanitize(item.observacao)]);

  fields.forEach(([labelTxt, val]) => {
    doc.save();
    doc.fontSize(8).font('Helvetica-Bold').fillColor(COLORS.textMuted);
    doc.text(labelTxt.toUpperCase(), textX, cy, { lineBreak: false });
    doc.restore();
    cy += 11;
    doc.save();
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.text);
    doc.text(val, textX, cy, { width: innerW });
    cy += doc.heightOfString(val, { width: innerW });
    doc.restore();
    cy += 6;
  });

  return startY + cardH + 8;
};

const renderPDIToDoc = (doc: PDFKit.PDFDocument, pdi: any, employeeInfo: any, departmentName: string) => {
  const items: any[] = Array.isArray(pdi?.items) ? pdi.items : [];

  drawHeaderBanner(doc, 'Plano de Desenvolvimento Individual', 'PDI - Avaliacao de Performance');

  let y = 110;
  y = drawInfoBox(doc, [
    ['Colaborador', sanitize(employeeInfo?.name || '-'), 'Cargo', sanitize(employeeInfo?.position || '-')],
    ['Departamento', sanitize(departmentName || '-'), 'Periodo', sanitize(pdi?.periodo || pdi?.timeline || '-')],
    [
      'Criado em',
      pdi?.created_at ? new Date(pdi.created_at).toLocaleDateString('pt-BR') : '-',
      'Atualizacao',
      pdi?.updated_at ? new Date(pdi.updated_at).toLocaleDateString('pt-BR') : '-'
    ]
  ], y);

  if (items.length === 0) {
    doc.save();
    doc.fontSize(11).font('Helvetica').fillColor(COLORS.textMuted)
      .text('Nenhum item cadastrado neste PDI.', CONTENT_X, y + 20, { width: CONTENT_W, align: 'center' });
    doc.restore();
    return;
  }

  // Agrupar itens por prazo
  const grupos: Record<string, any[]> = { curto: [], medio: [], longo: [] };
  items.forEach((item: any) => {
    const prazo = item?.prazo || 'curto';
    if (grupos[prazo]) grupos[prazo].push(item);
  });

  (['curto', 'medio', 'longo'] as const).forEach((prazo) => {
    const grupo = grupos[prazo];
    if (!grupo || grupo.length === 0) return;

    // Garantir espaco para header (28+10) + primeiro card completo (evita header orfao)
    const innerW = CONTENT_W - 24 - 14;
    const firstCardH = measureItemHeight(doc, grupo[0], innerW);
    if (y + 38 + firstCardH > CONTENT_BOTTOM) {
      doc.addPage();
      y = MARGIN;
    }

    y = drawPrazoHeader(doc, prazo, grupo.length, y);

    grupo.forEach((item: any, index: number) => {
      const cardH = measureItemHeight(doc, item, innerW);
      if (y + cardH > CONTENT_BOTTOM) {
        doc.addPage();
        y = MARGIN;
      }
      y = drawItemCard(doc, item, index, prazo, y);
    });

    y += 4;
  });
};

// Aplica o footer em todas as paginas bufferizadas
const drawFootersOnAllPages = (doc: PDFKit.PDFDocument) => {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    drawFooter(doc);
  }
};

// =====================================================================
// DOCX builders
// =====================================================================

const DOCX_HEX = {
  primary: '3F2A1D',
  bgSoft: 'F9FAFB',
  border: 'E5E7EB',
  text: '1F2937',
  textMuted: '6B7280',
  white: 'FFFFFF',
  prazoCurto: '15803D',
  prazoMedio: '6B7280',
  prazoLongo: '78716C'
};

const DOCX_STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  '1': { bg: 'FEE2E2', fg: '991B1B' },
  '2': { bg: 'FFEDD5', fg: '9A3412' },
  '3': { bg: 'FEF3C7', fg: '92400E' },
  '4': { bg: 'DBEAFE', fg: '1E40AF' },
  '5': { bg: 'D1FAE5', fg: '065F46' }
};

const noBorder = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
};

const buildBannerTable = (title: string, subtitle: string): Table => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorder,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: DOCX_HEX.primary },
            margins: { top: 240, bottom: 240, left: 200, right: 200 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: title, bold: true, size: 32, color: DOCX_HEX.white })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 80 },
                children: [new TextRun({ text: subtitle, size: 18, color: DOCX_HEX.white })]
              })
            ]
          })
        ]
      })
    ]
  });
};

const buildInfoBoxTable = (rows: Array<[string, string, string, string]>): Table => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: DOCX_HEX.border },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: DOCX_HEX.border },
      left: { style: BorderStyle.SINGLE, size: 4, color: DOCX_HEX.border },
      right: { style: BorderStyle.SINGLE, size: 4, color: DOCX_HEX.border },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
    },
    rows: rows.map(([l1, v1, l2, v2]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: DOCX_HEX.bgSoft },
            margins: { top: 120, bottom: 120, left: 200, right: 100 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: l1.toUpperCase(), bold: true, size: 14, color: DOCX_HEX.textMuted })]
              }),
              new Paragraph({
                spacing: { before: 40 },
                children: [new TextRun({ text: v1 || '-', size: 22, color: DOCX_HEX.text })]
              })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: DOCX_HEX.bgSoft },
            margins: { top: 120, bottom: 120, left: 200, right: 100 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: l2.toUpperCase(), bold: true, size: 14, color: DOCX_HEX.textMuted })]
              }),
              new Paragraph({
                spacing: { before: 40 },
                children: [new TextRun({ text: v2 || '-', size: 22, color: DOCX_HEX.text })]
              })
            ]
          })
        ]
      })
    )
  });
};

const buildPrazoHeaderTable = (prazo: 'curto' | 'medio' | 'longo', count: number): Table => {
  const colorMap: Record<string, string> = {
    curto: DOCX_HEX.prazoCurto,
    medio: DOCX_HEX.prazoMedio,
    longo: DOCX_HEX.prazoLongo
  };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorder,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: colorMap[prazo] },
            margins: { top: 120, bottom: 120, left: 240, right: 100 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: PRAZO_LABELS[prazo].toUpperCase(), bold: true, size: 24, color: DOCX_HEX.white })]
              })
            ]
          }),
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: colorMap[prazo] },
            margins: { top: 120, bottom: 120, left: 100, right: 240 },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: `${count} ${count === 1 ? 'item' : 'itens'}`, size: 20, color: DOCX_HEX.white })]
              })
            ]
          })
        ]
      })
    ]
  });
};

const buildItemCardTable = (item: any, index: number, prazo: 'curto' | 'medio' | 'longo'): Table => {
  const status = item.status || '1';
  const statusLabel = STATUS_LABELS[status] || 'Indefinido';
  const statusColors = DOCX_STATUS_COLORS[status] || DOCX_STATUS_COLORS['1'];
  const stripeColor: Record<string, string> = {
    curto: DOCX_HEX.prazoCurto,
    medio: DOCX_HEX.prazoMedio,
    longo: DOCX_HEX.prazoLongo
  };

  const fields: Array<[string, string]> = [];
  if (item.calendarizacao) fields.push(['Calendarizacao', sanitize(item.calendarizacao)]);
  if (item.comoDesenvolver) fields.push(['Como Desenvolver', sanitize(item.comoDesenvolver)]);
  if (item.resultadosEsperados) fields.push(['Resultados Esperados', sanitize(item.resultadosEsperados)]);
  if (item.observacao) fields.push(['Observacoes', sanitize(item.observacao)]);

  const contentChildren: Paragraph[] = [];
  // Linha do titulo + status (concat usando tabs e formatacao)
  contentChildren.push(
    new Paragraph({
      children: [
        new TextRun({ text: `${index + 1}. ${sanitize(item.competencia || 'Sem competencia')}`, bold: true, size: 22, color: DOCX_HEX.text })
      ]
    })
  );
  contentChildren.push(
    new Paragraph({
      spacing: { before: 60, after: 120 },
      children: [
        new TextRun({
          text: ` ${statusLabel} `,
          bold: true,
          size: 16,
          color: statusColors.fg,
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: statusColors.bg }
        })
      ]
    })
  );

  fields.forEach(([label, val]) => {
    contentChildren.push(
      new Paragraph({
        spacing: { before: 80, after: 20 },
        children: [new TextRun({ text: label.toUpperCase(), bold: true, size: 14, color: DOCX_HEX.textMuted })]
      })
    );
    contentChildren.push(
      new Paragraph({
        children: [new TextRun({ text: val, size: 18, color: DOCX_HEX.text })]
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: DOCX_HEX.border },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: DOCX_HEX.border },
      left: { style: BorderStyle.SINGLE, size: 4, color: DOCX_HEX.border },
      right: { style: BorderStyle.SINGLE, size: 4, color: DOCX_HEX.border },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 1, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: stripeColor[prazo] },
            margins: { top: 0, bottom: 0, left: 60, right: 0 },
            children: [new Paragraph({ children: [] })]
          }),
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            margins: { top: 200, bottom: 200, left: 240, right: 240 },
            children: contentChildren
          })
        ]
      })
    ]
  });
};

const spacer = (height = 200): Paragraph => new Paragraph({ spacing: { before: 0, after: height }, children: [] });

const buildPDIChildren = (pdi: any, employeeInfo: any, departmentName: string): (Paragraph | Table)[] => {
  const items: any[] = Array.isArray(pdi?.items) ? pdi.items : [];
  const children: (Paragraph | Table)[] = [];

  children.push(buildBannerTable('Plano de Desenvolvimento Individual', 'PDI - Avaliacao de Performance'));
  children.push(spacer(200));

  children.push(
    buildInfoBoxTable([
      ['Colaborador', sanitize(employeeInfo?.name || '-'), 'Cargo', sanitize(employeeInfo?.position || '-')],
      ['Departamento', sanitize(departmentName || '-'), 'Periodo', sanitize(pdi?.periodo || pdi?.timeline || '-')],
      [
        'Criado em',
        pdi?.created_at ? new Date(pdi.created_at).toLocaleDateString('pt-BR') : '-',
        'Atualizacao',
        pdi?.updated_at ? new Date(pdi.updated_at).toLocaleDateString('pt-BR') : '-'
      ]
    ])
  );
  children.push(spacer(300));

  if (items.length === 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Nenhum item cadastrado neste PDI.', italics: true, color: DOCX_HEX.textMuted })]
      })
    );
    return children;
  }

  const grupos: Record<string, any[]> = { curto: [], medio: [], longo: [] };
  items.forEach((item: any) => {
    const prazo = item?.prazo || 'curto';
    if (grupos[prazo]) grupos[prazo].push(item);
  });

  (['curto', 'medio', 'longo'] as const).forEach((prazo) => {
    const grupo = grupos[prazo];
    if (!grupo || grupo.length === 0) return;
    children.push(buildPrazoHeaderTable(prazo, grupo.length));
    children.push(spacer(150));
    grupo.forEach((item, idx) => {
      children.push(buildItemCardTable(item, idx, prazo));
      children.push(spacer(150));
    });
    children.push(spacer(200));
  });

  return children;
};

const buildBulkCoverChildren = (pdis: any[], userById: Map<string, any>): (Paragraph | Table)[] => {
  const children: (Paragraph | Table)[] = [];
  children.push(buildBannerTable('Relatorio Consolidado de PDIs', 'Planos de Desenvolvimento Individual'));
  children.push(spacer(400));

  // Caixa central com totais (tabela 1x1 estilizada)
  children.push(
    new Table({
      width: { size: 60, type: WidthType.PERCENTAGE },
      alignment: AlignmentType.CENTER,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: DOCX_HEX.border },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: DOCX_HEX.border },
        left: { style: BorderStyle.SINGLE, size: 4, color: DOCX_HEX.border },
        right: { style: BorderStyle.SINGLE, size: 4, color: DOCX_HEX.border }
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { type: ShadingType.CLEAR, color: 'auto', fill: DOCX_HEX.bgSoft },
              margins: { top: 400, bottom: 400, left: 200, right: 200 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: String(pdis.length), bold: true, size: 96, color: DOCX_HEX.primary })]
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 100 },
                  children: [new TextRun({ text: 'PDIs ativos no momento', size: 22, color: DOCX_HEX.textMuted })]
                })
              ]
            })
          ]
        })
      ]
    })
  );

  children.push(spacer(400));
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Colaboradores incluidos neste relatorio:', bold: true, size: 24, color: DOCX_HEX.text })]
    })
  );
  children.push(spacer(100));

  const maxOnCover = 25;
  pdis.slice(0, maxOnCover).forEach((p: any) => {
    const emp = userById.get(p.employee_id);
    const text = emp ? `${sanitize(emp.name)}${emp.position ? ` - ${sanitize(emp.position)}` : ''}` : 'Colaborador desconhecido';
    children.push(
      new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text: `• ${text}`, size: 20, color: DOCX_HEX.text })]
      })
    );
  });

  if (pdis.length > maxOnCover) {
    children.push(
      new Paragraph({
        spacing: { before: 100 },
        children: [new TextRun({ text: `... e mais ${pdis.length - maxOnCover} colaborador(es)`, italics: true, size: 18, color: DOCX_HEX.textMuted })]
      })
    );
  }

  return children;
};

export const exportService = {
  /**
   * Exporta os dados de uma trilha para PDF
   */
  async exportTrackToPDF(supabase: SupabaseClient<Database>, trackId: string): Promise<Buffer> {
    // Buscar dados da trilha
    const track = await salaryService.getCareerTrackById(supabase, trackId);
    const positions = await salaryService.getPositionsByTrack(supabase, trackId);
    const levels = await salaryService.getSalaryLevels(supabase);

    // Buscar departamento
    let departmentName = 'N/A';
    if (track.department_id) {
      const { data: dept } = await supabase
        .from('departments')
        .select('name')
        .eq('id', track.department_id)
        .single();
      if (dept) departmentName = dept.name;
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => buffers.push(chunk));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });
        doc.on('error', (err: Error) => reject(err));

        // Título
        doc.fontSize(20).text('Relatorio de Trilha de Carreira', { align: 'center' });
        doc.moveDown();

        // Informações da Trilha
        doc.fontSize(14).text('Informacoes da Trilha', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11);
        doc.text(`Nome: ${track.name || 'N/A'}`);
        doc.text(`Departamento: ${departmentName}`);
        doc.text(`Descricao: ${track.description || 'N/A'}`);
        doc.text(`Status: ${track.active ? 'Ativa' : 'Inativa'}`);
        doc.moveDown();

        // Cargos e Salários
        doc.fontSize(14).text('Cargos e Estrutura Salarial', { underline: true });
        doc.moveDown(0.5);

        if (!positions || positions.length === 0) {
          doc.fontSize(10).text('Nenhum cargo cadastrado nesta trilha.');
        } else {
          positions.forEach((position: any, index: number) => {
            // Verificar se estamos chegando ao fim da página
            if (doc.y > 700) {
              doc.addPage();
            }

            doc.fontSize(12).text(`${index + 1}. ${position.position?.name || 'Cargo nao identificado'}`);
            doc.fontSize(10);
            doc.text(`   Classe: ${position.class?.code || 'N/A'} - ${position.class?.name || ''}`);

            const baseSalary = position.base_salary || 0;
            doc.text(`   Salario Base: R$ ${baseSalary.toFixed(2).replace('.', ',')}`);

            // Níveis salariais
            doc.text('   Niveis Salariais:');
            if (levels && levels.length > 0) {
              levels.forEach((level: any) => {
                // Buscar percentage customizada ou usar a padrão
                let percentage = 0;
                if (position.custom_level_percentages && position.custom_level_percentages[level.id]) {
                  percentage = position.custom_level_percentages[level.id];
                } else if (level.percentage !== undefined && level.percentage !== null) {
                  percentage = level.percentage;
                }

                const salary = baseSalary * (1 + percentage / 100);
                doc.text(`      ${level.name}: R$ ${salary.toFixed(2).replace('.', ',')} (+${percentage}%)`);
              });
            }

            doc.moveDown(0.5);
          });
        }

        // Rodapé
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR');
        const timeStr = now.toLocaleTimeString('pt-BR');
        doc.moveDown(2);
        doc.fontSize(8).text(
          `Gerado em: ${dateStr} as ${timeStr}`,
          { align: 'center' }
        );

        doc.end();
      } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        reject(error);
      }
    });
  },

  /**
   * Exporta os dados de uma trilha para Excel
   */
  async exportTrackToExcel(supabase: SupabaseClient<Database>, trackId: string): Promise<Buffer> {
    try {
      // Buscar dados da trilha
      const track = await salaryService.getCareerTrackById(supabase, trackId);
      const positions = await salaryService.getPositionsByTrack(supabase, trackId);
      const levels = await salaryService.getSalaryLevels(supabase);

      // Buscar departamento
      let departmentName = 'N/A';
      if (track.department_id) {
        const { data: dept } = await supabase
          .from('departments')
          .select('name')
          .eq('id', track.department_id)
          .single();
        if (dept) departmentName = dept.name;
      }

      // Criar workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistema de Avaliacao';
      workbook.created = new Date();

      // Aba única com informações da trilha e cargos
      const sheet = workbook.addWorksheet('Trilha de Carreira');

      // Adicionar informações da trilha no topo
      sheet.mergeCells('A1:D1');
      sheet.getCell('A1').value = 'INFORMACOES DA TRILHA';
      sheet.getCell('A1').font = { bold: true, size: 14 };
      sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getCell('A1').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9EAD3' }
      };

      sheet.getRow(2).values = ['Nome:', track.name || 'N/A'];
      sheet.getRow(3).values = ['Departamento:', departmentName];
      sheet.getRow(4).values = ['Descricao:', track.description || 'N/A'];
      sheet.getRow(5).values = ['Status:', track.active ? 'Ativa' : 'Inativa'];

      // Estilizar labels
      sheet.getCell('A2').font = { bold: true };
      sheet.getCell('A3').font = { bold: true };
      sheet.getCell('A4').font = { bold: true };
      sheet.getCell('A5').font = { bold: true };

      // Ajustar largura das colunas
      sheet.getColumn(1).width = 20;
      sheet.getColumn(2).width = 50;

      // Espaço entre informações e tabela
      const startRow = 7;

      // Cabeçalho da tabela de cargos
      sheet.mergeCells(`A${startRow}:D${startRow}`);
      sheet.getCell(`A${startRow}`).value = 'CARGOS E SALARIOS';
      sheet.getCell(`A${startRow}`).font = { bold: true, size: 14 };
      sheet.getCell(`A${startRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getCell(`A${startRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9EAD3' }
      };

      // Definir colunas da tabela
      const headerRow = startRow + 1;
      const columns: any[] = [
        { header: 'Ordem', key: 'order', width: 10 },
        { header: 'Cargo', key: 'position_name', width: 30 },
        { header: 'Classe', key: 'class_code', width: 20 },
        { header: 'Salario Base', key: 'base_salary', width: 15 }
      ];

      // Adicionar colunas de níveis
      if (levels && levels.length > 0) {
        levels.forEach((level: any) => {
          columns.push({
            header: `Nivel ${level.name}`,
            key: `level_${level.id}`,
            width: 15
          });
        });
      }

      // Definir headers na linha correta
      const headerValues = columns.map(col => col.header);
      sheet.getRow(headerRow).values = headerValues;

      // Estilizar cabeçalho da tabela
      const tableHeaderRow = sheet.getRow(headerRow);
      tableHeaderRow.font = { bold: true, size: 11 };
      tableHeaderRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCCCCC' }
      };
      tableHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

      // Ajustar larguras das colunas
      columns.forEach((col, index) => {
        sheet.getColumn(index + 1).width = col.width;
      });

      // Adicionar dados dos cargos
      let currentRow = headerRow + 1;
      if (positions && positions.length > 0) {
        positions.forEach((position: any, index: number) => {
          const rowValues: any[] = [
            position.order_index || index + 1,
            position.position?.name || 'N/A',
            `${position.class?.code || ''} - ${position.class?.name || ''}`,
            position.base_salary || 0
          ];

          // Calcular salários por nível
          if (levels && levels.length > 0) {
            levels.forEach((level: any) => {
              // Buscar percentage customizada ou usar a padrão
              let percentage = 0;
              if (position.custom_level_percentages && position.custom_level_percentages[level.id]) {
                percentage = position.custom_level_percentages[level.id];
              } else if (level.percentage !== undefined && level.percentage !== null) {
                percentage = level.percentage;
              }

              const baseSalary = position.base_salary || 0;
              const salary = baseSalary * (1 + percentage / 100);
              rowValues.push(salary);
            });
          }

          sheet.getRow(currentRow).values = rowValues;
          currentRow++;
        });
      }

      // Formatar colunas de valores monetários
      // Coluna do salário base é a 4ª coluna (índice 4)
      for (let row = headerRow + 1; row < currentRow; row++) {
        sheet.getCell(row, 4).numFmt = 'R$ #,##0.00';

        // Formatar colunas dos níveis (a partir da coluna 5)
        if (levels && levels.length > 0) {
          for (let col = 5; col < 5 + levels.length; col++) {
            sheet.getCell(row, col).numFmt = 'R$ #,##0.00';
          }
        }
      }

      // Gerar buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      throw error;
    }
  },

  /**
   * Exporta o PDI de um colaborador para PDF
   */
  async exportPDIToPDF(supabase: SupabaseClient<Database>, employeeId: string): Promise<{ buffer: Buffer; employeeName: string }> {
    const { data: pdi, error } = await supabase
      .from('development_plans')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }
    if (!pdi) {
      throw new Error('PDI nao encontrado para este colaborador');
    }

    const { data: employee } = await supabase
      .from('users')
      .select('id, name, position, department_id')
      .eq('id', employeeId)
      .single();

    let departmentName = 'N/A';
    if (employee?.department_id) {
      const { data: dept } = await supabase
        .from('departments')
        .select('name')
        .eq('id', employee.department_id)
        .single();
      if (dept) departmentName = dept.name;
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument(PDI_DOC_OPTIONS);
        const buffers: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => buffers.push(chunk));
        doc.on('end', () => {
          resolve({
            buffer: Buffer.concat(buffers),
            employeeName: employee?.name || 'colaborador'
          });
        });
        doc.on('error', (err: Error) => reject(err));

        renderPDIToDoc(doc, pdi, employee, departmentName);
        drawFootersOnAllPages(doc);
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  },

  /**
   * Exporta todos os PDIs ativos para um unico PDF (uso administrativo)
   */
  async exportAllPDIsToPDF(supabase: SupabaseClient<Database>): Promise<Buffer> {
    const { data: pdis, error } = await supabase
      .from('development_plans')
      .select('*')
      .eq('status', 'active')
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);
    if (!pdis || pdis.length === 0) {
      throw new Error('Nenhum PDI ativo encontrado');
    }

    const employeeIds = Array.from(new Set(pdis.map((p: any) => p.employee_id).filter(Boolean)));
    const { data: users } = await supabase
      .from('users')
      .select('id, name, position, department_id')
      .in('id', employeeIds);

    const departmentIds = Array.from(new Set((users || []).map((u: any) => u.department_id).filter(Boolean)));
    const { data: departments } = departmentIds.length > 0
      ? await supabase.from('departments').select('id, name').in('id', departmentIds)
      : { data: [] as any[] };

    const userById = new Map<string, any>();
    (users || []).forEach((u: any) => userById.set(u.id, u));
    const deptById = new Map<string, string>();
    (departments || []).forEach((d: any) => deptById.set(d.id, d.name));

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument(PDI_DOC_OPTIONS);
        const buffers: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err: Error) => reject(err));

        // Capa
        drawHeaderBanner(doc, 'Relatorio Consolidado de PDIs', 'Planos de Desenvolvimento Individual');

        // Caixa central com totais
        const boxY = 200;
        const boxH = 110;
        doc.save();
        doc.roundedRect(CONTENT_X + 60, boxY, CONTENT_W - 120, boxH, 8)
          .fillAndStroke(COLORS.bgSoft, COLORS.border);
        doc.fillColor(COLORS.primary).fontSize(48).font('Helvetica-Bold')
          .text(String(pdis.length), CONTENT_X + 60, boxY + 18, { width: CONTENT_W - 120, align: 'center', lineBreak: false });
        doc.fillColor(COLORS.textMuted).fontSize(11).font('Helvetica')
          .text('PDIs ativos no momento', CONTENT_X + 60, boxY + 78, { width: CONTENT_W - 120, align: 'center', lineBreak: false });
        doc.restore();

        // Lista resumo de colaboradores
        let listY = boxY + boxH + 30;
        doc.save();
        doc.fillColor(COLORS.text).fontSize(12).font('Helvetica-Bold')
          .text('Colaboradores incluidos neste relatorio:', CONTENT_X, listY, { lineBreak: false });
        doc.restore();
        listY += 20;

        const maxOnCover = 15;
        const namesToShow = pdis.slice(0, maxOnCover).map((p: any) => {
          const emp = userById.get(p.employee_id);
          return emp ? `${sanitize(emp.name)}${emp.position ? ` - ${sanitize(emp.position)}` : ''}` : 'Colaborador desconhecido';
        });

        doc.save();
        doc.fillColor(COLORS.text).fontSize(10).font('Helvetica');
        namesToShow.forEach((name) => {
          if (listY > CONTENT_BOTTOM) return;
          doc.text(`-  ${name}`, CONTENT_X + 6, listY, { width: CONTENT_W - 12, lineBreak: false, ellipsis: true });
          listY += 14;
        });
        if (pdis.length > maxOnCover) {
          doc.fillColor(COLORS.textMuted).fontSize(9).font('Helvetica-Oblique')
            .text(`... e mais ${pdis.length - maxOnCover} colaborador(es)`, CONTENT_X + 6, listY + 4, { lineBreak: false });
        }
        doc.restore();

        pdis.forEach((pdi: any) => {
          doc.addPage();
          const employee = userById.get(pdi.employee_id) || { name: 'Colaborador desconhecido' };
          const departmentName = employee.department_id ? (deptById.get(employee.department_id) || 'N/A') : 'N/A';
          renderPDIToDoc(doc, pdi, employee, departmentName);
        });

        drawFootersOnAllPages(doc);
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  },

  /**
   * Exporta o PDI de um colaborador para DOCX
   */
  async exportPDIToDocx(supabase: SupabaseClient<Database>, employeeId: string): Promise<{ buffer: Buffer; employeeName: string }> {
    const { data: pdi, error } = await supabase
      .from('development_plans')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }
    if (!pdi) {
      throw new Error('PDI nao encontrado para este colaborador');
    }

    const { data: employee } = await supabase
      .from('users')
      .select('id, name, position, department_id')
      .eq('id', employeeId)
      .single();

    let departmentName = 'N/A';
    if (employee?.department_id) {
      const { data: dept } = await supabase
        .from('departments')
        .select('name')
        .eq('id', employee.department_id)
        .single();
      if (dept) departmentName = dept.name;
    }

    const now = new Date();
    const doc = new Document({
      creator: 'Sistema de Avaliacao',
      title: 'PDI',
      sections: [
        {
          properties: {
            page: {
              margin: { top: 720, bottom: 720, left: 720, right: 720 }
            }
          },
          children: [
            ...buildPDIChildren(pdi, employee, departmentName),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 400 },
              children: [new TextRun({ text: `Gerado em ${now.toLocaleDateString('pt-BR')} as ${now.toLocaleTimeString('pt-BR')}`, italics: true, size: 16, color: DOCX_HEX.textMuted })]
            })
          ]
        }
      ]
    });

    const buffer = await Packer.toBuffer(doc);
    return {
      buffer,
      employeeName: employee?.name || 'colaborador'
    };
  },

  /**
   * Exporta todos os PDIs ativos para um unico DOCX
   */
  async exportAllPDIsToDocx(supabase: SupabaseClient<Database>): Promise<Buffer> {
    const { data: pdis, error } = await supabase
      .from('development_plans')
      .select('*')
      .eq('status', 'active')
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);
    if (!pdis || pdis.length === 0) {
      throw new Error('Nenhum PDI ativo encontrado');
    }

    const employeeIds = Array.from(new Set(pdis.map((p: any) => p.employee_id).filter(Boolean)));
    const { data: users } = await supabase
      .from('users')
      .select('id, name, position, department_id')
      .in('id', employeeIds);

    const departmentIds = Array.from(new Set((users || []).map((u: any) => u.department_id).filter(Boolean)));
    const { data: departments } = departmentIds.length > 0
      ? await supabase.from('departments').select('id, name').in('id', departmentIds)
      : { data: [] as any[] };

    const userById = new Map<string, any>();
    (users || []).forEach((u: any) => userById.set(u.id, u));
    const deptById = new Map<string, string>();
    (departments || []).forEach((d: any) => deptById.set(d.id, d.name));

    const now = new Date();
    const allChildren: (Paragraph | Table)[] = [];

    // Capa
    allChildren.push(...buildBulkCoverChildren(pdis, userById));

    // Cada PDI em sua propria "pagina" via PageBreak
    pdis.forEach((pdi: any) => {
      const employee = userById.get(pdi.employee_id) || { name: 'Colaborador desconhecido' };
      const departmentName = employee.department_id ? (deptById.get(employee.department_id) || 'N/A') : 'N/A';
      allChildren.push(new Paragraph({ children: [new PageBreak()] }));
      allChildren.push(...buildPDIChildren(pdi, employee, departmentName));
    });

    allChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        children: [new TextRun({ text: `Gerado em ${now.toLocaleDateString('pt-BR')} as ${now.toLocaleTimeString('pt-BR')}`, italics: true, size: 16, color: DOCX_HEX.textMuted })]
      })
    );

    const doc = new Document({
      creator: 'Sistema de Avaliacao',
      title: 'PDIs Consolidados',
      sections: [
        {
          properties: {
            page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } }
          },
          children: allChildren
        }
      ]
    });

    return Packer.toBuffer(doc);
  }
};
