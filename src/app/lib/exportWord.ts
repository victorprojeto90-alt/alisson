import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  HeadingLevel, AlignmentType, WidthType, ShadingType, BorderStyle, Header, Footer,
  PageNumber, TabStopType, TabStopPosition, VerticalAlign, TableLayoutType,
  convertMillimetersToTwip, type IBorderOptions,
} from 'docx';
import type { ResultadoInventario } from './calculations';
import type { ProjetoParaRelatorio } from './reportText';
import { montarModelo, type Bloco, type ContextoEmissao, type Alinhamento } from './relatorio/modelo';
import { carregarLogos, desenharGrafico, prepararFonteCanvas } from './relatorio/recursos';
import { saveAs } from './fileSaver';

const VERDE = '00420D';
const VERDE_MEDIO = '0B5A1E';
const LIMA = 'ACD115';
const TEXTO = '212529';
const CINZA = '6B7280';
const LINHA = 'D6DED3';
const ZEBRA = 'F4F8F3';
const GRUPO = 'E2ECDF';
const FONTE = 'Calibri';

// Largura útil: A4 (210 mm) − 30 mm − 20 mm = 160 mm
const LARG_MM = 160;
const LARG_TW = convertMillimetersToTwip(LARG_MM);
const MM_PX = 3.7795; // 96 dpi

const SEM: IBorderOptions = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const linhaFina: IBorderOptions = { style: BorderStyle.SINGLE, size: 4, color: LINHA };

const alin = (a?: Alinhamento) => a === 'right' ? AlignmentType.RIGHT : a === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT;

function t(text: string, o: { b?: boolean; i?: boolean; size?: number; color?: string } = {}) {
  return new TextRun({ text, bold: o.b, italics: o.i, size: o.size ?? 24, color: o.color ?? TEXTO, font: FONTE });
}

function celula(texto: string, o: {
  largura: number; alinhar?: Alinhamento; b?: boolean; i?: boolean; cor?: string; fundo?: string; size?: number;
  span?: number; bordaSup?: IBorderOptions; bordaInf?: IBorderOptions;
}) {
  return new TableCell({
    width: { size: o.largura, type: WidthType.DXA },
    columnSpan: o.span,
    verticalAlign: VerticalAlign.CENTER,
    shading: o.fundo ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fundo } : undefined,
    margins: { top: 50, bottom: 50, left: 90, right: 90 },
    borders: { top: o.bordaSup ?? SEM, bottom: o.bordaInf ?? linhaFina, left: SEM, right: SEM },
    children: [new Paragraph({ alignment: alin(o.alinhar), spacing: { before: 0, after: 0, line: 240 }, children: [t(texto, { b: o.b, i: o.i, size: o.size ?? 18, color: o.cor })] })],
  });
}

