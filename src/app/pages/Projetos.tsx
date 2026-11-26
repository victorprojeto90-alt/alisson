import { useState, useEffect } from 'react';
import { Bone, ListSkeleton } from '../components/ui/skeletons';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '../components/ui/dropdown-menu';
import EditarProjetoModal, { type ProjetoEditavel } from '../components/project/EditarProjetoModal';
import {
  Plus, Trees, Search, Loader2, ChevronRight,
  Clock, BarChart3, CheckCircle2, MapPin, Ruler, Trash2, Pencil,
  MoreVertical, ArrowUpDown, Calendar, Layers,
} from 'lucide-react';
import { toast } from 'sonner';

interface Projeto {
  id: string;
  nome: string;
  data_inventario: string | null;
  descricao: string | null;
  municipio: string | null;
  estado: string | null;
  area_total_ha: number | null;
  tipo_inventario: string | null;
  motivo_inventario: string | null;
  bioma: string | null;
  status: string;
  created_at: string;
}


const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  rascunho: {
    label: 'Rascunho',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: <Clock className="w-3 h-3" />,
  },
  processado: {
    label: 'Processado',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <BarChart3 className="w-3 h-3" />,
  },
  finalizado: {
    label: 'Finalizado',
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
};

const TIPO_LABEL: Record<string, string> = {
  casual_simples: 'Casual Simples',
  censo: 'Censo 100%',
};

type Ordem = 'recentes' | 'nome' | 'area';

const BIOMA_LABEL: Record<string, string> = {
  amazonia: 'Amazônia',
  cerrado: 'Cerrado',
  mata_atlantica: 'Mata Atlântica',
  caatinga: 'Caatinga',
  pampa: 'Pampa',
  pantanal: 'Pantanal',
};

