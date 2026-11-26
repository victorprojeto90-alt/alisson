import { useState, useMemo, type ReactNode } from 'react';
import { PageSkeleton } from '../../components/ui/skeletons';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useApi } from '../../hooks/useApi';
import {
  useEmpresasAdmin, EmpresaAdmin, PLANOS_PAGOS, PLANO_POR_ID, maskCpfCnpj,
  abrirWhatsApp, baixarCSV,
} from './adminShared';
import { Etiqueta, Vazio, dataBR } from './adminUi';
import { PageHeader, HeaderStats, HeaderButton } from '../../components/layout/PageHeader';
import { PLANOS } from '../../lib/planos';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '../../components/ui/dropdown-menu';
import {
  Search, ArrowUpDown, Download, Eye, Briefcase, UserCheck, Crown, Ban, ShieldOff,
  CheckCircle2, MessageCircle, ExternalLink, Loader2, X, Trash2, MoreHorizontal, CalendarPlus, ArrowDownCircle, Trees,
} from 'lucide-react';

type FiltroPlano = 'all' | 'trial' | 'trial_expirando' | 'pagante' | 'bloqueado';
type OrdenarPor = 'cadastro' | 'nome' | 'vencimento' | 'plano';

const DIA = 86400000;
function situacao(emp: EmpresaAdmin) {
  const fim = emp.trial_ends_at ? new Date(emp.trial_ends_at) : null;
  const expirado = fim ? fim < new Date() : false;
  const dias = fim ? Math.max(0, Math.ceil((fim.getTime() - Date.now()) / DIA)) : 0;
  const pago = !!emp.plan_type && PLANOS_PAGOS.includes(emp.plan_type);
  const pro = emp.plan === 'profissional';
  return { fim, expirado, dias, pago, pro, emTeste: !pago && !pro };
}

function EtiquetaPlano({ emp }: { emp: EmpresaAdmin }) {
  const s = situacao(emp);
  if (emp.is_blocked) return <Etiqueta tom="vermelho" icone={<Ban className="w-3 h-3" />}>Bloqueada</Etiqueta>;
  if (s.pago) return <Etiqueta tom="verde" icone={<Crown className="w-3 h-3" />}>{PLANO_POR_ID[emp.plan_type!]?.nome ?? emp.plan_type}</Etiqueta>;
  if (s.pro) return <Etiqueta tom="verde" icone={<Crown className="w-3 h-3" />}>Pro (manual)</Etiqueta>;
  return s.expirado ? <Etiqueta tom="vermelho">Teste expirado</Etiqueta> : <Etiqueta tom="amarelo">Teste · {s.dias}d</Etiqueta>;
}

function textoVencimento(emp: EmpresaAdmin) {
  const s = situacao(emp);
  if (s.emTeste && s.fim) return s.expirado ? { t: 'Expirado', c: 'text-red-600' } : { t: `${s.dias} dias restantes`, c: 'text-green-700' };
  if (emp.plan_expires_at) return { t: dataBR(emp.plan_expires_at), c: 'text-gray-600' };
  return { t: '—', c: 'text-gray-300' };
}

