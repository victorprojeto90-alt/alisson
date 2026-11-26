import { useState, useEffect, useCallback, useRef } from 'react';
import { PageSkeleton } from '../components/ui/skeletons';
import { useParams, useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { useCalculations } from '../hooks/useCalculations';
import { agruparIndividuos, type Arvore, type Parcela } from '../lib/calculations';
import type { ColumnMapping } from '../components/project/ColumnMapper';
import type { RawRow } from '../components/project/DataUpload';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import DataUpload from '../components/project/DataUpload';
import ColumnMapper, { type SugestaoIA } from '../components/project/ColumnMapper';
import EditarProjetoModal, { type ProjetoEditavel } from '../components/project/EditarProjetoModal';
import { ErrorBoundary } from '../components/ErrorBoundary';
import StatsSummary from '../components/results/StatsSummary';
import FitossociologiaTable from '../components/results/FitossociologiaTable';
import IndicesDiversidade from '../components/results/IndicesDiversidade';
import EstruturaDiametrica from '../components/results/EstruturaDiametrica';
import EstruturaVertical from '../components/results/EstruturaVertical';
import CurvaColetor from '../components/results/CurvaColetor';
import VolumePorParcela from '../components/results/VolumePorParcela';
import IndividuosPorParcela from '../components/results/IndividuosPorParcela';
import ReportPreview from '../components/results/ReportPreview';
import ExportPanel from '../components/results/ExportPanel';
import ScoreCard from '../components/results/ScoreCard';
import { PageHeader, HeaderButton, HeaderStats, HeaderBadge } from '../components/layout/PageHeader';
import {
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
  Pencil,
  Sparkles,
  MapPin,
  Ruler,
  Calendar,
  RefreshCw,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

interface Projeto {
  id: string;
  nome: string;
  data_inventario: string | null;
  descricao: string | null;
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

// Seções da aba Resultados (menu que acompanha a rolagem)
const SECOES = [
  { id: 'sec-score', label: 'Score' },
  { id: 'sec-gerais', label: 'Dados gerais' },
  { id: 'sec-diversidade', label: 'Diversidade' },
  { id: 'sec-fito', label: 'Fitossociologia' },
  { id: 'sec-diametrica', label: 'Diamétrica' },
  { id: 'sec-vertical', label: 'Vertical' },
  { id: 'sec-coletor', label: 'Curva do coletor' },
  { id: 'sec-volume', label: 'Volume' },
];

function SecoesNav() {
  const [ativa, setAtiva] = useState(SECOES[0].id);
  const barra = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Seção ativa = a última cujo topo já passou da linha logo abaixo das abas fixas
    const onScroll = () => {
      const linha = window.innerWidth >= 768 ? 140 : 200;
      let atual = SECOES[0].id;
      for (const sec of SECOES) {
        const el = document.getElementById(sec.id);
        if (el && el.getBoundingClientRect().top - linha <= 0) atual = sec.id;
      }
      setAtiva(atual);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    barra.current?.querySelector<HTMLElement>(`[data-sec="${ativa}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [ativa]);

  return (
    <div ref={barra} className="ui-scroll-x flex gap-2 py-1">
      {SECOES.map(sec => (
        <button
          key={sec.id}
          data-sec={sec.id}
          onClick={() => document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className={`flex-none px-3.5 h-8 rounded-full text-xs font-semibold transition-colors border ${
            ativa === sec.id
              ? 'bg-[#acd115] border-[#acd115] text-[#00420d]'
              : 'bg-white border-gray-200 text-gray-600 hover:border-[#00420d]/30'
          }`}
        >
          {sec.label}
        </button>
      ))}
    </div>
  );
}

const TAB_TRIGGER = 'flex-none h-10 rounded-xl px-3.5 gap-1.5 text-sm font-semibold text-gray-600 data-[state=active]:bg-[#00420d] data-[state=active]:text-white data-[state=active]:shadow-sm disabled:opacity-40';

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
  const [showEdit, setShowEdit] = useState(false);
  const [mostrarUpload, setMostrarUpload] = useState(false);
  const [sugestoesIA, setSugestoesIA] = useState<Record<string, SugestaoIA>>({});
  // Nomes comuns (normalizados) cujo nome científico/família vieram da sugestão da IA
  // na última importação salva — usado só para marcar visualmente a pré-visualização.
  const [nomesPreenchidosPorIA, setNomesPreenchidosPorIA] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (id) loadProject();
  }, [id]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const [{ data: proj }, { data: arvs }, { data: parc }] = await Promise.all([
        supabase.from('projetos').select('*').eq('id', id!).single(),
        (async () => {
          let all: Arvore[] = [];
          let from = 0;
          const batch = 1000;
          for (;;) {
            const { data } = await supabase.from('arvores').select('*').eq('projeto_id', id!).order('parcela_numero').order('numero_arvore').range(from, from + batch - 1);
            if (!data || data.length === 0) break;
            all = all.concat(data);
            if (data.length < batch) break;
            from += batch;
          }
          return { data: all };
        })(),
        supabase.from('parcelas').select('*').eq('projeto_id', id!).order('numero'),
      ]);

      if (proj) setProjeto(proj);
      if (arvs) {
        setArvores(arvs);
        console.log('Primeiros 5 arvores:', arvs?.slice(0, 5).map(a => ({ parcela: a.parcela_numero, num: a.numero_arvore, nome: a.nome_comum })));
      }
      if (parc) setParcelas(parc.map(p => ({ numero: p.numero, area_m2: p.area_m2, lat: p.lat, lng: p.lng })));

      // Load previous result — falha aqui não deve travar a tela (ver useCalculations.ts)
      if (proj?.status === 'processado' || proj?.status === 'finalizado') {
        try {
          await loadResultado(id!);
        } catch (err) {
          console.error('Erro ao carregar resultado do projeto:', err);
          // continua sem resultado — usuário ainda vê os dados do projeto
        }
      }
    } catch (err) {
      console.error('Erro ao carregar projeto:', err);
      toast.error('Erro ao carregar projeto.');
    } finally {
      setLoading(false);
    }
  };

  const handleDataLoaded = (headers: string[], rows: RawRow[]) => {
    setRawHeaders(headers);
    setRawRows(rows);
    setShowMapper(true);
    setSugestoesIA({});
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
      // Nomes comuns (normalizados) que acabaram usando a sugestão da IA nesta gravação —
      // só para marcar visualmente a pré-visualização depois de salvar.
      const usadosPorIA = new Set<string>();

      // Convert raw rows to Arvore records
      const arvorasToInsert = rawRows.map((row, idx) => {
        const capRaw = Number(row[mapping.cap_cm] ?? 0);
        // If DAP mode, convert DAP → CAP = DAP * π
        const cap_cm = isDapMode ? capRaw * Math.PI : capRaw;

        const nomeComum = mapping.nome_comum ? String(row[mapping.nome_comum] ?? 'Desconhecida') : 'Desconhecida';
        const sugestao = sugestoesIA[nomeComum.toLowerCase().trim()];

        const nomeCientificoPlanilha = mapping.nome_cientifico && row[mapping.nome_cientifico]
          ? String(row[mapping.nome_cientifico])
          : null;
        const familiaPlanilha = mapping.familia && row[mapping.familia]
          ? String(row[mapping.familia])
          : null;

        // Só usa a sugestão da IA quando a planilha não trouxe o dado — nunca sobrescreve
        // um nome científico/família que o usuário já informou.
        const nome_cientifico = nomeCientificoPlanilha ?? sugestao?.nome_cientifico ?? null;
        const familia = familiaPlanilha ?? sugestao?.familia ?? null;
        if (!nomeCientificoPlanilha && !familiaPlanilha && sugestao) {
          usadosPorIA.add(nomeComum.toLowerCase().trim());
        }

        return {
          projeto_id: id!,
          parcela_numero: parseInt(String(row[mapping.parcela] ?? idx + 1)) || (idx + 1),
          numero_arvore: (() => {
            if (!mapping.numero_arvore || row[mapping.numero_arvore] == null) return null;
            const v = parseInt(String(row[mapping.numero_arvore]));
            return isNaN(v) ? null : v;
          })(),
          nome_comum: nomeComum,
          nome_cientifico,
          familia,
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
      await loadProject();
      setShowMapper(false);
      setMostrarUpload(false);
      setRawRows([]);
      setRawHeaders([]);
      setNomesPreenchidosPorIA(usadosPorIA);
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
      <PageSkeleton />
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

  // Agrupa fustes por indivíduo (mesma lógica do motor de cálculo) — reaproveitado tanto
  // pela aba de Resultados (Estrutura Vertical/Diamétrica) quanto pela aba de Indivíduos.
  const individuosAgrupados = resultado ? agruparIndividuos(resultado.arvores_calculadas) : [];

  // Conta indivíduos únicos (mesma lógica do calculations.ts):
  // agrupa por parcela+numero_arvore; registros sem numero_arvore contam individualmente.
  const nIndividuos = new Set(
    arvores.map(a => a.numero_arvore != null ? `${a.parcela_numero}:${a.numero_arvore}` : a.id)
  ).size;

  const nParcelas = new Set(arvores.map(a => a.parcela_numero)).size;
  const nEspecies = new Set(arvores.map(a => a.nome_comum?.toLowerCase())).size;
  const statusLabel = projeto.status === 'finalizado' ? 'Finalizado' : projeto.status === 'processado' ? 'Processado' : 'Rascunho';
  const localTxt = [projeto.municipio, projeto.estado].filter(Boolean).join('/');

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PageHeader
        onBack={() => navigate('/app/projetos')}
        eyebrow="Inventário florestal"
        title={projeto.nome}
        badge={<HeaderBadge>{statusLabel}</HeaderBadge>}
        subtitle={
          <span className="flex items-center gap-x-4 gap-y-1 flex-wrap">
            {localTxt && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{localTxt}</span>}
            <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" />{projeto.area_total_ha.toLocaleString('pt-BR')} ha</span>
            {projeto.data_inventario && (
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(projeto.data_inventario + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
            )}
          </span>
        }
        actions={
          <>
            <HeaderButton variant="outline" onClick={() => setShowEdit(true)} className="flex-1 md:flex-none">
              <Pencil className="w-4 h-4" /> Editar
            </HeaderButton>
            <HeaderButton onClick={handleProcessar} disabled={!hasData || processing} className="flex-[2] md:flex-none">
              {processing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
                : hasResultado
                  ? <><RefreshCw className="w-4 h-4" /> Reprocessar</>
                  : <><Play className="w-4 h-4" /> Processar<span className="hidden sm:inline"> inventário</span></>}
            </HeaderButton>
          </>
        }
      >
        <HeaderStats
          items={[
            { label: 'Indivíduos', value: hasData ? nIndividuos.toLocaleString('pt-BR') : '–' },
            { label: 'Parcelas', value: hasData ? nParcelas : '–' },
            { label: 'Espécies', value: hasData ? nEspecies : '–' },
            { label: 'Score', value: hasResultado ? `${resultado.score.total}` : '–', active: hasResultado },
          ]}
        />
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Abas fixas no topo durante a rolagem */}
        <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] md:top-0 z-20 -mx-4 px-4 md:-mx-8 md:px-8 py-2 bg-background/95 backdrop-blur mb-4">
          <TabsList className="ui-scroll-x flex w-full justify-start gap-1 bg-white border border-gray-100 shadow-sm p-1 rounded-2xl h-auto">
            <TabsTrigger value="dados" className={TAB_TRIGGER}>
              <Upload className="w-4 h-4" /> Dados
              {hasData && <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] group-data-[state=active]:text-[#acd115]" />}
            </TabsTrigger>
            <TabsTrigger value="resultados" className={TAB_TRIGGER} disabled={!hasResultado}>
              <BarChart3 className="w-4 h-4" /> Resultados
            </TabsTrigger>
            <TabsTrigger value="individuos" className={TAB_TRIGGER} disabled={!hasResultado}>
              <Users className="w-4 h-4" /> Indivíduos
            </TabsTrigger>
            <TabsTrigger value="relatorio" className={TAB_TRIGGER} disabled={!hasResultado}>
              <FileText className="w-4 h-4" /> Relatório
            </TabsTrigger>
            <TabsTrigger value="exportar" className={TAB_TRIGGER} disabled={!hasResultado}>
              <Download className="w-4 h-4" /> Exportar
            </TabsTrigger>
          </TabsList>
          {activeTab === 'resultados' && hasResultado && (
            <div className="mt-2"><SecoesNav /></div>
          )}
        </div>

        {!hasResultado && hasData && (
          <div className="flex items-start gap-3 mb-4 rounded-2xl border border-[#acd115]/50 bg-[#acd115]/10 p-4 text-sm text-[#0B3D2E]">
            <Play className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>Dados prontos. Toque em <strong>Processar inventário</strong> no topo para liberar Resultados, Indivíduos, Relatório e Exportar.</p>
          </div>
        )}

        {/* TAB: DADOS */}
        <TabsContent value="dados" className="space-y-5">
          {hasData && !showMapper && !mostrarUpload ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
              <div className="w-10 h-10 rounded-xl bg-[#00420d]/10 flex items-center justify-center flex-shrink-0">
                <Upload className="w-5 h-5 text-[#00420d]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">Planilha de campo</p>
                <p className="text-sm text-gray-500">Já carregada. Envie outra para substituir os dados.</p>
              </div>
              <Button variant="outline" onClick={() => setMostrarUpload(true)} className="h-11 rounded-xl gap-2">
                <Upload className="w-4 h-4" /> Enviar nova planilha
              </Button>
            </div>
          ) : (
          <Card className="shadow-sm">
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
          )}

          {/* Column Mapper */}
          {showMapper && rawRows.length > 0 && (
            <Card className="shadow-sm">
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
                  bioma={projeto.bioma}
                  onMappingChange={handleMappingChange}
                  onAiSuggestionsChange={setSugestoesIA}
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
            <Card className="shadow-sm">
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
                    <thead className="ui-thead">
                      <tr>
                        {['Parcela', 'Nº', 'Nome Comum', 'CAP (cm)', 'HT (m)', 'Nome Científico'].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {arvores.slice(0, 10).map((arv, i) => {
                        const viaIA = nomesPreenchidosPorIA.has((arv.nome_comum ?? '').toLowerCase().trim());
                        return (
                          <tr key={arv.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-3 py-2 font-mono">{arv.parcela_numero}</td>
                            <td className="px-3 py-2 font-mono">{arv.numero_arvore ?? '—'}</td>
                            <td className="px-3 py-2">{arv.nome_comum}</td>
                            <td className="px-3 py-2 font-mono">{arv.cap_cm?.toFixed(2) ?? '—'}</td>
                            <td className="px-3 py-2 font-mono">{arv.altura_total_m?.toFixed(2) ?? '—'}</td>
                            <td className="px-3 py-2 text-gray-400 italic">
                              <span className="inline-flex items-center gap-1">
                                {arv.nome_cientifico || '—'}
                                {viaIA && (
                                  <span
                                    title="Sugerido por IA — confira antes de usar em relatórios"
                                    className="inline-flex items-center gap-0.5 bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded-full font-semibold not-italic flex-shrink-0"
                                  >
                                    <Sparkles className="w-2.5 h-2.5" /> IA
                                  </span>
                                )}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {arvores.length > 10 && (
                    <p className="text-xs text-gray-400 text-center py-2 bg-gray-50 border-t">
                      + {arvores.length - 10} árvores não exibidas
                    </p>
                  )}
                  {nomesPreenchidosPorIA.size > 0 && (
                    <p className="text-xs text-purple-700 bg-purple-50 border-t border-purple-100 px-3 py-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                      Registros marcados com <strong>IA</strong> tiveram nome científico/família sugeridos
                      automaticamente e ainda não foram conferidos — revise-os antes de finalizar o inventário.
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
        <TabsContent value="resultados" className="space-y-5">
          {hasResultado && (() => {
            // individuosAgrupados (calculado no nível do componente) já traz os fustes
            // agrupados por indivíduo — evita contar múltiplos fustes da mesma árvore
            // como indivíduos separados, para o total desta tabela não divergir do total
            // geral do inventário.

            // Reaproveita os limites de estrato (h1/h2) já calculados em calculations.ts
            // (via resultado.estrutura_vertical), em vez de recalcular de forma
            // independente — garante que os dois lugares nunca divirjam.
            const h1 = resultado.estrutura_vertical.find(e => e.estrato === 'Inferior')?.altura_max ?? 0;
            const h2 = resultado.estrutura_vertical.find(e => e.estrato === 'Médio')?.altura_max ?? 0;
            const getEstrato = (h: number | null) => {
              if (h == null || h <= 0) return null;
              if (h <= h1) return 'Inferior';
              if (h <= h2) return 'Médio';
              return 'Superior';
            };

            // Group individuos by especie+estrato
            type EspEst = { nome_comum: string; nome_cientifico: string; estrato: string; count: number };
            const espEstMap = new Map<string, EspEst>();
            const estratoCounts: Record<string, number> = { Inferior: 0, Médio: 0, Superior: 0 };
            for (const ind of individuosAgrupados) {
              const est = getEstrato(ind.altura_total_m);
              if (!est) continue;
              estratoCounts[est] = (estratoCounts[est] ?? 0) + 1;
              const key = `${ind.nome_comum}||${est}`;
              if (!espEstMap.has(key)) {
                espEstMap.set(key, {
                  nome_comum: ind.nome_comum,
                  nome_cientifico: ind.nome_cientifico ?? '',
                  estrato: est,
                  count: 0,
                });
              }
              espEstMap.get(key)!.count += 1;
            }
            const especiesEstratos = Array.from(espEstMap.values())
              .sort((a, b) => b.count - a.count)
              .slice(0, 50)
              .map(e => ({
                nome_comum: e.nome_comum,
                nome_cientifico: e.nome_cientifico,
                estrato: e.estrato,
                n_individuos: e.count,
                pct_estrato: estratoCounts[e.estrato] > 0
                  ? (e.count / estratoCounts[e.estrato]) * 100
                  : 0,
              }));

            // Indivíduos agrupados para Sturges (reaproveita individuosAgrupados, já
            // calculado acima) — evita contar cada fuste de uma árvore multicaule como
            // um indivíduo separado. DAP = do fuste de maior CAP; AB = soma de todos os
            // fustes (mesmo critério usado em calculations.ts para classes_diametricas).
            const individuosParaDiametrica = individuosAgrupados.map(ind => ({
              dap_cm: ind.dap_cm,
              area_basal_m2: ind.area_basal_m2,
            }));

            return (
              <>
                <section id="sec-score" className="ui-section">
                <ErrorBoundary section="Score">
                  <ScoreCard
                    score={resultado.score}
                    precisaoRequerida={projeto.precisao_requerida}
                    erroRelPct={resultado.dados_gerais.erro_rel_pct}
                  />
                </ErrorBoundary>
                </section>
                <section id="sec-gerais" className="ui-section">
                <ErrorBoundary section="Dados Gerais">
                  <StatsSummary
                    dados={resultado.dados_gerais}
                    precisaoRequerida={projeto.precisao_requerida}
                    areaTotalHa={projeto.area_total_ha}
                  />
                </ErrorBoundary>
                </section>
                <section id="sec-diversidade" className="ui-section">
                <ErrorBoundary section="Índices de Diversidade">
                  <IndicesDiversidade indices={resultado.indices_diversidade} />
                </ErrorBoundary>
                </section>
                <section id="sec-fito" className="ui-section">
                <ErrorBoundary section="Fitossociologia">
                  <FitossociologiaTable especies={resultado.especies} familias={resultado.familias} />
                </ErrorBoundary>
                </section>
                <section id="sec-diametrica" className="ui-section">
                <ErrorBoundary section="Estrutura Diamétrica">
                  <EstruturaDiametrica individuos={individuosParaDiametrica} />
                </ErrorBoundary>
                </section>
                <section id="sec-vertical" className="ui-section">
                <ErrorBoundary section="Estrutura Vertical">
                  <EstruturaVertical
                    estratos={resultado.estrutura_vertical}
                    especiesEstratos={especiesEstratos}
                  />
                </ErrorBoundary>
                </section>
                <section id="sec-coletor" className="ui-section">
                <ErrorBoundary section="Curva do Coletor">
                  <CurvaColetor
                    pontos={resultado.curva_coletor}
                    totalParcelas={resultado.dados_gerais.n_parcelas}
                  />
                </ErrorBoundary>
                </section>
                <section id="sec-volume" className="ui-section">
                <ErrorBoundary section="Volume por Parcela">
                  <VolumePorParcela parcelas={resultado.parcelas} />
                </ErrorBoundary>
                </section>
              </>
            );
          })()}
        </TabsContent>

        {/* TAB: INDIVÍDUOS */}
        <TabsContent value="individuos">
          {hasResultado && (
            <ErrorBoundary section="Indivíduos por Parcela">
              <IndividuosPorParcela individuos={individuosAgrupados} />
            </ErrorBoundary>
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

      {showEdit && (
        <EditarProjetoModal
          projeto={projeto}
          onClose={() => setShowEdit(false)}
          onSaved={(atualizado: ProjetoEditavel) => {
            setProjeto(prev => prev ? {
              ...prev,
              ...atualizado,
              area_total_ha: atualizado.area_total_ha ?? prev.area_total_ha,
            } : prev);
            setShowEdit(false);
          }}
        />
      )}
    </div>
  );
}