export async function exportarWord(
  nomeArquivo: string,
  projeto: ProjetoParaRelatorio & { nome: string },
  resultado: ResultadoInventario,
  ctx: ContextoEmissao = {}
) {
  const [logos] = await Promise.all([carregarLogos(), prepararFonteCanvas()]);
  const modelo = montarModelo(projeto, resultado, ctx);
  const c = modelo.capa;

  // ================= CAPA =================
  const logoCapaW = 300;
  const capa: (Paragraph | Table)[] = [
    new Table({
      width: { size: LARG_TW, type: WidthType.DXA },
      columnWidths: [LARG_TW],
      layout: TableLayoutType.FIXED,
      borders: { top: SEM, bottom: SEM, left: SEM, right: SEM, insideHorizontal: SEM, insideVertical: SEM },
      rows: [new TableRow({
        children: [new TableCell({
          width: { size: LARG_TW, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: VERDE },
          borders: { top: SEM, left: SEM, right: SEM, bottom: { style: BorderStyle.SINGLE, size: 36, color: LIMA } },
          margins: { top: 700, bottom: 600, left: 500, right: 500 },
          children: [
            new Paragraph({ children: [new ImageRun({ type: 'png', data: logos.claro.bytes, transformation: { width: logoCapaW, height: Math.round((logoCapaW * logos.claro.altura) / logos.claro.largura) } })] }),
            new Paragraph({ spacing: { before: 500 }, children: [t('RELATÓRIO TÉCNICO DE', { b: true, size: 22, color: 'FFFFFF' })] }),
            new Paragraph({ children: [t('INVENTÁRIO FLORESTAL', { b: true, size: 40, color: 'FFFFFF' })] }),
            new Paragraph({ spacing: { before: 120 }, children: [t(c.finalidade, { size: 20, color: LIMA })] }),
          ],
        })],
      })],
    }),
    new Paragraph({ spacing: { before: 900 }, children: [t('PROJETO', { size: 20, color: CINZA })] }),
    new Paragraph({ spacing: { before: 60 }, children: [t(c.projeto, { b: true, size: 48 })] }),
    new Paragraph({ spacing: { before: 120, after: 400 }, children: [t(`${c.local}  ·  Bioma ${c.bioma}  ·  ${c.area}`, { size: 24, color: CINZA })] }),
    new Table({
      width: { size: LARG_TW, type: WidthType.DXA },
      columnWidths: [Math.round(LARG_TW * 0.38), LARG_TW - Math.round(LARG_TW * 0.38)],
      layout: TableLayoutType.FIXED,
      borders: { top: SEM, bottom: SEM, right: SEM, insideHorizontal: SEM, insideVertical: SEM, left: { style: BorderStyle.SINGLE, size: 24, color: VERDE_MEDIO } },
      rows: ([
        ['Responsável técnico', c.responsavel], ['Empresa', c.empresa], ['Data do inventário', c.dataInventario], ['Emissão do relatório', c.emissao],
      ] as [string, string][]).map(([k, v]) => new TableRow({
        children: [
          celula(k.toUpperCase(), { largura: Math.round(LARG_TW * 0.38), size: 18, cor: CINZA, fundo: ZEBRA, bordaInf: SEM }),
          celula(v, { largura: LARG_TW - Math.round(LARG_TW * 0.38), size: 24, b: true, fundo: ZEBRA, bordaInf: SEM }),
        ],
      })),
    }),
    new Paragraph({ spacing: { before: 2200 }, alignment: AlignmentType.CENTER, children: [t(c.cidadeData, { size: 22 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [t('Documento gerado pela plataforma AMBISAFE', { size: 17, color: CINZA })] }),
  ];

  // ================= CONTEÚDO =================
  const corpo: (Paragraph | Table)[] = [];
  const legenda = (txt: string) => new Paragraph({ keepNext: true, spacing: { before: 240, after: 80 }, children: [t(txt, { b: true, size: 21 })] });
  const fonte = (nota?: string) => new Paragraph({ spacing: { before: 60, after: 240 }, children: [t(`Fonte: AMBISAFE (${modelo.ano}).${nota ? ' ' + nota : ''}`, { size: 18, color: CINZA })] });

  const tabela = (b: Extract<Bloco, { tipo: 'tabela' }>) => {
    const larguras = b.colunas.map(col => Math.round(col.largura * LARG_TW));
    const tam = b.colunas.length >= 8 ? 16 : 18;
    const linhas: TableRow[] = [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: b.colunas.map((col, i) => celula(col.titulo, { largura: larguras[i], alinhar: col.alinhar ?? 'left', b: true, cor: 'FFFFFF', fundo: VERDE, size: tam, bordaInf: SEM })),
      }),
    ];
    let z = 0;
    for (const l of b.linhas) {
      if (l.tipo === 'grupo') {
        linhas.push(new TableRow({ cantSplit: true, children: [celula(l.texto, { largura: LARG_TW, span: b.colunas.length, b: true, cor: VERDE, fundo: GRUPO, size: tam })] }));
        z = 0;
        continue;
      }
      const fundo = z++ % 2 === 1 ? ZEBRA : undefined;
      linhas.push(new TableRow({
        cantSplit: true,
        children: l.celulas.map((txt, i) => celula(txt, {
          largura: larguras[i], alinhar: b.colunas[i].alinhar, i: b.colunas[i].italico, fundo, size: tam,
          b: l.destaque, cor: l.destaque ? VERDE : undefined,
        })),
      }));
    }
    if (b.total) {
      linhas.push(new TableRow({
        cantSplit: true,
        children: b.total.map((txt, i) => celula(txt, {
          largura: larguras[i], alinhar: b.colunas[i].alinhar, b: true, cor: VERDE, fundo: GRUPO, size: tam,
          bordaSup: { style: BorderStyle.SINGLE, size: 8, color: VERDE },
        })),
      }));
    }
    corpo.push(legenda(`Tabela ${b.numero} – ${b.titulo}`));
    corpo.push(new Table({
      width: { size: LARG_TW, type: WidthType.DXA },
      columnWidths: larguras,
      layout: TableLayoutType.FIXED,
      borders: { top: SEM, bottom: SEM, left: SEM, right: SEM, insideHorizontal: SEM, insideVertical: SEM },
      rows: linhas,
    }));
    corpo.push(fonte(b.nota));
  };

  for (const b of modelo.blocos) {
    switch (b.tipo) {
      case 'titulo':
        corpo.push(new Paragraph({
          heading: b.nivel === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
          pageBreakBefore: b.novaPagina,
          keepNext: true,
          children: [new TextRun({ text: b.texto })],
        }));
        break;
      case 'paragrafo':
        corpo.push(new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: convertMillimetersToTwip(12.5) },
          spacing: { before: 0, after: 120, line: 360 },
          children: [t(b.texto)],
        }));
        break;
      case 'tabela':
        tabela(b);
        break;
      case 'figura': {
        const img = desenharGrafico(b.grafico);
        const wpx = Math.round(LARG_MM * MM_PX);
        corpo.push(legenda(`Figura ${b.numero} – ${b.titulo}`));
        corpo.push(new Paragraph({ keepNext: true, alignment: AlignmentType.CENTER, children: [new ImageRun({ type: 'png', data: img.bytes, transformation: { width: wpx, height: Math.round((wpx * img.altura) / img.largura) } })] }));
        corpo.push(fonte());
        break;
      }
      case 'destaques': {
        const cw = Math.round(LARG_TW / 3);
        const linhas: TableRow[] = [];
        for (let i = 0; i < b.itens.length; i += 3) {
          linhas.push(new TableRow({
            cantSplit: true,
            children: b.itens.slice(i, i + 3).map(it => new TableCell({
              width: { size: cw, type: WidthType.DXA },
              shading: { type: ShadingType.CLEAR, color: 'auto', fill: ZEBRA },
              margins: { top: 140, bottom: 140, left: 160, right: 120 },
              borders: { top: { style: BorderStyle.SINGLE, size: 12, color: 'FFFFFF' }, bottom: { style: BorderStyle.SINGLE, size: 12, color: 'FFFFFF' }, left: { style: BorderStyle.SINGLE, size: 18, color: VERDE_MEDIO }, right: { style: BorderStyle.SINGLE, size: 12, color: 'FFFFFF' } },
              children: [
                new Paragraph({ spacing: { after: 60 }, children: [t(it.rotulo.toUpperCase(), { size: 16, color: CINZA })] }),
                new Paragraph({ children: [t(it.valor, { b: true, size: it.valor.length > 18 ? 22 : 28, color: VERDE })] }),
              ],
            })),
          }));
        }
        corpo.push(new Table({ width: { size: LARG_TW, type: WidthType.DXA }, columnWidths: [cw, cw, LARG_TW - 2 * cw], layout: TableLayoutType.FIXED, rows: linhas }));
        corpo.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
        break;
      }
      case 'ficha': {
        const k = Math.round(LARG_TW * 0.38);
        corpo.push(new Table({
          width: { size: LARG_TW, type: WidthType.DXA },
          columnWidths: [k, LARG_TW - k],
          layout: TableLayoutType.FIXED,
          borders: { top: SEM, bottom: SEM, left: SEM, right: SEM, insideHorizontal: SEM, insideVertical: SEM },
          rows: b.itens.map(([a, v], i) => new TableRow({
            cantSplit: true,
            children: [
              celula(a, { largura: k, size: 21, cor: CINZA, fundo: i % 2 === 0 ? ZEBRA : undefined }),
              celula(v, { largura: LARG_TW - k, size: 21, b: true, fundo: i % 2 === 0 ? ZEBRA : undefined }),
            ],
          })),
        }));
        corpo.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
        break;
      }
      case 'referencias':
        for (const ref of b.itens) corpo.push(new Paragraph({ spacing: { after: 200, line: 240 }, children: [t(ref, { size: 22 })] }));
        break;
      case 'assinatura':
        corpo.push(new Paragraph({ keepNext: true, keepLines: true, alignment: AlignmentType.RIGHT, spacing: { before: 480, after: 1100 }, children: [t(b.local)] }));
        corpo.push(new Paragraph({ keepNext: true, alignment: AlignmentType.CENTER, children: [t('________________________________________', { color: TEXTO })] }));
        corpo.push(new Paragraph({ keepNext: true, alignment: AlignmentType.CENTER, children: [t(b.nome, { b: true })] }));
        corpo.push(new Paragraph({ keepNext: !!b.empresa, alignment: AlignmentType.CENTER, children: [t(b.funcao, { size: 21, color: CINZA })] }));
        if (b.empresa) corpo.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [t(b.empresa, { size: 21, color: CINZA })] }));
        break;
    }
  }

  // ================= CABEÇALHO E RODAPÉ =================
  const logoHpx = 20;
  const cabecalho = new Header({
    children: [
      new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINHA, space: 4 } },
        children: [
          new ImageRun({ type: 'png', data: logos.escuro.bytes, transformation: { width: Math.round((logoHpx * logos.escuro.largura) / logos.escuro.altura), height: logoHpx } }),
          new TextRun({ text: '\tRelatório Técnico de Inventário Florestal', size: 17, color: CINZA, font: FONTE }),
        ],
      }),
    ],
  });
  const rodape = new Footer({
    children: [
      new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: LINHA, space: 4 } },
        children: [
          new TextRun({ text: modelo.rodape, size: 17, color: CINZA, font: FONTE }),
          new TextRun({ text: '\t', font: FONTE }),
          new TextRun({ children: [PageNumber.CURRENT], bold: true, size: 17, color: VERDE, font: FONTE }),
          new TextRun({ text: ' / ', bold: true, size: 17, color: VERDE, font: FONTE }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], bold: true, size: 17, color: VERDE, font: FONTE }),
        ],
      }),
    ],
  });

  const margem = {
    top: convertMillimetersToTwip(30), left: convertMillimetersToTwip(30),
    bottom: convertMillimetersToTwip(20), right: convertMillimetersToTwip(20),
    header: convertMillimetersToTwip(12), footer: convertMillimetersToTwip(10),
  };

  const doc = new Document({
    creator: 'AMBISAFE',
    title: `Relatório Técnico — ${projeto.nome}`,
    styles: {
      default: { document: { run: { font: FONTE, size: 24, color: TEXTO } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONTE, size: 28, bold: true, color: VERDE }, paragraph: { spacing: { before: 360, after: 200 } } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONTE, size: 25, bold: true, color: VERDE_MEDIO }, paragraph: { spacing: { before: 280, after: 140 } } },
      ],
    },
    sections: [
      { properties: { page: { margin: { top: convertMillimetersToTwip(18), left: margem.left, right: margem.right, bottom: margem.bottom } } }, children: capa },
      { properties: { page: { margin: margem } }, headers: { default: cabecalho }, footers: { default: rodape }, children: corpo },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${nomeArquivo}.docx`);
}
