import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { CheckCircle2, AlertCircle, Info, Sparkles, AlertTriangle, Loader2, X, BadgeCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { projectId } from '/utils/supabase/info';
import { toast } from 'sonner';
import type { RawRow } from './DataUpload';

export interface ColumnMapping {
  parcela: string;
  nome_comum: string;
  numero_arvore: string;
  cap_cm: string;
  altura_total_m: string;
  nome_cientifico: string;
  familia: string;
  numero_fuste: string;
  observacoes: string;
}

interface ColumnDef {
  key: keyof ColumnMapping;
  label: string;
  required: boolean;
  aliases: string[];
  hint: string;
}

const COLUMN_DEFS: ColumnDef[] = [
  {
    key: 'parcela',
    label: 'Parcela',
    required: true,
    aliases: ['parcela', 'parc', 'plot', 'unidade amostral', 'ua', 'upa', 'talhão'],
    hint: 'Número ou identificador da parcela',
  },
  {
    key: 'nome_comum',
    label: 'Nome Comum',
    required: true,
    aliases: ['nome comum', 'espécie', 'especie', 'nome', 'nome popular', 'common name', 'spp', 'sp'],
    hint: 'Nome popular da espécie',
  },
  {
    key: 'cap_cm',
    label: 'CAP (cm)',
    required: true,
    aliases: ['cap', 'cap (cm)', 'cap_cm', 'circunferência', 'circunferencia', 'circunf', 'circ'],
    hint: 'Circunferência à Altura do Peito em centímetros. Se informar DAP, coloque-o aqui multiplicado por π.',
  },
  {
    key: 'altura_total_m',
    label: 'Altura Total (m)',
    required: true,
    aliases: ['ht', 'altura', 'altura total', 'alt', 'h', 'height', 'ht (m)', 'altura_m', 'ht_m', 'alt. total', 'alt total', 'alt. tot', 'ht total'],
    hint: 'Altura total da árvore em metros',
  },
  {
    key: 'numero_arvore',
    label: 'Nº Árvore',
    required: false,
    aliases: ['número', 'numero', 'nº arvore', 'nº árvore', 'n arvore', 'id', 'arv', 'no arvore',
      'núm. árvore', 'num. arvore', 'núm arvore', 'num arvore', 'núm. arvore', 'num. árvore',
      'nº. árvore', 'nº. arvore'],
    hint: 'Número identificador da árvore na parcela',
  },
  {
    key: 'nome_cientifico',
    label: 'Nome Científico',
    required: false,
    aliases: ['nome científico', 'nome cientifico', 'científico', 'cientifico', 'scientific', 'binomial'],
    hint: 'Nome científico (gênero + espécie)',
  },
  {
    key: 'familia',
    label: 'Família',
    required: false,
    aliases: ['família', 'familia', 'family', 'fam'],
    hint: 'Família botânica',
  },
  {
    key: 'numero_fuste',
    label: 'Nº Fuste',
    required: false,
    aliases: ['fuste', 'fustes', 'nº fuste', 'n fuste', 'stem', 'multi',
      'núm. fuste', 'num. fuste', 'núm fuste', 'num fuste', 'nº. fuste'],
    hint: 'Número do fuste (para árvores com múltiplos fustes)',
  },
  {
    key: 'observacoes',
    label: 'Observações',
    required: false,
    aliases: ['obs', 'observações', 'observacoes', 'notas', 'notes', 'comentarios', 'comentário'],
    hint: 'Campo para observações adicionais',
  },
];

function autoDetect(headers: string[]): ColumnMapping {
  const mapping: Partial<ColumnMapping> = {};
  // Normaliza pontos/hifens/underscores → espaço, colapsa múltiplos espaços
  const normalize = (s: string) =>
    s.toLowerCase().trim().replace(/[_\-.]/g, ' ').replace(/\s+/g, ' ');

  for (const colDef of COLUMN_DEFS) {
    // Normaliza os aliases para que "núm. árvore" e "núm árvore" sejam equivalentes
    const normAliases = colDef.aliases.map(normalize);

    // Try exact / alias match
    const matched = headers.find(h => {
      const n = normalize(h);
      return normAliases.some(alias => n === alias || n.includes(alias));
    });
    if (matched) {
      mapping[colDef.key] = matched;
      continue;
    }

    // Try partial match
    const partial = headers.find(h => {
      const n = normalize(h);
      return normAliases.some(alias => n.startsWith(alias) || alias.startsWith(n));
    });
    if (partial) mapping[colDef.key] = partial;
  }

  // Special case: if column contains "dap" treat as cap * π
  const dapCol = headers.find(h => normalize(h).includes('dap'));
  if (dapCol && !mapping.cap_cm) mapping.cap_cm = dapCol;

  return {
    parcela: mapping.parcela ?? '',
    nome_comum: mapping.nome_comum ?? '',
    cap_cm: mapping.cap_cm ?? '',
    altura_total_m: mapping.altura_total_m ?? '',
    numero_arvore: mapping.numero_arvore ?? '',
    nome_cientifico: mapping.nome_cientifico ?? '',
    familia: mapping.familia ?? '',
    numero_fuste: mapping.numero_fuste ?? '',
    observacoes: mapping.observacoes ?? '',
  };
}

// Sugestão de identificação de espécie via IA (Gemini), uma por nome_comum distinto.
export interface SugestaoIA {
  nome_cientifico: string;
  familia: string;
  certeza: 'alta' | 'media' | 'baixa';
}

// Mesma normalização usada em calculations.ts para agrupar indivíduos por espécie
// (nome_comum.toLowerCase().trim()) — garante que a chave bata nos dois lugares.
const normalizeNome = (s: string) => s.toLowerCase().trim();

interface ColumnMapperProps {
  headers: string[];
  rows: RawRow[];
  bioma?: string | null;
  onMappingChange: (mapping: ColumnMapping, isDapMode: boolean) => void;
  onAiSuggestionsChange?: (sugestoes: Record<string, SugestaoIA>) => void;
}

export default function ColumnMapper({ headers, rows, bioma, onMappingChange, onAiSuggestionsChange }: ColumnMapperProps) {
  const [mapping, setMapping] = useState<ColumnMapping>(() => autoDetect(headers));
  const [isDapMode, setIsDapMode] = useState(false);
  const [sugestoesIA, setSugestoesIA] = useState<Record<string, SugestaoIA>>({});
  const [identificando, setIdentificando] = useState(false);
  const [progressoIA, setProgressoIA] = useState({ feito: 0, total: 0 });

  useEffect(() => {
    const detected = autoDetect(headers);
    setMapping(detected);
    // Detect if column name suggests DAP
    const capCol = detected.cap_cm;
    if (capCol && capCol.toLowerCase().includes('dap')) setIsDapMode(true);
    // Nova planilha carregada — descarta sugestões de IA de uma importação anterior
    setSugestoesIA({});
  }, [headers]);

  useEffect(() => {
    onMappingChange(mapping, isDapMode);
  }, [mapping, isDapMode, onMappingChange]);

  useEffect(() => {
    onAiSuggestionsChange?.(sugestoesIA);
  }, [sugestoesIA, onAiSuggestionsChange]);

  const setField = (key: keyof ColumnMapping, value: string) => {
    setMapping(prev => ({ ...prev, [key]: value }));
  };

  // Nomes comuns distintos presentes na planilha (a partir da coluna já mapeada) —
  // agrupa antes de chamar a IA para não fazer uma chamada por indivíduo/linha.
  const nomesComunsDistintos = mapping.nome_comum
    ? Array.from(new Set(
        rows
          .map(r => r[mapping.nome_comum])
          .filter((v): v is string | number => v != null && String(v).trim() !== '')
          .map(v => String(v).trim())
      ))
    : [];

  const handleIdentificarComIA = async () => {
    if (nomesComunsDistintos.length === 0) return;
    setIdentificando(true);
    setProgressoIA({ feito: 0, total: nomesComunsDistintos.length });

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const novasSugestoes: Record<string, SugestaoIA> = {};
    let falhas = 0;

    // Chamadas sequenciais (não em paralelo) para não estourar rate limit do Gemini
    // e para o indicador de progresso avançar de forma previsível, um nome por vez.
    for (const nomeComum of nomesComunsDistintos) {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-eed79e88/ai/identificar-especie`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ nome_comum: nomeComum, bioma: bioma ?? undefined }),
          }
        );
        if (!response.ok) throw new Error('Falha na API de IA');
        const data = await response.json() as { nome_cientifico?: string; familia?: string; certeza?: string };
        if (data.nome_cientifico && data.familia) {
          novasSugestoes[normalizeNome(nomeComum)] = {
            nome_cientifico: data.nome_cientifico,
            familia: data.familia,
            certeza: (data.certeza === 'alta' || data.certeza === 'media' || data.certeza === 'baixa')
              ? data.certeza
              : 'baixa',
          };
        } else {
          falhas++;
        }
      } catch {
        // Falha isolada para este nome (timeout, erro do Gemini, rate limit...) — não
        // interrompe o restante da identificação, só deixa esse nome sem sugestão.
        falhas++;
      }
      setProgressoIA(p => ({ ...p, feito: p.feito + 1 }));
    }

    setSugestoesIA(prev => ({ ...prev, ...novasSugestoes }));
    setIdentificando(false);

    const total = nomesComunsDistintos.length;
    const sucesso = total - falhas;
    if (sucesso > 0) {
      toast.success(
        falhas > 0
          ? `IA identificou ${sucesso} de ${total} espécies. Confira as sugestões antes de salvar.`
          : `IA identificou ${sucesso} espécie${sucesso !== 1 ? 's' : ''}. Confira as sugestões antes de salvar.`
      );
    }
    if (falhas > 0 && sucesso === 0) {
      toast.error('Não foi possível identificar nenhuma espécie agora. Tente novamente mais tarde.');
    } else if (falhas > 0) {
      toast.error(`${falhas} espécie${falhas !== 1 ? 's' : ''} não pôde${falhas !== 1 ? 'ram' : ''} ser identificada${falhas !== 1 ? 's' : ''} pela IA.`);
    }
  };

  const handleLimparSugestoesIA = () => setSugestoesIA({});

  const requiredFields = COLUMN_DEFS.filter(d => d.required);
  const requiredMapped = requiredFields.filter(d => mapping[d.key]);
  const isComplete = requiredMapped.length === requiredFields.length;

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className={`flex items-center gap-3 p-3 rounded-xl text-sm ${
        isComplete
          ? 'bg-green-50 border border-green-200 text-green-700'
          : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
      }`}>
        {isComplete
          ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
        <span>
          {isComplete
            ? 'Todas as colunas obrigatórias foram mapeadas. Verifique o mapeamento antes de continuar.'
            : `Mapeie as ${requiredFields.length - requiredMapped.length} colunas obrigatórias restantes.`}
        </span>
      </div>

      {/* DAP toggle */}
      {mapping.cap_cm && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-blue-800">
              A coluna <strong>{mapping.cap_cm}</strong> contém valores de:
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDapMode(false)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                !isDapMode ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-200'
              }`}
            >
              CAP (cm)
            </button>
            <button
              onClick={() => setIsDapMode(true)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                isDapMode ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-200'
              }`}
            >
              DAP (cm)
            </button>
          </div>
        </div>
      )}

      {/* Mapping grid */}
      <div className="space-y-3">
        {COLUMN_DEFS.map(colDef => (
          <div key={colDef.key} className="grid grid-cols-2 gap-3 items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-gray-900">{colDef.label}</span>
                {colDef.required && (
                  <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">obr.</span>
                )}
                {mapping[colDef.key] && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{colDef.hint}</p>
            </div>
            <Select
              value={mapping[colDef.key] || '__none__'}
              onValueChange={v => setField(colDef.key, v === '__none__' ? '' : v)}
            >
              <SelectTrigger className={`text-sm ${
                colDef.required && !mapping[colDef.key]
                  ? 'border-red-200 bg-red-50'
                  : mapping[colDef.key]
                    ? 'border-green-200 bg-green-50'
                    : ''
              }`}>
                <SelectValue placeholder="Selecionar coluna" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  <span className="text-gray-400 italic">Não mapeado</span>
                </SelectItem>
                {headers.map(h => (
                  <SelectItem key={h} value={h}>
                    <span className="font-mono text-sm">{h}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      {/* Identificação de espécie via IA */}
      {(!mapping.nome_cientifico || !mapping.familia) && mapping.nome_comum && rows.length > 0 && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-900">
                Sua planilha não tem {!mapping.nome_cientifico && !mapping.familia
                  ? 'nome científico nem família'
                  : !mapping.nome_cientifico ? 'nome científico' : 'família'} mapeados
              </p>
              <p className="text-xs text-purple-700 mt-0.5">
                A IA (Gemini) pode sugerir o nome científico e a família botânica a partir do nome popular de cada
                espécie encontrada na planilha ({nomesComunsDistintos.length} nome{nomesComunsDistintos.length !== 1 ? 's' : ''} distinto{nomesComunsDistintos.length !== 1 ? 's' : ''}).
              </p>
            </div>
          </div>

          {/* Aviso — sempre visível, antes de usar a IA */}
          <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-800">
              <strong>A sugestão da IA pode estar errada e precisa ser conferida por você.</strong> O mesmo nome
              popular pode se referir a espécies diferentes dependendo da região do Brasil, e uma mesma espécie
              pode ter vários nomes populares. Use como ponto de partida, não como resultado final.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleIdentificarComIA}
              disabled={identificando || nomesComunsDistintos.length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
            >
              {identificando ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Identificando {progressoIA.feito}/{progressoIA.total}...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Preencher com IA</>
              )}
            </Button>
            {Object.keys(sugestoesIA).length > 0 && !identificando && (
              <button
                type="button"
                onClick={handleLimparSugestoesIA}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Limpar sugestões
              </button>
            )}
          </div>

          {/* Resultado — sempre visível junto do aviso, depois de usar a IA */}
          {Object.keys(sugestoesIA).length > 0 && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 bg-purple-100 border border-purple-200 rounded-lg p-2.5">
                <BadgeCheck className="w-4 h-4 text-purple-700 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-purple-800">
                  Essas sugestões serão aplicadas aos registros correspondentes ao salvar os dados. Registros
                  preenchidos pela IA aparecerão marcados na pré-visualização dos dados carregados —
                  <strong> confira cada um antes de finalizar o inventário.</strong>
                </p>
              </div>
              <div className="overflow-x-auto rounded-lg border border-purple-200 max-h-56 overflow-y-auto">
                <table className="text-xs w-full">
                  <thead className="bg-purple-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-purple-800 font-semibold">Nome Comum</th>
                      <th className="px-3 py-2 text-left text-purple-800 font-semibold">Nome Científico (IA)</th>
                      <th className="px-3 py-2 text-left text-purple-800 font-semibold">Família (IA)</th>
                      <th className="px-3 py-2 text-left text-purple-800 font-semibold">Certeza</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nomesComunsDistintos
                      .filter(nome => sugestoesIA[normalizeNome(nome)])
                      .map(nome => {
                        const s = sugestoesIA[normalizeNome(nome)];
                        return (
                          <tr key={nome} className="bg-white even:bg-purple-50/40">
                            <td className="px-3 py-2 font-medium text-gray-800">{nome}</td>
                            <td className="px-3 py-2 italic text-gray-600">{s.nome_cientifico}</td>
                            <td className="px-3 py-2 text-gray-600">{s.familia}</td>
                            <td className="px-3 py-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                s.certeza === 'alta' ? 'bg-green-100 text-green-700' :
                                s.certeza === 'media' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {s.certeza}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              {nomesComunsDistintos.some(nome => !sugestoesIA[normalizeNome(nome)]) && (
                <p className="text-xs text-gray-500">
                  {nomesComunsDistintos.filter(nome => !sugestoesIA[normalizeNome(nome)]).length} nome(s) não
                  identificado(s) pela IA — os registros correspondentes ficarão sem nome científico/família,
                  sem impedir a importação do restante dos dados.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      {rows.length > 0 && mapping.parcela && mapping.cap_cm && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-2 font-medium">Pré-visualização (primeiras 3 linhas):</p>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="text-xs w-full">
              <thead className="bg-gray-50">
                <tr>
                  {Object.entries(mapping)
                    .filter(([, v]) => v)
                    .map(([k]) => (
                      <th key={k} className="px-3 py-2 text-left text-gray-500 font-semibold whitespace-nowrap">
                        {COLUMN_DEFS.find(d => d.key === k)?.label}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 3).map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {Object.entries(mapping)
                      .filter(([, v]) => v)
                      .map(([k, v]) => (
                        <td key={k} className="px-3 py-2 text-gray-700 whitespace-nowrap font-mono">
                          {row[v] != null ? String(row[v]) : '—'}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
