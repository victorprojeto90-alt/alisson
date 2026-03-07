// ============================================================
// AMBISAFE — Motor de Cálculos de Inventário Florestal
// ============================================================

export interface Arvore {
  id: string;
  parcela_numero: number;
  numero_arvore: number | null;
  nome_comum: string;
  nome_cientifico: string | null;
  familia: string | null;
  numero_fuste: number;
  cap_cm: number | null;
  altura_total_m: number | null;
  observacoes: string | null;
}

export interface Parcela {
  numero: number;
  area_m2: number;
  lat?: number | null;
  lng?: number | null;
}

export interface ProjetoConfig {
  area_total_ha: number;
  fator_forma: number;
  nivel_confianca: number; // 90, 95, 99
  tamanho_parcela_m2: number;
}

// ---- Cálculos por Indivíduo ----
export interface ArvoreCalculada extends Arvore {
  dap_cm: number;
  area_basal_m2: number;
  volume_cilindrico_m3: number;
  volume_ff_m3: number;
}

export function calcularArvore(arvore: Arvore, fator_forma: number): ArvoreCalculada | null {
  if (!arvore.cap_cm || !arvore.altura_total_m || arvore.cap_cm <= 0 || arvore.altura_total_m <= 0) {
    return null;
  }
  const dap_cm = arvore.cap_cm / Math.PI;
  const area_basal_m2 = (Math.PI * dap_cm * dap_cm) / 40000;
  const volume_cilindrico_m3 = area_basal_m2 * arvore.altura_total_m;
  const volume_ff_m3 = volume_cilindrico_m3 * fator_forma;

  return {
    ...arvore,
    dap_cm,
    area_basal_m2,
    volume_cilindrico_m3,
    volume_ff_m3,
  };
}

// ---- Resultados por Parcela ----
export interface ResultadoParcela {
  numero: number;
  area_m2: number;
  n_individuos: number;
  area_basal_m2: number;
  volume_m3: number;
  volume_ha: number;
  area_basal_ha: number;
  densidade_ha: number;
}

// ---- Fitossociologia por Espécie ----
export interface ResultadoEspecie {
  nome_comum: string;
  nome_cientifico: string;
  familia: string;
  n_individuos: number;
  n_parcelas: number;
  area_basal_m2: number;
  volume_m3: number;
  // Por hectare
  da: number;   // Densidade Absoluta (ind/ha)
  dr: number;   // Densidade Relativa (%)
  doa: number;  // Dominância Absoluta (m²/ha)
  dor: number;  // Dominância Relativa (%)
  fa: number;   // Frequência Absoluta (%)
  fr: number;   // Frequência Relativa (%)
  vi: number;   // Valor de Importância
  vi_pct: number; // VI%
  vol_ha: number; // Volume por hectare
}

// ---- Dados Gerais Estatísticos ----
export interface DadosGerais {
  n_parcelas: number;
  n_parcelas_possiveis: number;  // N = área_total / área_parcela
  area_amostrada_ha: number;
  n_individuos: number;
  n_especies: number;
  n_familias: number;
  volume_total_m3: number;
  area_basal_total_m2: number;
  // Estatísticas (xi = volume por parcela em m³)
  media_vol_parcela: number;     // Média em m³/parcela
  media_vol_ha: number;          // Média em m³/ha (derivada)
  variancia_amostral: number;    // Variância amostral (adimensional)
  desvio_padrao: number;         // Desvio padrão (adimensional)
  fator_correcao: number;        // FC = (N-n)/N
  variancia_media: number;
  erro_padrao: number;
  coeficiente_variacao_pct: number;
  t_student: number;
  erro_abs: number;              // Erro amostral absoluto (m³/parcela)
  erro_rel_pct: number;          // Erro amostral relativo (%)
  // IC por parcela (m³/parcela)
  ic_inferior_parcela: number;
  ic_superior_parcela: number;
  // IC por hectare (m³/ha)
  ic_inferior_ha: number;
  ic_superior_ha: number;
  // IC da população (m³)
  ic_inferior_pop: number;
  ic_superior_pop: number;
  volume_estimado_ha: number;
  volume_estimado_total: number;
}

// ---- Estrutura Diamétrica ----
export interface ClasseDiametrica {
  classe: string;
  min_cm: number;
  max_cm: number;
  n_individuos: number;
  pct: number;
  area_basal_m2: number;
}

