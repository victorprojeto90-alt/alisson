// ============================================================
// AMBISAFE — Geração Automática de Texto para Relatórios
// ============================================================

import type { ResultadoInventario } from './calculations';

export type MotivoInventario =
  | 'licenciamento'
  | 'manejo'
  | 'supressao'
  | 'academico';

export type TipoInventario =
  | 'casual_simples'
  | 'sistematico'
  | 'estratificado'
  | 'censo';

export interface ProjetoParaRelatorio {
  nome: string;
  municipio?: string;
  estado?: string;
  bioma?: string;
  area_total_ha: number;
  tipo_inventario: TipoInventario;
  motivo_inventario: MotivoInventario;
  tamanho_parcela_m2: number;
  fator_forma: number;
  nivel_confianca: number;
  precisao_requerida: number;
}

const TIPO_INVENTARIO_LABEL: Record<TipoInventario, string> = {
  casual_simples: 'Amostragem Casual Simples',
  sistematico: 'Amostragem Sistemática',
  estratificado: 'Amostragem Estratificada',
  censo: 'Inventário 100% (Censo Florestal)',
};

const BIOMA_LABEL: Record<string, string> = {
  amazonia: 'Amazônia',
  cerrado: 'Cerrado',
  mata_atlantica: 'Mata Atlântica',
  caatinga: 'Caatinga',
  pampa: 'Pampa',
  pantanal: 'Pantanal',
};

function formatNum(v: number, dec = 2): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

// ---- 1. Metodologia ----
export function gerarTextoMetodologia(projeto: ProjetoParaRelatorio, resultado: ResultadoInventario): string {
  const tipo = TIPO_INVENTARIO_LABEL[projeto.tipo_inventario] || projeto.tipo_inventario;
  const bioma = BIOMA_LABEL[projeto.bioma || ''] || projeto.bioma || '';
  const { dados_gerais } = resultado;

  const descTipo = (() => {
    switch (projeto.tipo_inventario) {
      case 'casual_simples':
        return 'As parcelas foram alocadas aleatoriamente na área de estudo, garantindo representatividade estatística sem estratificação prévia do ambiente';
      case 'sistematico':
        return 'As parcelas foram distribuídas sistematicamente em grid regular sobre a área, proporcionando cobertura uniforme e maior controle espacial da amostragem';
      case 'estratificado':
        return 'A área foi dividida em estratos homogêneos com base em características fisionômicas e estruturais da vegetação, sendo as parcelas alocadas proporcionalmente em cada estrato';
      case 'censo':
        return 'Foram mensurados todos os indivíduos arbóreos presentes na área de estudo, caracterizando um levantamento censitário completo da vegetação';
    }
  })();

  const areaParcelaHa = projeto.tamanho_parcela_m2 / 10000;
  const pctAmostrado = dados_gerais.area_amostrada_ha > 0
    ? (dados_gerais.area_amostrada_ha / projeto.area_total_ha) * 100
    : 0;

  return `O inventário florestal foi realizado por meio de ${tipo}, com parcelas de ${formatNum(projeto.tamanho_parcela_m2, 0)} m² (${formatNum(areaParcelaHa, 4)} ha) cada. ${descTipo}. Foram implantadas ${dados_gerais.n_parcelas} parcelas, totalizando ${formatNum(dados_gerais.area_amostrada_ha, 4)} ha de área amostrada, o que corresponde a ${formatNum(pctAmostrado, 2)}% da área total de ${formatNum(projeto.area_total_ha, 2)} ha${bioma ? `, inserida no Bioma ${bioma}` : ''}.

O critério de inclusão adotado foi o Diâmetro à Altura do Peito (DAP) ≥ 5 cm, determinado a partir da Circunferência à Altura do Peito (CAP), por meio da fórmula DAP = CAP/π. O volume individual foi estimado pelo método do cilindro, com aplicação de Fator de Forma (ff = ${formatNum(projeto.fator_forma, 2)}), conforme: V = (π × DAP²/40.000) × HT × ff.

Os parâmetros estatísticos foram calculados com nível de confiança de ${projeto.nivel_confianca}% (t-Student com ${dados_gerais.n_parcelas - 1} graus de liberdade = ${formatNum(dados_gerais.t_student, 3)}) e precisão requerida de ${projeto.precisao_requerida}%.`;
}

