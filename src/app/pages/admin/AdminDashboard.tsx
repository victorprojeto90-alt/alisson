import { useState, useEffect, useMemo } from 'react';
import { PageSkeleton } from '../../components/ui/skeletons';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router';
import { useEmpresasAdmin, PLANOS_PAGOS, PLANO_POR_ID, emTrialAtivo } from './adminShared';
import { Secao, Etiqueta, Indicador, Vazio, brl, dataBR } from './adminUi';
import { PageHeader, HeaderStats, HeaderButton } from '../../components/layout/PageHeader';
import {
  Trees, DollarSign, TrendingUp, XCircle, AlertTriangle, MessageCircleQuestion, Users, ChevronRight, CreditCard,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface HelpQuestion {
  id: string;
  page: string;
  question: string;
  helpful: boolean | null;
  created_at: string;
}

export default function AdminDashboard() {
  const { empresas, loading } = useEmpresasAdmin();
  const navigate = useNavigate();
  const [helpQuestions, setHelpQuestions] = useState<HelpQuestion[]>([]);

  useEffect(() => {
    supabase
      .from('help_questions')
      .select('id, page, question, helpful, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => { if (!error) setHelpQuestions(data ?? []); });
  }, []);

  const total = empresas.length;
  const totalProjects = empresas.reduce((acc, e) => acc + (e.projetos?.length ?? 0), 0);
  const pagantes = empresas.filter(e => e.plan_type && PLANOS_PAGOS.includes(e.plan_type));
  const bloqueados = empresas.filter(e => e.is_blocked);
  const emTrial = empresas.filter(emTrialAtivo);
  const mrr = pagantes.reduce((acc, e) => acc + (PLANO_POR_ID[e.plan_type!]?.preco ?? 0), 0);
  const ticketMedio = pagantes.length > 0 ? mrr / pagantes.length : 0;
  const trialParaPagoP = total > 0 ? Math.round((pagantes.length / total) * 100) : 0;
  const cancelamentosSolicitados = empresas.filter(e => e.block_reason === 'Cancelamento solicitado pelo usuário').length;

  const inadimplentes = empresas.filter(e =>
    e.block_reason === 'Pagamento em atraso' ||
    (e.is_blocked && e.plan_type && PLANOS_PAGOS.includes(e.plan_type) && e.block_reason !== 'Bloqueado manualmente pelo admin')
  );

  const trialsExpirando = emTrial.filter(e => {
    if (!e.trial_ends_at) return false;
    const venc = new Date(e.trial_ends_at);
    const em3dias = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    return venc >= new Date() && venc <= em3dias;
  }).sort((a, b) => new Date(a.trial_ends_at!).getTime() - new Date(b.trial_ends_at!).getTime());

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

  const recentSignups = [...empresas]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  if (loading) {
    return <PageSkeleton />;
  }

  const planoDe = (e: typeof empresas[number]) =>
    e.plan_type && PLANOS_PAGOS.includes(e.plan_type) ? (PLANO_POR_ID[e.plan_type]?.nome ?? e.plan_type) : e.plan === 'profissional' ? 'Profissional' : 'Teste';

  const perguntasPorTela = (() => {
    const counts: Record<string, number> = {};
    helpQuestions.forEach(q => { counts[q.page] = (counts[q.page] ?? 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  })();
  const maxPerg = perguntasPorTela[0]?.[1] ?? 1;
  const nAlertas = trialsExpirando.length + inadimplentes.length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Painel administrativo"
        title="Visão geral"
        subtitle={`${total} contas cadastradas · ${totalProjects} inventários criados`}
        actions={<>
          <HeaderButton variant="outline" onClick={() => navigate('/admin/financeiro')}><CreditCard className="w-4 h-4" /> Financeiro</HeaderButton>
          <HeaderButton onClick={() => navigate('/admin/clientes')}><Users className="w-4 h-4" /> Clientes</HeaderButton>
        </>}
      >
        <HeaderStats
          items={[
            { label: 'Contas', value: total, active: true },
            { label: 'Pagantes', value: pagantes.length },
            { label: 'Em teste', value: emTrial.length },
            { label: 'Bloqueadas', value: bloqueados.length },
          ]}
        />
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-5 md:mb-6">
        <Indicador rotulo="Receita mensal (MRR)" valor={brl(mrr)} icone={<DollarSign className="w-5 h-5" />} />
        <Indicador rotulo="Ticket médio" valor={brl(ticketMedio)} icone={<DollarSign className="w-5 h-5" />} />
        <Indicador rotulo="Conversão teste → pago" valor={`${trialParaPagoP}%`} icone={<TrendingUp className="w-5 h-5" />} tom="azul" />
        <Indicador rotulo="Cancelamentos" valor={cancelamentosSolicitados} icone={<XCircle className="w-5 h-5" />} tom="vermelho" />
        <div className="col-span-2 lg:col-span-1">
          <Indicador rotulo="Inventários criados" valor={totalProjects} icone={<Trees className="w-5 h-5" />} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 md:gap-6 items-start">
        <div className="lg:col-span-2 space-y-5 md:space-y-6">
          <Secao titulo="Novos cadastros" descricao="Últimos 6 meses">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cadastrosPorMes} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f4f8f3' }} formatter={(v: number) => [`${v} cadastro${v !== 1 ? 's' : ''}`, '']} />
                  <Bar dataKey="cadastros" fill="#0B5A1E" radius={[6, 6, 0, 0]} maxBarSize={56} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Secao>

          <Secao
            titulo="Cadastros recentes"
            contagem={recentSignups.length}
            semPadding
            acoes={<button onClick={() => navigate('/admin/clientes')} className="text-xs font-semibold text-[#0B5A1E] hover:underline inline-flex items-center gap-0.5">Ver todos <ChevronRight className="w-3.5 h-3.5" /></button>}
          >
            {/* computador */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="ui-thead">
                  <tr>
                    <th className="px-6 py-3 text-left">Empresa</th>
                    <th className="px-4 py-3 text-left">Responsável</th>
                    <th className="px-4 py-3 text-left">Plano</th>
                    <th className="px-4 py-3 text-left">Cadastro</th>
                    <th className="px-6 py-3 text-left">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentSignups.map(emp => (
                    <tr key={emp.id}>
                      <td className="px-6 py-3 font-medium text-gray-900">{emp.name}</td>
                      <td className="px-4 py-3 text-gray-500">{emp.profiles?.[0]?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{planoDe(emp)}</td>
                      <td className="px-4 py-3 text-gray-500">{dataBR(emp.created_at)}</td>
                      <td className="px-6 py-3">{emp.is_blocked ? <Etiqueta tom="vermelho">Bloqueada</Etiqueta> : <Etiqueta tom="verde">Ativa</Etiqueta>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* celular */}
            <div className="md:hidden divide-y divide-gray-50">
              {recentSignups.map(emp => (
                <div key={emp.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{emp.name}</p>
                    <p className="text-xs text-gray-500">{planoDe(emp)} · {dataBR(emp.created_at)}</p>
                  </div>
                  {emp.is_blocked ? <Etiqueta tom="vermelho">Bloqueada</Etiqueta> : <Etiqueta tom="verde">Ativa</Etiqueta>}
                </div>
              ))}
            </div>
            {recentSignups.length === 0 && <Vazio>Nenhum cadastro ainda.</Vazio>}
          </Secao>
        </div>

        <div className="space-y-5 md:space-y-6">
          <Secao titulo="Atenção" contagem={nAlertas} icone={<AlertTriangle className="w-4 h-4" />} descricao="Pagamentos em atraso e testes acabando">
            {nAlertas === 0 ? (
              <Vazio>Nada pendente agora.</Vazio>
            ) : (
              <ul className="space-y-2">
                {inadimplentes.map(e => (
                  <li key={`inad-${e.id}`} className="flex items-center gap-3 rounded-xl bg-red-50/60 px-3 py-2.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{e.name}</p>
                      <p className="text-xs text-red-700">Pagamento em atraso</p>
                    </div>
                  </li>
                ))}
                {trialsExpirando.map(e => {
                  const dias = Math.max(0, Math.ceil((new Date(e.trial_ends_at!).getTime() - Date.now()) / 86400000));
                  return (
                    <li key={`trial-${e.id}`} className="flex items-center gap-3 rounded-xl bg-amber-50/70 px-3 py-2.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dias <= 1 ? 'bg-red-500' : 'bg-amber-500'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{e.name}</p>
                        <p className="text-xs text-amber-700">Teste acaba em {dias} dia{dias !== 1 ? 's' : ''}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Secao>

          <Secao titulo="Dúvidas por tela" contagem={helpQuestions.length} icone={<MessageCircleQuestion className="w-4 h-4" />} descricao="Perguntas feitas na Central de Ajuda">
            {perguntasPorTela.length === 0 ? (
              <Vazio>Nenhuma pergunta registrada.</Vazio>
            ) : (
              <div className="space-y-3">
                {perguntasPorTela.map(([page, count]) => (
                  <div key={page}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 truncate">{page}</span>
                      <span className="font-semibold text-gray-800">{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-[#16A34A]" style={{ width: `${(count / maxPerg) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Secao>
        </div>
      </div>
    </div>
  );
}