// ---- Estrutura Vertical ----
export interface Estratificacao {
  estrato: 'Inferior' | 'Médio' | 'Superior';
  descricao: string;
  n_individuos: number;
  pct: number;
  altura_min: number;
  altura_max: number;
  area_basal_m2: number;
}

// ---- Índices de Diversidade ----
export interface IndicesDiversidade {
  shannon_h: number;     // Shannon-Weaver H'
  simpson_c: number;     // Dominância de Simpson C
  pielou_j: number;      // Equabilidade de Pielou J
  n_especies: number;
  n_individuos: number;
}

// ---- Score AMBISAFE ----
export interface ScoreAmbisafe {
  total: number;
  regularidade: number;   // 30%
  diversidade: number;    // 20%
  sustentabilidade: number; // 20%
  conformidade: number;   // 20%
  consistencia: number;   // 10%
  nivel: 'Excelente' | 'Bom' | 'Necessita Atenção';
}

// ---- Resultado Completo ----
export interface ResultadoInventario {
  arvores_calculadas: ArvoreCalculada[];
  arvores_invalidas: Arvore[];
  parcelas: ResultadoParcela[];
  especies: ResultadoEspecie[];
  familias: ResultadoFamilia[];
  dados_gerais: DadosGerais;
  classes_diametricas: ClasseDiametrica[];
  estrutura_vertical: Estratificacao[];
  indices_diversidade: IndicesDiversidade;
  score: ScoreAmbisafe;
}

export interface ResultadoFamilia {
  familia: string;
  n_individuos: number;
  n_especies: number;
  pct_individuos: number;
  vi_medio: number;
}

// ============================================================
// Tabela t-Student (bicaudal, gl = graus de liberdade)
// ============================================================
const T_TABLE: Record<number, Record<number, number>> = {
  90: { 1:6.314,2:2.920,3:2.353,4:2.132,5:2.015,6:1.943,7:1.895,8:1.860,9:1.833,10:1.812,
        11:1.796,12:1.782,13:1.771,14:1.761,15:1.753,16:1.746,17:1.740,18:1.734,19:1.729,
        20:1.725,25:1.708,30:1.697,40:1.684,60:1.671,120:1.658,999:1.645 },
  95: { 1:12.706,2:4.303,3:3.182,4:2.776,5:2.571,6:2.447,7:2.365,8:2.306,9:2.262,10:2.228,
        11:2.201,12:2.179,13:2.160,14:2.145,15:2.131,16:2.120,17:2.110,18:2.101,19:2.093,
        20:2.086,25:2.060,30:2.042,40:2.021,60:2.000,120:1.980,999:1.960 },
  99: { 1:63.657,2:9.925,3:5.841,4:4.604,5:4.032,6:3.707,7:3.499,8:3.355,9:3.250,10:3.169,
        11:3.106,12:3.055,13:3.012,14:2.977,15:2.947,16:2.921,17:2.898,18:2.878,19:2.861,
        20:2.845,25:2.787,30:2.750,40:2.704,60:2.660,120:2.617,999:2.576 },
};

function getTStudent(nivel: number, gl: number): number {
  const table = T_TABLE[nivel] || T_TABLE[95];
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  for (const key of keys) {
    if (gl <= key) return table[key];
  }
  return table[999] || 1.96;
}

