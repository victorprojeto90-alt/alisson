import { useMemo, type CSSProperties } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import {
  useEmpresasAdmin, EmpresaAdmin, PLANOS_PAGOS, PLANO_POR_ID, CORES_PIZZA,
  emTrialAtivo, abrirWhatsApp, baixarCSV, cores, cardStyle,
} from './adminShared';
import { Button } from '../../components/ui/button';
import {
  DollarSign, Crown, AlertTriangle, Clock, Download, MessageCircle,
  ExternalLink, ShieldOff, Loader2,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function PageHeader({ onExportar }: { onExportar: () => void }) {
  return (
    <div style={{
      background: 'white', borderBottom: `1px solid ${cores.borda}`, padding: '24px 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
    }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: cores.texto }}>Financeiro</h1>
        <p style={{ color: cores.textoSecundario, marginTop: '2px', fontSize: '14px' }}>
          Dados reais do Supabase — sem projeções
        </p>
      </div>
      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onExportar}>
        <Download className="w-3.5 h-3.5" />
        Exportar CSV
      </Button>
    </div>
  );
}

export default function AdminFinanceiro() {
  const { empresas, loading, reload } = useEmpresasAdmin();

  // Só dados reais — nada de ARR (MRR × 12 é projeção), nada de churn % (não há
  // histórico de cancelamentos ao longo do tempo no schema pra calcular isso de
  // verdade). O que dá pra afirmar com o que existe no banco hoje: MRR corrente,
  // contagem de pagantes/inadimplentes/trials, e as próprias listas de clientes.
  const pagantes = empresas.filter(e => e.plan_type && PLANOS_PAGOS.includes(e.plan_type) && !e.is_blocked);
  const inadimplentes = empresas.filter(e =>
    e.is_blocked && e.plan_type && PLANOS_PAGOS.includes(e.plan_type) && e.plan_type !== 'bloqueado'
  );
  const emTrial = empresas.filter(emTrialAtivo);
  const mrrReal = pagantes.reduce((sum, e) => sum + (PLANO_POR_ID[e.plan_type!]?.preco ?? 0), 0);

  const distribuicaoPlanos = PLANOS_PAGOS.map(id => ({
    id,
    nome: PLANO_POR_ID[id]?.nome ?? id,
    qtd: pagantes.filter(e => e.plan_type === id).length,
  })).filter(p => p.qtd > 0);

  const em30Dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const proximasCobrancas = pagantes
    .filter(e => e.plan_expires_at && new Date(e.plan_expires_at) <= em30Dias)
    .sort((a, b) => new Date(a.plan_expires_at!).getTime() - new Date(b.plan_expires_at!).getTime());

  const toggleBloqueio = async (empresaAlvo: EmpresaAdmin) => {
    const bloquear = !empresaAlvo.is_blocked;
    const { error } = await supabase
      .from('empresas')
      .update({ is_blocked: bloquear, block_reason: bloquear ? 'Bloqueado manualmente pelo admin' : null })
      .eq('id', empresaAlvo.id);
    if (error) toast.error('Erro ao atualizar bloqueio: ' + error.message);
    else { toast.success(bloquear ? 'Empresa bloqueada.' : 'Empresa desbloqueada.'); reload(); }
  };

  const exportarCSV = () => {
    const lista = [...pagantes, ...inadimplentes.filter(e => !pagantes.includes(e))];
    baixarCSV(
      `financeiro-ambisafe-${new Date().toISOString().split('T')[0]}.csv`,
      ['Nome', 'Plano', 'Valor/mês', 'Status', 'Último Pagamento', 'Próxima Cobrança'],
      lista.map(e => [
        e.name,
        PLANO_POR_ID[e.plan_type ?? '']?.nome ?? e.plan_type ?? '',
        PLANO_POR_ID[e.plan_type ?? '']?.precoFormatado ?? '',
        e.is_blocked ? 'Bloqueado / Inadimplente' : 'Ativo',
        e.ultimo_pagamento_at ?? '',
        e.plan_expires_at ?? '',
      ])
    );
  };

  const pizzaData = useMemo(
    () => distribuicaoPlanos.map(p => ({ name: p.nome, value: p.qtd })),
    [distribuicaoPlanos]
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={32} color={cores.verde} />
      </div>
    );
  }

  const statCard = (label: string, value: string | number, Icon: typeof DollarSign, color: string, bg: string, sub: string) => (
    <div style={cardStyle}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <Icon size={16} color={color} />
      </div>
      <p style={{ fontSize: 24, fontWeight: 700, color: cores.texto }}>{value}</p>
      <p style={{ fontSize: 12, color: cores.textoSecundario }}>{label}</p>
      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</p>
    </div>
  );

  return (
    <div>
      <PageHeader onExportar={exportarCSV} />
      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Cards — só dados reais */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {statCard('MRR Real', `R$ ${mrrReal.toFixed(2).replace('.', ',')}`, DollarSign, '#15803d', '#dcfce7', 'receita mensal atual')}
          {statCard('Pagantes', pagantes.length, Crown, cores.verde, `${cores.verde}1a`, 'assinaturas ativas')}
          {statCard('Inadimplentes', inadimplentes.length, AlertTriangle, cores.vermelho, '#fee2e2', 'bloqueados por atraso')}
          {statCard('Em Trial', emTrial.length, Clock, cores.amarelo, '#fef3c7', 'contas gratuitas')}
        </div>

        {/* Distribuição de planos */}
        <div style={cardStyle}>
          <p style={{ fontSize: 14, fontWeight: 600, color: cores.texto, marginBottom: 12 }}>Distribuição de Planos</p>
          {distribuicaoPlanos.length === 0 ? (
            <p style={{ fontSize: 12, color: cores.textoSecundario }}>Nenhum assinante pago ainda.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'center' }}>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pizzaData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                      {pizzaData.map((_, i) => <Cell key={i} fill={CORES_PIZZA[i % CORES_PIZZA.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {distribuicaoPlanos.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: cores.textoSecundario }}>{p.nome}</span>
                    <span style={{ fontWeight: 600, color: cores.texto }}>{p.qtd}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Próximas cobranças */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: cores.texto, padding: '16px 20px 12px' }}>Próximas Cobranças (30 dias)</p>
          {proximasCobrancas.length === 0 ? (
            <p style={{ fontSize: 12, color: cores.textoSecundario, padding: '0 20px 16px' }}>Nenhuma cobrança prevista nos próximos 30 dias.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb', borderTop: `1px solid ${cores.borda}`, borderBottom: `1px solid ${cores.borda}` }}>
                  <tr>
                    <th style={thStyle}>Nome</th>
                    <th style={thStyle}>Plano</th>
                    <th style={thStyle}>Valor</th>
                    <th style={thStyle}>Vence em</th>
                    <th style={thStyle}>Dias</th>
                    <th style={thStyle}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {proximasCobrancas.map(e => {
                    const dias = Math.ceil((new Date(e.plan_expires_at!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={e.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={tdStyle}>{e.name}</td>
                        <td style={{ ...tdStyle, color: cores.textoSecundario }}>{PLANO_POR_ID[e.plan_type ?? '']?.nome}</td>
                        <td style={tdStyle}>{PLANO_POR_ID[e.plan_type ?? '']?.precoFormatado}</td>
                        <td style={{ ...tdStyle, color: cores.textoSecundario }}>{new Date(e.plan_expires_at!).toLocaleDateString('pt-BR')}</td>
                        <td style={tdStyle}>{dias}d</td>
                        <td style={tdStyle}>
                          <AcoesFinanceiras empresa={e} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inadimplentes */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} color={cores.vermelho} />
            <p style={{ fontSize: 14, fontWeight: 600, color: cores.texto }}>Inadimplentes</p>
          </div>
          {inadimplentes.length === 0 ? (
            <p style={{ fontSize: 12, color: cores.textoSecundario, padding: '0 20px 16px' }}>Nenhum cliente inadimplente no momento.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb', borderTop: `1px solid ${cores.borda}`, borderBottom: `1px solid ${cores.borda}` }}>
                  <tr>
                    <th style={thStyle}>Nome</th>
                    <th style={thStyle}>Plano</th>
                    <th style={thStyle}>Último pag.</th>
                    <th style={thStyle}>Motivo</th>
                    <th style={thStyle}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {inadimplentes.map(e => (
                    <tr key={e.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={tdStyle}>{e.name}</td>
                      <td style={{ ...tdStyle, color: cores.textoSecundario }}>{PLANO_POR_ID[e.plan_type ?? '']?.nome}</td>
                      <td style={{ ...tdStyle, color: cores.textoSecundario }}>
                        {e.ultimo_pagamento_at ? new Date(e.ultimo_pagamento_at).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td style={{ ...tdStyle, color: cores.textoSecundario }}>{e.block_reason ?? '—'}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <AcoesFinanceiras empresa={e} />
                          <button
                            onClick={() => toggleBloqueio(e)}
                            style={{ fontSize: 12, color: '#16a34a', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                            title="Desbloquear"
                          >
                            <ShieldOff size={13} /> Desbl.
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Todos os pagantes */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: cores.texto, padding: '16px 20px 12px' }}>Todos os Pagantes ({pagantes.length})</p>
          {pagantes.length === 0 ? (
            <p style={{ fontSize: 12, color: cores.textoSecundario, padding: '0 20px 16px' }}>Nenhum assinante pago ainda.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb', borderTop: `1px solid ${cores.borda}`, borderBottom: `1px solid ${cores.borda}` }}>
                  <tr>
                    <th style={thStyle}>Nome</th>
                    <th style={thStyle}>Plano</th>
                    <th style={thStyle}>Valor/mês</th>
                    <th style={thStyle}>Vencimento</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pagantes.map(e => (
                    <tr key={e.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={tdStyle}>{e.name}</td>
                      <td style={{ ...tdStyle, color: cores.textoSecundario }}>{PLANO_POR_ID[e.plan_type ?? '']?.nome}</td>
                      <td style={tdStyle}>{PLANO_POR_ID[e.plan_type ?? '']?.precoFormatado}</td>
                      <td style={{ ...tdStyle, color: cores.textoSecundario }}>
                        {e.plan_expires_at ? new Date(e.plan_expires_at).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 500, background: '#dcfce7', color: '#15803d' }}>
                          Ativo
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AcoesFinanceiras({ empresa }: { empresa: EmpresaAdmin }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <button
        onClick={() => abrirWhatsApp(empresa)}
        style={{ fontSize: 12, color: '#16a34a', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        title="Falar no WhatsApp"
      >
        <MessageCircle size={13} /> WA
      </button>
      {empresa.asaas_customer_id && (
        <a
          href={`https://app.asaas.com/customer/${empresa.asaas_customer_id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
          title="Ver no Asaas"
        >
          <ExternalLink size={13} /> Asaas
        </a>
      )}
    </div>
  );
}

const thStyle: CSSProperties = { textAlign: 'left', padding: '8px 20px', color: '#6b7280', fontSize: 12, fontWeight: 600 };
const tdStyle: CSSProperties = { padding: '10px 20px', color: '#111827' };
