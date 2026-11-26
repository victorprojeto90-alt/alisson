import type { Worksheet, Workbook, Fill, Borders } from 'exceljs';
import type { ResultadoInventario } from './calculations';
import type { ProjetoParaRelatorio } from './reportText';
import { BIOMAS, FINALIDADES, AMOSTRAGEM, type ContextoEmissao } from './relatorio/modelo';
import { saveAs } from './fileSaver';

const VERDE = 'FF00420D';
const VERDE_MEDIO = 'FF0B5A1E';
const LIMA = 'FFACD115';
const ZEBRA = 'FFF4F8F3';
const GRUPO = 'FFE2ECDF';
const LINHA = 'FFD6DED3';
const CINZA = 'FF6B7280';

const fill = (argb: string): Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const bordaInf: Partial<Borders> = { bottom: { style: 'thin', color: { argb: LINHA } } };

type Fmt = string | undefined;
interface Col { titulo: string; largura: number; fmt?: Fmt; italico?: boolean }

function cabecalhoAba(ws: Worksheet, titulo: string, subtitulo: string, nCols: number) {
  ws.mergeCells(1, 1, 1, nCols);
  const c1 = ws.getCell(1, 1);
  c1.value = titulo;
  c1.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
  c1.fill = fill(VERDE);
  c1.alignment = { vertical: 'middle', indent: 1 };
  ws.getRow(1).height = 30;
  ws.mergeCells(2, 1, 2, nCols);
  const c2 = ws.getCell(2, 1);
  c2.value = subtitulo;
  c2.font = { name: 'Calibri', size: 10, color: { argb: 'FF374151' } };
  c2.fill = fill(GRUPO);
  c2.alignment = { vertical: 'middle', indent: 1 };
  ws.getRow(2).height = 20;
  for (let i = 1; i <= nCols; i++) ws.getCell(3, i).border = { top: { style: 'medium', color: { argb: LIMA } } };
}

function tabela(ws: Worksheet, titulo: string, subtitulo: string, cols: Col[], linhas: (string | number | null)[][], total?: (string | number | null)[]) {
  cabecalhoAba(ws, titulo, subtitulo, cols.length);
  const linhaCab = 4;
  ws.columns = cols.map(c => ({ width: c.largura }));
  const hr = ws.getRow(linhaCab);
  cols.forEach((c, i) => {
    const cell = hr.getCell(i + 1);
    cell.value = c.titulo;
    cell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = fill(VERDE_MEDIO);
    cell.alignment = { vertical: 'middle', horizontal: i === 0 ? 'left' : 'center', wrapText: true };
  });
  hr.height = 30;
  linhas.forEach((ln, r) => {
    const row = ws.getRow(linhaCab + 1 + r);
    ln.forEach((v, i) => {
      const cell = row.getCell(i + 1);
      cell.value = v as never;
      cell.font = { name: 'Calibri', size: 10.5, italic: cols[i].italico };
      if (cols[i].fmt) cell.numFmt = cols[i].fmt!;
      if (typeof v === 'number') cell.alignment = { horizontal: 'right' };
      cell.border = bordaInf;
      if (r % 2 === 1) cell.fill = fill(ZEBRA);
    });
  });
  if (total) {
    const row = ws.getRow(linhaCab + 1 + linhas.length);
    total.forEach((v, i) => {
      const cell = row.getCell(i + 1);
      cell.value = v as never;
      cell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: VERDE } };
      cell.fill = fill(GRUPO);
      if (cols[i].fmt && typeof v === 'number') cell.numFmt = cols[i].fmt!;
      if (typeof v === 'number') cell.alignment = { horizontal: 'right' };
      cell.border = { top: { style: 'thin', color: { argb: VERDE } } };
    });
  }
  ws.views = [{ state: 'frozen', ySplit: linhaCab, xSplit: 1 }];
  if (linhas.length > 0) ws.autoFilter = { from: { row: linhaCab, column: 1 }, to: { row: linhaCab + linhas.length, column: cols.length } };
  ws.pageSetup = { orientation: cols.length > 8 ? 'landscape' : 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9, printTitlesRow: `${linhaCab}:${linhaCab}` };
}

const N2 = '#,##0.00';
const N4 = '#,##0.0000';
const N6 = '#,##0.000000';
const N0 = '#,##0';

