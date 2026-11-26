// ============================================================
// Modelo único do relatório técnico: o PDF e o Word desenham
// exatamente os mesmos blocos, na mesma ordem.
// ============================================================
import type { ResultadoInventario } from '../calculations';
import {
  gerarTextoIntroducao, gerarTextoObjetivo, gerarTextoMetodologia,
  gerarTextoResultadosGerais, gerarTextoEstruturaHorizontal, gerarTextoEstruturaDiametrica,
  gerarTextoEstruturaVertical, gerarTextoIndicesDiversidade, gerarTextoConclusao,
  type ProjetoParaRelatorio, type ChaveSecao, type TextosSalvos, textosValidos,
} from '../reportText';
import type { DadosGrafico } from './recursos';

export type Alinhamento = 'left' | 'center' | 'right';

export interface Coluna {
  titulo: string;
  largura: number; // fração da largura útil (as colunas somam 1)
  alinhar?: Alinhamento;
  italico?: boolean;
}

export type Linha =
  | { tipo: 'dados'; celulas: string[]; destaque?: boolean }
  | { tipo: 'grupo'; texto: string };

export type Bloco =
  | { tipo: 'titulo'; nivel: 1 | 2; texto: string; novaPagina?: boolean }
  | { tipo: 'paragrafo'; texto: string }
  | { tipo: 'tabela'; numero: number; titulo: string; colunas: Coluna[]; linhas: Linha[]; total?: string[]; nota?: string }
  | { tipo: 'figura'; numero: number; titulo: string; grafico: DadosGrafico }
  | { tipo: 'destaques'; itens: { rotulo: string; valor: string }[] }
  | { tipo: 'ficha'; itens: [string, string][] }
  | { tipo: 'referencias'; itens: string[] }
  | { tipo: 'assinatura'; local: string; nome: string; funcao: string; empresa: string };

export interface Capa {
  projeto: string;
  local: string;
  bioma: string;
  finalidade: string;
  area: string;
  dataInventario: string;
  responsavel: string;
  empresa: string;
  cidadeData: string;
  emissao: string;
}

export interface ModeloRelatorio {
  capa: Capa;
  blocos: Bloco[];
  rodape: string;
  ano: number;
}

export interface ContextoEmissao {
  empresa?: string | null;
  responsavel?: string | null;
  cidade?: string | null;
  uf?: string | null;
  dataInventario?: string | null;
  registro?: string | null;
  marca?: import('./tema').MarcaEmpresa | null;
  textos?: TextosSalvos | null;
}

// ---------- Formatação brasileira ----------
export const num = (v: number | null | undefined, dec = 2) =>
  (Number.isFinite(v as number) ? (v as number) : 0).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
export const int = (v: number) => Math.round(v).toLocaleString('pt-BR');
const pct = (v: number) => `${num(v, 2)}%`;

