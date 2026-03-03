import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Building2, Users, Trees, Crown, Clock, RefreshCw, Loader2,
  CheckCircle2, AlertTriangle, ShieldCheck, Search, TrendingUp,
  UserCheck, Briefcase, BarChart3, Mail, MessageCircleQuestion,
} from 'lucide-react';
import { toast } from 'sonner';

interface HelpQuestion {
  id: string;
  page: string;
  question: string;
  helpful: boolean | null;
  created_at: string;
}

interface EmpresaAdmin {
  id: string;
  name: string;
  plan: string;
  trial_ends_at: string | null;
  created_at: string;
  owner_id: string;
  telefone?: string | null;
  cnpj?: string | null;
  cidade?: string | null;
  estado_uf?: string | null;
  profiles: { id: string; name: string; role: string; tipo_usuario?: string; email?: string }[];
  projetos: { id: string; status: string }[];
}

export default function AdminPage() {
  const { user } = useAuth();
  const [empresas, setEmpresas] = useState<EmpresaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState<'all' | 'trial' | 'profissional'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [helpQuestions, setHelpQuestions] = useState<HelpQuestion[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [empresasRes, helpRes] = await Promise.all([
      supabase
        .from('empresas')
        .select('*, profiles(id, name, role, tipo_usuario), projetos(id, status)')
        .order('created_at', { ascending: false }),
      supabase
        .from('help_questions')
        .select('id, page, question, helpful, created_at')
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    if (empresasRes.error) {
      toast.error('Erro ao carregar dados. Execute o SQL de políticas admin no Supabase.');
      console.error(empresasRes.error);
    } else {
      setEmpresas(empresasRes.data ?? []);
    }
    if (!helpRes.error) {
      setHelpQuestions(helpRes.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const changePlan = async (empresaId: string, newPlan: string) => {
    setUpdatingId(empresaId);
    const trialEndsAt = newPlan === 'trial'
      ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const update: Record<string, string | null> = { plan: newPlan };
    if (trialEndsAt !== undefined) update.trial_ends_at = trialEndsAt;

    const { error } = await supabase
      .from('empresas')
      .update(update)
      .eq('id', empresaId);

    setUpdatingId(null);
    if (error) toast.error('Erro ao atualizar plano: ' + error.message);
    else {
      toast.success(`Plano atualizado para ${newPlan === 'profissional' ? 'Profissional' : 'Trial'}!`);
      load();
    }
  };

  const extendTrial = async (empresaId: string) => {
    setUpdatingId(empresaId);
    const newDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from('empresas')
      .update({ trial_ends_at: newDate })
      .eq('id', empresaId);
    setUpdatingId(null);
    if (error) toast.error('Erro: ' + error.message);
    else { toast.success('Trial estendido por 30 dias!'); load(); }
  };

  // Stats
  const total = empresas.length;
  const totalPro = empresas.filter(e => e.plan === 'profissional').length;
  const totalTrial = empresas.filter(e => e.plan !== 'profissional').length;
  const totalExpired = empresas.filter(e => {
    if (e.plan === 'profissional') return false;
    return e.trial_ends_at ? new Date(e.trial_ends_at) < new Date() : false;
  }).length;
  const totalUsers = empresas.reduce((acc, e) => acc + (e.profiles?.length ?? 0), 0);
  const totalProjects = empresas.reduce((acc, e) => acc + (e.projetos?.length ?? 0), 0);
  const totalProcessed = empresas.reduce((acc, e) =>
    acc + (e.projetos?.filter(p => p.status !== 'rascunho').length ?? 0), 0);

  // Recent 5 signups
  const recentSignups = [...empresas]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Filtered
  const filtered = empresas.filter(e => {
    const matchSearch = !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.profiles?.some(p => p.name?.toLowerCase().includes(search.toLowerCase()));
    const matchPlan = filterPlan === 'all' || e.plan === filterPlan ||
      (filterPlan === 'trial' && e.plan !== 'profissional');
    return matchSearch && matchPlan;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400/20 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Painel Superadmin</h1>
            <p className="text-gray-400 text-sm">{user?.email}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {[
          { label: 'Empresas', value: total, icon: Building2, color: 'text-[#0B3D2E]', bg: 'bg-[#0B3D2E]/10' },
          { label: 'Usuários', value: totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Plano Pro', value: totalPro, icon: Crown, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Trial Ativo', value: totalTrial - totalExpired, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Trial Exp.', value: totalExpired, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Inventários', value: totalProjects, icon: Trees, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Processados', value: totalProcessed, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Futuros: Receita, Email MKT, etc. */}
        <Card className="border-0 shadow-sm border-dashed border-2 border-gray-200 col-span-1">
          <CardContent className="p-6 flex flex-col items-center justify-center h-32 text-center">
            <TrendingUp className="w-8 h-8 text-gray-200 mb-2" />
            <p className="text-sm text-gray-400 font-medium">Receita / Pagamentos</p>
            <p className="text-xs text-gray-300">Em breve — integração Stripe</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm border-dashed border-2 border-gray-200 col-span-1">
          <CardContent className="p-6 flex flex-col items-center justify-center h-32 text-center">
            <Mail className="w-8 h-8 text-gray-200 mb-2" />
            <p className="text-sm text-gray-400 font-medium">E-mail Marketing</p>
            <p className="text-xs text-gray-300">Em breve — integração Resend/Mailchimp</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm border-dashed border-2 border-gray-200 col-span-1">
          <CardContent className="p-6 flex flex-col items-center justify-center h-32 text-center">
            <BarChart3 className="w-8 h-8 text-gray-200 mb-2" />
            <p className="text-sm text-gray-400 font-medium">Analytics Avançado</p>
            <p className="text-xs text-gray-300">Em breve — gráficos de crescimento</p>
          </CardContent>
        </Card>

        {/* Cadastros Recentes */}
        <Card className="border-0 shadow-sm lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Cadastros Recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {recentSignups.map(emp => (
                <div key={emp.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 bg-[#0B3D2E]/10 rounded-full flex items-center justify-center text-[#0B3D2E] font-bold text-sm flex-shrink-0">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{emp.name}</p>
                    <p className="text-xs text-gray-400">{emp.profiles?.[0]?.name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      variant="outline"
                      className={emp.plan === 'profissional'
                        ? 'text-green-600 border-green-200 bg-green-50 text-xs'
                        : 'text-yellow-600 border-yellow-200 bg-yellow-50 text-xs'
                      }
                    >
                      {emp.plan === 'profissional' ? 'Pro' : 'Trial'}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(emp.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics de Ajuda */}
      {helpQuestions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Perguntas por tela */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <MessageCircleQuestion className="w-4 h-4 text-[#16A34A]" />
                Perguntas por Tela
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-4">
              {(() => {
                const counts: Record<string, number> = {};
                helpQuestions.forEach(q => {
                  counts[q.page] = (counts[q.page] ?? 0) + 1;
                });
                const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
                const max = sorted[0]?.[1] ?? 1;
                return (
                  <div className="px-4 space-y-2">
                    {sorted.map(([page, count]) => (
                      <div key={page}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 capitalize">{page}</span>
                          <span className="text-gray-400 font-medium">{count}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-[#16A34A] h-1.5 rounded-full"
                            style={{ width: `${(count / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Stats de satisfação */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Satisfação</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const withFeedback = helpQuestions.filter(q => q.helpful !== null);
                const positive = withFeedback.filter(q => q.helpful === true).length;
                const total = helpQuestions.length;
                const pct = withFeedback.length > 0 ? Math.round((positive / withFeedback.length) * 100) : 0;
                return (
                  <div className="space-y-3 text-center">
                    <p className="text-4xl font-bold text-[#0B3D2E]">{total}</p>
                    <p className="text-xs text-gray-400">perguntas totais</p>
                    <div className="border-t pt-3">
                      <p className="text-2xl font-bold text-[#16A34A]">{pct}%</p>
                      <p className="text-xs text-gray-400">avaliadas positivamente</p>
                      <p className="text-xs text-gray-300 mt-1">({withFeedback.length} avaliações)</p>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Últimas perguntas */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Últimas Perguntas</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-4">
              <div className="divide-y divide-gray-50">
                {helpQuestions.slice(0, 5).map(q => (
                  <div key={q.id} className="px-4 py-2.5">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded capitalize">
                        {q.page}
                      </span>
                      <span className="text-xs text-gray-300">
                        {new Date(q.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 line-clamp-2">{q.question}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Clientes Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base">Clientes ({filtered.length})</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar empresa ou usuário..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-8 text-sm w-52"
                />
              </div>
              <div className="flex border rounded-lg overflow-hidden text-xs">
                {(['all', 'profissional', 'trial'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setFilterPlan(p)}
                    className={`px-3 py-1.5 font-medium transition-colors ${
                      filterPlan === p
                        ? 'bg-[#0B3D2E] text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p === 'all' ? 'Todos' : p === 'profissional' ? 'Pro' : 'Trial'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-y border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Empresa / Responsável</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Projetos</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Plano</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Trial</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Cadastro</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((emp, i) => {
                  const trialEndsAt = emp.trial_ends_at ? new Date(emp.trial_ends_at) : null;
                  const trialExpired = trialEndsAt ? trialEndsAt < new Date() : false;
                  const trialDays = trialEndsAt
                    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                    : 0;
                  const isUpdating = updatingId === emp.id;
                  const tipoUsuario = emp.profiles?.[0]?.tipo_usuario ?? 'empresa';
                  const processados = emp.projetos?.filter(p => p.status !== 'rascunho').length ?? 0;

                  return (
                    <tr key={emp.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{emp.name}</p>
                          {emp.profiles?.[0]?.name && (
                            <p className="text-xs text-gray-400">{emp.profiles[0].name}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          {tipoUsuario === 'empresa'
                            ? <><Briefcase className="w-3 h-3" /> Empresa</>
                            : <><UserCheck className="w-3 h-3" /> Pessoa Física</>
                          }
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs">
                          <span className="text-gray-800 font-medium">{emp.projetos?.length ?? 0}</span>
                          <span className="text-gray-400"> total</span>
                          {processados > 0 && (
                            <span className="text-green-600 ml-1">· {processados} proc.</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {emp.plan === 'profissional' ? (
                          <Badge className="bg-green-50 text-green-700 border-green-200 border text-xs gap-1 font-normal">
                            <Crown className="w-3 h-3" /> Pro
                          </Badge>
                        ) : (
                          <Badge variant="outline" className={
                            trialExpired
                              ? 'text-red-600 border-red-200 bg-red-50 text-xs'
                              : 'text-yellow-600 border-yellow-200 bg-yellow-50 text-xs'
                          }>
                            {trialExpired ? 'Expirado' : 'Trial'}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {emp.plan !== 'profissional' && trialEndsAt ? (
                          trialExpired
                            ? <span className="text-red-500">Expirado</span>
                            : <span className="text-green-600">{trialDays}d restantes</span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(emp.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        ) : (
                          <div className="flex items-center gap-1 flex-wrap">
                            {emp.plan === 'profissional' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 border-gray-200 text-gray-600"
                                onClick={() => changePlan(emp.id, 'trial')}
                              >
                                Rebaixar
                              </Button>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  className="text-xs h-7 bg-[#16A34A] hover:bg-[#15803d] text-white gap-1"
                                  onClick={() => changePlan(emp.id, 'profissional')}
                                >
                                  <CheckCircle2 className="w-3 h-3" /> Ativar Pro
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7 border-blue-200 text-blue-600"
                                  onClick={() => extendTrial(emp.id)}
                                >
                                  +30d
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">
                  {total === 0
                    ? 'Nenhuma empresa. Execute o SQL das políticas admin no Supabase.'
                    : 'Nenhum resultado para o filtro aplicado.'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
