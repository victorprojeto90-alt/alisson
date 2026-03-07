import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
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

interface ColumnMapperProps {
  headers: string[];
  rows: RawRow[];
  onMappingChange: (mapping: ColumnMapping, isDapMode: boolean) => void;
}

export default function ColumnMapper({ headers, rows, onMappingChange }: ColumnMapperProps) {
  const [mapping, setMapping] = useState<ColumnMapping>(() => autoDetect(headers));
  const [isDapMode, setIsDapMode] = useState(false);

  useEffect(() => {
    const detected = autoDetect(headers);
    setMapping(detected);
    // Detect if column name suggests DAP
    const capCol = detected.cap_cm;
    if (capCol && capCol.toLowerCase().includes('dap')) setIsDapMode(true);
  }, [headers]);

  useEffect(() => {
    onMappingChange(mapping, isDapMode);
  }, [mapping, isDapMode, onMappingChange]);

  const setField = (key: keyof ColumnMapping, value: string) => {
    setMapping(prev => ({ ...prev, [key]: value }));
  };

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