// ---- 2. Resultados Gerais ----
export function gerarTextoResultadosGerais(resultado: ResultadoInventario): string {
  const { dados_gerais } = resultado;
  const espMaisImportante = resultado.especies[0];
  const espMaisAbundante = [...resultado.especies].sort((a, b) => b.n_individuos - a.n_individuos)[0];

  const qualidadeErro = dados_gerais.erro_rel_pct <= 10
    ? 'dentro do limite aceitável (≤ 10%)'
    : dados_gerais.erro_rel_pct <= 15
      ? 'próximo ao limite aceitável'
      : 'superior ao limite recomendado de 10%, indicando maior variabilidade entre parcelas';

  return `Foram amostrados ${dados_gerais.n_individuos} indivíduos arbóreos em ${dados_gerais.n_parcelas} parcelas, totalizando ${formatNum(dados_gerais.area_amostrada_ha, 4)} ha de área amostral. Registrou-se a ocorrência de ${dados_gerais.n_especies} espécies distribuídas em ${dados_gerais.n_familias} famílias botânicas.

O volume médio estimado por hectare foi de ${formatNum(dados_gerais.media_vol_ha, 4)} m³/ha, com desvio padrão de ${formatNum(dados_gerais.desvio_padrao, 4)} m³/ha e coeficiente de variação de ${formatNum(dados_gerais.coeficiente_variacao_pct, 2)}%. O erro amostral obtido foi de ${formatNum(dados_gerais.erro_rel_pct, 2)}%, ${qualidadeErro}. O intervalo de confiança (IC ${95}%) para a estimativa volumétrica por hectare situa-se entre ${formatNum(dados_gerais.ic_inferior_ha, 4)} e ${formatNum(dados_gerais.ic_superior_ha, 4)} m³/ha.

O volume total estimado para a área de estudo é de ${formatNum(dados_gerais.volume_estimado_total, 2)} m³, com IC variando entre ${formatNum(dados_gerais.ic_inferior_pop, 2)} e ${formatNum(dados_gerais.ic_superior_pop, 2)} m³.${espMaisImportante ? `

A espécie com maior Valor de Importância (VI) foi ${espMaisImportante.nome_cientifico || espMaisImportante.nome_comum} (VI% = ${formatNum(espMaisImportante.vi_pct, 2)}%), enquanto a espécie mais abundante foi ${espMaisAbundante.nome_cientifico || espMaisAbundante.nome_comum} com ${espMaisAbundante.n_individuos} indivíduos (${formatNum(espMaisAbundante.dr, 2)}% da densidade total).` : ''}`;
}

// ---- 3. Estrutura Horizontal ----
export function gerarTextoEstruturaHorizontal(resultado: ResultadoInventario): string {
  const top5 = resultado.especies.slice(0, 5);
  const { dados_gerais } = resultado;

  if (top5.length === 0) return 'Não há dados suficientes para análise da estrutura horizontal.';

  const espDominante = [...resultado.especies].sort((a, b) => b.doa - a.doa)[0];
  const pctTop3 = top5.slice(0, 3).reduce((s, e) => s + e.vi_pct, 0);

  const listTop5 = top5.map((e, i) =>
    `${i + 1}ª) ${e.nome_cientifico || e.nome_comum} (VI% = ${formatNum(e.vi_pct, 2)}%; DA = ${formatNum(e.da, 2)} ind/ha)`
  ).join('; ');

  return `A análise fitossociológica da estrutura horizontal evidenciou que a área apresenta ${dados_gerais.n_especies} espécies com distribuição de importância variada. As cinco espécies com maior Valor de Importância (VI%) foram: ${listTop5}.

As três espécies ecologicamente mais importantes concentraram ${formatNum(pctTop3, 2)}% do Valor de Importância total da área, o que ${pctTop3 > 60 ? 'indica certa dominância de poucas espécies, o que pode refletir estágios sucessionais intermediários ou perturbações históricas' : 'indica boa distribuição ecológica entre as espécies amostradas, característica de florestas em estágio avançado de sucessão ecológica'}.

${espDominante ? `Em termos de dominância, destaca-se a espécie ${espDominante.nome_cientifico || espDominante.nome_comum} com Dominância Absoluta de ${formatNum(espDominante.doa, 4)} m²/ha e Dominância Relativa de ${formatNum(espDominante.dor, 2)}%.` : ''}`;
}

