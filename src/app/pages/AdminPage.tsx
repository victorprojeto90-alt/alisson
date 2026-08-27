import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Building2, Users, Trees, Crown, Clock, RefreshCw, Loader2,
  CheckCircle2, AlertTriangle, ShieldCheck, Search, TrendingUp,
  UserCheck, Briefcase, BarChart3, MessageCircleQuestion,
  DollarSign, Ban, ExternalLink, ShieldOff, LayoutDashboard, Wallet,
  Leaf, Settings2, X, Eye, CalendarClock,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { toast } from 'sonner';
import { PLANOS } from '../lib/planos';
import { BANCO_ESPECIES, BIOMA_LABEL } from './Especies';
import { projectId } from '/utils/supabase/info';
import packageJson from '../../../package.json';

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
  // Campos de cobrança (Asaas) — undefined até a migração SQL rodar.
  asaas_customer_id?: string | null;
  plan_type?: string | null;
  is_blocked?: boolean | null;
  block_reason?: string | null;
  plan_expires_at?: string | null;
  ultimo_pagamento_at?: string | null;
  profiles: {
    id: string;
    name: string;
    role: string;
    tipo_usuario?: string;
    telefone?: string | null;
    cpf_cnpj?: string | null;
    cidade?: string | null;
    estado_uf?: string | null;
  }[];
  projetos: { id: string; status: string }[];
}

const PLANOS_PAGOS = ['mensal', 'trimestral', 'semestral', 'anual'];
const PLANO_POR_ID = Object.fromEntries(PLANOS.map(p => [p.id, p]));

// Mascara CPF/CNPJ mantendo a pontuação original, só os últimos 2 dígitos visíveis.
function maskCpfCnpj(v: string): string {
  const digitsOnly = v.replace(/\D/g, '');
  const total = digitsOnly.length;
  let seen = 0;
  return v.replace(/\d/g, () => {
    seen++;
    return seen > total - 2 ? digitsOnly[seen - 1] : '*';
  });
}

type Secao = 'dashboard' | 'clientes' | 'financeiro' | 'especies' | 'sistema';

const SECOES: { id: Secao; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'financeiro', label: 'Financeiro', icon: Wallet },
  { id: 'especies', label: 'Banco de Espécies', icon: Leaf },
  { id: 'sistema', label: 'Sistema', icon: Settings2 },
];

