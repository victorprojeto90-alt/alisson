import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useApi } from '../../hooks/useApi';
import {
  useEmpresasAdmin, EmpresaAdmin, PLANOS_PAGOS, PLANO_POR_ID, maskCpfCnpj,
  abrirWhatsApp, baixarCSV, cores,
} from './adminShared';
import { PLANOS } from '../../lib/planos';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  Building2, Search, ArrowUpDown, Download, Eye, Briefcase, UserCheck,
  Crown, Ban, ShieldOff, CheckCircle2, MessageCircle, ExternalLink,
  Loader2, X, Trash2,
} from 'lucide-react';

type FiltroPlano = 'all' | 'trial' | 'trial_expirando' | 'profissional' | 'pagante' | 'bloqueado';
type OrdenarPor = 'cadastro' | 'nome' | 'vencimento' | 'plano';

function PageHeader() {
  return (
    <div style={{ background: 'white', borderBottom: `1px solid ${cores.borda}`, padding: '24px 32px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: cores.texto }}>Clientes</h1>
      <p style={{ color: cores.textoSecundario, marginTop: '2px', fontSize: '14px' }}>Contas cadastradas na plataforma</p>
    </div>
  );
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
    if (!confirm(`Tem certeza que deseja excluir "${empresa.name}"?\n\nIsso remove permanentemente a empresa, os projetos, os perfis e o acesso de login de todos os usuários vinculados. Esta ação é irreversível.`)) {
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
    const matchPlan = filterPlan === 'all' || e.plan === filterPlan ||
      (filterPlan === 'trial' && e.plan !== 'profissional') ||
      (filterPlan === 'trial_expirando' && trialExpirandoLogo) ||
      (filterPlan === 'pagante' && !!e.plan_type && PLANOS_PAGOS.includes(e.plan_type)) ||
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
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={32} color={cores.verde} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader />
      <div style={{ padding: '24px 32px' }}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center justify-between flex-wrap gap-3 p-4 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-800">Clientes ({filtered.length})</span>
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
                <Select value={ordenarPor} onValueChange={v => setOrdenarPor(v as OrdenarPor)}>
                  <SelectTrigger className="h-8 text-xs w-40 gap-1">
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cadastro">Mais recentes</SelectItem>
                    <SelectItem value="nome">Nome (A-Z)</SelectItem>
                    <SelectItem value="vencimento">Vencimento</SelectItem>
                    <SelectItem value="plano">Plano</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex border rounded-lg overflow-hidden text-xs flex-wrap">
                  {(['all', 'profissional', 'pagante', 'trial', 'trial_expirando', 'bloqueado'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setFilterPlan(p)}
                      className={`px-3 py-1.5 font-medium transition-colors ${
                        filterPlan === p ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      style={filterPlan === p ? { background: cores.verde } : undefined}
                    >
                      {p === 'all' ? 'Todos' : p === 'profissional' ? 'Pro' : p === 'pagante' ? 'Pagantes' : p === 'trial' ? 'Trial' : p === 'trial_expirando' ? 'Expirando' : 'Bloqueados'}
                    </button>
                  ))}
                </div>
                <Select value={periodoFiltro} onValueChange={v => setPeriodoFiltro(v as typeof periodoFiltro)}>
                  <SelectTrigger className="h-8 text-xs w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Cadastro: todos</SelectItem>
                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                    <SelectItem value="30d">Últimos 30 dias</SelectItem>
                    <SelectItem value="90d">Últimos 90 dias</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={exportarCSV}>
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Empresa / Responsável</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Tipo</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">CPF/CNPJ</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Projetos</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Plano</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Trial/Venc.</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Cadastro</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 text-xs">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sorted.map((emp, i) => {
                    const trialEndsAt = emp.trial_ends_at ? new Date(emp.trial_ends_at) : null;
                    const trialExpired = trialEndsAt ? trialEndsAt < new Date() : false;
                    const trialDays = trialEndsAt
                      ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                      : 0;
                    const isUpdating = updatingId === emp.id;
                    const isExcluindo = excluindoId === emp.id;
                    const tipoUsuario = emp.profiles?.[0]?.tipo_usuario ?? 'empresa';
                    const processados = emp.projetos?.filter(p => p.status !== 'rascunho').length ?? 0;
                    const cpfCnpj = emp.profiles?.[0]?.cpf_cnpj ?? emp.cnpj;

                    return (
                      <tr key={emp.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                        <td className="px-4 py-3">
                          <button onClick={() => setDetalheEmpresa(emp)} className="text-left hover:underline">
                            <p className="font-medium text-gray-900 text-sm">{emp.name}</p>
                            {emp.profiles?.[0]?.name && <p className="text-xs text-gray-400">{emp.profiles[0].name}</p>}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            {tipoUsuario === 'empresa' ? <><Briefcase className="w-3 h-3" /> Empresa</> : <><UserCheck className="w-3 h-3" /> Pessoa Física</>}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">{cpfCnpj ? maskCpfCnpj(cpfCnpj) : '—'}</td>
                        <td className="px-4 py-3">
                          <div className="text-xs">
                            <span className="text-gray-800 font-medium">{emp.projetos?.length ?? 0}</span>
                            <span className="text-gray-400"> total</span>
                            {processados > 0 && <span className="text-green-600 ml-1">· {processados} proc.</span>}
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
                            <Badge variant="outline" className={trialExpired ? 'text-red-600 border-red-200 bg-red-50 text-xs' : 'text-yellow-600 border-yellow-200 bg-yellow-50 text-xs'}>
                              {trialExpired ? 'Expirado' : `Trial · ${trialDays}d`}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {emp.plan !== 'profissional' && trialEndsAt ? (
                            trialExpired ? <span className="text-red-500">Expirado</span> : <span className="text-green-600">{trialDays}d restantes</span>
                          ) : emp.plan_expires_at ? (
                            <span className="text-gray-500">{new Date(emp.plan_expires_at).toLocaleDateString('pt-BR')}</span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{new Date(emp.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-3">
                          {isUpdating || isExcluindo ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          ) : (
                            <div className="flex items-center gap-1 flex-wrap">
                              <button onClick={() => setDetalheEmpresa(emp)} className="text-xs h-7 px-2 flex items-center gap-1 text-gray-400 hover:text-gray-700" title="Ver detalhes">
                                <Eye className="w-3 h-3" />
                              </button>
                              {emp.plan === 'profissional' ? (
                                <Button variant="outline" size="sm" className="text-xs h-7 border-gray-200 text-gray-600" onClick={() => changePlan(emp.id, 'trial')}>
                                  Rebaixar
                                </Button>
                              ) : (
                                <>
                                  <Button size="sm" className="text-xs h-7 gap-1" style={{ background: cores.verdeClaro, color: cores.verde }} onClick={() => changePlan(emp.id, 'profissional')}>
                                    <CheckCircle2 className="w-3 h-3" /> Ativar Pro
                                  </Button>
                                  <Button variant="outline" size="sm" className="text-xs h-7 border-blue-200 text-blue-600" onClick={() => extendTrial(emp.id)}>
                                    +30d
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="outline" size="sm"
                                className={`text-xs h-7 gap-1 ${emp.is_blocked ? 'border-green-200 text-green-600' : 'border-red-200 text-red-600'}`}
                                onClick={() => toggleBloqueio(emp)}
                                title={emp.is_blocked ? 'Desbloquear acesso' : 'Bloquear acesso'}
                              >
                                {emp.is_blocked ? <ShieldOff className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                              </Button>
                              <button onClick={() => abrirWhatsApp(emp)} className="text-xs h-7 px-2 flex items-center gap-1 text-gray-400 hover:text-green-600" title="Falar no WhatsApp">
                                <MessageCircle className="w-3 h-3" />
                              </button>
                              {emp.asaas_customer_id && (
                                <a href={`https://app.asaas.com/customer/${emp.asaas_customer_id}`} target="_blank" rel="noopener noreferrer" className="text-xs h-7 px-2 flex items-center gap-1 text-gray-400 hover:text-gray-700" title="Ver cliente no Asaas">
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                              <button onClick={() => excluirCliente(emp)} className="text-xs h-7 px-2 flex items-center gap-1 text-red-400 hover:text-red-600" title="Excluir cliente">
                                <Trash2 className="w-3 h-3" />
                              </button>
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
                    {empresas.length === 0 ? 'Nenhuma empresa. Execute o SQL das políticas admin no Supabase.' : 'Nenhum resultado para o filtro aplicado.'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de detalhes do cliente */}
      {detalheEmpresa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetalheEmpresa(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{detalheEmpresa.name}</h3>
              <button onClick={() => setDetalheEmpresa(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-500">Responsável: <span className="text-gray-800 font-medium">{detalheEmpresa.profiles?.[0]?.name ?? '—'}</span></p>
              <p className="text-xs text-gray-400">E-mail não disponível aqui — precisa do endpoint admin (auth.admin), não implementado ainda.</p>
              {(detalheEmpresa.profiles?.[0]?.cpf_cnpj ?? detalheEmpresa.cnpj) && (
                <p className="text-gray-500">CPF/CNPJ: <span className="text-gray-800 font-mono">{maskCpfCnpj((detalheEmpresa.profiles?.[0]?.cpf_cnpj ?? detalheEmpresa.cnpj)!)}</span></p>
              )}
              <p className="text-gray-500">
                Plano: <span className="text-gray-800 font-medium">
                  {detalheEmpresa.plan_type && PLANOS_PAGOS.includes(detalheEmpresa.plan_type) ? PLANO_POR_ID[detalheEmpresa.plan_type]?.nome : detalheEmpresa.plan === 'profissional' ? 'Profissional' : 'Trial'}
                </span>
              </p>
              <p className="text-gray-500">Cadastro: <span className="text-gray-800">{new Date(detalheEmpresa.created_at).toLocaleDateString('pt-BR')}</span></p>
              <p className="text-gray-500">Projetos: <span className="text-gray-800">{detalheEmpresa.projetos?.length ?? 0} criados</span></p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
              <label className="text-xs font-medium text-gray-500">Mudar plano (billing Asaas)</label>
              <Select value={detalheEmpresa.plan_type ?? 'trial'} onValueChange={v => mudarPlanoManual(detalheEmpresa.id, v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  {PLANOS.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome} — {p.precoFormatado}/mês</SelectItem>
                  ))}
                  <SelectItem value="bloqueado">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Button size="sm" variant="outline" className="text-xs" onClick={() => extendTrial(detalheEmpresa.id)}>Estender Trial (+30d)</Button>
              <Button
                size="sm" variant="outline"
                className={`text-xs ${detalheEmpresa.is_blocked ? 'border-green-200 text-green-600' : 'border-red-200 text-red-600'}`}
                onClick={() => { toggleBloqueio(detalheEmpresa); setDetalheEmpresa(null); }}
              >
                {detalheEmpresa.is_blocked ? 'Desbloquear' : 'Bloquear'}
              </Button>
              <Button size="sm" variant="outline" className="text-xs gap-1 border-green-200 text-green-700" onClick={() => abrirWhatsApp(detalheEmpresa)}>
                <MessageCircle className="w-3 h-3" /> WhatsApp
              </Button>
              {detalheEmpresa.asaas_customer_id && (
                <a href={`https://app.asaas.com/customer/${detalheEmpresa.asaas_customer_id}`} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Ver no Asaas
                </a>
              )}
              <Button
                size="sm" variant="outline"
                className="text-xs gap-1 border-red-200 text-red-600 hover:bg-red-50 ml-auto"
                onClick={() => excluirCliente(detalheEmpresa)}
                disabled={excluindoId === detalheEmpresa.id}
              >
                <Trash2 className="w-3 h-3" /> Excluir cliente
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
