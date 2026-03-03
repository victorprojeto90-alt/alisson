import * as XLSX from 'xlsx';
import type { ResultadoInventario } from './calculations';
import { fmt } from './calculations';

export function exportarExcel(
  nomeArquivo: string,
  resultado: ResultadoInventario
) {
  const wb = XLSX.utils.book_new();

  // ---- Aba 1: Dados Gerais ----
  const dadosGeraisRows = [
    ['DADOS GERAIS DO INVENTÁRIO FLORESTAL'],
    [],
    ['Parâmetro', 'Valor'],
    ['Número de Parcelas', resultado.dados_gerais.n_parcelas],
    ['Área Amostrada (ha)', resultado.dados_gerais.area_amostrada_ha.toFixed(4)],
    ['Número de Indivíduos', resultado.dados_gerais.n_individuos],
    ['Número de Espécies', resultado.dados_gerais.n_especies],
    ['Número de Famílias', resultado.dados_gerais.n_familias],
    ['Volume Total Amostrado (m³)', resultado.dados_gerais.volume_total_m3.toFixed(4)],
    ['Área Basal Total (m²)', resultado.dados_gerais.area_basal_total_m2.toFixed(4)],
    ['Parcelas Possíveis na Área (N)', resultado.dados_gerais.n_parcelas_possiveis],
    ['Média (m³/parcela)', resultado.dados_gerais.media_vol_parcela.toFixed(4)],
    ['Média (m³/ha)', resultado.dados_gerais.media_vol_ha.toFixed(4)],
    ['Variância Amostral', resultado.dados_gerais.variancia_amostral.toFixed(6)],
    ['Desvio Padrão', resultado.dados_gerais.desvio_padrao.toFixed(4)],
    ['Fator de Correção (FC)', resultado.dados_gerais.fator_correcao.toFixed(4)],
    ['Variância da Média', resultado.dados_gerais.variancia_media.toFixed(6)],
    ['Erro Padrão da Média', resultado.dados_gerais.erro_padrao.toFixed(4)],
    ['Coeficiente de Variação (%)', resultado.dados_gerais.coeficiente_variacao_pct.toFixed(2)],
    ['t-Student', resultado.dados_gerais.t_student.toFixed(3)],
    ['Erro Amostral Absoluto (m³)', resultado.dados_gerais.erro_abs.toFixed(4)],
    ['Erro Amostral Relativo (%)', resultado.dados_gerais.erro_rel_pct.toFixed(2)],
    ['IC Inferior - Por Parcela (m³/parcela)', resultado.dados_gerais.ic_inferior_parcela.toFixed(4)],
    ['IC Superior - Por Parcela (m³/parcela)', resultado.dados_gerais.ic_superior_parcela.toFixed(4)],
    ['IC Inferior - Por Hectare (m³/ha)', resultado.dados_gerais.ic_inferior_ha.toFixed(4)],
    ['IC Superior - Por Hectare (m³/ha)', resultado.dados_gerais.ic_superior_ha.toFixed(4)],
    ['IC Inferior - População (m³)', resultado.dados_gerais.ic_inferior_pop.toFixed(2)],
    ['IC Superior - População (m³)', resultado.dados_gerais.ic_superior_pop.toFixed(2)],
    ['Volume Estimado para a Área Total (m³)', resultado.dados_gerais.volume_estimado_total.toFixed(2)],
    ['Score AMBISAFE', resultado.score.total + '/100'],
  ];
  const wsGeral = XLSX.utils.aoa_to_sheet(dadosGeraisRows);
  XLSX.utils.book_append_sheet(wb, wsGeral, 'Dados Gerais');

  // ---- Aba 2: Fitossociologia ----
  const fitoRows = [
    ['ANÁLISE FITOSSOCIOLÓGICA - ESPÉCIES'],
    [],
    [
      'Nº', 'Nome Comum', 'Nome Científico', 'Família',
      'NI', 'DA (ind/ha)', 'DR (%)',
      'DoA (m²/ha)', 'DoR (%)',
      'FA (%)', 'FR (%)',
      'VI', 'VI (%)',
      'Volume (m³)', 'Vol/ha (m³/ha)',
    ],
    ...resultado.especies.map((e, i) => [
      i + 1,
      e.nome_comum,
      e.nome_cientifico || '',
      e.familia || '',
      e.n_individuos,
      e.da.toFixed(2),
      e.dr.toFixed(2),
      e.doa.toFixed(4),
      e.dor.toFixed(2),
      e.fa.toFixed(2),
      e.fr.toFixed(2),
      e.vi.toFixed(2),
      e.vi_pct.toFixed(2),
      e.volume_m3.toFixed(4),
      e.vol_ha.toFixed(4),
    ]),
  ];
  const wsFito = XLSX.utils.aoa_to_sheet(fitoRows);
  XLSX.utils.book_append_sheet(wb, wsFito, 'Fitossociologia');

  // ---- Aba 3: Famílias ----
  const famRows = [
    ['ANÁLISE POR FAMÍLIA BOTÂNICA'],
    [],
    ['Nº', 'Família', 'Nº Espécies', 'Nº Indivíduos', '% Indivíduos', 'VI Médio (%)'],
    ...resultado.familias.map((f, i) => [
      i + 1,
      f.familia,
      f.n_especies,
      f.n_individuos,
      f.pct_individuos.toFixed(2),
      f.vi_medio.toFixed(2),
    ]),
  ];
  const wsFam = XLSX.utils.aoa_to_sheet(famRows);
  XLSX.utils.book_append_sheet(wb, wsFam, 'Famílias');

  // ---- Aba 4: Parcelas ----
  const parcelaRows = [
    ['RESULTADOS POR PARCELA'],
    [],
    ['Parcela', 'Área (m²)', 'NI', 'AB (m²)', 'Volume (m³)', 'Volume (m³/ha)', 'AB (m²/ha)', 'Densidade (ind/ha)'],
    ...resultado.parcelas.map(p => [
      p.numero,
      p.area_m2,
      p.n_individuos,
      p.area_basal_m2.toFixed(4),
      p.volume_m3.toFixed(4),
      p.volume_ha.toFixed(4),
      p.area_basal_ha.toFixed(4),
      p.densidade_ha.toFixed(2),
    ]),
  ];
  const wsParcela = XLSX.utils.aoa_to_sheet(parcelaRows);
  XLSX.utils.book_append_sheet(wb, wsParcela, 'Parcelas');

  // ---- Aba 5: Estrutura Diamétrica ----
  const diamRows = [
    ['ESTRUTURA DIAMÉTRICA (DISTRIBUIÇÃO POR CLASSES DE DAP)'],
    [],
    ['Classe DAP (cm)', 'Nº Indivíduos', '% Indivíduos', 'Área Basal (m²)'],
    ...resultado.classes_diametricas.map(c => [
      c.classe,
      c.n_individuos,
      c.pct.toFixed(2),
      c.area_basal_m2.toFixed(4),
    ]),
  ];
  const wsDiam = XLSX.utils.aoa_to_sheet(diamRows);
  XLSX.utils.book_append_sheet(wb, wsDiam, 'Est. Diamétrica');

  // ---- Aba 6: Índices Diversidade ----
  const divRows = [
    ['ÍNDICES DE DIVERSIDADE FLORÍSTICA'],
    [],
    ['Índice', 'Valor', 'Interpretação'],
    ["Shannon-Weaver H'", resultado.indices_diversidade.shannon_h.toFixed(4), resultado.indices_diversidade.shannon_h >= 3.5 ? 'Muito Alta' : resultado.indices_diversidade.shannon_h >= 2.5 ? 'Alta' : 'Moderada/Baixa'],
    ['Dominância de Simpson C', resultado.indices_diversidade.simpson_c.toFixed(4), resultado.indices_diversidade.simpson_c >= 0.9 ? 'Alta Diversidade' : 'Moderada/Baixa'],
    ['Equabilidade de Pielou J', resultado.indices_diversidade.pielou_j.toFixed(4), resultado.indices_diversidade.pielou_j >= 0.8 ? 'Alta' : resultado.indices_diversidade.pielou_j >= 0.6 ? 'Moderada' : 'Baixa'],
    [],
    ['Nº total de indivíduos', resultado.indices_diversidade.n_individuos],
    ['Nº total de espécies', resultado.indices_diversidade.n_especies],
  ];
  const wsDiv = XLSX.utils.aoa_to_sheet(divRows);
  XLSX.utils.book_append_sheet(wb, wsDiv, 'Índices Diversidade');

  // ---- Aba 7: Dados Brutos ----
  const arvoresCalc = resultado.arvores_calculadas;
  const brutasRows = [
    ['DADOS BRUTOS - ÁRVORES CALCULADAS'],
    [],
    ['Parcela', 'Nº Árvore', 'Nome Comum', 'Nome Científico', 'Família', 'Nº Fuste',
      'CAP (cm)', 'DAP (cm)', 'HT (m)', 'AB (m²)', 'Vol. Cil. (m³)', 'Vol. FF (m³)'],
    ...arvoresCalc.map(a => [
      a.parcela_numero,
      a.numero_arvore ?? '',
      a.nome_comum,
      a.nome_cientifico ?? '',
      a.familia ?? '',
      a.numero_fuste,
      fmt.num(a.cap_cm ?? 0, 2),
      fmt.num(a.dap_cm, 2),
      fmt.num(a.altura_total_m ?? 0, 2),
      fmt.num(a.area_basal_m2, 6),
      fmt.num(a.volume_cilindrico_m3, 6),
      fmt.num(a.volume_ff_m3, 6),
    ]),
  ];
  const wsBrutas = XLSX.utils.aoa_to_sheet(brutasRows);
  XLSX.utils.book_append_sheet(wb, wsBrutas, 'Dados Brutos');

  XLSX.writeFile(wb, `${nomeArquivo}.xlsx`);
}
