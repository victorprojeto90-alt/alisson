import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { gerarRelatorioCompleto, type ProjetoParaRelatorio } from './reportText';
import type { ResultadoInventario } from './calculations';

// Cores de marca AMBISAFE
const COR_PRIMARIA: [number, number, number] = [0, 66, 13]; // #00420d
const COR_ACENTO: [number, number, number] = [172, 209, 21]; // #acd115

// Referências bibliográficas (ABNT NBR 6023:2018)
const REFERENCIAS = [
  'IBGE. Manual Técnico da Vegetação Brasileira. 2. ed. Rio de Janeiro: IBGE, 2012.',
  'MÜLLER-DOMBOIS, D.; ELLENBERG, H. Aims and methods of vegetation ecology. New York: Wiley, 1974.',
  'SHANNON, C. E.; WEAVER, W. The mathematical theory of communication. Urbana: University of Illinois Press, 1949.',
];

export function exportarPDF(
  nomeArquivo: string,
  projeto: ProjetoParaRelatorio & { nome: string },
  resultado: ResultadoInventario
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Margens ABNT NBR 14724 (mm)
  const marginL = 30;
  const marginR = 20;
  const marginTop = 30;
  const marginBottom = 20;
  const contentW = pageW - marginL - marginR;
  const maxY = pageH - marginBottom - 12; // limite antes do rodapé

  // Estilo de tabela ABNT: apenas linhas horizontais (sem bordas verticais)
  const tableLineStyle = {
    lineWidth: { top: 0, left: 0, right: 0, bottom: 0.1 } as const,
    lineColor: [210, 210, 210] as [number, number, number],
  };
  const headLineStyle = {
    lineWidth: { top: 0.3, left: 0, right: 0, bottom: 0.3 } as const,
    lineColor: COR_PRIMARIA,
  };

  const addPage = () => {
    doc.addPage();
  };

  // Legenda "Tabela N — Descrição" acima da tabela
  const legendaTabela = (numero: number, descricao: string, y: number): number => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text(`Tabela ${numero} — ${descricao}`, marginL, y);
    return y + 6;
  };

  // "Fonte: AMBISAFE (ano)" abaixo da tabela
  const fonteTabela = (y: number): number => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Fonte: AMBISAFE (${new Date().getFullYear()}).`, marginL, y);
    return y + 6;
  };

  // -- CAPA --
  doc.setFillColor(...COR_PRIMARIA);
  doc.rect(0, 0, pageW, 80, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('AMBISAFE Geotecnologias', marginL, 35);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório Técnico de Inventário Florestal', marginL, 46);
  doc.setTextColor(...COR_ACENTO);
  doc.setFontSize(10);
  doc.text('Plataforma Nacional Inteligente de Gestão Florestal e Ambiental', marginL, 55);

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(projeto.nome, marginL, 100);

  if (projeto.municipio) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`${projeto.municipio}${projeto.estado ? '/' + projeto.estado : ''}`, marginL, 110);
  }

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text([
    `Área Total: ${projeto.area_total_ha.toLocaleString('pt-BR')} ha`,
    `Bioma: ${projeto.bioma || 'Não informado'}`,
    `Emitido em: ${new Date().toLocaleDateString('pt-BR')}`,
    `Score AMBISAFE: ${resultado.score.total}/100 — ${resultado.score.nivel}`,
  ], marginL, 125);

  // -- DADOS GERAIS --
  addPage();
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COR_PRIMARIA);
  doc.text('Dados Gerais do Inventário Florestal', marginL, marginTop);

  const dg = resultado.dados_gerais;
  let y = legendaTabela(1, 'Dados Gerais do Inventário Florestal', marginTop + 10);
  autoTable(doc, {
    startY: y,
    margin: { left: marginL, right: marginR },
    head: [['Parâmetro', 'Valor']],
    body: [
      ['Número de Parcelas (n)', String(dg.n_parcelas)],
      ['Parcelas Possíveis na Área (N)', String(dg.n_parcelas_possiveis)],
      ['Área Amostrada (ha)', dg.area_amostrada_ha.toFixed(4)],
      ['Número de Indivíduos', String(dg.n_individuos)],
      ['Número de Espécies', String(dg.n_especies)],
      ['Número de Famílias', String(dg.n_familias)],
      ['Volume Total Amostrado (m³)', dg.volume_total_m3.toFixed(4)],
      ['Área Basal Total (m²)', dg.area_basal_total_m2.toFixed(4)],
      ['Média (m³/parcela)', dg.media_vol_parcela.toFixed(4)],
      ['Variância Amostral', dg.variancia_amostral.toFixed(6)],
      ['Desvio Padrão', dg.desvio_padrao.toFixed(4)],
      ['Fator de Correção (FC)', dg.fator_correcao.toFixed(4)],
      ['Variância da Média', dg.variancia_media.toFixed(6)],
      ['Erro Padrão da Média', dg.erro_padrao.toFixed(4)],
      ['Coeficiente de Variação (%)', `${dg.coeficiente_variacao_pct.toFixed(2)}%`],
      ['t-Student', dg.t_student.toFixed(3)],
      ['Erro Amostral Absoluto (m³)', dg.erro_abs.toFixed(4)],
      ['Erro Amostral Relativo (%)', `${dg.erro_rel_pct.toFixed(2)}%`],
      ['IC — por Parcela: LI ≤ Média ≤ LS (m³/parcela)', `${dg.ic_inferior_parcela.toFixed(4)} ≤ ${dg.media_vol_parcela.toFixed(4)} ≤ ${dg.ic_superior_parcela.toFixed(4)}`],
      ['IC — por Hectare: LI ≤ Média ≤ LS (m³/ha)', `${dg.ic_inferior_ha.toFixed(4)} ≤ ${dg.media_vol_ha.toFixed(4)} ≤ ${dg.ic_superior_ha.toFixed(4)}`],
      ['IC — da População: LI ≤ Total ≤ LS (m³)', `${dg.ic_inferior_pop.toFixed(2)} ≤ ${dg.volume_estimado_total.toFixed(2)} ≤ ${dg.ic_superior_pop.toFixed(2)}`],
      ['Volume Estimado para a Área Total (m³)', dg.volume_estimado_total.toFixed(2)],
    ],
    headStyles: { fillColor: COR_PRIMARIA, textColor: 255, fontStyle: 'bold', fontSize: 10, ...headLineStyle },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 9, cellPadding: 3, ...tableLineStyle },
    columnStyles: { 0: { cellWidth: contentW * 0.65 }, 1: { halign: 'right', fontStyle: 'bold' } },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fonteTabela((doc as any).lastAutoTable.finalY + 6);

  // -- FITOSSOCIOLOGIA --
  addPage();
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COR_PRIMARIA);
  doc.text('Análise Fitossociológica — Espécies (ordenado por VI%)', marginL, marginTop);

  y = legendaTabela(2, 'Análise Fitossociológica das Espécies', marginTop + 10);
  autoTable(doc, {
    startY: y,
    margin: { left: marginL, right: marginR },
    head: [['Espécie', 'NI', 'DA', 'DR%', 'DoA', 'DoR%', 'VI%']],
    body: resultado.especies.slice(0, 25).map(e => [
      e.nome_cientifico || e.nome_comum,
      String(e.n_individuos),
      e.da.toFixed(2),
      e.dr.toFixed(2),
      e.doa.toFixed(4),
      e.dor.toFixed(2),
      e.vi_pct.toFixed(2),
    ]),
    headStyles: { fillColor: COR_PRIMARIA, textColor: 255, fontStyle: 'bold', fontSize: 9, ...headLineStyle },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 8, cellPadding: 2, ...tableLineStyle },
    columnStyles: {
      0: { cellWidth: contentW * 0.30, fontStyle: 'italic' },
      1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' },
      4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right', fontStyle: 'bold' },
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fonteTabela((doc as any).lastAutoTable.finalY + 6);

  // -- ÍNDICES DE DIVERSIDADE --
  addPage();
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COR_PRIMARIA);
  doc.text('Índices de Diversidade Florística', marginL, marginTop);

  y = legendaTabela(3, 'Índices de Diversidade Florística', marginTop + 10);
  autoTable(doc, {
    startY: y,
    margin: { left: marginL, right: marginR },
    head: [['Índice', 'Valor', 'Interpretação']],
    body: [
      ["Shannon-Weaver (H')", resultado.indices_diversidade.shannon_h.toFixed(4),
        resultado.indices_diversidade.shannon_h >= 3.5 ? 'Muito Alta' : resultado.indices_diversidade.shannon_h >= 2.5 ? 'Alta' : 'Moderada'],
      ['Dominância de Simpson (C)', resultado.indices_diversidade.simpson_c.toFixed(4),
        resultado.indices_diversidade.simpson_c >= 0.9 ? 'Alta Diversidade' : 'Moderada'],
      ['Equabilidade de Pielou (J)', resultado.indices_diversidade.pielou_j.toFixed(4),
        resultado.indices_diversidade.pielou_j >= 0.8 ? 'Alta uniformidade' : 'Moderada'],
    ],
    headStyles: { fillColor: COR_PRIMARIA, textColor: 255, fontStyle: 'bold', fontSize: 10, ...headLineStyle },
    styles: { fontSize: 10, cellPadding: 4, ...tableLineStyle },
    columnStyles: { 1: { halign: 'center', fontStyle: 'bold' } },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fonteTabela((doc as any).lastAutoTable.finalY + 6);

  // -- TEXTO DO RELATÓRIO --
  addPage();
  const secoes = gerarRelatorioCompleto(projeto, resultado);

  y = marginTop;
  for (const secao of secoes) {
    if (y > maxY - 20) { addPage(); y = marginTop; }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COR_PRIMARIA);
    doc.text(secao.titulo, marginL, y);
    y += 8;

    doc.setFontSize(12);
    doc.setFont('times', 'normal');
    doc.setTextColor(50, 50, 50);

    const paragrafos = secao.conteudo.split('\n\n');
    for (const para of paragrafos) {
      const lines = doc.splitTextToSize(para, contentW);
      if (y + lines.length * 5.5 > maxY) { addPage(); y = marginTop; }
      doc.text(lines, marginL, y, { align: 'justify' });
      y += lines.length * 5.5 + 4;
    }
    y += 8;
  }

  // -- REFERÊNCIAS BIBLIOGRÁFICAS --
  addPage();
  y = marginTop;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COR_PRIMARIA);
  doc.text('REFERÊNCIAS', marginL, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont('times', 'normal');
  doc.setTextColor(50, 50, 50);
  for (const ref of REFERENCIAS) {
    const lines = doc.splitTextToSize(ref, contentW);
    if (y + lines.length * 5 > maxY) { addPage(); y = marginTop; }
    doc.text(lines, marginL, y);
    y += lines.length * 5 + 6;
  }

  // -- FOOTER on all pages --
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`AMBISAFE Geotecnologias — ${projeto.nome}`, marginL, pageH - 10);
    doc.text(`Página ${i} de ${totalPages}`, pageW - marginR, pageH - 10, { align: 'right' });
    doc.line(marginL, pageH - 14, pageW - marginR, pageH - 14);
  }

  doc.save(`${nomeArquivo}.pdf`);
}