// ---- 4. Estrutura Diamétrica ----
export function gerarTextoEstruturaDiametrica(resultado: ResultadoInventario): string {
  const { classes_diametricas, dados_gerais } = resultado;
  if (classes_diametricas.length === 0) return 'Não há dados suficientes para análise da estrutura diamétrica.';

  const classeMaior = classes_diametricas.reduce((max, c) => c.n_individuos > max.n_individuos ? c : max);
  const nonEmpty = classes_diametricas.filter(c => c.n_individuos > 0);
  const isJInverse = nonEmpty.length > 2 && nonEmpty.slice(0, -1).every((c, i) => c.n_individuos >= nonEmpty[i + 1].n_individuos);

  const interpretacao = isJInverse
    ? 'A estrutura diamétrica apresentou distribuição em "J" invertido, com maior concentração de indivíduos nas classes de menor diâmetro e decréscimo progressivo nas classes superiores. Esse padrão é característico de florestas nativas em processo de regeneração natural contínua, com boa capacidade de reposição de indivíduos e manutenção da estrutura ao longo do tempo.'
    : 'A distribuição diamétrica não apresentou o padrão clássico em "J" invertido, indicando possível influência de perturbações antrópicas ou naturais, estágio inicial de sucessão ecológica ou dominância de poucas espécies com alta plasticidade de crescimento.';

  return `A análise da distribuição diamétrica foi realizada por classes de diâmetro com amplitude de 5 cm, abrangendo desde a menor classe de inclusão (DAP ≥ 5 cm) até os maiores diâmetros registrados. A classe diamétrica de maior frequência foi ${classeMaior.classe}, com ${classeMaior.n_individuos} indivíduos (${formatNum(classeMaior.pct, 2)}% do total).

Foram identificadas ${nonEmpty.length} classes diamétricas com ocorrência de indivíduos, totalizando ${dados_gerais.n_individuos} indivíduos mensurados.

${interpretacao}`;
}

// ---- 5. Índices de Diversidade ----
export function gerarTextoIndicesDiversidade(resultado: ResultadoInventario): string {
  const { indices_diversidade } = resultado;
  const { shannon_h, simpson_c, pielou_j } = indices_diversidade;

  const interpShannon = shannon_h >= 3.5
    ? 'muito alta, típica de florestas tropicais bem conservadas'
    : shannon_h >= 2.5
      ? 'alta, indicando boa riqueza florística'
      : shannon_h >= 1.5
        ? 'moderada'
        : 'baixa, podendo indicar perturbações ou estágios sucessionais iniciais';

  const interpPielou = pielou_j >= 0.8
    ? 'alta (J ≥ 0,8), demonstrando que as espécies possuem distribuição abundante relativamente equitativa'
    : pielou_j >= 0.6
      ? 'moderada, com algum grau de dominância entre espécies'
      : 'baixa, indicando dominância expressiva de poucas espécies';

  return `Os índices de diversidade florística foram calculados considerando as ${indices_diversidade.n_especies} espécies e ${indices_diversidade.n_individuos} indivíduos amostrados.

O Índice de Diversidade de Shannon-Weaver (H') obtido foi de ${formatNum(shannon_h, 4)} nats/ind., correspondendo a uma diversidade ${interpShannon}. A Equabilidade de Pielou (J) foi de ${formatNum(pielou_j, 4)}, considerada ${interpPielou}. O Índice de Dominância de Simpson (C) apresentou valor de ${formatNum(simpson_c, 4)}, onde valores próximos a 1,0 indicam maior diversidade e menor dominância de espécies.

Esses resultados ${shannon_h >= 2.5 && pielou_j >= 0.6 ? 'apontam para uma comunidade florestal com boa representatividade de espécies e estrutura diversificada, favorável à manutenção dos processos ecológicos e dos serviços ambientais da área' : 'indicam a necessidade de atenção quanto à composição florística e à estrutura da comunidade, recomendando-se medidas de conservação e monitoramento contínuo'}.`;
}