// ============================================================
// FUNÇÃO PRINCIPAL DE CÁLCULO
// ============================================================
export function calcularInventario(
  arvores: Arvore[],
  parcelasInput: Parcela[],
  config: ProjetoConfig
): ResultadoInventario {
  const { area_total_ha, fator_forma, nivel_confianca, tamanho_parcela_m2 } = config;

  // 1. Calcular cada árvore (um registro por fuste)
  const arvores_calculadas: ArvoreCalculada[] = [];
  const arvores_invalidas: Arvore[] = [];

  for (const arv of arvores) {
    const calc = calcularArvore(arv, fator_forma);
    if (calc) arvores_calculadas.push(calc);
    else arvores_invalidas.push(arv);
  }

  // 1b. Agrupar fustes por indivíduo (parcela + numero_arvore).
  // Árvores sem numero_arvore são tratadas como indivíduos únicos (cada fuste = 1 indivíduo).
  const individuosMap = new Map<string, {
    parcela_numero: number;
    nome_comum: string;
    nome_cientifico: string | null;
    familia: string | null;
    volume_ff_m3: number;
    area_basal_m2: number;
    fustes: ArvoreCalculada[];
  }>();

  for (const arv of arvores_calculadas) {
    const key = arv.numero_arvore != null
      ? `${arv.parcela_numero}:${arv.numero_arvore}`
      : arv.id; // sem número → cada fuste é seu próprio indivíduo
    if (!individuosMap.has(key)) {
      individuosMap.set(key, {
        parcela_numero: arv.parcela_numero,
        nome_comum: arv.nome_comum,
        nome_cientifico: arv.nome_cientifico,
        familia: arv.familia,
        volume_ff_m3: 0,
        area_basal_m2: 0,
        fustes: [],
      });
    }
    const ind = individuosMap.get(key)!;
    ind.volume_ff_m3 += arv.volume_ff_m3;
    ind.area_basal_m2 += arv.area_basal_m2;
    ind.fustes.push(arv);
  }
  const individuos = Array.from(individuosMap.values());

  // 1c. Indivíduos calculados — um por árvore, com DAP/altura do fuste de maior CAP
  //     e área basal/volume somados de todos os fustes.
  const individuosCalculados = individuos.map(ind => {
    const fustePrincipal = ind.fustes.reduce((max, f) =>
      (f.cap_cm ?? 0) >= (max.cap_cm ?? 0) ? f : max
    );
    return {
      parcela_numero: ind.parcela_numero,
      nome_comum: ind.nome_comum,
      dap_cm: fustePrincipal.dap_cm,
      altura_total_m: fustePrincipal.altura_total_m,
      area_basal_m2: ind.area_basal_m2,   // soma de todos os fustes
      volume_ff_m3: ind.volume_ff_m3,     // soma de todos os fustes
    };
  });

  // 2. Determinar parcelas únicas
  const numeroParcelas = [...new Set(arvores.map(a => a.parcela_numero))].sort((a, b) => a - b);
  const areaParcela_m2 = tamanho_parcela_m2 || 400;

  // Montar mapa de parcelas
  const parcelasMap = new Map<number, Parcela>();
  for (const p of parcelasInput) parcelasMap.set(p.numero, p);
  for (const n of numeroParcelas) {
    if (!parcelasMap.has(n)) parcelasMap.set(n, { numero: n, area_m2: areaParcela_m2 });
  }

  // 3. Calcular por parcela — usar indivíduos agrupados para contagem e volumes
  const parcelas: ResultadoParcela[] = numeroParcelas.map(numParcela => {
    const indsP = individuos.filter(i => i.parcela_numero === numParcela);
    const parcelaInfo = parcelasMap.get(numParcela)!;
    const area_ha = parcelaInfo.area_m2 / 10000;

    const ab = indsP.reduce((s, i) => s + i.area_basal_m2, 0);
    const vol = indsP.reduce((s, i) => s + i.volume_ff_m3, 0);

    return {
      numero: numParcela,
      area_m2: parcelaInfo.area_m2,
      n_individuos: indsP.length,
      area_basal_m2: ab,
      volume_m3: vol,
      volume_ha: area_ha > 0 ? vol / area_ha : 0,
      area_basal_ha: area_ha > 0 ? ab / area_ha : 0,
      densidade_ha: area_ha > 0 ? indsP.length / area_ha : 0,
    };
  });

  const n = parcelas.length;
  const areaTotalAmostrada_ha = numeroParcelas.reduce((s, np) => {
    return s + (parcelasMap.get(np)?.area_m2 ?? areaParcela_m2) / 10000;
  }, 0);

  // 4. Fitossociologia por espécie — baseada em indivíduos (não em fustes)
  const especiesMap = new Map<string, {
    nome_comum: string;
    nome_cientifico: string;
    familia: string;
    n_inds: number;
    ab_total: number;
    vol_total: number;
    parcelas: Set<number>;
  }>();

  for (const ind of individuos) {
    const key = ind.nome_comum?.toLowerCase().trim() || 'desconhecida';
    if (!especiesMap.has(key)) {
      especiesMap.set(key, {
        nome_comum: ind.nome_comum || 'Desconhecida',
        nome_cientifico: ind.nome_cientifico || 'Não identificada',
        familia: ind.familia || 'Não identificada',
        n_inds: 0,
        ab_total: 0,
        vol_total: 0,
        parcelas: new Set(),
      });
    }
    const esp = especiesMap.get(key)!;
    esp.n_inds += 1;
    esp.ab_total += ind.area_basal_m2;
    esp.vol_total += ind.volume_ff_m3;
    esp.parcelas.add(ind.parcela_numero);
  }

  const N_total = individuos.length; // total de indivíduos (não de fustes)
  const AB_total = individuos.reduce((s, i) => s + i.area_basal_m2, 0);
  const soma_FA: number[] = [];

  const especiesArr = Array.from(especiesMap.values());
  const especiesRaw = especiesArr.map(e => {
    const ni = e.n_inds;
    const ab_i = e.ab_total;
    const vol_i = e.vol_total;
    const np_i = e.parcelas.size;
    const fa = (np_i / n) * 100;
    soma_FA.push(fa);
    return { ...e, ni, ab_i, vol_i, np_i, fa };
  });

  const soma_FA_total = soma_FA.reduce((s, v) => s + v, 0);

  const especies: ResultadoEspecie[] = especiesRaw.map(e => {
    const da = areaTotalAmostrada_ha > 0 ? e.ni / areaTotalAmostrada_ha : 0;
    const dr = N_total > 0 ? (e.ni / N_total) * 100 : 0;
    const doa = areaTotalAmostrada_ha > 0 ? e.ab_i / areaTotalAmostrada_ha : 0;
    const dor = AB_total > 0 ? (e.ab_i / AB_total) * 100 : 0;
    const fr = soma_FA_total > 0 ? (e.fa / soma_FA_total) * 100 : 0;
    const vi = dr + dor + fr;
    return {
      nome_comum: e.nome_comum,
      nome_cientifico: e.nome_cientifico,
      familia: e.familia,
      n_individuos: e.ni,
      n_parcelas: e.np_i,
      area_basal_m2: e.ab_i,
      volume_m3: e.vol_i,
      da, dr, doa, dor,
      fa: e.fa, fr,
      vi, vi_pct: vi / 3,
      vol_ha: areaTotalAmostrada_ha > 0 ? e.vol_i / areaTotalAmostrada_ha : 0,
    };
  }).sort((a, b) => b.vi - a.vi);

  // 5. Por família
  const familiasMap = new Map<string, { n_individuos: number; especies: Set<string>; vi_total: number }>();
  for (const esp of especies) {
    const fam = esp.familia || 'Não identificada';
    if (!familiasMap.has(fam)) familiasMap.set(fam, { n_individuos: 0, especies: new Set(), vi_total: 0 });
    const f = familiasMap.get(fam)!;
    f.n_individuos += esp.n_individuos;
    f.especies.add(esp.nome_comum);
    f.vi_total += esp.vi_pct;
  }
  const familias: ResultadoFamilia[] = Array.from(familiasMap.entries())
    .map(([familia, v]) => ({
      familia,
      n_individuos: v.n_individuos,
      n_especies: v.especies.size,
      pct_individuos: N_total > 0 ? (v.n_individuos / N_total) * 100 : 0,
      vi_medio: v.especies.size > 0 ? v.vi_total / v.especies.size : 0,
    }))
    .sort((a, b) => b.n_individuos - a.n_individuos);

  // 6. Dados gerais estatísticos
  // xi = volume por parcela em m³ (conforme metodologia de inventário florestal)
  const volumes_parcela = parcelas.map(p => p.volume_m3);
  const media = n > 0 ? volumes_parcela.reduce((s, v) => s + v, 0) / n : 0; // m³/parcela
  const variancia = n > 1
    ? volumes_parcela.reduce((s, v) => s + Math.pow(v - media, 2), 0) / (n - 1)
    : 0; // adimensional
  const desvio = Math.sqrt(variancia);
  const cv = media > 0 ? (desvio / media) * 100 : 0;
  const t = getTStudent(nivel_confianca, n - 1);

  // Fator de Correção (FC) — população finita quando FC < 0.98
  const area_parcela_ha = areaParcela_m2 / 10000;
  const N_caberiam = area_parcela_ha > 0 ? area_total_ha / area_parcela_ha : 1;
  const FC = N_caberiam > 0 ? (N_caberiam - n) / N_caberiam : 1;
  const variancia_media = FC >= 0.98
    ? variancia / n                  // população infinita
    : (variancia / n) * FC;          // população finita com correção
  const erro_padrao = Math.sqrt(variancia_media);
  const erro_abs = t * erro_padrao;  // m³/parcela
  const erro_rel = media > 0 ? (erro_abs / media) * 100 : 0;

  // IC por parcela (m³/parcela)
  const ic_inf_parcela = media - erro_abs;
  const ic_sup_parcela = media + erro_abs;

  // IC por hectare (m³/ha)
  const media_ha = area_parcela_ha > 0 ? media / area_parcela_ha : 0;
  const ic_inf_ha = area_parcela_ha > 0 ? ic_inf_parcela / area_parcela_ha : 0;
  const ic_sup_ha = area_parcela_ha > 0 ? ic_sup_parcela / area_parcela_ha : 0;

  // IC da população (m³)
  const ic_inf_pop = ic_inf_parcela * N_caberiam;
  const ic_sup_pop = ic_sup_parcela * N_caberiam;
  const vol_estimado_total = media * N_caberiam; // m³

  const dados_gerais: DadosGerais = {
    n_parcelas: n,
    n_parcelas_possiveis: Math.round(N_caberiam),
    area_amostrada_ha: areaTotalAmostrada_ha,
    n_individuos: N_total,
    n_especies: especiesMap.size,
    n_familias: familiasMap.size,
    volume_total_m3: individuos.reduce((s, i) => s + i.volume_ff_m3, 0),
    area_basal_total_m2: AB_total,
    media_vol_parcela: media,
    media_vol_ha: media_ha,
    variancia_amostral: variancia,
    desvio_padrao: desvio,
    fator_correcao: FC,
    variancia_media,
    erro_padrao,
    coeficiente_variacao_pct: cv,
    t_student: t,
    erro_abs,
    erro_rel_pct: erro_rel,
    ic_inferior_parcela: ic_inf_parcela,
    ic_superior_parcela: ic_sup_parcela,
    ic_inferior_ha: ic_inf_ha,
    ic_superior_ha: ic_sup_ha,
    ic_inferior_pop: ic_inf_pop,
    ic_superior_pop: ic_sup_pop,
    volume_estimado_ha: media_ha,
    volume_estimado_total: vol_estimado_total,
  };

  // 7. Estrutura diamétrica
  const classes_def = [
    { classe: '< 5 cm', min_cm: 0, max_cm: 5 },
    { classe: '5 – 10 cm', min_cm: 5, max_cm: 10 },
    { classe: '10 – 15 cm', min_cm: 10, max_cm: 15 },
    { classe: '15 – 20 cm', min_cm: 15, max_cm: 20 },
    { classe: '20 – 25 cm', min_cm: 20, max_cm: 25 },
    { classe: '25 – 30 cm', min_cm: 25, max_cm: 30 },
    { classe: '30 – 40 cm', min_cm: 30, max_cm: 40 },
    { classe: '40 – 50 cm', min_cm: 40, max_cm: 50 },
    { classe: '> 50 cm', min_cm: 50, max_cm: Infinity },
  ];

  const classes_diametricas: ClasseDiametrica[] = classes_def.map(cd => {
    const indsC = individuosCalculados.filter(i => i.dap_cm >= cd.min_cm && i.dap_cm < cd.max_cm);
    return {
      ...cd,
      n_individuos: indsC.length,
      pct: N_total > 0 ? (indsC.length / N_total) * 100 : 0,
      area_basal_m2: indsC.reduce((s, i) => s + i.area_basal_m2, 0),
    };
  }).filter(c => c.n_individuos > 0);

  // 8. Estrutura vertical
  const alturas = individuosCalculados
    .map(i => i.altura_total_m)
    .filter((h): h is number => h != null && h > 0);
  const h_max = alturas.length > 0 ? Math.max(...alturas) : 0;
  const h1 = h_max / 3;
  const h2 = (h_max * 2) / 3;

  const estratos = [
    { estrato: 'Inferior' as const, desc: `HT ≤ ${h1.toFixed(1)} m`, min: 0, max: h1 },
    { estrato: 'Médio' as const, desc: `${h1.toFixed(1)} < HT ≤ ${h2.toFixed(1)} m`, min: h1, max: h2 },
    { estrato: 'Superior' as const, desc: `HT > ${h2.toFixed(1)} m`, min: h2, max: Infinity },
  ];

  const estrutura_vertical: Estratificacao[] = estratos.map(e => {
    const indsE = individuosCalculados.filter(i =>
      i.altura_total_m != null && i.altura_total_m > e.min && i.altura_total_m <= e.max
    );
    return {
      estrato: e.estrato,
      descricao: e.desc,
      n_individuos: indsE.length,
      pct: N_total > 0 ? (indsE.length / N_total) * 100 : 0,
      altura_min: e.min,
      altura_max: e.max === Infinity ? h_max : e.max,
      area_basal_m2: indsE.reduce((s, i) => s + i.area_basal_m2, 0),
    };
  });

  // 9. Índices de diversidade
  const S = especiesMap.size;
  const shannon_h = N_total > 0
    ? -Array.from(especiesMap.values()).reduce((sum, e) => {
        const p = e.n_inds / N_total;
        return sum + (p > 0 ? p * Math.log(p) : 0);
      }, 0)
    : 0;

  const simpson_c = N_total > 0
    ? 1 - Array.from(especiesMap.values()).reduce((sum, e) => {
        const p = e.n_inds / N_total;
        return sum + p * p;
      }, 0)
    : 0;

  const pielou_j = S > 1 ? shannon_h / Math.log(S) : 0;

  const indices_diversidade: IndicesDiversidade = {
    shannon_h, simpson_c, pielou_j,
    n_especies: S,
    n_individuos: N_total,
  };

  // 10. Score AMBISAFE
  const scoreReg = (() => {
    if (erro_rel <= 5) return 100;
    if (erro_rel <= 10) return 85;
    if (erro_rel <= 15) return 65;
    if (erro_rel <= 20) return 45;
    return 25;
  })();

  const scoreDiversidade = (() => {
    if (shannon_h >= 3.5) return 100;
    if (shannon_h >= 2.5) return 80;
    if (shannon_h >= 1.5) return 60;
    if (shannon_h >= 0.5) return 40;
    return 20;
  })();

  // Sustentabilidade: verificar se distribuição é J-invertida
  const nonEmptyClasses = classes_diametricas.filter(c => c.n_individuos > 0);
  const isJInverse = nonEmptyClasses.length > 2 && nonEmptyClasses
    .slice(0, -1)
    .every((c, i) => c.n_individuos >= nonEmptyClasses[i + 1].n_individuos);
  const scoreSustentabilidade = isJInverse ? 90 : pielou_j > 0.6 ? 70 : 45;

  const scoreConformidade = (() => {
    if (cv <= 20) return 100;
    if (cv <= 40) return 75;
    if (cv <= 60) return 55;
    return 35;
  })();

  const pctValidos = arvores.length > 0
    ? (arvores_calculadas.length / arvores.length) * 100
    : 100;
  const scoreConsistencia = (() => {
    if (pctValidos >= 99) return 100;
    if (pctValidos >= 90) return 80;
    if (pctValidos >= 80) return 60;
    return 40;
  })();

  const scoreTotal = Math.round(
    scoreReg * 0.30 +
    scoreDiversidade * 0.20 +
    scoreSustentabilidade * 0.20 +
    scoreConformidade * 0.20 +
    scoreConsistencia * 0.10
  );

  const score: ScoreAmbisafe = {
    total: scoreTotal,
    regularidade: scoreReg,
    diversidade: scoreDiversidade,
    sustentabilidade: scoreSustentabilidade,
    conformidade: scoreConformidade,
    consistencia: scoreConsistencia,
    nivel: scoreTotal >= 80 ? 'Excelente' : scoreTotal >= 50 ? 'Bom' : 'Necessita Atenção',
  };

  return {
    arvores_calculadas,
    arvores_invalidas,
    parcelas,
    especies,
    familias,
    dados_gerais,
    classes_diametricas,
    estrutura_vertical,
    indices_diversidade,
    score,
  };
}

// Helpers de formatação
export const fmt = {
  num: (v: number, decimais = 2) => v.toFixed(decimais),
  pct: (v: number) => `${v.toFixed(2)}%`,
  m3: (v: number) => `${v.toFixed(4)} m³`,
  m2: (v: number) => `${v.toFixed(6)} m²`,
  ha: (v: number, dec = 2) => `${v.toFixed(dec)} ha`,
  ha_m3: (v: number) => `${v.toFixed(4)} m³/ha`,
  cm: (v: number) => `${v.toFixed(2)} cm`,
  m: (v: number) => `${v.toFixed(2)} m`,
};