export default function AdminClientes() {
  const { empresas, loading, reload } = useEmpresasAdmin();
  const { apiCall } = useApi();
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState<FiltroPlano>('all');
  const [ordenarPor, setOrdenarPor] = useState<OrdenarPor>('cadastro');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [detalheEmpresa, setDetalheEmpresa] = useState<EmpresaAdmin | null>(null);
  const [periodoFiltro, setPeriodoFiltro] = useState<'todos' | '7d' | '30d' | '90d'>('todos');

  const changePlan = async (empresaId: string, newPlan: string) => {
    setUpdatingId(empresaId);
    const trialEndsAt = newPlan === 'trial' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : null;
    const update: Record<string, string | null> = { plan: newPlan };
    if (trialEndsAt !== undefined) update.trial_ends_at = trialEndsAt;
    const { error } = await supabase.from('empresas').update(update).eq('id', empresaId);
    setUpdatingId(null);
    if (error) toast.error('Erro ao atualizar plano: ' + error.message);
    else { toast.success(`Plano atualizado para ${newPlan === 'profissional' ? 'Profissional' : 'Trial'}!`); reload(); }
  };

  const mudarPlanoManual = async (empresaId: string, novoPlano: string) => {
    setUpdatingId(empresaId);
    const { error } = await supabase
      .from('empresas')
      .update({ plan_type: novoPlano, is_blocked: false, block_reason: null })
      .eq('id', empresaId);
    setUpdatingId(null);
    if (error) toast.error('Erro ao mudar plano: ' + error.message);
    else { toast.success('Plano atualizado!'); reload(); setDetalheEmpresa(null); }
  };

  const extendTrial = async (empresaId: string, dias = 30) => {
    setUpdatingId(empresaId);
    const empresaAtual = empresas.find(e => e.id === empresaId);
    const base = empresaAtual?.trial_ends_at && new Date(empresaAtual.trial_ends_at) > new Date()
      ? new Date(empresaAtual.trial_ends_at)
      : new Date();
    base.setDate(base.getDate() + dias);
    const { error } = await supabase.from('empresas').update({ trial_ends_at: base.toISOString() }).eq('id', empresaId);
    setUpdatingId(null);
    if (error) toast.error('Erro: ' + error.message);
    else { toast.success(`Trial estendido por ${dias} dias!`); reload(); }
  };

  const toggleBloqueio = async (empresaAlvo: EmpresaAdmin) => {
    setUpdatingId(empresaAlvo.id);
    const bloquear = !empresaAlvo.is_blocked;
    const { error } = await supabase
      .from('empresas')
      .update({ is_blocked: bloquear, block_reason: bloquear ? 'Bloqueado manualmente pelo admin' : null })
      .eq('id', empresaAlvo.id);
    setUpdatingId(null);
    if (error) toast.error('Erro ao atualizar bloqueio: ' + error.message);
    else { toast.success(bloquear ? 'Empresa bloqueada.' : 'Empresa desbloqueada.'); reload(); }
  };

  // Exclusão real — apaga projetos/profiles/empresa E os usuários de autenticação
  // vinculados (via Edge Function com service role). Deletar só as linhas do
  // Postgres não seria suficiente: o AuthContext auto-provisiona empresa+profile
  // no próximo login se a conta de autenticação continuar existindo, "ressuscitando"
  // o cliente excluído.
  const excluirCliente = async (empresa: EmpresaAdmin) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${empresa.name}"?\n\nIsso remove permanentemente a empresa, os projetos, os perfis e o acesso de login de todos os usuários vinculados. Esta ação é irreversível.`)) {
      return;
    }
    setExcluindoId(empresa.id);
    try {
      await apiCall(`/admin/empresas/${empresa.id}`, { method: 'DELETE' });
      toast.success('Cliente excluído com sucesso.');
      setDetalheEmpresa(null);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao excluir cliente.');
    } finally {
      setExcluindoId(null);
    }
  };

  const filtered = empresas.filter(e => {
    const matchSearch = !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.profiles?.some(p => p.name?.toLowerCase().includes(search.toLowerCase()));
    const trialExpirandoLogo = (() => {
      if (e.is_blocked || !e.trial_ends_at) return false;
      const venc = new Date(e.trial_ends_at);
      const em3dias = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      return venc >= new Date() && venc <= em3dias;
    })();
    const matchPlan = filterPlan === 'all' ||
      (filterPlan === 'trial' && e.plan !== 'profissional' && !(e.plan_type && PLANOS_PAGOS.includes(e.plan_type)) && !e.is_blocked) ||
      (filterPlan === 'trial_expirando' && trialExpirandoLogo) ||
      (filterPlan === 'pagante' && ((!!e.plan_type && PLANOS_PAGOS.includes(e.plan_type)) || e.plan === 'profissional') && !e.is_blocked) ||
      (filterPlan === 'bloqueado' && !!e.is_blocked);
    if (!matchSearch || !matchPlan) return false;

    if (periodoFiltro !== 'todos') {
      const dias = periodoFiltro === '7d' ? 7 : periodoFiltro === '30d' ? 30 : 90;
      const limite = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
      if (new Date(e.created_at) < limite) return false;
    }

    return true;
  });

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (ordenarPor) {
      case 'nome':
        return arr.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      case 'vencimento':
        return arr.sort((a, b) => {
          const va = a.plan_expires_at ?? a.trial_ends_at;
          const vb = b.plan_expires_at ?? b.trial_ends_at;
          if (!va) return 1;
          if (!vb) return -1;
          return new Date(va).getTime() - new Date(vb).getTime();
        });
      case 'plano':
        return arr.sort((a, b) => (a.plan_type ?? a.plan).localeCompare(b.plan_type ?? b.plan));
      case 'cadastro':
      default:
        return arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [filtered, ordenarPor]);

  const exportarCSV = () => {
    baixarCSV(
      `clientes-ambisafe-${new Date().toISOString().split('T')[0]}.csv`,
      ['Empresa', 'Responsável', 'Tipo', 'CPF/CNPJ', 'Plano', 'Status', 'Trial/Vencimento', 'Projetos', 'Cadastro'],
      sorted.map(e => [
        e.name,
        e.profiles?.[0]?.name ?? '',
        e.profiles?.[0]?.tipo_usuario === 'empresa' ? 'Empresa' : 'Pessoa Física',
        e.profiles?.[0]?.cpf_cnpj ?? e.cnpj ?? '',
        e.plan_type && PLANOS_PAGOS.includes(e.plan_type) ? (PLANO_POR_ID[e.plan_type]?.nome ?? e.plan_type) : (e.plan === 'profissional' ? 'Profissional' : 'Trial'),
        e.is_blocked ? 'Bloqueado' : 'Ativo',
        e.plan_expires_at ?? e.trial_ends_at ?? '',
        String(e.projetos?.length ?? 0),
        e.created_at,
      ])
    );
  };

  if (loading) {
    return <PageSkeleton />;
  }

  const contar = (f: FiltroPlano) => empresas.filter(e => {
    const s = situacao(e);
    if (f === 'all') return true;
    if (f === 'bloqueado') return !!e.is_blocked;
    if (f === 'pagante') return (s.pago || s.pro) && !e.is_blocked;
    if (f === 'trial') return s.emTeste && !e.is_blocked;
    if (f === 'trial_expirando') return !e.is_blocked && !!s.fim && !s.expirado && s.dias <= 3;
    return false;
  }).length;

  const MenuAcoes = ({ emp }: { emp: EmpresaAdmin }) => {
    const s = situacao(emp);
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100" aria-label="Mais ações">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setDetalheEmpresa(emp)}><Eye className="w-4 h-4 mr-2" /> Ver detalhes</DropdownMenuItem>
          <DropdownMenuItem onClick={() => abrirWhatsApp(emp)}><MessageCircle className="w-4 h-4 mr-2" /> Falar no WhatsApp</DropdownMenuItem>
          {s.emTeste && <DropdownMenuItem onClick={() => extendTrial(emp.id)}><CalendarPlus className="w-4 h-4 mr-2" /> Estender teste (+30 dias)</DropdownMenuItem>}
          {s.pro && <DropdownMenuItem onClick={() => changePlan(emp.id, 'trial')}><ArrowDownCircle className="w-4 h-4 mr-2" /> Voltar para teste</DropdownMenuItem>}
          {emp.asaas_customer_id && (
            <DropdownMenuItem asChild>
              <a href={`https://app.asaas.com/customer/${emp.asaas_customer_id}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4 mr-2" /> Ver no Asaas</a>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => toggleBloqueio(emp)} className={emp.is_blocked ? 'text-green-700' : 'text-red-600'}>
            {emp.is_blocked ? <><ShieldOff className="w-4 h-4 mr-2" /> Desbloquear acesso</> : <><Ban className="w-4 h-4 mr-2" /> Bloquear acesso</>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => excluirCliente(emp)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Excluir cliente</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const AcaoPrincipal = ({ emp, cheio }: { emp: EmpresaAdmin; cheio?: boolean }) => {
    const s = situacao(emp);
    if (updatingId === emp.id || excluindoId === emp.id) return <Loader2 className="w-4 h-4 animate-spin text-gray-400 mx-2" />;
    if (s.emTeste && !emp.is_blocked) {
      return (
        <Button size="sm" onClick={() => changePlan(emp.id, 'profissional')} className={`h-9 gap-1.5 rounded-xl bg-[#acd115] text-[#00420d] hover:bg-[#acd115]/85 ${cheio ? 'flex-1' : ''}`}>
          <CheckCircle2 className="w-4 h-4" /> Ativar Pro
        </Button>
      );
    }
    return (
      <Button size="sm" variant="outline" onClick={() => abrirWhatsApp(emp)} className={`h-9 gap-1.5 rounded-xl text-green-700 border-green-200 hover:bg-green-50 ${cheio ? 'flex-1' : ''}`}>
        <MessageCircle className="w-4 h-4" /> WhatsApp
      </Button>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Painel administrativo"
        title="Clientes"
        subtitle="Contas cadastradas na plataforma"
        actions={<HeaderButton variant="outline" onClick={exportarCSV}><Download className="w-4 h-4" /> Baixar CSV</HeaderButton>}
      >
        <HeaderStats
          items={([
            ['all', 'Todos'], ['pagante', 'Pagantes'], ['trial', 'Em teste'], ['trial_expirando', 'Expirando'], ['bloqueado', 'Bloqueadas'],
          ] as [FiltroPlano, string][]).map(([f, label]) => ({ label, value: contar(f), active: filterPlan === f, onClick: () => setFilterPlan(f) }))}
        />
      </PageHeader>

      {/* barra de busca e ordenação */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Buscar empresa ou responsável..." value={search} onChange={e => setSearch(e.target.value)} className="pl-11 h-12 rounded-xl bg-white" />
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2">
          <Select value={ordenarPor} onValueChange={v => setOrdenarPor(v as OrdenarPor)}>
            <SelectTrigger className="h-12 rounded-xl bg-white sm:w-44 gap-2"><ArrowUpDown className="w-4 h-4 text-gray-400" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cadastro">Mais recentes</SelectItem>
              <SelectItem value="nome">Nome (A-Z)</SelectItem>
              <SelectItem value="vencimento">Vencimento</SelectItem>
              <SelectItem value="plano">Plano</SelectItem>
            </SelectContent>
          </Select>
          <Select value={periodoFiltro} onValueChange={v => setPeriodoFiltro(v as typeof periodoFiltro)}>
            <SelectTrigger className="h-12 rounded-xl bg-white sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Cadastro: qualquer data</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-3 px-1">{sorted.length} {sorted.length === 1 ? 'cliente' : 'clientes'}</p>

      {/* computador: tabela */}
      <div className="hidden md:block rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="ui-thead">
              <tr>
                <th className="px-5 py-3 text-left">Empresa / responsável</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">CPF/CNPJ</th>
                <th className="px-4 py-3 text-left">Inventários</th>
                <th className="px-4 py-3 text-left">Plano</th>
                <th className="px-4 py-3 text-left">Teste / vencimento</th>
                <th className="px-4 py-3 text-left">Cadastro</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map(emp => {
                const tipo = emp.profiles?.[0]?.tipo_usuario ?? 'empresa';
                const proc = emp.projetos?.filter(p => p.status !== 'rascunho').length ?? 0;
                const doc = emp.profiles?.[0]?.cpf_cnpj ?? emp.cnpj;
                const venc = textoVencimento(emp);
                return (
                  <tr key={emp.id} className="hover:bg-[#f8faf7]">
                    <td className="px-5 py-3">
                      <button onClick={() => setDetalheEmpresa(emp)} className="text-left group">
                        <p className="font-medium text-gray-900 group-hover:underline">{emp.name}</p>
                        {emp.profiles?.[0]?.name && <p className="text-xs text-gray-500">{emp.profiles[0].name}</p>}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {tipo === 'empresa' ? <span className="inline-flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> Empresa</span> : <span className="inline-flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" /> Pessoa física</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">{doc ? maskCpfCnpj(doc) : '—'}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <span className="font-semibold text-gray-800">{emp.projetos?.length ?? 0}</span>
                      {proc > 0 && <span className="text-green-700"> · {proc} processados</span>}
                    </td>
                    <td className="px-4 py-3"><EtiquetaPlano emp={emp} /></td>
                    <td className={`px-4 py-3 text-xs whitespace-nowrap ${venc.c}`}>{venc.t}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{dataBR(emp.created_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <AcaoPrincipal emp={emp} />
                        <MenuAcoes emp={emp} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {sorted.length === 0 && <Vazio>{empresas.length === 0 ? 'Nenhuma empresa cadastrada.' : 'Nenhum cliente para este filtro.'}</Vazio>}
      </div>

      {/* celular: cartões */}
      <div className="md:hidden space-y-3">
        {sorted.map(emp => {
          const venc = textoVencimento(emp);
          const proc = emp.projetos?.filter(p => p.status !== 'rascunho').length ?? 0;
          return (
            <div key={emp.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
              <div className="flex items-start justify-between gap-2">
                <button onClick={() => setDetalheEmpresa(emp)} className="text-left min-w-0">
                  <p className="font-semibold text-gray-900 leading-tight">{emp.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{emp.profiles?.[0]?.name ?? '—'}</p>
                </button>
                <MenuAcoes emp={emp} />
              </div>
              <div className="mt-2"><EtiquetaPlano emp={emp} /></div>
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-50 text-xs">
                <div><p className="text-gray-400 flex items-center gap-1"><Trees className="w-3 h-3" /> Inventários</p><p className="font-semibold text-gray-800 mt-0.5">{emp.projetos?.length ?? 0}{proc > 0 ? <span className="font-normal text-green-700"> · {proc} proc.</span> : null}</p></div>
                <div><p className="text-gray-400">Teste / venc.</p><p className={`font-semibold mt-0.5 ${venc.c}`}>{venc.t}</p></div>
                <div><p className="text-gray-400">Cadastro</p><p className="font-semibold text-gray-800 mt-0.5">{dataBR(emp.created_at)}</p></div>
              </div>
              <div className="flex gap-2 mt-3">
                <AcaoPrincipal emp={emp} cheio />
                <Button size="sm" variant="outline" className="h-9 rounded-xl gap-1.5" onClick={() => setDetalheEmpresa(emp)}><Eye className="w-4 h-4" /> Detalhes</Button>
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && <div className="rounded-2xl border border-gray-100 bg-white"><Vazio>{empresas.length === 0 ? 'Nenhuma empresa cadastrada.' : 'Nenhum cliente para este filtro.'}</Vazio></div>}
      </div>

      {/* Detalhes do cliente */}
      {detalheEmpresa && (() => {
        const d = detalheEmpresa;
        const doc = d.profiles?.[0]?.cpf_cnpj ?? d.cnpj;
        const venc = textoVencimento(d);
        const linhas: [string, ReactNode][] = [
          ['Responsável', d.profiles?.[0]?.name ?? '—'],
          ['Telefone', d.telefone ?? d.profiles?.[0]?.telefone ?? '—'],
          ['CPF/CNPJ', doc ? <span className="font-mono">{maskCpfCnpj(doc)}</span> : '—'],
          ['Cidade', [d.cidade ?? d.profiles?.[0]?.cidade, d.estado_uf ?? d.profiles?.[0]?.estado_uf].filter(Boolean).join('/') || '—'],
          ['Plano', <EtiquetaPlano key="p" emp={d} />],
          ['Teste / vencimento', <span key="v" className={venc.c}>{venc.t}</span>],
          ['Inventários', `${d.projetos?.length ?? 0} criados`],
          ['Cadastro', dataBR(d.created_at)],
        ];
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDetalheEmpresa(null)} />
            <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[92vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
              <div className="bg-gradient-to-br from-[#00420d] via-[#0B5A1E] to-[#16A34A] text-white px-6 pt-6 pb-5 rounded-t-3xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white/70 text-xs">Cliente</p>
                    <h3 className="text-xl font-bold leading-tight">{d.name}</h3>
                  </div>
                  <button onClick={() => setDetalheEmpresa(null)} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0" aria-label="Fechar"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <dl className="divide-y divide-gray-50 text-sm">
                  {linhas.map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-4 py-2.5">
                      <dt className="text-gray-500">{k}</dt>
                      <dd className="text-gray-900 font-medium text-right">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500">Mudar plano (cobrança)</label>
                  <Select value={d.plan_type ?? 'trial'} onValueChange={v => mudarPlanoManual(d.id, v)}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Teste</SelectItem>
                      {PLANOS.map(p => <SelectItem key={p.id} value={p.id}>{p.nome} — {p.precoFormatado}/mês</SelectItem>)}
                      <SelectItem value="bloqueado">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="rounded-xl gap-1.5" onClick={() => extendTrial(d.id)}><CalendarPlus className="w-4 h-4" /> +30 dias de teste</Button>
                  <Button variant="outline" className="rounded-xl gap-1.5 text-green-700 border-green-200 hover:bg-green-50" onClick={() => abrirWhatsApp(d)}><MessageCircle className="w-4 h-4" /> WhatsApp</Button>
                  <Button variant="outline" className={`rounded-xl gap-1.5 ${d.is_blocked ? 'text-green-700 border-green-200' : 'text-red-600 border-red-200'}`} onClick={() => { toggleBloqueio(d); setDetalheEmpresa(null); }}>
                    {d.is_blocked ? <><ShieldOff className="w-4 h-4" /> Desbloquear</> : <><Ban className="w-4 h-4" /> Bloquear</>}
                  </Button>
                  {d.asaas_customer_id ? (
                    <a href={`https://app.asaas.com/customer/${d.asaas_customer_id}`} target="_blank" rel="noopener noreferrer" className="h-9 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5"><ExternalLink className="w-4 h-4" /> Ver no Asaas</a>
                  ) : <span />}
                </div>
                <button onClick={() => excluirCliente(d)} disabled={excluindoId === d.id} className="w-full text-sm text-red-600 hover:text-red-700 inline-flex items-center justify-center gap-1.5 pt-2">
                  {excluindoId === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Excluir cliente permanentemente
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
