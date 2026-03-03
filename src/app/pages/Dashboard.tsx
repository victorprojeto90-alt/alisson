import { useState, useEffect } from 'react';
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
  Loader2,
  RefreshCw,
} from 'lucide-react';
import OnboardingCard from '../components/help/OnboardingCard';

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
  sistematico: 'Sistemático',
  estratificado: 'Estratificado',
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
    if (!empresa?.id) { setLoading(false); return; }
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
        const { data: res } = await supabase
          .from('resultados')
          .select('score')
          .eq('projeto_id', p.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        return { ...p, score: res?.score?.total ?? null };
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
      title: 'Área Total (ha)',
      value: projetos.reduce((s, p) => s + (p.area_total_ha ?? 0), 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
      icon: <TrendingUp className="w-6 h-6 text-[#0B3D2E]" />,
      bg: 'bg-emerald-50',
      sub: 'soma de todos projetos',
    },
    {
      title: 'Score Médio',
      value: (() => {
        const comScore = projetos.filter(p => p.score != null);
        if (comScore.length === 0) return '—';
        const avg = comScore.reduce((s, p) => s + (p.score ?? 0), 0) / comScore.length;
        return `${Math.round(avg)}/100`;
      })(),
      icon: <BarChart3 className="w-6 h-6 text-[#10B981]" />,
      bg: 'bg-teal-50',
      sub: 'AMBISAFE Score',
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Olá, {profile?.name?.split(' ')[0] || 'Bem-vindo'} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            {empresa?.name} · {empresa?.plan === 'trial' ? 'Período de trial' : 'Plano Profissional'}
          </p>
        </div>
        <Button
          onClick={() => navigate('/app/projetos/novo')}
          className="bg-[#0B3D2E] hover:bg-[#0B3D2E]/90 text-white gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Novo Inventário
        </Button>
      </div>

      {/* Onboarding checklist for new users */}
      {!loading && <OnboardingCard projetos={projetos} />}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.title}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Projects List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Meus Inventários</CardTitle>
              <CardDescription>Todos os seus projetos de inventário florestal</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#16A34A] mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Carregando projetos...</p>
            </div>
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
            <div className="space-y-3">
              {projetos.map(projeto => {
                const statusCfg = STATUS_CONFIG[projeto.status] || STATUS_CONFIG['rascunho'];
                return (
                  <div
                    key={projeto.id}
                    onClick={() => navigate(`/app/projetos/${projeto.id}`)}
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-[#16A34A]/30 hover:bg-gray-50 cursor-pointer transition-all group"
                  >
                    <div className="w-11 h-11 bg-[#0B3D2E]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Trees className="w-5 h-5 text-[#0B3D2E]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-semibold text-gray-900 truncate">{projeto.nome}</h4>
                        <Badge
                          variant="outline"
                          className={`flex-shrink-0 text-xs gap-1 ${statusCfg.color}`}
                        >
                          {statusCfg.icon}
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
