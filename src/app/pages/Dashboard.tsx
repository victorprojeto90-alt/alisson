import { useState, useEffect } from 'react';
import { Bone, ListSkeleton } from '../components/ui/skeletons';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Plus,
  Trees,
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ChevronRight,
  RefreshCw,
  Leaf,
  HelpCircle,
} from 'lucide-react';
import OnboardingCard from '../components/help/OnboardingCard';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface Projeto {
  id: string;
  nome: string;
  municipio: string | null;
  estado: string | null;
  area_total_ha: number | null;
  tipo_inventario: string | null;
  motivo_inventario: string | null;
  status: string;
  created_at: string;
  score?: number | null;
}

const TIPO_LABEL: Record<string, string> = {
  casual_simples: 'Casual Simples',
  estratificado: 'Casual Estratificada',
  censo: 'Censo 100%',
};

const MOTIVO_LABEL: Record<string, string> = {
  licenciamento: 'Licenciamento',
  manejo: 'Manejo Florestal',
  supressao: 'Supressão Vegetal',
  academico: 'Acadêmico',
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  rascunho: {
    label: 'Rascunho',
    icon: <Clock className="w-3.5 h-3.5" />,
    color: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  processado: {
    label: 'Processado',
    icon: <BarChart3 className="w-3.5 h-3.5" />,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  finalizado: {
    label: 'Finalizado',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    color: 'bg-green-50 text-green-700 border-green-200',
  },
};

function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-xs text-gray-400">—</span>;
  const color = score >= 80 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600';
  const bg = score >= 80 ? 'bg-green-50' : score >= 50 ? 'bg-yellow-50' : 'bg-red-50';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${bg} ${color}`}>
      {score >= 80 ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      {score}/100
    </span>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { empresa, profile, loading: authLoading } = useAuth();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!empresa?.id) return; // perfil ainda carregando: mantém os blocos de carregamento
    loadProjetos();
  }, [empresa?.id, authLoading]);

  const loadProjetos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('projetos')
      .select('*')
      .eq('empresa_id', empresa!.id)
      .order('created_at', { ascending: false });

    if (data) {
      // Fetch scores
      const projetosComScore = await Promise.all(data.map(async (p) => {
        const { data: resultado } = await supabase
          .from('resultados')
          .select('score')
          .eq('projeto_id', p.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(); // retorna null se não existir, sem erro 406
        // score pode ser null se o projeto ainda não foi processado
        return { ...p, score: resultado?.score?.total ?? null };
      }));
      setProjetos(projetosComScore);
    }
    setLoading(false);
  };

  const stats = [
    {
      title: 'Total de Projetos',
      value: projetos.length,
      icon: <Trees className="w-6 h-6 text-[#16A34A]" />,
      bg: 'bg-green-50',
      sub: `${projetos.filter(p => p.status === 'processado' || p.status === 'finalizado').length} processados`,
    },
    {
      title: 'Área Total Inventariada',
      value: `${projetos.reduce((s, p) => s + (p.area_total_ha ?? 0), 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ha`,
      icon: <TrendingUp className="w-6 h-6 text-[#0B3D2E]" />,
      bg: 'bg-emerald-50',
      sub: 'soma de todos os projetos',
    },
    {
      title: 'Score Médio AMBISAFE',
      value: (() => {
        const comScore = projetos.filter(p => p.score != null);
        if (comScore.length === 0) return '—';
        const avg = comScore.reduce((s, p) => s + (p.score ?? 0), 0) / comScore.length;
        return `${Math.round(avg)}/100`;
      })(),
      icon: <BarChart3 className="w-6 h-6 text-[#10B981]" />,
      bg: 'bg-teal-50',
      sub: 'Qualidade técnica do inventário (0–100)',
    },
    {
      title: 'Finalizados',
      value: projetos.filter(p => p.status === 'finalizado').length,
      icon: <FileText className="w-6 h-6 text-blue-600" />,
      bg: 'bg-blue-50',
      sub: 'prontos para exportar',
    },
  ];

  if (!authLoading && !empresa) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto pt-16">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Conta não configurada</h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Sua conta foi criada mas os dados da empresa ainda não foram registrados no banco.
            Isso acontece quando há um problema de configuração no Supabase.
          </p>
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Para corrigir, execute este SQL no Supabase:</h3>
            <div className="bg-gray-900 rounded-xl p-4 text-xs text-green-400 font-mono overflow-x-auto">
              <pre>{`DROP POLICY IF EXISTS "admin_all_empresas" ON empresas;
DROP POLICY IF EXISTS "admin_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admin_all_projetos" ON projetos;
DROP POLICY IF EXISTS "admin_all_parcelas" ON parcelas;
DROP POLICY IF EXISTS "admin_all_arvores" ON arvores;
DROP POLICY IF EXISTS "admin_all_resultados" ON resultados;

CREATE POLICY "admin_all_empresas" ON empresas FOR ALL
  USING (auth.email() = 'admin@ambisafe.com.br')
  WITH CHECK (auth.email() = 'admin@ambisafe.com.br');

CREATE POLICY "admin_all_profiles" ON profiles FOR ALL
  USING (auth.email() = 'admin@ambisafe.com.br')
  WITH CHECK (auth.email() = 'admin@ambisafe.com.br');

CREATE POLICY "admin_all_projetos" ON projetos FOR ALL
  USING (auth.email() = 'admin@ambisafe.com.br')
  WITH CHECK (auth.email() = 'admin@ambisafe.com.br');

CREATE POLICY "admin_all_parcelas" ON parcelas FOR ALL
  USING (auth.email() = 'admin@ambisafe.com.br')
  WITH CHECK (auth.email() = 'admin@ambisafe.com.br');

CREATE POLICY "admin_all_arvores" ON arvores FOR ALL
  USING (auth.email() = 'admin@ambisafe.com.br')
  WITH CHECK (auth.email() = 'admin@ambisafe.com.br');

CREATE POLICY "admin_all_resultados" ON resultados FOR ALL
  USING (auth.email() = 'admin@ambisafe.com.br')
  WITH CHECK (auth.email() = 'admin@ambisafe.com.br');`}</pre>
            </div>
            <p className="text-xs text-gray-500">
              Após executar o SQL, clique em &quot;Recarregar&quot; para tentar novamente.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-[#0B3D2E] hover:bg-[#0B3D2E]/90 text-white gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar página
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Cabeçalho verde (celular e computador) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#00420d] via-[#0B5A1E] to-[#16A34A] text-white p-5 md:p-8 mb-5 md:mb-6 shadow-lg md:flex md:items-center md:justify-between md:gap-6">
        <div className="absolute -top-10 -right-10 w-40 h-40 md:w-72 md:h-72 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-16 right-40 w-48 h-48 rounded-full bg-[#acd115]/10 pointer-events-none hidden md:block" />
        <div className="relative">
          <p className="text-white/70 text-sm">{empresa?.name}</p>
          <h1 className="text-2xl md:text-3xl font-bold mt-0.5">Olá, {profile?.name?.split(' ')[0] || 'Bem-vindo'} 👋</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#acd115] text-[#00420d]">
              {empresa?.plan === 'trial' ? 'Período de trial' : 'Plano Profissional'}
            </span>
            <span className="hidden md:inline text-white/70 text-sm">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
        </div>
        <div className="relative flex gap-3 mt-4 md:mt-0 flex-shrink-0">
          <button
            onClick={() => navigate('/app/relatorios')}
            className="hidden md:flex h-12 px-5 rounded-xl border border-white/30 text-white font-semibold items-center gap-2 hover:bg-white/10 transition-colors"
          >
            <FileText className="w-5 h-5" /> Relatórios
          </button>
          <button
            onClick={() => navigate('/app/projetos/novo')}
            className="w-full md:w-auto h-12 md:px-6 rounded-xl bg-white text-[#00420d] font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all"
          >
            <Plus className="w-5 h-5" /> Novo Inventário
          </button>
        </div>
      </div>

      {/* Onboarding checklist for new users */}
      {!loading && <OnboardingCard projetos={projetos} />}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5 md:mb-8">
        {stats.map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm rounded-2xl md:hover:shadow-md md:hover:-translate-y-0.5 transition-all">
            <CardContent className="p-3.5 md:p-5 flex md:block items-center gap-3">
              <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl ${stat.bg} flex items-center justify-center md:mb-3 flex-shrink-0`}>
                {stat.icon}
              </div>
              <div className="min-w-0">
                {loading ? <Bone className="h-6 md:h-7 w-14 md:w-16 mb-1" /> : <p className="text-lg md:text-2xl font-bold text-gray-900 leading-tight truncate">{stat.value}</p>}
                <p className="text-[11px] md:text-xs text-gray-500 md:mt-0.5 leading-snug">{stat.title}</p>
                <p className="hidden md:block text-xs text-gray-400 mt-1">{stat.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Inventários + coluna lateral (computador) */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
      <Card className="border-0 shadow-sm rounded-2xl lg:col-span-2">
        <CardHeader className="pb-4 px-4 md:px-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Meus Inventários</CardTitle>
              <CardDescription>Todos os seus projetos de inventário florestal</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 md:px-6">
          {loading ? (
            <ListSkeleton rows={3} />
          ) : projetos.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-xl">
              <Trees className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-700 mb-2">Nenhum inventário ainda</h3>
              <p className="text-gray-400 text-sm mb-6">
                Crie seu primeiro projeto de inventário florestal
              </p>
              <Button
                onClick={() => navigate('/app/projetos/novo')}
                className="bg-[#0B3D2E] hover:bg-[#0B3D2E]/90 text-white gap-2"
              >
                <Plus className="w-4 h-4" />
                Criar Primeiro Inventário
              </Button>
            </div>
          ) : (
            <ErrorBoundary section="Lista de Projetos">
            <div className="space-y-3">
              {projetos.map(projeto => {
                const statusCfg = STATUS_CONFIG[projeto.status] || STATUS_CONFIG['rascunho'];
                return (
                  <div
                    key={projeto.id}
                    onClick={() => navigate(`/app/projetos/${projeto.id}`)}
                    className="flex items-center gap-3 md:gap-4 p-3.5 md:p-4 rounded-xl border border-gray-100 hover:border-[#16A34A]/30 hover:bg-gray-50 active:bg-gray-50 cursor-pointer transition-all group"
                  >
                    <div className="w-11 h-11 bg-[#0B3D2E]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Trees className="w-5 h-5 text-[#0B3D2E]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-semibold text-gray-900 leading-snug line-clamp-2 md:truncate">{projeto.nome}</h4>
                        <Badge
                          variant="outline"
                          className={`hidden md:inline-flex flex-shrink-0 text-xs gap-1 ${statusCfg.color}`}
                        >
                          {statusCfg.icon}
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-x-3 gap-y-1.5 text-xs text-gray-400 flex-wrap mt-1 md:mt-0">
                        <Badge
                          variant="outline"
                          className={`md:hidden text-[11px] gap-1 px-2 py-0 ${statusCfg.color}`}
                        >
                          {statusCfg.icon}
                          {statusCfg.label}
                        </Badge>
                        {projeto.municipio && (
                          <span>{projeto.municipio}{projeto.estado ? `/${projeto.estado}` : ''}</span>
                        )}
                        {projeto.area_total_ha && (
                          <span>{projeto.area_total_ha.toLocaleString('pt-BR')} ha</span>
                        )}
                        {projeto.tipo_inventario && (
                          <span>{TIPO_LABEL[projeto.tipo_inventario] || projeto.tipo_inventario}</span>
                        )}
                        {projeto.motivo_inventario && (
                          <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                            {MOTIVO_LABEL[projeto.motivo_inventario] || projeto.motivo_inventario}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="hidden sm:block text-right">
                        <ScoreBadge score={projeto.score} />
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(projeto.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#16A34A] transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
            </ErrorBoundary>
          )}
        </CardContent>
      </Card>

        {/* Coluna lateral (computador) */}
        <aside className="hidden lg:flex flex-col gap-6">
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Atalhos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {[
                { label: 'Meus projetos', icon: <Trees className="w-5 h-5" />, onClick: () => navigate('/app/projetos'), destaque: true },
                { label: 'Banco de espécies', icon: <Leaf className="w-5 h-5" />, onClick: () => navigate('/app/especies') },
                { label: 'Relatórios', icon: <FileText className="w-5 h-5" />, onClick: () => navigate('/app/relatorios') },
                { label: 'Central de ajuda', icon: <HelpCircle className="w-5 h-5" />, onClick: () => window.dispatchEvent(new Event('ambisafe:ajuda')) },
              ].map(a => (
                <button
                  key={a.label}
                  onClick={a.onClick}
                  className={`flex flex-col items-start gap-3 p-4 rounded-xl text-left text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md ${
                    a.destaque ? 'bg-[#00420d] text-white' : 'bg-gray-50 text-gray-800 hover:bg-white border border-gray-100'
                  }`}
                >
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${a.destaque ? 'bg-[#acd115] text-[#00420d]' : 'bg-[#0B3D2E]/10 text-[#0B3D2E]'}`}>
                    {a.icon}
                  </span>
                  {a.label}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Inventários por status</CardTitle>
              <CardDescription>{projetos.length} no total</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(['finalizado', 'processado', 'rascunho'] as const).map(st => {
                const qtd = projetos.filter(p => (p.status || 'rascunho') === st).length;
                const pct = projetos.length ? Math.round((qtd / projetos.length) * 100) : 0;
                const cfg = STATUS_CONFIG[st];
                const barra = st === 'finalizado' ? 'bg-[#16A34A]' : st === 'processado' ? 'bg-blue-500' : 'bg-gray-400';
                return (
                  <div key={st}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="flex items-center gap-2 text-gray-700">{cfg.icon}{cfg.label}</span>
                      <span className="font-semibold text-gray-900">{loading ? '…' : qtd}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full rounded-full ${barra} transition-all duration-700`} style={{ width: `${loading ? 0 : pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
