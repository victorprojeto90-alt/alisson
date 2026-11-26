import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  HeadingLevel, AlignmentType, WidthType, ShadingType, BorderStyle, Header, Footer,
  PageNumber, TabStopType, TabStopPosition, VerticalAlign, TableLayoutType,
  convertMillimetersToTwip, type IBorderOptions,
} from 'docx';
import type { ResultadoInventario } from './calculations';
import type { ProjetoParaRelatorio } from './reportText';
import { montarModelo, type Bloco, type ContextoEmissao, type Alinhamento } from './relatorio/modelo';
import { desenharGrafico, prepararFonteCanvas } from './relatorio/recursos';
import { carregarTema } from './relatorio/tema';
import { saveAs } from './fileSaver';

// Cores do tema (definidas a cada exportação: marca do cliente ou AMBISAFE)
let VERDE = '00420D';
let PRIMARIA = '00420D';
let SOBRE = 'FFFFFF';
let VERDE_MEDIO = '0B5A1E';
let LIMA = 'ACD115';
let LINHA = 'D6DED3';
let ZEBRA = 'F4F8F3';
let GRUPO = 'E2ECDF';
const TEXTO = '212529';
const CINZA = '6B7280';
const FONTE = 'Calibri';

// Largura útil: A4 (210 mm) − 30 mm − 20 mm = 160 mm
const LARG_MM = 160;
const LARG_TW = convertMillimetersToTwip(LARG_MM);
const MM_PX = 3.7795; // 96 dpi

const SEM: IBorderOptions = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const linhaFina = (): IBorderOptions => ({ style: BorderStyle.SINGLE, size: 4, color: LINHA });

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
    borders: { top: o.bordaSup ?? SEM, bottom: o.bordaInf ?? linhaFina(), left: SEM, right: SEM },
    children: [new Paragraph({ alignment: alin(o.alinhar), spacing: { before: 0, after: 0, line: 240 }, children: [t(texto, { b: o.b, i: o.i, size: o.size ?? 18, color: o.cor })] })],
  });
}

export async function exportarWord(
  nomeArquivo: string,
  projeto: ProjetoParaRelatorio & { nome: string },
  resultado: ResultadoInventario,
  ctx: ContextoEmissao = {}
) {
  const [tema] = await Promise.all([carregarTema(ctx.marca, ctx.empresa), prepararFonteCanvas()]);
  VERDE = tema.escura; PRIMARIA = tema.primaria; SOBRE = tema.sobrePrimaria; VERDE_MEDIO = tema.media;
  LIMA = tema.destaque; LINHA = tema.linha; ZEBRA = tema.zebra; GRUPO = tema.grupo;
  const coresGrafico = { forte: '#' + tema.media, suave: '#' + tema.suave };
  const modelo = montarModelo(projeto, resultado, ctx);
  const c = modelo.capa;
  const dims = (img: { largura: number; altura: number }, maxW: number, maxH: number) => {
    const e = Math.min(maxW / img.largura, maxH / img.altura);
    return { width: Math.round(img.largura * e), height: Math.round(img.altura * e) };
  };

  // ================= CAPA =================
  const topoCapa: Paragraph[] = tema.logoCapaNoBranco
    ? [tema.logoCapa
        ? new Paragraph({ spacing: { after: 300 }, children: [new ImageRun({ type: 'png', data: tema.logoCapa.bytes, transformation: dims(tema.logoCapa, 300, 90) })] })
        : new Paragraph({ spacing: { after: 300 }, children: [t(tema.nome, { b: true, size: 44, color: VERDE })] })]
    : [];
  const capa: (Paragraph | Table)[] = [
    ...topoCapa,
    new Table({
      width: { size: LARG_TW, type: WidthType.DXA },
      columnWidths: [LARG_TW],
      layout: TableLayoutType.FIXED,
      borders: { top: SEM, bottom: SEM, left: SEM, right: SEM, insideHorizontal: SEM, insideVertical: SEM },
      rows: [new TableRow({
        children: [new TableCell({
          width: { size: LARG_TW, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: PRIMARIA },
          borders: { top: SEM, left: SEM, right: SEM, bottom: { style: BorderStyle.SINGLE, size: 36, color: LIMA } },
          margins: { top: tema.logoCapaNoBranco ? 500 : 700, bottom: 600, left: 500, right: 500 },
          children: [
            ...(!tema.logoCapaNoBranco && tema.logoCapa ? [new Paragraph({ spacing: { after: 500 }, children: [new ImageRun({ type: 'png', data: tema.logoCapa.bytes, transformation: dims(tema.logoCapa, 300, 80) })] })] : []),
            new Paragraph({ children: [t('RELATÓRIO TÉCNICO DE', { b: true, size: 22, color: SOBRE })] }),
            new Paragraph({ children: [t('INVENTÁRIO FLORESTAL', { b: true, size: 40, color: SOBRE })] }),
            new Paragraph({ spacing: { before: 120 }, children: [t(c.finalidade, { size: 20, color: tema.proprio ? SOBRE : LIMA })] }),
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
        children: b.colunas.map((col, i) => celula(col.titulo, { largura: larguras[i], alinhar: col.alinhar ?? 'left', b: true, cor: SOBRE, fundo: PRIMARIA, size: tam, bordaInf: SEM })),
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
        const img = desenharGrafico({ ...b.grafico, cores: coresGrafico });
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
  const logoCab = tema.logoCabecalho ? dims(tema.logoCabecalho, 170, tema.proprio ? 30 : 20) : null;
  const cabecalho = new Header({
    children: [
      new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINHA, space: 4 } },
        children: [
          tema.logoCabecalho && logoCab
            ? new ImageRun({ type: 'png', data: tema.logoCabecalho.bytes, transformation: logoCab })
            : new TextRun({ text: tema.nome, bold: true, size: 20, color: VERDE, font: FONTE }),
          new TextRun({ text: '\tRelatório Técnico de Inventário Florestal', size: 17, color: CINZA, font: FONTE }),
        ],
      }),
    ],
  });
  const linha2 = [tema.contato, tema.proprio ? 'Gerado pelo sistema AMBISAFE' : ''].filter(Boolean).join('  ·  ');
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
      ...(linha2 ? [new Paragraph({ children: [new TextRun({ text: linha2, size: 14, color: '969CA3', font: FONTE })] })] : []),
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
