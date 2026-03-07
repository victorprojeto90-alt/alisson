import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { useCalculations } from '../hooks/useCalculations';
import type { Arvore, Parcela } from '../lib/calculations';
import type { ColumnMapping } from '../components/project/ColumnMapper';
import type { RawRow } from '../components/project/DataUpload';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import DataUpload from '../components/project/DataUpload';
import ColumnMapper from '../components/project/ColumnMapper';
import StatsSummary from '../components/results/StatsSummary';
import FitossociologiaTable from '../components/results/FitossociologiaTable';
import IndicesDiversidade from '../components/results/IndicesDiversidade';
import EstruturaDiametrica from '../components/results/EstruturaDiametrica';
import EstruturaVertical from '../components/results/EstruturaVertical';
import ReportPreview from '../components/results/ReportPreview';
import ExportPanel from '../components/results/ExportPanel';
import ScoreCard from '../components/results/ScoreCard';
import {
  ArrowLeft,
  Upload,
  Play,
  FileText,
  BarChart3,
  Download,
  Loader2,
  Trees,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

interface Projeto {
  id: string;
  nome: string;
  municipio: string | null;
  estado: string | null;
  bioma: string | null;
  area_total_ha: number;
  tipo_inventario: string;
  motivo_inventario: string;
  precisao_requerida: number;
  nivel_confianca: number;
  tamanho_parcela_m2: number;
  fator_forma: number;
  status: string;
  created_at: string;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { resultado, processing, processar, loadResultado } = useCalculations();

  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [arvores, setArvores] = useState<Arvore[]>([]);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dados');

  // Upload state
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [isDapMode, setIsDapMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showMapper, setShowMapper] = useState(false);

  useEffect(() => {
    if (id) loadProject();
  }, [id]);

  const loadProject = async () => {
    setLoading(true);
    const [{ data: proj }, { data: arvs }, { data: parc }] = await Promise.all([
      supabase.from('projetos').select('*').eq('id', id!).single(),
      supabase.from('arvores').select('*').eq('projeto_id', id!).order('parcela_numero').order('numero_arvore').range(0, 49999),
      supabase.from('parcelas').select('*').eq('projeto_id', id!).order('numero'),
    ]);

    if (proj) setProjeto(proj);
    if (arvs) {
      setArvores(arvs);
      console.log('Primeiros 5 arvores:', arvs?.slice(0, 5).map(a => ({ parcela: a.parcela_numero, num: a.numero_arvore, nome: a.nome_comum })));
    }
    if (parc) setParcelas(parc.map(p => ({ numero: p.numero, area_m2: p.area_m2, lat: p.lat, lng: p.lng })));

    // Load previous result
    if (proj?.status === 'processado' || proj?.status === 'finalizado') {
      await loadResultado(id!);
    }
    setLoading(false);
  };

  const handleDataLoaded = (headers: string[], rows: RawRow[]) => {
    setRawHeaders(headers);
    setRawRows(rows);
    setShowMapper(true);
  };

  const handleMappingChange = useCallback((m: ColumnMapping, dap: boolean) => {
    setMapping(m);
    setIsDapMode(dap);
  }, []);

  const handleSaveData = async () => {
    if (!mapping?.parcela || !mapping?.cap_cm || !mapping?.altura_total_m || !mapping?.nome_comum) {
      toast.error('Mapeie as colunas obrigatórias antes de salvar.');
      return;
    }

    setUploading(true);
    try {
      // Convert raw rows to Arvore records
      const arvorasToInsert = rawRows.map((row, idx) => {
        const capRaw = Number(row[mapping.cap_cm] ?? 0);
        // If DAP mode, convert DAP → CAP = DAP * π
        const cap_cm = isDapMode ? capRaw * Math.PI : capRaw;

        return {
          projeto_id: id!,
          parcela_numero: parseInt(String(row[mapping.parcela] ?? idx + 1)) || (idx + 1),
          numero_arvore: (() => {
            if (!mapping.numero_arvore || row[mapping.numero_arvore] == null) return null;
            const v = parseInt(String(row[mapping.numero_arvore]));
            return isNaN(v) ? null : v;
          })(),
          nome_comum: mapping.nome_comum ? String(row[mapping.nome_comum] ?? 'Desconhecida') : 'Desconhecida',
          nome_cientifico: mapping.nome_cientifico && row[mapping.nome_cientifico]
            ? String(row[mapping.nome_cientifico])
            : null,
          familia: mapping.familia && row[mapping.familia]
            ? String(row[mapping.familia])
            : null,
          numero_fuste: mapping.numero_fuste && row[mapping.numero_fuste]
            ? parseInt(String(row[mapping.numero_fuste])) || 1
            : 1,
          cap_cm: cap_cm > 0 ? cap_cm : null,
          altura_total_m: mapping.altura_total_m && row[mapping.altura_total_m] != null
            ? Number(row[mapping.altura_total_m]) || null
            : null,
          observacoes: mapping.observacoes && row[mapping.observacoes]
            ? String(row[mapping.observacoes])
            : null,
        };
      }).filter(a => a.cap_cm && a.altura_total_m);

      if (arvorasToInsert.length === 0) {
        toast.error('Nenhuma árvore válida encontrada. Verifique o mapeamento de colunas.');
        return;
      }

      // Delete existing and insert new
      await supabase.from('arvores').delete().eq('projeto_id', id!);
      const BATCH_SIZE = 500;
      for (let i = 0; i < arvorasToInsert.length; i += BATCH_SIZE) {
        await supabase.from('arvores').insert(arvorasToInsert.slice(i, i + BATCH_SIZE));
      }

      const newArvores = await supabase
        .from('arvores')
        .select('*')
        .eq('projeto_id', id!)
        .order('parcela_numero')
        .order('numero_arvore');

      if (newArvores.data) setArvores(newArvores.data);
      setShowMapper(false);
      setRawRows([]);
      setRawHeaders([]);
      const nInds = new Set(
        arvorasToInsert.map((a, i) => a.numero_arvore != null ? `${a.parcela_numero}:${a.numero_arvore}` : `__${i}`)
      ).size;
      const nFustes = arvorasToInsert.length;
      toast.success(
        nInds === nFustes
          ? `${nInds} indivíduos salvos com sucesso!`
          : `${nInds} indivíduos (${nFustes} fustes) salvos com sucesso!`
      );
    } finally {
      setUploading(false);
    }
  };

  const handleProcessar = async () => {
    if (!projeto) return;
    if (arvores.length === 0) {
      toast.error('Importe os dados antes de processar o inventário.');
      return;
    }

    const res = await processar({
      projetoId: id!,
      arvores,
      parcelas,
      config: {
        area_total_ha: projeto.area_total_ha,
        fator_forma: projeto.fator_forma,
        nivel_confianca: projeto.nivel_confianca,
        tamanho_parcela_m2: projeto.tamanho_parcela_m2,
      },
    });

    if (res) {
      setActiveTab('resultados');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#16A34A] mx-auto" />
        <p className="text-gray-400 mt-3">Carregando projeto...</p>
      </div>
    );
  }

  if (!projeto) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Projeto não encontrado.</p>
        <Button onClick={() => navigate('/app/dashboard')} className="mt-4">
          Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  const hasData = arvores.length > 0;
  const hasResultado = resultado != null;

  // Conta indivíduos únicos (mesma lógica do calculations.ts):
  // agrupa por parcela+numero_arvore; registros sem numero_arvore contam individualmente.
  const nIndividuos = new Set(
    arvores.map(a => a.numero_arvore != null ? `${a.parcela_numero}:${a.numero_arvore}` : a.id)
  ).size;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
        <button
          onClick={() => navigate('/app/dashboard')}
          className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">{projeto.nome}</h1>
            <Badge variant="outline" className={
              projeto.status === 'finalizado' ? 'bg-green-50 text-green-700 border-green-200' :
              projeto.status === 'processado' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              'bg-gray-100 text-gray-500 border-gray-200'
            }>
              {projeto.status === 'finalizado' ? 'Finalizado' :
               projeto.status === 'processado' ? 'Processado' : 'Rascunho'}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-400">
            {projeto.municipio && <span>{projeto.municipio}{projeto.estado ? `/${projeto.estado}` : ''}</span>}
            <span>{projeto.area_total_ha.toLocaleString('pt-BR')} ha</span>
            {hasData && <span>{nIndividuos.toLocaleString('pt-BR')} indivíduos</span>}
          </div>
        </div>

        {/* Process button */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {hasResultado && (
            <div className="hidden sm:flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-700">
                Score: {resultado.score.total}/100
              </span>
            </div>
          )}
          <Button
            onClick={handleProcessar}
            disabled={!hasData || processing}
            className="bg-[#16A34A] hover:bg-[#15803d] text-white gap-2"
          >
            {processing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
            ) : (
              <><Play className="w-4 h-4" /> Processar Inventário</>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-6 bg-gray-100 p-1 rounded-xl h-auto">
          <TabsTrigger value="dados" className="rounded-lg gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Dados</span>
            {hasData && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger value="resultados" className="rounded-lg gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm py-2" disabled={!hasResultado}>
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Resultados</span>
          </TabsTrigger>
          <TabsTrigger value="relatorio" className="rounded-lg gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm py-2" disabled={!hasResultado}>
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Relatório</span>
          </TabsTrigger>
          <TabsTrigger value="exportar" className="rounded-lg gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm py-2" disabled={!hasResultado}>
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB: DADOS */}
        <TabsContent value="dados" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#16A34A]" />
                Upload da Planilha de Campo
              </CardTitle>
              <CardDescription>
                Importe sua planilha de inventário. O sistema detectará as colunas automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataUpload onDataLoaded={handleDataLoaded} />
            </CardContent>
          </Card>

          {/* Column Mapper */}
          {showMapper && rawRows.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Mapeamento de Colunas</CardTitle>
                    <CardDescription>Confirme o mapeamento automático das colunas da sua planilha</CardDescription>
                  </div>
                  <button
                    onClick={() => setShowMapper(s => !s)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showMapper ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <ColumnMapper
                  headers={rawHeaders}
                  rows={rawRows}
                  onMappingChange={handleMappingChange}
                />
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleSaveData}
                    disabled={uploading}
                    className="bg-[#0B3D2E] hover:bg-[#0B3D2E]/90 text-white gap-2"
                  >
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                    ) : (
                      <><Save className="w-4 h-4" /> Salvar Dados</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data summary */}
          {hasData && !showMapper && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Trees className="w-4 h-4 text-[#16A34A]" />
                      Dados Carregados
                    </CardTitle>
                    <CardDescription>
                      {nIndividuos.toLocaleString('pt-BR')} indivíduos em{' '}
                      {[...new Set(arvores.map(a => a.parcela_numero))].length} parcelas
                    </CardDescription>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Pronto para processar
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  {[
                    { label: 'Indivíduos', value: nIndividuos },
                    { label: 'Parcelas', value: [...new Set(arvores.map(a => a.parcela_numero))].length },
                    { label: 'Espécies', value: [...new Set(arvores.map(a => a.nome_comum?.toLowerCase()))].length },
                    { label: 'Sem CAP/HT', value: arvores.filter(a => !a.cap_cm || !a.altura_total_m).length },
                  ].map((stat, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString('pt-BR')}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Quick data preview */}
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="text-xs w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Parcela', 'Nº', 'Nome Comum', 'CAP (cm)', 'HT (m)', 'Nome Científico'].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {arvores.slice(0, 10).map((arv, i) => (
                        <tr key={arv.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2 font-mono">{arv.parcela_numero}</td>
                          <td className="px-3 py-2 font-mono">{arv.numero_arvore ?? '—'}</td>
                          <td className="px-3 py-2">{arv.nome_comum}</td>
                          <td className="px-3 py-2 font-mono">{arv.cap_cm?.toFixed(2) ?? '—'}</td>
                          <td className="px-3 py-2 font-mono">{arv.altura_total_m?.toFixed(2) ?? '—'}</td>
                          <td className="px-3 py-2 text-gray-400 italic">{arv.nome_cientifico || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {arvores.length > 10 && (
                    <p className="text-xs text-gray-400 text-center py-2 bg-gray-50 border-t">
                      + {arvores.length - 10} árvores não exibidas
                    </p>
                  )}
                </div>

                {arvores.filter(a => !a.cap_cm || !a.altura_total_m).length > 0 && (
                  <div className="flex items-start gap-2 mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-yellow-700">
                      <strong>{arvores.filter(a => !a.cap_cm || !a.altura_total_m).length} registros</strong> sem CAP ou HT serão ignorados nos cálculos.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!hasData && !showMapper && (
            <div className="text-center py-8 text-gray-400">
              <Upload className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Faça upload da planilha acima para carregar os dados do inventário.</p>
            </div>
          )}
        </TabsContent>

        {/* TAB: RESULTADOS */}
        <TabsContent value="resultados" className="space-y-6">
          {hasResultado && (
            <>
              <ScoreCard score={resultado.score} />
              <StatsSummary dados={resultado.dados_gerais} precisaoRequerida={projeto.precisao_requerida} />
              <IndicesDiversidade indices={resultado.indices_diversidade} />
              <FitossociologiaTable especies={resultado.especies} familias={resultado.familias} />
              <EstruturaDiametrica classes={resultado.classes_diametricas} />
              <EstruturaVertical estratos={resultado.estrutura_vertical} />
            </>
          )}
        </TabsContent>

        {/* TAB: RELATÓRIO */}
        <TabsContent value="relatorio">
          {hasResultado && projeto && (
            <ReportPreview projeto={projeto} resultado={resultado} />
          )}
        </TabsContent>

        {/* TAB: EXPORTAR */}
        <TabsContent value="exportar">
          {hasResultado && projeto && (
            <ExportPanel projeto={projeto} resultado={resultado} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
