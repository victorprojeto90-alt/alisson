import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { gerarRelatorioCompleto, type ProjetoParaRelatorio } from './reportText';
import type { ResultadoInventario } from './calculations';

export function exportarPDF(
  nomeArquivo: string,
  projeto: ProjetoParaRelatorio & { nome: string },
  resultado: ResultadoInventario
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const marginL = 20;
  const marginR = 20;
  const contentW = pageW - marginL - marginR;

  // Helper: add page if needed
  const addPage = () => {
    doc.addPage();
  };

  // -- CAPA --
  doc.setFillColor(11, 61, 46); // #0B3D2E
  doc.rect(0, 0, pageW, 80, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('AMBISAFE Geotecnologias', marginL, 35);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório Técnico de Inventário Florestal', marginL, 46);
  doc.setTextColor(22, 163, 74); // #16A34A
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
  doc.setTextColor(11, 61, 46);
  doc.text('Dados Gerais do Inventário Florestal', marginL, 25);

  const dg = resultado.dados_gerais;
  autoTable(doc, {
    startY: 32,
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
    headStyles: { fillColor: [11, 61, 46], textColor: 255, fontStyle: 'bold', fontSize: 10 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { cellWidth: contentW * 0.65 }, 1: { halign: 'right', fontStyle: 'bold' } },
  });

  // -- FITOSSOCIOLOGIA --
  addPage();
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(11, 61, 46);
  doc.text('Análise Fitossociológica — Espécies (ordenado por VI%)', marginL, 25);

  autoTable(doc, {
    startY: 32,
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
    headStyles: { fillColor: [11, 61, 46], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: contentW * 0.30, fontStyle: 'italic' },
      1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' },
      4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right', fontStyle: 'bold' },
    },
  });

  // -- ÍNDICES DE DIVERSIDADE --
  addPage();
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(11, 61, 46);
  doc.text('Índices de Diversidade Florística', marginL, 25);

  autoTable(doc, {
    startY: 32,
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
    headStyles: { fillColor: [11, 61, 46], textColor: 255, fontStyle: 'bold', fontSize: 10 },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: { 1: { halign: 'center', fontStyle: 'bold' } },
  });

  // -- TEXTO DO RELATÓRIO --
  addPage();
  const secoes = gerarRelatorioCompleto(projeto, resultado);

  let y = 25;
  for (const secao of secoes) {
    // Check if we need a new page
    if (y > 240) { addPage(); y = 25; }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 61, 46);
    doc.text(secao.titulo, marginL, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);

    const paragrafos = secao.conteudo.split('\n\n');
    for (const para of paragrafos) {
      const lines = doc.splitTextToSize(para, contentW);
      if (y + lines.length * 5 > 270) { addPage(); y = 25; }
      doc.text(lines, marginL, y, { align: 'justify' });
      y += lines.length * 5 + 4;
    }
    y += 8;
  }

  // -- FOOTER on all pages --
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`AMBISAFE Geotecnologias — ${projeto.nome}`, marginL, 290);
    doc.text(`Página ${i} de ${totalPages}`, pageW - marginR, 290, { align: 'right' });
    doc.line(marginL, 286, pageW - marginR, 286);
  }

  doc.save(`${nomeArquivo}.pdf`);
}
