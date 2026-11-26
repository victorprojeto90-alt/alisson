import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { PageSkeleton, StatsSkeleton } from '../../components/ui/skeletons';
import { toast } from 'sonner';
import {
  useEmpresasAdmin, EmpresaAdmin, PLANOS_PAGOS, PLANO_POR_ID, CORES_PIZZA,
  abrirWhatsApp, baixarCSV,
} from './adminShared';
import { Secao, Etiqueta, Vazio, Indicador, brl, dataBR } from './adminUi';
import { PageHeader, HeaderStats, HeaderButton } from '../../components/layout/PageHeader';
import { adminAsaas, type AsaasPayment, type AsaasSubscription } from '../../lib/adminAsaas';
import { Button } from '../../components/ui/button';
import {
  Crown, AlertTriangle, Download, RefreshCw, MessageCircle, Send, Loader2, UserX, PieChart as PieIcon,
  CheckCircle2, Clock, Repeat,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

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
    return <PageSkeleton />;
  }

  const opcoes: { id: Periodo; label: string }[] = [
    { id: '7d', label: '7 dias' }, { id: '30d', label: '30 dias' }, { id: '90d', label: '90 dias' }, { id: '12m', label: '12 meses' },
  ];
  const nomePeriodo = opcoes.find(o => o.id === periodo)?.label ?? '';
  const naoPagaram = [...nuncaPagaram, ...tentouNaoPagou];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Painel administrativo"
        title="Financeiro"
        subtitle="Cobranças e assinaturas vindas do Asaas"
        actions={<>
          <HeaderButton variant="outline" onClick={carregarDadosAsaas} disabled={loadingAsaas}>
            <RefreshCw className={`w-4 h-4 ${loadingAsaas ? 'animate-spin' : ''}`} /> Atualizar
          </HeaderButton>
          <HeaderButton variant="outline" onClick={exportarCSV}><Download className="w-4 h-4" /> CSV</HeaderButton>
        </>}
      >
        <div className="flex gap-1 p-1 rounded-2xl bg-white/10 w-fit mb-3">
          {opcoes.map(o => (
            <button
              key={o.id}
              onClick={() => setPeriodo(o.id)}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${periodo === o.id ? 'bg-white text-[#00420d] shadow' : 'text-white/80 hover:bg-white/10'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        {loadingAsaas ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:max-w-3xl">
            {[0, 1, 2, 3].map(i => <div key={i} className="h-[62px] rounded-2xl bg-white/10 animate-pulse" />)}
          </div>
        ) : (
          <HeaderStats
            colunasCelular={2}
            items={[
              { label: `Recebido · ${nomePeriodo}`, value: brl(somaRecebidos), active: true },
              { label: 'Aguardando', value: brl(somaPendentes) },
              { label: 'Em atraso', value: brl(somaVencidos) },
              { label: 'Receita mensal', value: brl(mrrReal) },
            ]}
          />
        )}
      </PageHeader>

      {erroAsaas && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>Não foi possível carregar os dados do Asaas: {erroAsaas}. Onde dá, os números usam o cálculo local.</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5 md:mb-6">
        <Indicador rotulo="Assinaturas ativas" valor={assinaturasAsaas.length} icone={<Repeat className="w-5 h-5" />} />
        <Indicador rotulo="Pagamentos recebidos" valor={recebidos.length} detalhe={nomePeriodo} icone={<CheckCircle2 className="w-5 h-5" />} />
        <Indicador rotulo="Aguardando pagamento" valor={pendentes.length} icone={<Clock className="w-5 h-5" />} tom="amarelo" />
        <Indicador rotulo="Em atraso" valor={vencidos.length} icone={<AlertTriangle className="w-5 h-5" />} tom="vermelho" />
      </div>
      {loadingAsaas && <div className="mb-5"><StatsSkeleton count={4} /></div>}

      <div className="grid lg:grid-cols-3 gap-5 md:gap-6 mb-5 md:mb-6 items-start">
        <Secao titulo="Planos dos assinantes" icone={<PieIcon className="w-4 h-4" />} descricao={assinaturasAsaas.length > 0 ? 'Receita mensal pela soma das assinaturas no Asaas' : 'Receita mensal estimada pelos planos'}>
          {distribuicaoPlanos.length === 0 ? (
            <Vazio>Nenhum assinante pago ainda.</Vazio>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pizzaData} dataKey="value" nameKey="name" innerRadius={34} outerRadius={60} paddingAngle={2}>
                      {pizzaData.map((_, i) => <Cell key={i} fill={CORES_PIZZA[i % CORES_PIZZA.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex-1 space-y-2">
                {distribuicaoPlanos.map((p, i) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600"><span className="w-2.5 h-2.5 rounded-full" style={{ background: CORES_PIZZA[i % CORES_PIZZA.length] }} />{p.nome}</span>
                    <span className="font-semibold text-gray-900">{p.qtd}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Secao>

        <Secao
          className="lg:col-span-2"
          titulo="Cadastrou e não pagou"
          contagem={naoPagaram.length}
          icone={<UserX className="w-4 h-4" />}
          descricao={`Nunca tentaram assinar: ${nuncaPagaram.length} · Começaram e abandonaram o pagamento: ${tentouNaoPagou.length}`}
          semPadding
        >
          {naoPagaram.length === 0 ? (
            <Vazio>Todos os cadastros já tentaram ou concluíram uma assinatura.</Vazio>
          ) : (
            <Lista
              colunas={['Empresa', 'Cadastro', 'Teste acaba', 'Situação', '']}
              linhas={naoPagaram.map(e => ({
                id: e.id,
                titulo: e.name,
                celulas: [
                  <span key="n" className="font-medium text-gray-900">{e.name}</span>,
                  dataBR(e.created_at),
                  dataBR(e.trial_ends_at),
                  e.asaas_customer_id ? <Etiqueta key="s" tom="amarelo">Abandonou o pagamento</Etiqueta> : <Etiqueta key="s" tom="cinza">Nunca tentou</Etiqueta>,
                  <BotaoWhats key="w" onClick={() => abrirWhatsApp(e)} />,
                ],
                resumo: `Cadastro ${dataBR(e.created_at)} · teste até ${dataBR(e.trial_ends_at)}`,
                etiqueta: e.asaas_customer_id ? <Etiqueta tom="amarelo">Abandonou</Etiqueta> : <Etiqueta tom="cinza">Nunca tentou</Etiqueta>,
                acoes: <BotaoWhats onClick={() => abrirWhatsApp(e)} />,
              }))}
            />
          )}
        </Secao>
      </div>

      <div className="space-y-5 md:space-y-6">
        <SecaoPagamentos titulo="Em atraso" tipo="vencido" pagamentos={vencidos} nomeCliente={nomeCliente} getEmpresa={getEmpresa} onReenviar={reenviarCobranca} enviandoCobranca={enviandoCobranca} />
        <SecaoPagamentos titulo="Aguardando pagamento" tipo="pendente" pagamentos={pendentes} nomeCliente={nomeCliente} getEmpresa={getEmpresa} onReenviar={reenviarCobranca} enviandoCobranca={enviandoCobranca} />
        <SecaoPagamentos titulo={`Recebidos · ${nomePeriodo}`} tipo="recebido" pagamentos={recebidos} nomeCliente={nomeCliente} getEmpresa={getEmpresa} />

        <Secao titulo="Assinaturas ativas no Asaas" contagem={assinaturasAsaas.length} icone={<Crown className="w-4 h-4" />} semPadding>
          {assinaturasAsaas.length === 0 ? (
            <Vazio>{loadingAsaas ? 'Carregando...' : 'Nenhuma assinatura ativa encontrada.'}</Vazio>
          ) : (
            <Lista
              colunas={['Cliente', 'Valor/mês', 'Próxima cobrança', 'Situação']}
              linhas={assinaturasAsaas.map(a => ({
                id: a.id,
                titulo: nomeCliente(a.customer),
                celulas: [<span key="n" className="font-medium text-gray-900">{nomeCliente(a.customer)}</span>, brl(a.value), dataBR(a.nextDueDate), <Etiqueta key="s" tom="verde">Ativa</Etiqueta>],
                resumo: `${brl(a.value)}/mês · próxima ${dataBR(a.nextDueDate)}`,
                etiqueta: <Etiqueta tom="verde">Ativa</Etiqueta>,
              }))}
            />
          )}
        </Secao>
      </div>
    </div>
  );
}

function BotaoWhats({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 hover:bg-green-50 px-2.5 h-8 rounded-lg">
      <MessageCircle className="w-4 h-4" /> WhatsApp
    </button>
  );
}

interface LinhaLista { id: string; titulo: string; celulas: ReactNode[]; resumo: string; etiqueta?: ReactNode; acoes?: ReactNode }

// Tabela no computador, cartões no celular
function Lista({ colunas, linhas }: { colunas: string[]; linhas: LinhaLista[] }) {
  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="ui-thead">
            <tr>{colunas.map((c, i) => <th key={i} className={`py-3 text-left ${i === 0 ? 'px-6' : 'px-4'}`}>{c}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {linhas.map(l => (
              <tr key={l.id} className="hover:bg-[#f8faf7]">
                {l.celulas.map((c, i) => <td key={i} className={`py-3 text-gray-600 ${i === 0 ? 'px-6' : 'px-4'}`}>{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden divide-y divide-gray-50">
        {linhas.map(l => (
          <div key={l.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-900">{l.titulo}</p>
                <p className="text-xs text-gray-500 mt-0.5">{l.resumo}</p>
              </div>
              {l.etiqueta && <div className="shrink-0">{l.etiqueta}</div>}
            </div>
            {l.acoes && <div className="mt-2 flex">{l.acoes}</div>}
          </div>
        ))}
      </div>
    </>
  );
}

function SecaoPagamentos({
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
  const icone = tipo === 'recebido' ? <CheckCircle2 className="w-4 h-4" /> : tipo === 'pendente' ? <Clock className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />;
  const total = pagamentos.reduce((s, p) => s + p.value, 0);
  const whats = (customer: string) => {
    const empresa = getEmpresa(customer);
    if (empresa) abrirWhatsApp(empresa);
    else toast.error('Não achamos a empresa deste cliente do Asaas no sistema.');
  };
  const acoes = (p: AsaasPayment, nome: string) => (
    <div className="flex items-center gap-1">
      {onReenviar && (
        <Button size="sm" variant="outline" className="h-8 rounded-lg gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-50" onClick={() => onReenviar(p.customer, p.value, nome)} disabled={enviandoCobranca === p.customer}>
          {enviandoCobranca === p.customer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Reenviar
        </Button>
      )}
      <BotaoWhats onClick={() => whats(p.customer)} />
    </div>
  );
  return (
    <Secao
      titulo={titulo}
      contagem={pagamentos.length}
      icone={icone}
      descricao={pagamentos.length ? `Total: ${brl(total)}` : undefined}
      semPadding
    >
      {pagamentos.length === 0 ? (
        <Vazio>Nenhum registro.</Vazio>
      ) : (
        <Lista
          colunas={tipo === 'recebido' ? ['Cliente', 'Valor', 'Data', 'Forma', 'Código'] : ['Cliente', 'Valor', tipo === 'pendente' ? 'Vence em' : 'Venceu em', 'Dias', 'Ações']}
          linhas={pagamentos.map(p => {
            const dias = Math.abs(Math.ceil((new Date(p.dueDate).getTime() - Date.now()) / 86400000));
            const nome = nomeCliente(p.customer);
            return {
              id: p.id,
              titulo: nome,
              celulas: tipo === 'recebido'
                ? [<span key="n" className="font-medium text-gray-900">{nome}</span>, <span key="v" className="font-semibold text-gray-900">{brl(p.value)}</span>, dataBR(p.dueDate), p.billingType, <span key="c" className="font-mono text-xs text-gray-400">{p.id}</span>]
                : [<span key="n" className="font-medium text-gray-900">{nome}</span>, <span key="v" className="font-semibold text-gray-900">{brl(p.value)}</span>, dataBR(p.dueDate), <Etiqueta key="d" tom={tipo === 'vencido' ? 'vermelho' : 'amarelo'}>{dias} dias</Etiqueta>, <span key="a">{acoes(p, nome)}</span>],
              resumo: `${brl(p.value)} · ${tipo === 'recebido' ? 'pago em' : tipo === 'pendente' ? 'vence em' : 'venceu em'} ${dataBR(p.dueDate)}${tipo === 'recebido' ? ' · ' + p.billingType : ''}`,
              etiqueta: tipo === 'recebido' ? undefined : <Etiqueta tom={tipo === 'vencido' ? 'vermelho' : 'amarelo'}>{tipo === 'vencido' ? `${dias} dias em atraso` : `faltam ${dias} dias`}</Etiqueta>,
              acoes: tipo === 'recebido' ? undefined : acoes(p, nome),
            };
          })}
        />
      )}
    </Secao>
  );
}
