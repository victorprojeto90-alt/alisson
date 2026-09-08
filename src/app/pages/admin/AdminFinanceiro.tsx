import { useState, useEffect, useMemo, type CSSProperties } from 'react';
import { toast } from 'sonner';
import {
  useEmpresasAdmin, EmpresaAdmin, PLANOS_PAGOS, PLANO_POR_ID, CORES_PIZZA,
  abrirWhatsApp, baixarCSV, cores, cardStyle,
} from './adminShared';
import { adminAsaas, type AsaasPayment, type AsaasSubscription } from '../../lib/adminAsaas';
import { Button } from '../../components/ui/button';
import {
  DollarSign, Crown, AlertTriangle, Clock, Download, RefreshCw, MessageCircle,
  Send, Loader2, UserX,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Periodo = '7d' | '30d' | '90d' | '12m';

function calcularPeriodo(periodo: Periodo) {
  const fim = new Date();
  const inicio = new Date();
  if (periodo === '7d') inicio.setDate(inicio.getDate() - 7);
  else if (periodo === '30d') inicio.setDate(inicio.getDate() - 30);
  else if (periodo === '90d') inicio.setDate(inicio.getDate() - 90);
  else inicio.setFullYear(inicio.getFullYear() - 1);
  return { inicio: inicio.toISOString().split('T')[0], fim: fim.toISOString().split('T')[0] };
}

function PageHeader({
  periodo, onPeriodo, onExportar, onAtualizar, atualizando,
}: {
  periodo: Periodo;
  onPeriodo: (p: Periodo) => void;
  onExportar: () => void;
  onAtualizar: () => void;
  atualizando: boolean;
}) {
  const opcoes: { id: Periodo; label: string }[] = [
    { id: '7d', label: '7 dias' }, { id: '30d', label: '30 dias' },
    { id: '90d', label: '90 dias' }, { id: '12m', label: '12 meses' },
  ];
  return (
    <div style={{ background: 'white', borderBottom: `1px solid ${cores.borda}`, padding: '24px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: cores.texto }}>Financeiro</h1>
          <p style={{ color: cores.textoSecundario, marginTop: '2px', fontSize: '14px' }}>Dados reais do Asaas</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onAtualizar} disabled={atualizando}>
            <RefreshCw className={`w-3.5 h-3.5 ${atualizando ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onExportar}>
            <Download className="w-3.5 h-3.5" />
            CSV
          </Button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 16 }}>
        {opcoes.map(o => (
          <button
            key={o.id}
            onClick={() => onPeriodo(o.id)}
            style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              border: `1px solid ${periodo === o.id ? cores.verde : cores.borda}`,
              background: periodo === o.id ? cores.verde : 'white',
              color: periodo === o.id ? 'white' : cores.textoSecundario,
              cursor: 'pointer',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdminFinanceiro() {
  const { empresas, loading } = useEmpresasAdmin();
  const [periodo, setPeriodo] = useState<Periodo>('30d');
  const [recebidos, setRecebidos] = useState<AsaasPayment[]>([]);
  const [pendentes, setPendentes] = useState<AsaasPayment[]>([]);
  const [vencidos, setVencidos] = useState<AsaasPayment[]>([]);
  const [assinaturasAsaas, setAssinaturasAsaas] = useState<AsaasSubscription[]>([]);
  const [loadingAsaas, setLoadingAsaas] = useState(false);
  const [erroAsaas, setErroAsaas] = useState<string | null>(null);
  const [enviandoCobranca, setEnviandoCobranca] = useState<string | null>(null);

  const carregarDadosAsaas = async () => {
    setLoadingAsaas(true);
    setErroAsaas(null);
    try {
      const { inicio, fim } = calcularPeriodo(periodo);
      const [rRecebidos, rPendentes, rVencidos, rAssinaturas] = await Promise.all([
        adminAsaas.listarPagamentos({ dataInicio: inicio, dataFim: fim, status: 'RECEIVED' }),
        adminAsaas.listarPagamentos({ status: 'PENDING' }),
        adminAsaas.listarPagamentos({ status: 'OVERDUE' }),
        adminAsaas.listarAssinaturas('ACTIVE'),
      ]);
      setRecebidos(rRecebidos.data ?? []);
      setPendentes(rPendentes.data ?? []);
      setVencidos(rVencidos.data ?? []);
      setAssinaturasAsaas(rAssinaturas.data ?? []);
    } catch (e) {
      setErroAsaas(e instanceof Error ? e.message : 'Erro ao carregar dados do Asaas');
    } finally {
      setLoadingAsaas(false);
    }
  };

  useEffect(() => { carregarDadosAsaas(); }, [periodo]);

  // Mapa customer Asaas → empresa, pra mostrar nome do cliente nas tabelas (os
  // pagamentos/assinaturas do Asaas só trazem o id do customer, não o nome).
  const empresaPorCustomerId = useMemo(() => {
    const map: Record<string, EmpresaAdmin> = {};
    for (const e of empresas) if (e.asaas_customer_id) map[e.asaas_customer_id] = e;
    return map;
  }, [empresas]);

  const nomeCliente = (customerId: string) => empresaPorCustomerId[customerId]?.name ?? customerId;
  const getEmpresa = (customerId: string) => empresaPorCustomerId[customerId];

  // Quem nunca tentou assinar: trial/bloqueado/sem plano, e sem cliente Asaas.
  const nuncaPagaram = empresas.filter(e =>
    !e.asaas_customer_id && (e.plan_type === 'trial' || e.plan_type === 'bloqueado' || !e.plan_type)
  );
  // Quem criou o cliente Asaas mas não fechou a assinatura (abandonou o checkout).
  const tentouNaoPagou = empresas.filter(e =>
    e.asaas_customer_id && !e.asaas_subscription_id &&
    (e.plan_type === 'trial' || e.plan_type === 'bloqueado' || !e.plan_type)
  );

  const somaRecebidos = recebidos.reduce((s, p) => s + p.value, 0);
  const somaPendentes = pendentes.reduce((s, p) => s + p.value, 0);
  const somaVencidos = vencidos.reduce((s, p) => s + p.value, 0);
  // MRR real: soma das assinaturas ativas no Asaas. Se a busca ao Asaas falhar,
  // cai pro cálculo local (plan_type × preço do plano) em vez de mostrar em branco.
  const mrrAsaas = assinaturasAsaas.reduce((s, a) => s + a.value, 0);
  const mrrLocalFallback = empresas
    .filter(e => e.plan_type && PLANOS_PAGOS.includes(e.plan_type) && !e.is_blocked)
    .reduce((s, e) => s + (PLANO_POR_ID[e.plan_type!]?.preco ?? 0), 0);
  const mrrReal = assinaturasAsaas.length > 0 ? mrrAsaas : mrrLocalFallback;

  const distribuicaoPlanos = PLANOS_PAGOS.map(id => ({
    id,
    nome: PLANO_POR_ID[id]?.nome ?? id,
    qtd: empresas.filter(e => e.plan_type === id && !e.is_blocked).length,
  })).filter(p => p.qtd > 0);
  const pizzaData = useMemo(() => distribuicaoPlanos.map(p => ({ name: p.nome, value: p.qtd })), [distribuicaoPlanos]);

  const reenviarCobranca = async (customerId: string, valor: number, empresaNome: string) => {
    setEnviandoCobranca(customerId);
    try {
      await adminAsaas.reenviarCobranca(customerId, valor, `AMBISAFE — Regularização de assinatura (${empresaNome})`);
      toast.success('Cobrança PIX gerada com sucesso.');
      carregarDadosAsaas();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao gerar cobrança');
    } finally {
      setEnviandoCobranca(null);
    }
  };

  const exportarCSV = () => {
    const linhas: (string | number)[][] = [
      ...recebidos.map(p => [nomeCliente(p.customer), 'Recebido', p.value, p.dueDate]),
      ...pendentes.map(p => [nomeCliente(p.customer), 'Pendente', p.value, p.dueDate]),
      ...vencidos.map(p => [nomeCliente(p.customer), 'Vencido', p.value, p.dueDate]),
    ];
    baixarCSV(
      `financeiro-ambisafe-${new Date().toISOString().split('T')[0]}.csv`,
      ['Cliente', 'Status', 'Valor', 'Vencimento'],
      linhas
    );
  };

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
      <p style={{ fontSize: 22, fontWeight: 700, color: cores.texto }}>{value}</p>
      <p style={{ fontSize: 12, color: cores.textoSecundario }}>{label}</p>
      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</p>
    </div>
  );

  return (
    <div>
      <PageHeader periodo={periodo} onPeriodo={setPeriodo} onExportar={exportarCSV} onAtualizar={carregarDadosAsaas} atualizando={loadingAsaas} />
      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {erroAsaas && (
          <div style={{ ...cardStyle, borderColor: '#fecaca', background: '#fef2f2', padding: 16 }}>
            <p style={{ fontSize: 13, color: cores.vermelho }}>
              Não foi possível carregar os dados do Asaas: {erroAsaas}. Os cards abaixo usam fallback local onde possível.
            </p>
          </div>
        )}

        {/* Cards reais */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {loadingAsaas ? (
            <div style={{ ...cardStyle, gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', padding: 32 }}>
              <Loader2 className="animate-spin" size={24} color={cores.verde} />
            </div>
          ) : (
            <>
              {statCard('Recebido', `R$ ${somaRecebidos.toFixed(2).replace('.', ',')}`, DollarSign, '#15803d', '#dcfce7', 'no período selecionado')}
              {statCard('Pendente', `R$ ${somaPendentes.toFixed(2).replace('.', ',')}`, Clock, cores.amarelo, '#fef3c7', 'aguardando pagamento')}
              {statCard('Vencido', `R$ ${somaVencidos.toFixed(2).replace('.', ',')}`, AlertTriangle, cores.vermelho, '#fee2e2', 'em atraso')}
              {statCard('Assinaturas', assinaturasAsaas.length, Crown, cores.verde, `${cores.verde}1a`, 'ativas no Asaas')}
              {statCard('MRR Real', `R$ ${mrrReal.toFixed(2).replace('.', ',')}`, DollarSign, cores.azul, '#dbeafe', assinaturasAsaas.length > 0 ? 'soma das assinaturas Asaas' : 'estimado (fallback local)')}
            </>
          )}
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

        {/* Quem só cadastrou e não pagou */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserX size={16} color={cores.textoSecundario} />
            <p style={{ fontSize: 14, fontWeight: 600, color: cores.texto }}>Quem só cadastrou e não pagou</p>
          </div>
          <p style={{ fontSize: 12, color: cores.textoSecundario, padding: '0 20px 12px' }}>
            Nunca tentaram assinar ({nuncaPagaram.length}) + criaram cliente no Asaas mas abandonaram o checkout ({tentouNaoPagou.length})
          </p>
          {(nuncaPagaram.length + tentouNaoPagou.length) === 0 ? (
            <p style={{ fontSize: 12, color: cores.textoSecundario, padding: '0 20px 16px' }}>Todos os cadastros já tentaram ou completaram uma assinatura.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb', borderTop: `1px solid ${cores.borda}`, borderBottom: `1px solid ${cores.borda}` }}>
                  <tr>
                    <th style={thStyle}>Nome</th>
                    <th style={thStyle}>Cadastro</th>
                    <th style={thStyle}>Trial expira</th>
                    <th style={thStyle}>Situação</th>
                    <th style={thStyle}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {[...nuncaPagaram, ...tentouNaoPagou].map(e => (
                    <tr key={e.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={tdStyle}>{e.name}</td>
                      <td style={{ ...tdStyle, color: cores.textoSecundario }}>{new Date(e.created_at).toLocaleDateString('pt-BR')}</td>
                      <td style={{ ...tdStyle, color: cores.textoSecundario }}>
                        {e.trial_ends_at ? new Date(e.trial_ends_at).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: e.asaas_customer_id ? '#fef3c7' : '#f3f4f6', color: e.asaas_customer_id ? cores.amarelo : cores.textoSecundario }}>
                          {e.asaas_customer_id ? 'Abandonou checkout' : 'Nunca tentou'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <button onClick={() => abrirWhatsApp(e)} style={{ fontSize: 12, color: '#16a34a', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MessageCircle size={13} /> WA
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagamentos recebidos */}
        <TabelaPagamentos titulo={`Pagamentos Recebidos (${periodo})`} pagamentos={recebidos} nomeCliente={nomeCliente} getEmpresa={getEmpresa} tipo="recebido" />

        {/* Pagamentos pendentes */}
        <TabelaPagamentos
          titulo="Pagamentos Pendentes (aguardando)"
          pagamentos={pendentes}
          nomeCliente={nomeCliente}
          getEmpresa={getEmpresa}
          tipo="pendente"
          onReenviar={reenviarCobranca}
          enviandoCobranca={enviandoCobranca}
        />

        {/* Pagamentos vencidos */}
        <TabelaPagamentos
          titulo="Pagamentos Vencidos (em atraso)"
          pagamentos={vencidos}
          nomeCliente={nomeCliente}
          getEmpresa={getEmpresa}
          tipo="vencido"
          onReenviar={reenviarCobranca}
          enviandoCobranca={enviandoCobranca}
        />

        {/* Assinaturas ativas */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: cores.texto, padding: '16px 20px 12px' }}>Assinaturas Ativas (Asaas) ({assinaturasAsaas.length})</p>
          {assinaturasAsaas.length === 0 ? (
            <p style={{ fontSize: 12, color: cores.textoSecundario, padding: '0 20px 16px' }}>
              {loadingAsaas ? 'Carregando...' : 'Nenhuma assinatura ativa encontrada no Asaas.'}
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb', borderTop: `1px solid ${cores.borda}`, borderBottom: `1px solid ${cores.borda}` }}>
                  <tr>
                    <th style={thStyle}>Cliente</th>
                    <th style={thStyle}>Valor/mês</th>
                    <th style={thStyle}>Próx. cobrança</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assinaturasAsaas.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={tdStyle}>{nomeCliente(a.customer)}</td>
                      <td style={tdStyle}>R$ {a.value.toFixed(2).replace('.', ',')}</td>
                      <td style={{ ...tdStyle, color: cores.textoSecundario }}>{new Date(a.nextDueDate).toLocaleDateString('pt-BR')}</td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#dcfce7', color: '#15803d' }}>{a.status}</span>
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

function TabelaPagamentos({
  titulo, pagamentos, nomeCliente, getEmpresa, tipo, onReenviar, enviandoCobranca,
}: {
  titulo: string;
  pagamentos: AsaasPayment[];
  nomeCliente: (id: string) => string;
  getEmpresa: (id: string) => EmpresaAdmin | undefined;
  tipo: 'recebido' | 'pendente' | 'vencido';
  onReenviar?: (customerId: string, valor: number, nome: string) => void;
  enviandoCobranca?: string | null;
}) {
  return (
    <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: cores.texto, padding: '16px 20px 12px' }}>{titulo} ({pagamentos.length})</p>
      {pagamentos.length === 0 ? (
        <p style={{ fontSize: 12, color: cores.textoSecundario, padding: '0 20px 16px' }}>Nenhum registro encontrado.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb', borderTop: `1px solid ${cores.borda}`, borderBottom: `1px solid ${cores.borda}` }}>
              <tr>
                <th style={thStyle}>Cliente</th>
                <th style={thStyle}>Valor</th>
                <th style={thStyle}>{tipo === 'recebido' ? 'Data' : tipo === 'pendente' ? 'Vence' : 'Venceu'}</th>
                {tipo !== 'recebido' && <th style={thStyle}>Dias</th>}
                {tipo === 'recebido' && <th style={thStyle}>Método</th>}
                <th style={thStyle}>{tipo === 'recebido' ? 'ID Asaas' : 'Ações'}</th>
              </tr>
            </thead>
            <tbody>
              {pagamentos.map(p => {
                const dias = Math.abs(Math.ceil((new Date(p.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                const nome = nomeCliente(p.customer);
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={tdStyle}>{nome}</td>
                    <td style={tdStyle}>R$ {p.value.toFixed(2).replace('.', ',')}</td>
                    <td style={{ ...tdStyle, color: cores.textoSecundario }}>{new Date(p.dueDate).toLocaleDateString('pt-BR')}</td>
                    {tipo !== 'recebido' && <td style={tdStyle}>{dias}d</td>}
                    {tipo === 'recebido' && <td style={{ ...tdStyle, color: cores.textoSecundario }}>{p.billingType}</td>}
                    <td style={tdStyle}>
                      {tipo === 'recebido' ? (
                        <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>{p.id}</span>
                      ) : (
                        <div style={{ display: 'flex', gap: 8 }}>
                          {onReenviar && (
                            <button
                              onClick={() => onReenviar(p.customer, p.value, nome)}
                              disabled={enviandoCobranca === p.customer}
                              style={{ fontSize: 12, color: cores.azul, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              {enviandoCobranca === p.customer ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Reenviar
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const empresa = getEmpresa(p.customer);
                              if (empresa) abrirWhatsApp(empresa);
                              else toast.error('Empresa não encontrada localmente para este cliente Asaas.');
                            }}
                            style={{ fontSize: 12, color: '#16a34a', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <MessageCircle size={13} /> WA
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle: CSSProperties = { textAlign: 'left', padding: '8px 20px', color: '#6b7280', fontSize: 12, fontWeight: 600 };
const tdStyle: CSSProperties = { padding: '10px 20px', color: '#111827' };
