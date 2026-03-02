import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, ShadingType,
  TableOfContents, PageBreak,
} from 'docx';
import type { ResultadoInventario } from './calculations';
import { gerarRelatorioCompleto, type ProjetoParaRelatorio } from './reportText';
import { saveAs } from './fileSaver';

function headingPara(text: string, level: typeof HeadingLevel.HEADING_1 = HeadingLevel.HEADING_1): Paragraph {
  return new Paragraph({ text, heading: level, spacing: { before: 400, after: 200 } });
}

function bodyPara(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 24, font: 'Times New Roman' })],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 120, after: 120, line: 360 },
  });
}

function simpleTable(headers: string[], rows: string[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: headers.map(h =>
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: h, bold: true, size: 20, color: 'FFFFFF', font: 'Arial' })],
              alignment: AlignmentType.CENTER,
            })],
            shading: { type: ShadingType.SOLID, color: '0B3D2E', fill: '0B3D2E' },
          })
        ),
      }),
      ...rows.map((row, ri) =>
        new TableRow({
          children: row.map(cell =>
            new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: cell, size: 20, font: 'Arial' })],
              })],
              shading: ri % 2 === 1
                ? { type: ShadingType.SOLID, color: 'F3F4F6', fill: 'F3F4F6' }
                : undefined,
            })
          ),
        })
      ),
    ],
  });
}

export async function exportarWord(
  nomeArquivo: string,
  projeto: ProjetoParaRelatorio & { nome: string },
  resultado: ResultadoInventario
) {
  const secoes = gerarRelatorioCompleto(projeto, resultado);
  const dg = resultado.dados_gerais;

  const children: (Paragraph | Table | TableOfContents)[] = [
    // Capa
    new Paragraph({
      children: [new TextRun({ text: 'AMBISAFE Geotecnologias', bold: true, size: 48, font: 'Arial', color: '0B3D2E' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 2000 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Relatório Técnico de Inventário Florestal', size: 32, font: 'Arial', color: '16A34A' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
    }),
    new Paragraph({ children: [new TextRun({ text: '' })] }),
    new Paragraph({
      children: [new TextRun({ text: projeto.nome, bold: true, size: 28, font: 'Times New Roman' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: `${projeto.municipio ?? ''}${projeto.estado ? '/' + projeto.estado : ''}`,
        size: 22, font: 'Times New Roman',
      })],
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' }), size: 22, font: 'Times New Roman' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
    }),
    new Paragraph({ children: [new PageBreak()], pageBreakBefore: true }),

    // Texto do relatório
    ...secoes.flatMap(secao => [
      headingPara(secao.titulo, HeadingLevel.HEADING_1),
      ...secao.conteudo.split('\n\n').map(p => bodyPara(p)),
    ]),

    new Paragraph({ children: [new PageBreak()], pageBreakBefore: true }),

    // Tabela de Dados Gerais
    headingPara('TABELA 1 — Dados Gerais do Inventário Florestal', HeadingLevel.HEADING_2),
    simpleTable(
      ['Parâmetro', 'Valor'],
      [
        ['Número de Parcelas', String(dg.n_parcelas)],
        ['Área Amostrada (ha)', dg.area_amostrada_ha.toFixed(4)],
        ['Número de Indivíduos', String(dg.n_individuos)],
        ['Número de Espécies', String(dg.n_especies)],
        ['Número de Famílias', String(dg.n_familias)],
        ['Volume Total Amostrado (m³)', dg.volume_total_m3.toFixed(4)],
        ['Média (m³/ha)', dg.media_vol_ha.toFixed(4)],
        ['Desvio Padrão', dg.desvio_padrao.toFixed(4)],
        ['Coeficiente de Variação (%)', dg.coeficiente_variacao_pct.toFixed(2)],
        ['Erro Amostral Relativo (%)', dg.erro_rel_pct.toFixed(2)],
        ['IC Inferior (m³/ha)', dg.ic_inferior_ha.toFixed(4)],
        ['IC Superior (m³/ha)', dg.ic_superior_ha.toFixed(4)],
        ['Volume Estimado Total (m³)', dg.volume_estimado_total.toFixed(2)],
        ['Score AMBISAFE', `${resultado.score.total}/100 — ${resultado.score.nivel}`],
      ]
    ),

    new Paragraph({ children: [new PageBreak()], pageBreakBefore: true }),

    // Fitossociologia
    headingPara('TABELA 2 — Análise Fitossociológica das Espécies (ordenado por VI%)', HeadingLevel.HEADING_2),
    simpleTable(
      ['Espécie', 'NI', 'DA', 'DR%', 'DoA', 'DoR%', 'FA%', 'FR%', 'VI%'],
      resultado.especies.slice(0, 30).map(e => [
        e.nome_cientifico || e.nome_comum,
        String(e.n_individuos),
        e.da.toFixed(2),
        e.dr.toFixed(2),
        e.doa.toFixed(4),
        e.dor.toFixed(2),
        e.fa.toFixed(2),
        e.fr.toFixed(2),
        e.vi_pct.toFixed(2),
      ])
    ),

    new Paragraph({ children: [new PageBreak()], pageBreakBefore: true }),

    // Índices diversidade
    headingPara('TABELA 3 — Índices de Diversidade Florística', HeadingLevel.HEADING_2),
    simpleTable(
      ['Índice', 'Valor', 'Interpretação'],
      [
        ["Shannon-Weaver H'", resultado.indices_diversidade.shannon_h.toFixed(4),
          resultado.indices_diversidade.shannon_h >= 3.5 ? 'Muito Alta' : resultado.indices_diversidade.shannon_h >= 2.5 ? 'Alta' : 'Moderada'],
        ['Dominância de Simpson C', resultado.indices_diversidade.simpson_c.toFixed(4),
          resultado.indices_diversidade.simpson_c >= 0.9 ? 'Alta Diversidade' : 'Moderada'],
        ['Equabilidade de Pielou J', resultado.indices_diversidade.pielou_j.toFixed(4),
          resultado.indices_diversidade.pielou_j >= 0.8 ? 'Alta' : 'Moderada'],
      ]
    ),
  ];

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Times New Roman', size: 24 },
        },
      },
    },
    sections: [{ children }],
  });

  const buffer = await Packer.toBuffer(doc);
  saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
    `${nomeArquivo}.docx`);
}