export async function exportarExcel(
  nomeArquivo: string,
  resultado: ResultadoInventario,
  projeto?: ProjetoParaRelatorio & { nome: string },
  ctx: ContextoEmissao = {}
) {
  const ExcelJS = (await import('exceljs')).default;
  const wb: Workbook = new ExcelJS.Workbook();
  wb.creator = 'AMBISAFE';
  wb.created = new Date();
  const r = resultado;
  const dg = r.dados_gerais;
  const nome = projeto?.nome ?? nomeArquivo.replace(/_/g, ' ');
  const local = projeto?.municipio ? `${projeto.municipio}${projeto.estado ? '/' + projeto.estado.toUpperCase() : ''}` : '';
  const sub = [nome, local, projeto?.bioma ? `Bioma ${BIOMAS[projeto.bioma] || projeto.bioma}` : ''].filter(Boolean).join('  ·  ');

  // ---------- Resumo ----------
  const ws = wb.addWorksheet('Resumo', { properties: { tabColor: { argb: VERDE } } });
  ws.columns = [{ width: 38 }, { width: 34 }, { width: 4 }, { width: 30 }, { width: 22 }];
  cabecalhoAba(ws, 'AMBISAFE — Inventário Florestal', `Emitido em ${new Date().toLocaleDateString('pt-BR')}`, 5);
  const ident: [string, string | number][] = [
    ['Projeto', nome],
    ['Localização', local || 'Não informada'],
    ['Bioma', projeto?.bioma ? BIOMAS[projeto.bioma] || projeto.bioma : 'Não informado'],
    ['Área total (ha)', projeto?.area_total_ha ?? 0],
    ['Finalidade', projeto ? FINALIDADES[projeto.motivo_inventario] || projeto.motivo_inventario : ''],
    ['Tipo de amostragem', projeto ? AMOSTRAGEM[projeto.tipo_inventario] || projeto.tipo_inventario : ''],
    ['Tamanho da parcela (m²)', projeto?.tamanho_parcela_m2 ?? 0],
    ['Nível de confiança (%)', projeto?.nivel_confianca ?? 0],
    ['Precisão requerida (%)', projeto?.precisao_requerida ?? 0],
    ['Fator de forma', projeto?.fator_forma ?? 0],
    ['Responsável técnico', ctx.responsavel || ''],
    ['Empresa', ctx.empresa || ''],
  ];
  const sec = (row: number, texto: string, c1: number, c2: number) => {
    ws.mergeCells(row, c1, row, c2);
    const c = ws.getCell(row, c1);
    c.value = texto;
    c.font = { name: 'Calibri', size: 11, bold: true, color: { argb: VERDE } };
    c.border = { bottom: { style: 'medium', color: { argb: VERDE_MEDIO } } };
  };
  sec(4, 'IDENTIFICAÇÃO', 1, 2);
  ident.forEach(([k, v], i) => {
    const row = ws.getRow(5 + i);
    row.getCell(1).value = k;
    row.getCell(1).font = { name: 'Calibri', size: 10.5, color: { argb: CINZA } };
    const c = row.getCell(2);
    c.value = v;
    c.font = { name: 'Calibri', size: 10.5, bold: true };
    if (typeof v === 'number') { c.numFmt = k.includes('Fator') ? '0.00' : N2; c.alignment = { horizontal: 'left' }; }
    [1, 2].forEach(ci => { row.getCell(ci).border = bordaInf; if (i % 2 === 0) row.getCell(ci).fill = fill(ZEBRA); });
  });
  sec(4, 'RESULTADOS PRINCIPAIS', 4, 5);
  const kpis: [string, number, string][] = [
    ['Volume total estimado (m³)', dg.volume_estimado_total, N2],
    ['Volume médio (m³/ha)', dg.media_vol_ha, N2],
    ['Erro amostral (%)', dg.erro_rel_pct, N2],
    ['Indivíduos amostrados', dg.n_individuos, N0],
    ['Espécies', dg.n_especies, N0],
    ['Famílias', dg.n_familias, N0],
    ['Parcelas', dg.n_parcelas, N0],
    ['Área amostrada (ha)', dg.area_amostrada_ha, N4],
    ["Shannon (H')", r.indices_diversidade.shannon_h, N4],
    ['Score AMBISAFE (0–100)', r.score.total, N0],
  ];
  kpis.forEach(([k, v, f], i) => {
    const row = ws.getRow(5 + i);
    row.getCell(4).value = k;
    row.getCell(4).font = { name: 'Calibri', size: 10.5, color: { argb: CINZA } };
    const c = row.getCell(5);
    c.value = v;
    c.numFmt = f;
    c.font = { name: 'Calibri', size: 12, bold: true, color: { argb: VERDE } };
    [4, 5].forEach(ci => { row.getCell(ci).border = bordaInf; if (i % 2 === 0) row.getCell(ci).fill = fill(ZEBRA); });
  });
  ws.getRow(5 + ident.length + 1).getCell(1).value = 'Abas: Parâmetros · Fitossociologia · Famílias · Parcelas · Est. diamétrica · Est. vertical · Diversidade · Dados de campo';
  ws.getRow(5 + ident.length + 1).getCell(1).font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: CINZA } };
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 1, paperSize: 9 };

  // ---------- Parâmetros ----------
  const wsP = wb.addWorksheet('Parâmetros');
  const conf = projeto?.nivel_confianca ?? 95;
  const params: [string, number | null, Fmt][] = [
    ['AMOSTRAGEM', null, undefined],
    ['Número de parcelas (n)', dg.n_parcelas, N0],
    ['Parcelas possíveis na área (N)', dg.n_parcelas_possiveis, N0],
    ['Área amostrada (ha)', dg.area_amostrada_ha, N4],
    ['Número de indivíduos', dg.n_individuos, N0],
    ['Número de espécies', dg.n_especies, N0],
    ['Número de famílias', dg.n_familias, N0],
    ['Área basal total amostrada (m²)', dg.area_basal_total_m2, N4],
    ['Volume total amostrado (m³)', dg.volume_total_m3, N4],
    ['ESTATÍSTICA DA AMOSTRAGEM', null, undefined],
    ['Média (m³/parcela)', dg.media_vol_parcela, N4],
    ['Média (m³/ha)', dg.media_vol_ha, N4],
    ['Variância amostral', dg.variancia_amostral, N6],
    ['Desvio padrão', dg.desvio_padrao, N4],
    ['Coeficiente de variação (%)', dg.coeficiente_variacao_pct, N2],
    ['Fator de correção (FC)', dg.fator_correcao, N4],
    ['Variância da média', dg.variancia_media, N6],
    ['Erro padrão da média', dg.erro_padrao, N4],
    [`t de Student (${conf}%)`, dg.t_student, '0.000'],
    ['Erro amostral absoluto (m³/parcela)', dg.erro_abs, N4],
    ['Erro amostral relativo (%)', dg.erro_rel_pct, N2],
    [`INTERVALOS DE CONFIANÇA (${conf}%)`, null, undefined],
    ['IC por parcela — limite inferior (m³/parcela)', dg.ic_inferior_parcela, N4],
    ['IC por parcela — limite superior (m³/parcela)', dg.ic_superior_parcela, N4],
    ['IC por hectare — limite inferior (m³/ha)', dg.ic_inferior_ha, N4],
    ['IC por hectare — limite superior (m³/ha)', dg.ic_superior_ha, N4],
    ['IC da população — limite inferior (m³)', dg.ic_inferior_pop, N2],
    ['IC da população — limite superior (m³)', dg.ic_superior_pop, N2],
    ['Volume estimado para a área total (m³)', dg.volume_estimado_total, N2],
  ];
  cabecalhoAba(wsP, 'Parâmetros gerais e estatísticos', sub, 2);
  wsP.columns = [{ width: 50 }, { width: 22 }];
  const hP = wsP.getRow(4);
  ['Parâmetro', 'Valor'].forEach((txt, i) => {
    const c = hP.getCell(i + 1);
    c.value = txt;
    c.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = fill(VERDE_MEDIO);
    c.alignment = { horizontal: i ? 'right' : 'left', vertical: 'middle' };
  });
  hP.height = 24;
  let z = 0;
  params.forEach(([k, v, f], i) => {
    const row = wsP.getRow(5 + i);
    if (v === null) {
      wsP.mergeCells(5 + i, 1, 5 + i, 2);
      const c = row.getCell(1);
      c.value = k;
      c.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: VERDE } };
      c.fill = fill(GRUPO);
      z = 0;
      return;
    }
    row.getCell(1).value = k;
    row.getCell(2).value = v;
    row.getCell(2).numFmt = f!;
    const dest = k.startsWith('Erro amostral relativo') || k.startsWith('Volume estimado');
    [1, 2].forEach(ci => {
      const c = row.getCell(ci);
      c.font = { name: 'Calibri', size: 10.5, bold: dest, color: dest ? { argb: VERDE } : undefined };
      c.border = bordaInf;
      if (z % 2 === 1) c.fill = fill(ZEBRA);
    });
    z++;
  });
  wsP.views = [{ state: 'frozen', ySplit: 4 }];
  wsP.pageSetup = { fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 };

  // ---------- Fitossociologia ----------
  const somaE = r.especies.reduce((s, e) => ({ ni: s.ni + e.n_individuos, da: s.da + e.da, doa: s.doa + e.doa, fa: s.fa + e.fa, vol: s.vol + e.volume_m3, volha: s.volha + e.vol_ha }), { ni: 0, da: 0, doa: 0, fa: 0, vol: 0, volha: 0 });
  tabela(wb.addWorksheet('Fitossociologia'), 'Análise fitossociológica por espécie (ordem decrescente de VI%)', sub, [
    { titulo: 'Nº', largura: 6, fmt: N0 }, { titulo: 'Nome comum', largura: 20 }, { titulo: 'Nome científico', largura: 30, italico: true },
    { titulo: 'Família', largura: 18 }, { titulo: 'NI', largura: 8, fmt: N0 }, { titulo: 'DA (ind/ha)', largura: 12, fmt: N2 },
    { titulo: 'DR (%)', largura: 10, fmt: N2 }, { titulo: 'DoA (m²/ha)', largura: 12, fmt: N4 }, { titulo: 'DoR (%)', largura: 10, fmt: N2 },
    { titulo: 'FA (%)', largura: 10, fmt: N2 }, { titulo: 'FR (%)', largura: 10, fmt: N2 }, { titulo: 'VI (0–300)', largura: 11, fmt: N2 },
    { titulo: 'VI%', largura: 9, fmt: N2 }, { titulo: 'Volume (m³)', largura: 12, fmt: N4 }, { titulo: 'Volume (m³/ha)', largura: 13, fmt: N4 },
  ], r.especies.map((e, i) => [i + 1, e.nome_comum, e.nome_cientifico || '', e.familia || '', e.n_individuos, e.da, e.dr, e.doa, e.dor, e.fa, e.fr, e.vi, e.vi_pct, e.volume_m3, e.vol_ha]),
  ['Total', '', '', '', somaE.ni, somaE.da, 100, somaE.doa, 100, somaE.fa, 100, 300, 100, somaE.vol, somaE.volha]);

  // ---------- Famílias ----------
  tabela(wb.addWorksheet('Famílias'), 'Distribuição por família botânica', sub, [
    { titulo: 'Nº', largura: 6, fmt: N0 }, { titulo: 'Família', largura: 26 }, { titulo: 'Espécies', largura: 11, fmt: N0 },
    { titulo: 'Indivíduos', largura: 12, fmt: N0 }, { titulo: '% indivíduos', largura: 13, fmt: N2 }, { titulo: 'VI% médio', largura: 12, fmt: N2 },
  ], r.familias.map((f, i) => [i + 1, f.familia, f.n_especies, f.n_individuos, f.pct_individuos, f.vi_medio]),
  ['Total', '', dg.n_especies, dg.n_individuos, 100, null]);

  // ---------- Parcelas ----------
  const n = Math.max(r.parcelas.length, 1);
  const med = (k: keyof (typeof r.parcelas)[number]) => r.parcelas.reduce((s, p) => s + (p[k] as number), 0) / n;
  tabela(wb.addWorksheet('Parcelas'), 'Resultados por parcela', sub, [
    { titulo: 'Parcela', largura: 10, fmt: N0 }, { titulo: 'Área (m²)', largura: 11, fmt: N0 }, { titulo: 'NI', largura: 8, fmt: N0 },
    { titulo: 'AB (m²)', largura: 12, fmt: N4 }, { titulo: 'Volume (m³)', largura: 13, fmt: N4 }, { titulo: 'Volume (m³/ha)', largura: 14, fmt: N4 },
    { titulo: 'AB (m²/ha)', largura: 12, fmt: N4 }, { titulo: 'Densidade (ind/ha)', largura: 16, fmt: N2 },
  ], r.parcelas.map(p => [p.numero, p.area_m2, p.n_individuos, p.area_basal_m2, p.volume_m3, p.volume_ha, p.area_basal_ha, p.densidade_ha]),
  ['Média', med('area_m2'), med('n_individuos'), med('area_basal_m2'), med('volume_m3'), med('volume_ha'), med('area_basal_ha'), med('densidade_ha')]);

  // ---------- Estrutura diamétrica ----------
  tabela(wb.addWorksheet('Est. diamétrica'), 'Distribuição por classe de diâmetro (DAP)', sub, [
    { titulo: 'Classe de DAP (cm)', largura: 20 }, { titulo: 'Indivíduos', largura: 12, fmt: N0 },
    { titulo: '% indivíduos', largura: 13, fmt: N2 }, { titulo: 'Área basal (m²)', largura: 15, fmt: N4 },
  ], r.classes_diametricas.map(c => [c.classe, c.n_individuos, c.pct, c.area_basal_m2]),
  ['Total', r.classes_diametricas.reduce((s, c) => s + c.n_individuos, 0), 100, r.classes_diametricas.reduce((s, c) => s + c.area_basal_m2, 0)]);

  // ---------- Estrutura vertical ----------
  tabela(wb.addWorksheet('Est. vertical'), 'Estratificação vertical', sub, [
    { titulo: 'Estrato', largura: 12 }, { titulo: 'Critério de altura', largura: 26 }, { titulo: 'Altura mín. (m)', largura: 14, fmt: N2 },
    { titulo: 'Altura máx. (m)', largura: 14, fmt: N2 }, { titulo: 'Indivíduos', largura: 12, fmt: N0 }, { titulo: '% indivíduos', largura: 13, fmt: N2 },
    { titulo: 'Área basal (m²)', largura: 15, fmt: N4 },
  ], (r.estrutura_vertical ?? []).map(e => [e.estrato, e.descricao, e.altura_min, e.altura_max, e.n_individuos, e.pct, e.area_basal_m2]),
  ['Total', '', null, null, (r.estrutura_vertical ?? []).reduce((s, e) => s + e.n_individuos, 0), 100, (r.estrutura_vertical ?? []).reduce((s, e) => s + e.area_basal_m2, 0)]);

  // ---------- Diversidade ----------
  const id = r.indices_diversidade;
  tabela(wb.addWorksheet('Diversidade'), 'Índices de diversidade florística', sub, [
    { titulo: 'Índice', largura: 32 }, { titulo: 'Valor', largura: 14, fmt: N4 }, { titulo: 'Interpretação', largura: 24 },
  ], [
    ["Shannon-Weaver (H')", id.shannon_h, id.shannon_h >= 3.5 ? 'Muito alta' : id.shannon_h >= 2.5 ? 'Alta' : id.shannon_h >= 1.5 ? 'Moderada' : 'Baixa'],
    ['Simpson (C)', id.simpson_c, id.simpson_c >= 0.9 ? 'Alta diversidade' : id.simpson_c >= 0.7 ? 'Moderada' : 'Baixa'],
    ['Equabilidade de Pielou (J)', id.pielou_j, id.pielou_j >= 0.8 ? 'Alta uniformidade' : id.pielou_j >= 0.6 ? 'Moderada' : 'Baixa'],
    ['Número de espécies', id.n_especies, '—'],
    ['Número de indivíduos', id.n_individuos, '—'],
  ]);

  // ---------- Dados de campo ----------
  tabela(wb.addWorksheet('Dados de campo'), 'Dados de campo e cálculos por fuste', sub, [
    { titulo: 'Parcela', largura: 9, fmt: N0 }, { titulo: 'Árvore', largura: 9, fmt: N0 }, { titulo: 'Fuste', largura: 8, fmt: N0 },
    { titulo: 'Nome comum', largura: 20 }, { titulo: 'Nome científico', largura: 28, italico: true }, { titulo: 'Família', largura: 18 },
    { titulo: 'CAP (cm)', largura: 10, fmt: N2 }, { titulo: 'DAP (cm)', largura: 10, fmt: N2 }, { titulo: 'HT (m)', largura: 9, fmt: N2 },
    { titulo: 'AB (m²)', largura: 12, fmt: N6 }, { titulo: 'Vol. cilíndrico (m³)', largura: 16, fmt: N6 }, { titulo: 'Vol. com ff (m³)', largura: 15, fmt: N6 },
  ], r.arvores_calculadas.map(a => [a.parcela_numero, a.numero_arvore ?? null, a.numero_fuste, a.nome_comum, a.nome_cientifico ?? '', a.familia ?? '', a.cap_cm ?? null, a.dap_cm, a.altura_total_m ?? null, a.area_basal_m2, a.volume_cilindrico_m3, a.volume_ff_m3]),
  ['Total', null, null, '', '', '', null, null, null, r.arvores_calculadas.reduce((s, a) => s + a.area_basal_m2, 0), r.arvores_calculadas.reduce((s, a) => s + a.volume_cilindrico_m3, 0), r.arvores_calculadas.reduce((s, a) => s + a.volume_ff_m3, 0)]);

  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${nomeArquivo}.xlsx`);
}