// ---- 6. Conclusão Técnica (por motivo) ----
export function gerarTextoConclusao(
  projeto: ProjetoParaRelatorio,
  resultado: ResultadoInventario
): string {
  const { dados_gerais, score } = resultado;
  const motivo = projeto.motivo_inventario;

  const baseConc = `O inventário florestal realizado na área "${projeto.nome}"${projeto.municipio ? `, município de ${projeto.municipio}${projeto.estado ? '/' + projeto.estado.toUpperCase() : ''}` : ''}, abrangendo ${formatNum(projeto.area_total_ha, 2)} ha, resultou no registro de ${dados_gerais.n_individuos} indivíduos, pertencentes a ${dados_gerais.n_especies} espécies de ${dados_gerais.n_familias} famílias botânicas. O volume total estimado para a área foi de ${formatNum(dados_gerais.volume_estimado_total, 2)} m³, com erro amostral de ${formatNum(dados_gerais.erro_rel_pct, 2)}%.

O Score AMBISAFE obtido foi de ${score.total}/100 (${score.nivel}), refletindo a qualidade técnica e a sustentabilidade ecológica do inventário.`;

  const motivoConc: Record<MotivoInventario, string> = {
    licenciamento: `
Com base nos resultados obtidos, o inventário florestal atende aos requisitos técnicos estabelecidos para fins de licenciamento ambiental, fornecendo os subsídios necessários para a elaboração dos documentos de supressão vegetal e compensação ambiental, em conformidade com a legislação federal (Lei 12.651/2012 — Código Florestal) e normas estaduais aplicáveis. Os dados volumétricos, fitossociológicos e estatísticos apresentados são suficientes para instruir o processo de licenciamento junto ao órgão ambiental competente.`,
    manejo: `
Os resultados obtidos fornecem os subsídios técnicos necessários para a elaboração do Plano de Manejo Florestal Sustentável (PMFS), em atendimento aos critérios estabelecidos na legislação florestal vigente. ${score.total >= 70 ? 'A estrutura florestal identificada apresenta condições favoráveis à prática do manejo sustentável, com manutenção da capacidade produtiva e da diversidade biológica.' : 'Recomenda-se cautela na intensidade de exploração, priorizando técnicas de manejo de impacto reduzido (MIR) para preservar a estrutura e a diversidade da floresta.'} A definição do ciclo de corte e da intensidade de exploração deve considerar o volume estimado, a distribuição diamétrica e os índices de diversidade apresentados.`,
    supressao: `
Os dados obtidos no inventário florestal fornecem as informações técnicas necessárias para a caracterização da vegetação a ser suprimida, incluindo volume total de madeira (${formatNum(dados_gerais.volume_estimado_total, 2)} m³), composição florística e estrutura da comunidade vegetal. Esses elementos são essenciais para a determinação das medidas compensatórias cabíveis, conforme estabelecido no art. 26 da Lei 12.651/2012 e resoluções do CONAMA aplicáveis. Ressalta-se a importância do resgate de germoplasma das espécies identificadas, especialmente aquelas com status de ameaça de extinção ou de ocorrência restrita.`,
    academico: `
O estudo desenvolvido contribui para o conhecimento da estrutura e composição florística da área amostrada, gerando informações relevantes sobre a diversidade de espécies, a estrutura diamétrica e volumétrica e os parâmetros fitossociológicos da comunidade florestal. Os resultados obtidos podem ser utilizados como referência para estudos comparativos, monitoramento da dinâmica florestal e avaliação de serviços ecossistêmicos. Recomenda-se a continuidade do monitoramento para acompanhar a evolução da estrutura da comunidade ao longo do tempo.`,
  };

  return baseConc + (motivoConc[motivo] || '');
}

// ---- Relatório Completo ----
export interface SecaoRelatorio {
  titulo: string;
  conteudo: string;
}

export function gerarRelatorioCompleto(
  projeto: ProjetoParaRelatorio,
  resultado: ResultadoInventario
): SecaoRelatorio[] {
  return [
    {
      titulo: '1. Metodologia',
      conteudo: gerarTextoMetodologia(projeto, resultado),
    },
    {
      titulo: '2. Resultados Gerais',
      conteudo: gerarTextoResultadosGerais(resultado),
    },
    {
      titulo: '3. Estrutura Horizontal',
      conteudo: gerarTextoEstruturaHorizontal(resultado),
    },
    {
      titulo: '4. Estrutura Diamétrica',
      conteudo: gerarTextoEstruturaDiametrica(resultado),
    },
    {
      titulo: '5. Índices de Diversidade Florística',
      conteudo: gerarTextoIndicesDiversidade(resultado),
    },
    {
      titulo: '6. Conclusão Técnica',
      conteudo: gerarTextoConclusao(projeto, resultado),
    },
  ];
}