export default function AdminPage() {
  const { user } = useAuth();
  const [secao, setSecao] = useState<Secao>('dashboard');
  const [empresas, setEmpresas] = useState<EmpresaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState<'all' | 'trial' | 'profissional' | 'pagante' | 'bloqueado'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [helpQuestions, setHelpQuestions] = useState<HelpQuestion[]>([]);
  const [detalheEmpresa, setDetalheEmpresa] = useState<EmpresaAdmin | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [empresasRes, helpRes] = await Promise.all([
      supabase
        .from('empresas')
        .select('*, profiles(id, name, role, tipo_usuario, telefone, cpf_cnpj, cidade, estado_uf), projetos(id, status)')
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

  const toggleBloqueio = async (empresaAlvo: EmpresaAdmin) => {
    setUpdatingId(empresaAlvo.id);
    const bloquear = !empresaAlvo.is_blocked;
    const { error } = await supabase
      .from('empresas')
      .update({
        is_blocked: bloquear,
        block_reason: bloquear ? 'Bloqueado manualmente pelo admin' : null,
      })
      .eq('id', empresaAlvo.id);
    setUpdatingId(null);
    if (error) toast.error('Erro ao atualizar bloqueio: ' + error.message);
    else { toast.success(bloquear ? 'Empresa bloqueada.' : 'Empresa desbloqueada.'); load(); }
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
  // "Processados este mês" ficou de fora: `projetos` só traz {id, status} no select
  // atual (sem data de processamento), não dá pra filtrar por mês sem estender a
  // query e sem um campo de "processado_em" na tabela — não inventei esse dado.

  // Financeiro (Asaas) — plan_type/is_blocked só existem depois da migração SQL rodar;
  // até lá esses cálculos ficam zerados sem quebrar o resto da tela.
  const pagantes = empresas.filter(e => e.plan_type && PLANOS_PAGOS.includes(e.plan_type));
  const bloqueados = empresas.filter(e => e.is_blocked);
  const mrr = pagantes.reduce((acc, e) => acc + (PLANO_POR_ID[e.plan_type!]?.preco ?? 0), 0);
  const trialParaPagoP = total > 0 ? Math.round((pagantes.length / total) * 100) : 0;
  const mrrPorPlano = PLANOS.map(p => ({
    plano: p,
    qtd: empresas.filter(e => e.plan_type === p.id).length,
    receita: empresas.filter(e => e.plan_type === p.id).length * p.preco,
  })).filter(p => p.qtd > 0);

  // Inadimplentes: sinalizados pelo webhook (PAYMENT_OVERDUE) mas ainda não bloqueados,
  // ou já bloqueados por atraso de pagamento (não por trial expirado/ação manual).
  const inadimplentes = empresas.filter(e =>
    e.block_reason === 'Pagamento em atraso' ||
    (e.is_blocked && e.plan_type && PLANOS_PAGOS.includes(e.plan_type) && e.block_reason !== 'Bloqueado manualmente pelo admin')
  );

  // Próximas cobranças — plan_expires_at nos próximos 7 dias
  const proximasCobrancas = empresas.filter(e => {
    if (!e.plan_expires_at) return false;
    const venc = new Date(e.plan_expires_at);
    const em7dias = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return venc >= new Date() && venc <= em7dias;
  }).sort((a, b) => new Date(a.plan_expires_at!).getTime() - new Date(b.plan_expires_at!).getTime());

  // Cadastros por mês (últimos 6 meses) — pro gráfico do Dashboard
  const cadastrosPorMes = useMemo(() => {
    const agora = new Date();
    const meses: { chave: string; mes: string; cadastros: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      meses.push({
        chave: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        mes: d.toLocaleDateString('pt-BR', { month: 'short' }),
        cadastros: 0,
      });
    }
    for (const e of empresas) {
      const d = new Date(e.created_at);
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const alvo = meses.find(m => m.chave === chave);
      if (alvo) alvo.cadastros++;
    }
    return meses;
  }, [empresas]);

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
      (filterPlan === 'trial' && e.plan !== 'profissional') ||
      (filterPlan === 'pagante' && !!e.plan_type && PLANOS_PAGOS.includes(e.plan_type)) ||
      (filterPlan === 'bloqueado' && !!e.is_blocked);
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
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
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

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar de seções */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="flex lg:flex-col gap-1 bg-[#00420d] rounded-2xl p-2 overflow-x-auto">
            {SECOES.map(s => (
              <button
                key={s.id}
                onClick={() => setSecao(s.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  secao === s.id ? 'bg-white text-[#00420d]' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <s.icon className="w-4 h-4 flex-shrink-0" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0 space-y-6">
          {secao === 'dashboard' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Empresas', value: total, icon: Building2, color: 'text-[#0B3D2E]', bg: 'bg-[#0B3D2E]/10' },
                  { label: 'Usuários', value: totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Plano Pro', value: totalPro, icon: Crown, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Trial Ativo', value: totalTrial - totalExpired, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                  { label: 'Trial Exp.', value: totalExpired, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
                  { label: 'Inventários', value: totalProjects, icon: Trees, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Processados', value: totalProcessed, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'Bloqueados', value: bloqueados.length, icon: Ban, color: 'text-red-600', bg: 'bg-red-50' },
                  { label: 'Espécies no Banco', value: BANCO_ESPECIES.length, icon: Leaf, color: 'text-lime-700', bg: 'bg-lime-50' },
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
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-lg font-bold text-green-700">Operacional</p>
                    <p className="text-xs text-gray-500">Status do sistema</p>
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico de cadastros por mês */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-700">Novos Cadastros — Últimos 6 Meses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cadastrosPorMes}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v: number) => [`${v} cadastro${v !== 1 ? 's' : ''}`, '']} />
                        <Bar dataKey="cadastros" fill="#00420d" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cadastros Recentes */}
                <Card className="border-0 shadow-sm lg:col-span-2">
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

                {/* Perguntas por tela */}
                {helpQuestions.length > 0 && (
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
                )}
              </div>

              {/* Satisfação + Últimas perguntas */}
              {helpQuestions.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-gray-700">Satisfação</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const withFeedback = helpQuestions.filter(q => q.helpful !== null);
                        const positive = withFeedback.filter(q => q.helpful === true).length;
                        const totalPerguntas = helpQuestions.length;
                        const pct = withFeedback.length > 0 ? Math.round((positive / withFeedback.length) * 100) : 0;
                        return (
                          <div className="space-y-3 text-center">
                            <p className="text-4xl font-bold text-[#0B3D2E]">{totalPerguntas}</p>
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
            </>
          )}

          {secao === 'clientes' && (
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
                      {(['all', 'profissional', 'pagante', 'trial', 'bloqueado'] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => setFilterPlan(p)}
                          className={`px-3 py-1.5 font-medium transition-colors ${
                            filterPlan === p
                              ? 'bg-[#0B3D2E] text-white'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {p === 'all' ? 'Todos' : p === 'profissional' ? 'Pro' : p === 'pagante' ? 'Pagantes' : p === 'trial' ? 'Trial' : 'Bloqueados'}
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
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">CPF/CNPJ</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Projetos</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Plano</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Trial</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Último Pagamento</th>
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
                        const cpfCnpj = emp.profiles?.[0]?.cpf_cnpj ?? emp.cnpj;

                        return (
                          <tr key={emp.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                            <td className="px-4 py-3">
                              <button onClick={() => setDetalheEmpresa(emp)} className="text-left hover:underline">
                                <p className="font-medium text-gray-900 text-sm">{emp.name}</p>
                                {emp.profiles?.[0]?.name && (
                                  <p className="text-xs text-gray-400">{emp.profiles[0].name}</p>
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                {tipoUsuario === 'empresa'
                                  ? <><Briefcase className="w-3 h-3" /> Empresa</>
                                  : <><UserCheck className="w-3 h-3" /> Pessoa Física</>
                                }
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                              {cpfCnpj ? maskCpfCnpj(cpfCnpj) : '—'}
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
                              {emp.is_blocked ? (
                                <Badge className="bg-red-50 text-red-700 border-red-200 border text-xs gap-1 font-normal">
                                  <Ban className="w-3 h-3" /> Bloqueado
                                </Badge>
                              ) : emp.plan_type && PLANOS_PAGOS.includes(emp.plan_type) ? (
                                <Badge className="bg-green-50 text-green-700 border-green-200 border text-xs gap-1 font-normal">
                                  <Crown className="w-3 h-3" /> {PLANO_POR_ID[emp.plan_type]?.nome ?? emp.plan_type}
                                </Badge>
                              ) : emp.plan === 'profissional' ? (
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
                            <td className="px-4 py-3 text-xs text-gray-500">
                              {emp.ultimo_pagamento_at
                                ? new Date(emp.ultimo_pagamento_at).toLocaleDateString('pt-BR')
                                : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400">
                              {new Date(emp.created_at).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-4 py-3">
                              {isUpdating ? (
                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                              ) : (
                                <div className="flex items-center gap-1 flex-wrap">
                                  <button
                                    onClick={() => setDetalheEmpresa(emp)}
                                    className="text-xs h-7 px-2 flex items-center gap-1 text-gray-400 hover:text-gray-700"
                                    title="Ver detalhes"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </button>
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
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className={`text-xs h-7 gap-1 ${emp.is_blocked ? 'border-green-200 text-green-600' : 'border-red-200 text-red-600'}`}
                                    onClick={() => toggleBloqueio(emp)}
                                    title={emp.is_blocked ? 'Desbloquear acesso' : 'Bloquear acesso'}
                                  >
                                    {emp.is_blocked ? <ShieldOff className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                                  </Button>
                                  {emp.asaas_customer_id && (
                                    <a
                                      href={`https://app.asaas.com/customer/${emp.asaas_customer_id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs h-7 px-2 flex items-center gap-1 text-gray-400 hover:text-gray-700"
                                      title="Ver cliente no Asaas"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
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
          )}

          {secao === 'financeiro' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'MRR', value: `R$ ${mrr.toFixed(2).replace('.', ',')}`, icon: DollarSign, color: 'text-green-700', bg: 'bg-green-50' },
                  { label: 'Pagantes', value: String(pagantes.length), icon: Crown, color: 'text-[#0B3D2E]', bg: 'bg-[#0B3D2E]/10' },
                  { label: 'Trial → Pago', value: `${trialParaPagoP}%`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Inadimplentes', value: String(inadimplentes.length), icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      MRR por Plano
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 pb-4">
                    {mrrPorPlano.length === 0 ? (
                      <p className="text-xs text-gray-400 px-4 pb-2">Nenhum assinante pago ainda.</p>
                    ) : (
                      <div className="px-4 space-y-2">
                        {mrrPorPlano.map(({ plano, qtd, receita }) => (
                          <div key={plano.id} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">{plano.nome} ({qtd})</span>
                            <span className="text-gray-800 font-semibold">R$ {receita.toFixed(2).replace('.', ',')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] text-gray-300 px-4 mt-3">
                      Gráfico de receita histórica requer endpoint de pagamentos do Asaas — não implementado ainda.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-blue-600" />
                      Próximas Cobranças (7 dias)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 pb-4">
                    {proximasCobrancas.length === 0 ? (
                      <p className="text-xs text-gray-400 px-4 pb-2">Nenhuma cobrança prevista nos próximos 7 dias.</p>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {proximasCobrancas.map(e => (
                          <div key={e.id} className="flex items-center justify-between px-4 py-2 text-xs">
                            <span className="text-gray-700">{e.name}</span>
                            <span className="text-gray-400">{new Date(e.plan_expires_at!).toLocaleDateString('pt-BR')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Clientes Inadimplentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {inadimplentes.length === 0 ? (
                    <p className="text-xs text-gray-400 px-4 pb-4">Nenhum cliente inadimplente no momento.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-y border-gray-100">
                          <tr>
                            <th className="px-4 py-2.5 text-left font-semibold text-gray-600 text-xs">Empresa</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-gray-600 text-xs">Plano</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-gray-600 text-xs">Vencimento</th>
                            <th className="px-4 py-2.5 text-left font-semibold text-gray-600 text-xs">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {inadimplentes.map(e => (
                            <tr key={e.id}>
                              <td className="px-4 py-2.5 text-sm text-gray-800">{e.name}</td>
                              <td className="px-4 py-2.5 text-xs text-gray-500">{PLANO_POR_ID[e.plan_type ?? '']?.nome ?? e.plan_type}</td>
                              <td className="px-4 py-2.5 text-xs text-gray-500">
                                {e.plan_expires_at ? new Date(e.plan_expires_at).toLocaleDateString('pt-BR') : '—'}
                              </td>
                              <td className="px-4 py-2.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7 border-red-200 text-red-600"
                                  onClick={() => toggleBloqueio(e)}
                                >
                                  Bloquear
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {secao === 'especies' && <AbaEspecies />}

          {secao === 'sistema' && <AbaSistema />}
        </div>
      </div>

      {/* Modal de detalhes do cliente */}
      {detalheEmpresa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetalheEmpresa(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{detalheEmpresa.name}</h3>
              <button onClick={() => setDetalheEmpresa(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-500">
                Responsável: <span className="text-gray-800 font-medium">{detalheEmpresa.profiles?.[0]?.name ?? '—'}</span>
              </p>
              <p className="text-xs text-gray-400">
                E-mail não disponível aqui — precisa do endpoint admin (auth.admin), não implementado ainda.
              </p>
              {(detalheEmpresa.profiles?.[0]?.cpf_cnpj ?? detalheEmpresa.cnpj) && (
                <p className="text-gray-500">
                  CPF/CNPJ: <span className="text-gray-800 font-mono">{maskCpfCnpj((detalheEmpresa.profiles?.[0]?.cpf_cnpj ?? detalheEmpresa.cnpj)!)}</span>
                </p>
              )}
              <p className="text-gray-500">
                Plano: <span className="text-gray-800 font-medium">
                  {detalheEmpresa.plan_type && PLANOS_PAGOS.includes(detalheEmpresa.plan_type)
                    ? PLANO_POR_ID[detalheEmpresa.plan_type]?.nome
                    : detalheEmpresa.plan === 'profissional' ? 'Profissional' : 'Trial'}
                </span>
              </p>
              <p className="text-gray-500">
                Cadastro: <span className="text-gray-800">{new Date(detalheEmpresa.created_at).toLocaleDateString('pt-BR')}</span>
              </p>
              <p className="text-gray-500">
                Projetos: <span className="text-gray-800">{detalheEmpresa.projetos?.length ?? 0} criados</span>
              </p>
              <p className="text-gray-500">
                Último pagamento: <span className="text-gray-800">
                  {detalheEmpresa.ultimo_pagamento_at ? new Date(detalheEmpresa.ultimo_pagamento_at).toLocaleDateString('pt-BR') : '—'}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              <Button size="sm" variant="outline" className="text-xs" onClick={() => extendTrial(detalheEmpresa.id)}>
                Estender Trial
              </Button>
              <Button
                size="sm"
                variant="outline"
                className={`text-xs ${detalheEmpresa.is_blocked ? 'border-green-200 text-green-600' : 'border-red-200 text-red-600'}`}
                onClick={() => { toggleBloqueio(detalheEmpresa); setDetalheEmpresa(null); }}
              >
                {detalheEmpresa.is_blocked ? 'Desbloquear' : 'Bloquear'}
              </Button>
              {detalheEmpresa.asaas_customer_id && (
                <a
                  href={`https://app.asaas.com/customer/${detalheEmpresa.asaas_customer_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> Ver no Asaas
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Aba Banco de Espécies (leitura) ───────────────────────────────────────
// BANCO_ESPECIES é um array estático embutido no bundle (ver Especies.tsx) — não
// existe tabela `species_database` no Supabase. Por isso esta aba é só consulta;
// adicionar/editar/remover/importar CSV exigiria migrar esses dados para uma
// tabela real primeiro (nova migração + refatorar Especies.tsx pra ler do banco
// em vez do array estático), o que não foi feito aqui.
function AbaEspecies() {
  const [busca, setBusca] = useState('');
  const [bioma, setBioma] = useState('all');

  const filtradas = BANCO_ESPECIES.filter(e => {
    const matchBioma = bioma === 'all' || e.bioma === bioma;
    const matchBusca = !busca ||
      e.nome_popular.toLowerCase().includes(busca.toLowerCase()) ||
      e.nome_cientifico.toLowerCase().includes(busca.toLowerCase());
    return matchBioma && matchBusca;
  });

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base">Banco de Espécies ({filtradas.length} de {BANCO_ESPECIES.length})</CardTitle>
            <p className="text-xs text-gray-400 mt-1">
              Somente leitura — os dados vêm de um array estático no código, não de uma tabela no banco.
              Adicionar/editar/remover/importar CSV exige migrar isso para o Supabase primeiro.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar espécie..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="pl-9 h-8 text-sm w-52"
              />
            </div>
            <Select value={bioma} onValueChange={setBioma}>
              <SelectTrigger className="h-8 text-xs w-40">
                <SelectValue placeholder="Bioma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os biomas</SelectItem>
                {Object.entries(BIOMA_LABEL).map(([id, label]) => (
                  <SelectItem key={id} value={id}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-y border-gray-100 sticky top-0">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 text-xs">Nome Popular</th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 text-xs">Nome Científico</th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 text-xs">Família</th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-600 text-xs">Bioma</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtradas.map((e, i) => (
                <tr key={`${e.nome_popular}-${i}`}>
                  <td className="px-4 py-2 text-sm text-gray-800">{e.nome_popular}</td>
                  <td className="px-4 py-2 text-sm italic text-gray-500">{e.nome_cientifico}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{e.familia}</td>
                  <td className="px-4 py-2">
                    <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full">
                      {BIOMA_LABEL[e.bioma] ?? e.bioma}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Aba Sistema ────────────────────────────────────────────────────────────
function AbaSistema() {
  const [statusServer, setStatusServer] = useState<'checando' | 'ok' | 'erro'>('checando');
  const [statusAsaasProxy, setStatusAsaasProxy] = useState<'checando' | 'ok' | 'erro'>('checando');

  useEffect(() => {
    const base = `https://${projectId}.supabase.co/functions/v1`;
    fetch(`${base}/make-server-eed79e88/health`).then(r => setStatusServer(r.ok ? 'ok' : 'erro')).catch(() => setStatusServer('erro'));
    fetch(`${base}/asaas-proxy/health`).then(r => setStatusAsaasProxy(r.ok ? 'ok' : 'erro')).catch(() => setStatusAsaasProxy('erro'));
  }, []);

  const statusBadge = (s: 'checando' | 'ok' | 'erro') => {
    if (s === 'checando') return <Badge variant="outline" className="text-gray-500 border-gray-200 bg-gray-50 gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Checando</Badge>;
    if (s === 'ok') return <Badge className="bg-green-50 text-green-700 border-green-200 border gap-1"><CheckCircle2 className="w-3 h-3" /> Online</Badge>;
    return <Badge className="bg-red-50 text-red-700 border-red-200 border gap-1"><AlertTriangle className="w-3 h-3" /> Offline / não deployada</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700">Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between py-1.5 border-b border-gray-50">
            <span className="text-gray-500">Versão do app</span>
            <span className="text-gray-800 font-mono">{packageJson.version}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-50">
            <span className="text-gray-500">Edge Function — server (IA, admin)</span>
            {statusBadge(statusServer)}
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-gray-500">Edge Function — asaas-proxy</span>
            {statusBadge(statusAsaasProxy)}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700">Variáveis de Ambiente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-400">
            Não é possível checar a presença de secrets do servidor (GEMINI_API_KEY, ASAAS_API_KEY,
            ASAAS_WEBHOOK_TOKEN, SUPABASE_SERVICE_ROLE_KEY) a partir do navegador — isso é intencional,
            é exatamente o que os mantém seguros. Confira no painel do Supabase em Edge Functions → Secrets.
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700">Últimos Erros</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-400">
            Ainda não existe uma tabela de log de erros no Supabase — os erros só aparecem no console do
            navegador de cada usuário (ver ErrorBoundary) e nos logs de cada Edge Function no painel do
            Supabase. Um log centralizado exigiria uma tabela nova + captura nos ErrorBoundary.
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700">Manutenção</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              try { localStorage.clear(); sessionStorage.clear(); } catch { /* ignora se bloqueado pelo navegador */ }
              toast.success('Cache local limpo.');
            }}
          >
            Limpar cache local
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