export const BIOMAS: Record<string, string> = {
  amazonia: 'Amazônia', cerrado: 'Cerrado', mata_atlantica: 'Mata Atlântica',
  caatinga: 'Caatinga', pampa: 'Pampa', pantanal: 'Pantanal',
};
export const FINALIDADES: Record<string, string> = {
  licenciamento: 'Licenciamento ambiental',
  manejo: 'Plano de manejo florestal',
  supressao: 'Supressão de vegetação',
  academico: 'Estudo acadêmico/científico',
};
export const AMOSTRAGEM: Record<string, string> = {
  casual_simples: 'Amostragem casual simples',
  censo: 'Inventário 100% (censo)',
};

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function dataPorExtenso(d: Date) {
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

function dataCurta(iso?: string | null) {
  if (!iso) return 'Não informada';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return a && m && d ? `${d}/${m}/${a}` : iso;
}

const REFERENCIAS = [
  'BRASIL. Lei nº 12.651, de 25 de maio de 2012. Dispõe sobre a proteção da vegetação nativa. Diário Oficial da União, Brasília, DF, 28 maio 2012.',
  'IBGE. Manual técnico da vegetação brasileira. 2. ed. Rio de Janeiro: IBGE, 2012.',
  'MÜLLER-DOMBOIS, D.; ELLENBERG, H. Aims and methods of vegetation ecology. New York: Wiley, 1974.',
  'PÉLLICO NETTO, S.; BRENA, D. A. Inventário florestal. Curitiba: Editorado pelos autores, 1997.',
  'PIELOU, E. C. The measurement of diversity in different types of biological collections. Journal of Theoretical Biology, v. 13, p. 131-144, 1966.',
  'SHANNON, C. E.; WEAVER, W. The mathematical theory of communication. Urbana: University of Illinois Press, 1949.',
  'SOARES, C. P. B.; PAULA NETO, F.; SOUZA, A. L. Dendrometria e inventário florestal. 2. ed. Viçosa: Editora UFV, 2011.',
];

function paragrafos(texto: string): Bloco[] {
  return texto.split('\n\n').map(t => t.trim()).filter(Boolean).map(t => ({ tipo: 'paragrafo', texto: t }) as Bloco);
}

export function montarModelo(
  projeto: ProjetoParaRelatorio & { nome: string },
  r: ResultadoInventario,
  ctx: ContextoEmissao = {}
): ModeloRelatorio {
  const hoje = new Date();
  const dg = r.dados_gerais;
  const local = projeto.municipio ? `${projeto.municipio}${projeto.estado ? '/' + projeto.estado.toUpperCase() : ''}` : 'Não informado';
  const bioma = BIOMAS[projeto.bioma || ''] || projeto.bioma || 'Não informado';
  const finalidade = FINALIDADES[projeto.motivo_inventario] || projeto.motivo_inventario;
  const responsavel = ctx.responsavel?.trim() || 'Responsável técnico';
  const empresa = ctx.empresa?.trim() || '';
  const cidadeEmissao = ctx.cidade ? `${ctx.cidade}${ctx.uf ? '/' + ctx.uf.toUpperCase() : ''}` : local;

  const capa: Capa = {
    projeto: projeto.nome,
    local,
    bioma,
    finalidade,
    area: `${num(projeto.area_total_ha, 2)} ha`,
    dataInventario: dataCurta(ctx.dataInventario),
    responsavel,
    empresa: empresa || '—',
    cidadeData: `${cidadeEmissao !== 'Não informado' ? cidadeEmissao + ' — ' : ''}${MESES[hoje.getMonth()]} de ${hoje.getFullYear()}`,
    emissao: hoje.toLocaleDateString('pt-BR'),
  };

  // Texto editado pelo usuário (ou pela IA) substitui o automático, se for do mesmo processamento
  const salvos = textosValidos(ctx.textos, r) ? ctx.textos!.secoes : {};
  const txt = (chave: ChaveSecao, automatico: string) => paragrafos(salvos[chave]?.texto?.trim() ? salvos[chave]!.texto : automatico);

  let nTab = 0;
  let nFig = 0;
  const tab = () => ++nTab;
  const fig = () => ++nFig;
  const B: Bloco[] = [];

  // ---------- Identificação e resumo ----------
  B.push({ tipo: 'titulo', nivel: 1, texto: 'IDENTIFICAÇÃO DO INVENTÁRIO', novaPagina: true });
  B.push({
    tipo: 'ficha',
    itens: [
      ['Projeto', projeto.nome],
      ['Localização', local],
      ['Bioma', bioma],
      ['Área total', `${num(projeto.area_total_ha, 2)} ha`],
      ['Finalidade', finalidade],
      ['Tipo de amostragem', AMOSTRAGEM[projeto.tipo_inventario] || projeto.tipo_inventario],
      ['Parcelas', `${dg.n_parcelas} parcelas de ${int(projeto.tamanho_parcela_m2)} m²`],
      ['Nível de confiança / precisão requerida', `${projeto.nivel_confianca}% / ${num(projeto.precisao_requerida, 0)}%`],
      ['Fator de forma', num(projeto.fator_forma, 2)],
      ['Data do inventário', capa.dataInventario],
      ['Responsável técnico', responsavel],
      ...(empresa ? [['Empresa', empresa] as [string, string]] : []),
    ],
  });
  B.push({ tipo: 'titulo', nivel: 2, texto: 'Resumo dos resultados' });
  B.push({
    tipo: 'destaques',
    itens: [
      { rotulo: 'Volume total estimado', valor: `${num(dg.volume_estimado_total, 2)} m³` },
      { rotulo: 'Volume médio por hectare', valor: `${num(dg.media_vol_ha, 2)} m³/ha` },
      { rotulo: 'Erro amostral', valor: pct(dg.erro_rel_pct) },
      { rotulo: 'Indivíduos amostrados', valor: int(dg.n_individuos) },
      { rotulo: 'Espécies / famílias', valor: `${dg.n_especies} / ${dg.n_familias}` },
      { rotulo: 'Score AMBISAFE', valor: `${r.score.total}/100 · ${r.score.nivel}` },
    ],
  });

  // ---------- Texto ----------
  B.push({ tipo: 'titulo', nivel: 1, texto: '1 INTRODUÇÃO', novaPagina: true });
  B.push(...txt('introducao', gerarTextoIntroducao(projeto)));
  B.push({ tipo: 'titulo', nivel: 1, texto: '2 OBJETIVO' });
  B.push(...txt('objetivo', gerarTextoObjetivo(projeto)));
  B.push({ tipo: 'titulo', nivel: 1, texto: '3 MATERIAL E MÉTODOS' });
  B.push(...txt('metodologia', gerarTextoMetodologia(projeto, r)));

  B.push({ tipo: 'titulo', nivel: 1, texto: '4 RESULTADOS E DISCUSSÃO' });
  B.push(...txt('resultados_intro', 'A seguir são apresentados os resultados obtidos no inventário florestal e a discussão técnica dos parâmetros calculados.'));

  // 4.1
  B.push({ tipo: 'titulo', nivel: 2, texto: '4.1 Parâmetros gerais e estatísticos' });
  B.push(...txt('resultados_gerais', gerarTextoResultadosGerais(projeto, r)));
  B.push({
    tipo: 'tabela', numero: tab(), titulo: 'Parâmetros gerais e estatísticos do inventário',
    colunas: [{ titulo: 'Parâmetro', largura: 0.62 }, { titulo: 'Valor', largura: 0.38, alinhar: 'right' }],
    linhas: [
      { tipo: 'grupo', texto: 'Amostragem' },
      { tipo: 'dados', celulas: ['Número de parcelas (n)', int(dg.n_parcelas)] },
      { tipo: 'dados', celulas: ['Parcelas possíveis na área (N)', int(dg.n_parcelas_possiveis)] },
      { tipo: 'dados', celulas: ['Área amostrada (ha)', num(dg.area_amostrada_ha, 4)] },
      { tipo: 'dados', celulas: ['Número de indivíduos', int(dg.n_individuos)] },
      { tipo: 'dados', celulas: ['Número de espécies', int(dg.n_especies)] },
      { tipo: 'dados', celulas: ['Número de famílias', int(dg.n_familias)] },
      { tipo: 'dados', celulas: ['Área basal total amostrada (m²)', num(dg.area_basal_total_m2, 4)] },
      { tipo: 'dados', celulas: ['Volume total amostrado (m³)', num(dg.volume_total_m3, 4)] },
      { tipo: 'grupo', texto: 'Estatística da amostragem' },
      { tipo: 'dados', celulas: ['Média (m³/parcela)', num(dg.media_vol_parcela, 4)] },
      { tipo: 'dados', celulas: ['Média (m³/ha)', num(dg.media_vol_ha, 4)] },
      { tipo: 'dados', celulas: ['Variância amostral', num(dg.variancia_amostral, 6)] },
      { tipo: 'dados', celulas: ['Desvio padrão', num(dg.desvio_padrao, 4)] },
      { tipo: 'dados', celulas: ['Coeficiente de variação (%)', num(dg.coeficiente_variacao_pct, 2)] },
      { tipo: 'dados', celulas: ['Fator de correção (FC)', num(dg.fator_correcao, 4)] },
      { tipo: 'dados', celulas: ['Variância da média', num(dg.variancia_media, 6)] },
      { tipo: 'dados', celulas: ['Erro padrão da média', num(dg.erro_padrao, 4)] },
      { tipo: 'dados', celulas: [`t de Student (${projeto.nivel_confianca}%; ${Math.max(dg.n_parcelas - 1, 0)} gl)`, num(dg.t_student, 3)] },
      { tipo: 'dados', celulas: ['Erro amostral absoluto (m³/parcela)', num(dg.erro_abs, 4)] },
      { tipo: 'dados', celulas: ['Erro amostral relativo (%)', num(dg.erro_rel_pct, 2)], destaque: true },
      { tipo: 'grupo', texto: `Intervalos de confiança (${projeto.nivel_confianca}%)` },
      { tipo: 'dados', celulas: ['Por parcela (m³/parcela)', `${num(dg.ic_inferior_parcela, 4)} ≤ μ ≤ ${num(dg.ic_superior_parcela, 4)}`] },
      { tipo: 'dados', celulas: ['Por hectare (m³/ha)', `${num(dg.ic_inferior_ha, 4)} ≤ μ ≤ ${num(dg.ic_superior_ha, 4)}`] },
      { tipo: 'dados', celulas: ['População (m³)', `${num(dg.ic_inferior_pop, 2)} ≤ X ≤ ${num(dg.ic_superior_pop, 2)}`] },
      { tipo: 'dados', celulas: ['Volume estimado para a área total (m³)', num(dg.volume_estimado_total, 2)], destaque: true },
    ],
  });

  // 4.2
  B.push({ tipo: 'titulo', nivel: 2, texto: '4.2 Análise fitossociológica' });
  B.push(...txt('horizontal', gerarTextoEstruturaHorizontal(r)));
  const topVI = r.especies.slice(0, 10);
  if (topVI.length > 0) {
    B.push({
      tipo: 'figura', numero: fig(), titulo: `Espécies com maior Valor de Importância (VI%)${r.especies.length > 10 ? ' — 10 primeiras' : ''}`,
      grafico: {
        tipo: 'barras',
        rotulos: topVI.map(e => e.nome_cientifico || e.nome_comum),
        valores: topVI.map(e => Number(e.vi_pct.toFixed(2))),
        eixo: 'Valor de Importância (%)',
        formato: v => `${num(v, 2)}%`,
      },
    });
  }
  const somaEsp = r.especies.reduce((s, e) => ({ ni: s.ni + e.n_individuos, da: s.da + e.da, doa: s.doa + e.doa, fa: s.fa + e.fa, vol: s.vol + e.vol_ha }), { ni: 0, da: 0, doa: 0, fa: 0, vol: 0 });
  B.push({
    tipo: 'tabela', numero: tab(), titulo: 'Parâmetros fitossociológicos das espécies, em ordem decrescente de VI%',
    colunas: [
      { titulo: 'Espécie', largura: 0.25, italico: true },
      { titulo: 'Família', largura: 0.145 },
      { titulo: 'NI', largura: 0.055, alinhar: 'right' },
      { titulo: 'DA', largura: 0.09, alinhar: 'right' },
      { titulo: 'DR%', largura: 0.07, alinhar: 'right' },
      { titulo: 'DoA', largura: 0.08, alinhar: 'right' },
      { titulo: 'DoR%', largura: 0.07, alinhar: 'right' },
      { titulo: 'FA%', largura: 0.08, alinhar: 'right' },
      { titulo: 'FR%', largura: 0.07, alinhar: 'right' },
      { titulo: 'VI%', largura: 0.07, alinhar: 'right' },
    ],
    linhas: r.especies.map(e => ({
      tipo: 'dados' as const,
      celulas: [e.nome_cientifico || e.nome_comum, e.familia || '—', int(e.n_individuos), num(e.da, 2), num(e.dr, 2), num(e.doa, 4), num(e.dor, 2), num(e.fa, 2), num(e.fr, 2), num(e.vi_pct, 2)],
    })),
    total: ['Total', '', int(somaEsp.ni), num(somaEsp.da, 2), '100,00', num(somaEsp.doa, 4), '100,00', num(somaEsp.fa, 2), '100,00', '100,00'],
    nota: 'NI = número de indivíduos; DA = densidade absoluta (ind/ha); DR = densidade relativa; DoA = dominância absoluta (m²/ha); DoR = dominância relativa; FA = frequência absoluta; FR = frequência relativa; VI = valor de importância.',
  });
  if (r.familias.length > 0) {
    B.push({
      tipo: 'tabela', numero: tab(), titulo: 'Distribuição dos indivíduos por família botânica',
      colunas: [
        { titulo: 'Família', largura: 0.4 },
        { titulo: 'Espécies', largura: 0.15, alinhar: 'right' },
        { titulo: 'Indivíduos', largura: 0.15, alinhar: 'right' },
        { titulo: '% indivíduos', largura: 0.15, alinhar: 'right' },
        { titulo: 'VI% médio', largura: 0.15, alinhar: 'right' },
      ],
      linhas: r.familias.map(f => ({ tipo: 'dados' as const, celulas: [f.familia, int(f.n_especies), int(f.n_individuos), num(f.pct_individuos, 2), num(f.vi_medio, 2)] })),
      total: ['Total', int(dg.n_especies), int(dg.n_individuos), '100,00', ''],
    });
  }

  // 4.3
  B.push({ tipo: 'titulo', nivel: 2, texto: '4.3 Estrutura diamétrica' });
  B.push(...txt('diametrica', gerarTextoEstruturaDiametrica(r)));
  const classes = r.classes_diametricas.filter(c => c.n_individuos > 0 || r.classes_diametricas.length <= 12);
  if (classes.length > 0) {
    B.push({
      tipo: 'figura', numero: fig(), titulo: 'Distribuição dos indivíduos por classe de diâmetro (DAP)',
      grafico: { tipo: 'colunas', rotulos: classes.map(c => c.classe.replace(/\s*cm$/i, '')), valores: classes.map(c => c.n_individuos), eixo: 'Classe de DAP (cm)', formato: v => int(v) },
    });
    B.push({
      tipo: 'tabela', numero: tab(), titulo: 'Distribuição diamétrica dos indivíduos',
      colunas: [
        { titulo: 'Classe de DAP (cm)', largura: 0.34 },
        { titulo: 'Indivíduos', largura: 0.22, alinhar: 'right' },
        { titulo: '% indivíduos', largura: 0.22, alinhar: 'right' },
        { titulo: 'Área basal (m²)', largura: 0.22, alinhar: 'right' },
      ],
      linhas: r.classes_diametricas.map(c => ({ tipo: 'dados' as const, celulas: [c.classe, int(c.n_individuos), num(c.pct, 2), num(c.area_basal_m2, 4)] })),
      total: ['Total', int(r.classes_diametricas.reduce((s, c) => s + c.n_individuos, 0)), '100,00', num(r.classes_diametricas.reduce((s, c) => s + c.area_basal_m2, 0), 4)],
    });
  }

  // 4.4
  B.push({ tipo: 'titulo', nivel: 2, texto: '4.4 Estrutura vertical' });
  B.push(...txt('vertical', gerarTextoEstruturaVertical(r)));
  if (r.estrutura_vertical?.length) {
    B.push({
      tipo: 'tabela', numero: tab(), titulo: 'Estratificação vertical da vegetação',
      colunas: [
        { titulo: 'Estrato', largura: 0.16 },
        { titulo: 'Critério de altura', largura: 0.3 },
        { titulo: 'Indivíduos', largura: 0.16, alinhar: 'right' },
        { titulo: '% indivíduos', largura: 0.18, alinhar: 'right' },
        { titulo: 'Área basal (m²)', largura: 0.2, alinhar: 'right' },
      ],
      linhas: r.estrutura_vertical.map(e => ({ tipo: 'dados' as const, celulas: [e.estrato, e.descricao, int(e.n_individuos), num(e.pct, 2), num(e.area_basal_m2, 4)] })),
      total: ['Total', '', int(r.estrutura_vertical.reduce((s, e) => s + e.n_individuos, 0)), '100,00', num(r.estrutura_vertical.reduce((s, e) => s + e.area_basal_m2, 0), 4)],
    });
  }

  // 4.5
  const id = r.indices_diversidade;
  B.push({ tipo: 'titulo', nivel: 2, texto: '4.5 Índices de diversidade' });
  B.push(...txt('diversidade', gerarTextoIndicesDiversidade(r)));
  B.push({
    tipo: 'tabela', numero: tab(), titulo: 'Índices de diversidade florística',
    colunas: [{ titulo: 'Índice', largura: 0.44 }, { titulo: 'Valor', largura: 0.2, alinhar: 'right' }, { titulo: 'Interpretação', largura: 0.36 }],
    linhas: [
      { tipo: 'dados', celulas: ["Shannon-Weaver (H')", num(id.shannon_h, 4), id.shannon_h >= 3.5 ? 'Muito alta' : id.shannon_h >= 2.5 ? 'Alta' : id.shannon_h >= 1.5 ? 'Moderada' : 'Baixa'] },
      { tipo: 'dados', celulas: ['Simpson (C)', num(id.simpson_c, 4), id.simpson_c >= 0.9 ? 'Alta diversidade' : id.simpson_c >= 0.7 ? 'Moderada' : 'Baixa'] },
      { tipo: 'dados', celulas: ['Equabilidade de Pielou (J)', num(id.pielou_j, 4), id.pielou_j >= 0.8 ? 'Alta uniformidade' : id.pielou_j >= 0.6 ? 'Moderada' : 'Baixa'] },
      { tipo: 'dados', celulas: ['Riqueza (número de espécies)', int(id.n_especies), '—'] },
    ],
  });

  // 4.6 Score
  const sc = r.score;
  B.push({ tipo: 'titulo', nivel: 2, texto: '4.6 Score AMBISAFE' });
  B.push({ tipo: 'paragrafo', texto: `O Score AMBISAFE sintetiza a qualidade técnica do inventário em uma nota de 0 a 100, ponderando a regularidade estatística, a diversidade florística, a sustentabilidade, a conformidade ambiental e a consistência dos dados. O inventário obteve ${sc.total} pontos, classificado como "${sc.nivel}".` });
  B.push({
    tipo: 'tabela', numero: tab(), titulo: 'Composição do Score AMBISAFE',
    colunas: [{ titulo: 'Critério', largura: 0.6 }, { titulo: 'Peso', largura: 0.18, alinhar: 'right' }, { titulo: 'Pontuação', largura: 0.22, alinhar: 'right' }],
    linhas: [
      { tipo: 'dados', celulas: ['Regularidade estatística', '30%', num(sc.regularidade, 0)] },
      { tipo: 'dados', celulas: ['Diversidade florística', '20%', num(sc.diversidade, 0)] },
      { tipo: 'dados', celulas: ['Sustentabilidade', '20%', num(sc.sustentabilidade, 0)] },
      { tipo: 'dados', celulas: ['Conformidade ambiental', '20%', num(sc.conformidade, 0)] },
      { tipo: 'dados', celulas: ['Consistência dos dados', '10%', num(sc.consistencia, 0)] },
    ],
    total: ['Score final', '100%', `${sc.total}/100`],
  });

  // 5
  B.push({ tipo: 'titulo', nivel: 1, texto: '5 CONCLUSÃO' });
  B.push(...txt('conclusao', gerarTextoConclusao(projeto, r)));

  B.push({
    tipo: 'assinatura',
    local: `${cidadeEmissao !== 'Não informado' ? cidadeEmissao + ', ' : ''}${dataPorExtenso(hoje)}.`,
    nome: responsavel,
    funcao: `Responsável técnico — ${ctx.registro?.trim() || 'CREA nº ____________'}`,
    empresa,
  });

  B.push({ tipo: 'titulo', nivel: 1, texto: 'REFERÊNCIAS', novaPagina: true });
  B.push({ tipo: 'referencias', itens: REFERENCIAS });

  // Anexo
  if (r.parcelas.length > 0) {
    const soma = r.parcelas.reduce((s, p) => ({ ni: s.ni + p.n_individuos, ab: s.ab + p.area_basal_m2, v: s.v + p.volume_m3 }), { ni: 0, ab: 0, v: 0 });
    const n = r.parcelas.length;
    B.push({ tipo: 'titulo', nivel: 1, texto: 'ANEXO A — RESULTADOS POR PARCELA', novaPagina: true });
    B.push({
      tipo: 'tabela', numero: tab(), titulo: 'Resultados por parcela amostral',
      colunas: [
        { titulo: 'Parcela', largura: 0.1, alinhar: 'center' },
        { titulo: 'Área (m²)', largura: 0.11, alinhar: 'right' },
        { titulo: 'NI', largura: 0.08, alinhar: 'right' },
        { titulo: 'AB (m²)', largura: 0.12, alinhar: 'right' },
        { titulo: 'Volume (m³)', largura: 0.13, alinhar: 'right' },
        { titulo: 'Volume (m³/ha)', largura: 0.15, alinhar: 'right' },
        { titulo: 'AB (m²/ha)', largura: 0.14, alinhar: 'right' },
        { titulo: 'Densidade (ind/ha)', largura: 0.17, alinhar: 'right' },
      ],
      linhas: r.parcelas.map(p => ({ tipo: 'dados' as const, celulas: [String(p.numero), int(p.area_m2), int(p.n_individuos), num(p.area_basal_m2, 4), num(p.volume_m3, 4), num(p.volume_ha, 4), num(p.area_basal_ha, 4), num(p.densidade_ha, 2)] })),
      total: [
        'Média', int(r.parcelas.reduce((s, p) => s + p.area_m2, 0) / n), num(soma.ni / n, 1), num(soma.ab / n, 4), num(soma.v / n, 4),
        num(r.parcelas.reduce((s, p) => s + p.volume_ha, 0) / n, 4), num(r.parcelas.reduce((s, p) => s + p.area_basal_ha, 0) / n, 4), num(r.parcelas.reduce((s, p) => s + p.densidade_ha, 0) / n, 2),
      ],
      nota: 'NI = número de indivíduos; AB = área basal.',
    });
  }

  return {
    capa,
    blocos: B,
    rodape: `${projeto.nome} · ${local}`,
    ano: hoje.getFullYear(),
  };
}
