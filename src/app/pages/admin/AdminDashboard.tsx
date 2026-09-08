import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import {
  useEmpresasAdmin, PLANOS_PAGOS, PLANO_POR_ID, emTrialAtivo, cores, cardStyle,
} from './adminShared';
import {
  Building2, Crown, Clock, Ban, Trees, DollarSign, TrendingUp, XCircle,
  AlertTriangle, MessageCircleQuestion, Loader2,
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

function PageHeader() {
  return (
    <div style={{ background: 'white', borderBottom: `1px solid ${cores.borda}`, padding: '24px 32px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: cores.texto }}>Dashboard</h1>
      <p style={{ color: cores.textoSecundario, marginTop: '2px', fontSize: '14px' }}>Visão geral do AMBISAFE</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { empresas, loading } = useEmpresasAdmin();
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
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={32} color={cores.verde} />
      </div>
    );
  }

  const statCard = (label: string, value: string | number, Icon: typeof Building2, color: string, bg: string) => (
    <div style={cardStyle}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <Icon size={16} color={color} />
      </div>
      <p style={{ fontSize: 24, fontWeight: 700, color: cores.texto }}>{value}</p>
      <p style={{ fontSize: 12, color: cores.textoSecundario }}>{label}</p>
    </div>
  );

  return (
    <div>
      <PageHeader />
      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Métricas principais */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {statCard('Contas', total, Building2, cores.verde, `${cores.verde}1a`)}
          {statCard('Em Trial', emTrial.length, Clock, '#d97706', '#fef3c7')}
          {statCard('Pagantes', pagantes.length, Crown, '#16a34a', '#dcfce7')}
          {statCard('Bloqueados', bloqueados.length, Ban, cores.vermelho, '#fee2e2')}
          {statCard('Projetos criados', totalProjects, Trees, '#059669', '#d1fae5')}
        </div>

        {/* Financeiro */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {statCard('MRR', `R$ ${mrr.toFixed(2).replace('.', ',')}`, DollarSign, '#15803d', '#dcfce7')}
          {statCard('Conversão trial → pago', `${trialParaPagoP}%`, TrendingUp, cores.azul, '#dbeafe')}
          {statCard('Cancelamentos', cancelamentosSolicitados, XCircle, cores.vermelho, '#fee2e2')}
          {statCard('Ticket médio', `R$ ${ticketMedio.toFixed(2).replace('.', ',')}`, DollarSign, cores.verde, `${cores.verde}1a`)}
        </div>

        {/* Alertas */}
        {(trialsExpirando.length > 0 || inadimplentes.length > 0) && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <AlertTriangle size={16} color={cores.vermelho} />
              <span style={{ fontSize: 14, fontWeight: 600, color: cores.texto }}>
                Alertas ({trialsExpirando.length + inadimplentes.length})
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {inadimplentes.map(e => (
                <div key={`inad-${e.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', fontSize: 13 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: cores.vermelho, flexShrink: 0 }} />
                  <span style={{ fontWeight: 500, color: cores.texto }}>{e.name}</span>
                  <span style={{ color: cores.textoSecundario, fontSize: 12 }}>— pagamento em atraso</span>
                </div>
              ))}
              {trialsExpirando.map(e => {
                const dias = Math.max(0, Math.ceil((new Date(e.trial_ends_at!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                return (
                  <div key={`trial-${e.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', fontSize: 13 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: dias <= 1 ? cores.vermelho : cores.amarelo, flexShrink: 0 }} />
                    <span style={{ fontWeight: 500, color: cores.texto }}>{e.name}</span>
                    <span style={{ color: cores.textoSecundario, fontSize: 12 }}>— trial expira em {dias} dia{dias !== 1 ? 's' : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: helpQuestions.length > 0 ? '2fr 1fr' : '1fr', gap: 24 }}>
          {/* Gráfico de cadastros */}
          <div style={cardStyle}>
            <p style={{ fontSize: 14, fontWeight: 600, color: cores.texto, marginBottom: 12 }}>Novos Cadastros — Últimos 6 Meses</p>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cadastrosPorMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`${v} cadastro${v !== 1 ? 's' : ''}`, '']} />
                  <Bar dataKey="cadastros" fill={cores.verde} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Perguntas por tela */}
          {helpQuestions.length > 0 && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <MessageCircleQuestion size={16} color={cores.verdeClaro} />
                <span style={{ fontSize: 14, fontWeight: 600, color: cores.texto }}>Perguntas por Tela</span>
              </div>
              {(() => {
                const counts: Record<string, number> = {};
                helpQuestions.forEach(q => { counts[q.page] = (counts[q.page] ?? 0) + 1; });
                const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
                const max = sortedCounts[0]?.[1] ?? 1;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {sortedCounts.map(([page, count]) => (
                      <div key={page}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: cores.textoSecundario, textTransform: 'capitalize' }}>{page}</span>
                          <span style={{ color: cores.textoSecundario, fontWeight: 500 }}>{count}</span>
                        </div>
                        <div style={{ width: '100%', background: '#f3f4f6', borderRadius: 999, height: 6 }}>
                          <div style={{ width: `${(count / max) * 100}%`, background: cores.verdeClaro, borderRadius: 999, height: 6 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Atividade recente */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: cores.texto, padding: '16px 20px 0' }}>Atividade Recente</p>
          <div style={{ overflowX: 'auto', marginTop: 12 }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb', borderTop: `1px solid ${cores.borda}`, borderBottom: `1px solid ${cores.borda}` }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 20px', color: cores.textoSecundario, fontSize: 12 }}>Nome</th>
                  <th style={{ textAlign: 'left', padding: '8px 20px', color: cores.textoSecundario, fontSize: 12 }}>Plano</th>
                  <th style={{ textAlign: 'left', padding: '8px 20px', color: cores.textoSecundario, fontSize: 12 }}>Cadastro</th>
                  <th style={{ textAlign: 'left', padding: '8px 20px', color: cores.textoSecundario, fontSize: 12 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSignups.map(emp => (
                  <tr key={emp.id} style={{ borderBottom: `1px solid #f3f4f6` }}>
                    <td style={{ padding: '10px 20px', fontWeight: 500, color: cores.texto }}>{emp.name}</td>
                    <td style={{ padding: '10px 20px', color: cores.textoSecundario, fontSize: 12 }}>
                      {emp.plan_type && PLANOS_PAGOS.includes(emp.plan_type)
                        ? PLANO_POR_ID[emp.plan_type]?.nome
                        : emp.plan === 'profissional' ? 'Profissional' : 'Trial'}
                    </td>
                    <td style={{ padding: '10px 20px', color: cores.textoSecundario, fontSize: 12 }}>
                      {new Date(emp.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '10px 20px' }}>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 500,
                        background: emp.is_blocked ? '#fee2e2' : '#dcfce7',
                        color: emp.is_blocked ? cores.vermelho : '#15803d',
                      }}>
                        {emp.is_blocked ? 'Bloqueado' : 'Ativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ height: 12 }} />
        </div>
      </div>
    </div>
  );
}