export default function Projetos() {
  const navigate = useNavigate();
  const { empresa } = useAuth();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'rascunho' | 'processado' | 'finalizado'>('all');
  const [ordem, setOrdem] = useState<Ordem>('recentes');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Projeto | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit modal state
  const [editTarget, setEditTarget] = useState<Projeto | null>(null);

  const fetchProjetos = async () => {
    if (!empresa?.id) return; // perfil ainda carregando: mantém os blocos de carregamento
    const { data } = await supabase
      .from('projetos')
      .select('id, nome, data_inventario, descricao, municipio, estado, area_total_ha, tipo_inventario, motivo_inventario, bioma, status, created_at')
      .eq('empresa_id', empresa.id)
      .order('created_at', { ascending: false });
    setProjetos(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProjetos();
  }, [empresa?.id]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Delete related data first
      await supabase.from('arvores').delete().eq('projeto_id', deleteTarget.id);
      await supabase.from('parcelas').delete().eq('projeto_id', deleteTarget.id);
      const { error } = await supabase.from('projetos').delete().eq('id', deleteTarget.id);
      if (error) {
        toast.error('Erro ao excluir projeto: ' + error.message);
      } else {
        toast.success(`Projeto "${deleteTarget.nome}" excluído com sucesso.`);
        setProjetos(prev => prev.filter(p => p.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  const filtered = projetos.filter(p => {
    const matchSearch = !search ||
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      (p.municipio ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.estado ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const countByStatus = (status: string) => projetos.filter(p => p.status === status).length;
  const areaTotal = projetos.reduce((soma, p) => soma + (p.area_total_ha ?? 0), 0);

  const ordenados = [...filtered].sort((a, b) => {
    if (ordem === 'nome') return a.nome.localeCompare(b.nome, 'pt-BR');
    if (ordem === 'area') return (b.area_total_ha ?? 0) - (a.area_total_ha ?? 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const abrir = (id: string) => navigate(`/app/projetos/${id}`);
  const local = (p: Projeto) => [p.municipio, p.estado].filter(Boolean).join('/');
  const dataFmt = (p: Projeto) => new Date(p.data_inventario ?? p.created_at).toLocaleDateString('pt-BR');

  const filtros = [
    { value: 'all' as const, label: 'Todos', count: projetos.length },
    { value: 'rascunho' as const, label: 'Rascunhos', count: countByStatus('rascunho') },
    { value: 'processado' as const, label: 'Processados', count: countByStatus('processado') },
    { value: 'finalizado' as const, label: 'Finalizados', count: countByStatus('finalizado') },
  ];

  const StatusBadge = ({ status }: { status: string }) => {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['rascunho'];
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${cfg.color}`}>
        {cfg.icon}{cfg.label}
      </span>
    );
  };

  const MenuAcoes = ({ projeto }: { projeto: Projeto }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={e => e.stopPropagation()}
          className="w-9 h-9 -mr-1 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 active:bg-gray-200"
          aria-label="Ações do projeto"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44" onClick={e => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => abrir(projeto.id)}>
          <ChevronRight className="w-4 h-4" /> Abrir
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setEditTarget(projeto)}>
          <Pencil className="w-4 h-4" /> Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setDeleteTarget(projeto)} className="text-red-600 focus:text-red-600">
          <Trash2 className="w-4 h-4" /> Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Cabeçalho verde com contadores que filtram a lista */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#00420d] via-[#0B5A1E] to-[#16A34A] text-white p-5 md:p-8 mb-5 md:mb-6 shadow-lg">
        <div className="absolute -top-12 -right-12 w-44 h-44 md:w-72 md:h-72 rounded-full bg-white/10 pointer-events-none" />
        <div className="relative md:flex md:items-start md:justify-between md:gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Inventários</h1>
            <p className="text-white/75 text-sm mt-1">
              {loading
                ? <Bone className="h-4 w-40 inline-block bg-white/20" />
                : <>{projetos.length} projeto{projetos.length !== 1 ? 's' : ''} · {areaTotal.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ha inventariados</>}
            </p>
          </div>
          <button
            onClick={() => navigate('/app/projetos/novo')}
            className="mt-4 md:mt-0 w-full md:w-auto h-12 md:px-6 rounded-xl bg-white text-[#00420d] font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all flex-shrink-0"
          >
            <Plus className="w-5 h-5" /> Novo Inventário
          </button>
        </div>

        <div className="relative grid grid-cols-4 gap-2 mt-5 md:mt-7 md:max-w-2xl">
          {filtros.map(f => {
            const ativo = statusFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`rounded-2xl py-2.5 md:py-3 px-1 text-center transition-all ${
                  ativo ? 'bg-white text-[#00420d] shadow-md' : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                {loading
                  ? <Bone className={`h-6 w-6 mx-auto mb-1 ${ativo ? '' : 'bg-white/20'}`} />
                  : <p className="text-xl md:text-2xl font-bold leading-none">{f.count}</p>}
                <p className={`text-[11px] md:text-xs mt-1 ${ativo ? 'text-[#00420d]/80 font-semibold' : 'text-white/75'}`}>{f.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Busca + ordenação */}
      <div className="flex gap-2 md:gap-3 mb-4 md:mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por nome ou cidade..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-12 rounded-xl bg-white border-gray-200"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-12 px-3 md:px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 flex items-center gap-2 hover:bg-gray-50 flex-shrink-0">
              <ArrowUpDown className="w-4 h-4" />
              <span className="hidden sm:inline">
                {ordem === 'recentes' ? 'Mais recentes' : ordem === 'nome' ? 'Nome (A–Z)' : 'Maior área'}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setOrdem('recentes')}>Mais recentes</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOrdem('nome')}>Nome (A–Z)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOrdem('area')}>Maior área</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Lista */}
      {loading ? (
        <ListSkeleton rows={4} />
      ) : ordenados.length === 0 ? (
        <div className="text-center py-16 md:py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-white">
          <div className="w-16 h-16 rounded-2xl bg-[#00420d]/10 flex items-center justify-center mx-auto mb-4">
            <Trees className="w-8 h-8 text-[#00420d]" />
          </div>
          <h3 className="text-gray-800 font-semibold mb-1">
            {projetos.length === 0 ? 'Nenhum inventário criado' : 'Nenhum resultado encontrado'}
          </h3>
          <p className="text-gray-400 text-sm mb-6 px-6">
            {projetos.length === 0
              ? 'Crie seu primeiro projeto de inventário florestal'
              : 'Tente ajustar a busca ou o filtro de status'}
          </p>
          {projetos.length === 0 && (
            <Button
              onClick={() => navigate('/app/projetos/novo')}
              className="bg-[#00420d] hover:bg-[#00420d]/90 text-white gap-2 h-11 rounded-xl"
            >
              <Plus className="w-4 h-4" />
              Criar Primeiro Inventário
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Celular: cartões */}
          <div className="md:hidden space-y-3">
            {ordenados.map(projeto => (
              <div
                key={projeto.id}
                onClick={() => abrir(projeto.id)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 active:scale-[0.99] active:bg-gray-50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-[#00420d]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Trees className="w-5 h-5 text-[#00420d]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">{projeto.nome}</h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <StatusBadge status={projeto.status} />
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{dataFmt(projeto)}
                      </span>
                    </div>
                  </div>
                  <MenuAcoes projeto={projeto} />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 text-xs">
                  <div className="min-w-0">
                    <p className="text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />Local</p>
                    <p className="text-gray-800 font-medium truncate mt-0.5">{local(projeto) || '—'}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-400 flex items-center gap-1"><Ruler className="w-3 h-3" />Área</p>
                    <p className="text-gray-800 font-medium mt-0.5">{projeto.area_total_ha ? `${projeto.area_total_ha.toLocaleString('pt-BR')} ha` : '—'}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-400 flex items-center gap-1"><Layers className="w-3 h-3" />Bioma</p>
                    <p className="text-gray-800 font-medium truncate mt-0.5">{projeto.bioma ? (BIOMA_LABEL[projeto.bioma] ?? projeto.bioma) : '—'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Computador: tabela */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500 bg-gray-50/80 border-b border-gray-100">
                  <th className="px-5 py-3.5 font-semibold">Projeto</th>
                  <th className="px-4 py-3.5 font-semibold">Local</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Área</th>
                  <th className="px-4 py-3.5 font-semibold">Bioma</th>
                  <th className="px-4 py-3.5 font-semibold">Data</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {ordenados.map(projeto => (
                  <tr
                    key={projeto.id}
                    onClick={() => abrir(projeto.id)}
                    className="border-b border-gray-50 last:border-0 hover:bg-[#acd115]/[0.07] cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#00420d]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#00420d] transition-colors">
                          <Trees className="w-5 h-5 text-[#00420d] group-hover:text-[#acd115] transition-colors" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">{projeto.nome}</p>
                          {projeto.tipo_inventario && (
                            <p className="text-xs text-gray-400 mt-0.5">{TIPO_LABEL[projeto.tipo_inventario] ?? projeto.tipo_inventario}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{local(projeto) || '—'}</td>
                    <td className="px-4 py-4 text-gray-900 font-medium text-right tabular-nums">
                      {projeto.area_total_ha ? `${projeto.area_total_ha.toLocaleString('pt-BR')} ha` : '—'}
                    </td>
                    <td className="px-4 py-4">
                      {projeto.bioma
                        ? <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium">{BIOMA_LABEL[projeto.bioma] ?? projeto.bioma}</span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-4 text-gray-500 tabular-nums">{dataFmt(projeto)}</td>
                    <td className="px-4 py-4"><StatusBadge status={projeto.status} /></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={e => { e.stopPropagation(); setEditTarget(projeto); }}
                          className="p-2 rounded-lg text-gray-500 hover:text-[#00420d] hover:bg-green-50 transition-colors"
                          title="Editar projeto"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteTarget(projeto); }}
                          className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Excluir projeto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#00420d] transition-colors ml-1" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Edit modal */}
      {editTarget && (
        <EditarProjetoModal
          projeto={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(atualizado: ProjetoEditavel) => {
            setProjetos(prev => prev.map(p => p.id === atualizado.id ? { ...p, ...atualizado } : p));
            setEditTarget(null);
          }}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-10">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Excluir Projeto</h3>
            <p className="text-gray-500 text-sm text-center mb-6">
              Tem certeza que deseja excluir o projeto{' '}
              <strong className="text-gray-900">&ldquo;{deleteTarget.nome}&rdquo;</strong>?{' '}
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Excluindo...</>
                ) : (
                  <><Trash2 className="w-4 h-4" /> Excluir</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
