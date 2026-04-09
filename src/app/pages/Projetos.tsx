import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import {
  Plus, Trees, Search, Loader2, ChevronRight,
  Clock, BarChart3, CheckCircle2, Filter, MapPin, Ruler, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Projeto {
  id: string;
  nome: string;
  municipio: string | null;
  estado: string | null;
  area_total_ha: number | null;
  tipo_inventario: string | null;
  motivo_inventario: string | null;
  bioma: string | null;
  status: string;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'processado', label: 'Processado' },
  { value: 'finalizado', label: 'Finalizado' },
] as const;

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

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Projeto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProjetos = async () => {
    if (!empresa?.id) { setLoading(false); return; }
    const { data } = await supabase
      .from('projetos')
      .select('id, nome, municipio, estado, area_total_ha, tipo_inventario, motivo_inventario, bioma, status, created_at')
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

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventários</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {projetos.length} projeto{projetos.length !== 1 ? 's' : ''} no total
          </p>
        </div>
        <Button
          onClick={() => navigate('/app/projetos/novo')}
          className="bg-[#00420d] hover:bg-[#00420d]/90 text-white gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Novo Inventário
        </Button>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Rascunhos', count: countByStatus('rascunho'), color: 'text-gray-600', bg: 'bg-gray-50' },
          { label: 'Processados', count: countByStatus('processado'), color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Finalizados', count: countByStatus('finalizado'), color: 'text-green-700', bg: 'bg-green-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por nome, município ou estado..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 border rounded-lg overflow-hidden p-1 bg-gray-50 flex-shrink-0">
          <Filter className="w-3.5 h-3.5 text-gray-400 ml-1" />
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === opt.value
                  ? 'bg-[#00420d] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Project list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#00420d]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
          <Trees className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-gray-600 font-semibold mb-1">
            {projetos.length === 0 ? 'Nenhum inventário criado' : 'Nenhum resultado encontrado'}
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            {projetos.length === 0
              ? 'Crie seu primeiro projeto de inventário florestal'
              : 'Tente ajustar os filtros de busca'}
          </p>
          {projetos.length === 0 && (
            <Button
              onClick={() => navigate('/app/projetos/novo')}
              className="bg-[#00420d] hover:bg-[#00420d]/90 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Criar Primeiro Inventário
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(projeto => {
            const statusCfg = STATUS_CONFIG[projeto.status] ?? STATUS_CONFIG['rascunho'];
            return (
              <Card
                key={projeto.id}
                className="border-0 shadow-sm hover:shadow-md transition-all group"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-11 h-11 bg-[#00420d]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#00420d]/20 transition-colors cursor-pointer"
                      onClick={() => navigate(`/app/projetos/${projeto.id}`)}
                    >
                      <Trees className="w-5 h-5 text-[#00420d]" />
                    </div>

                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => navigate(`/app/projetos/${projeto.id}`)}
                    >
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h3 className="font-semibold text-gray-900 truncate">{projeto.nome}</h3>
                        <Badge variant="outline" className={`flex-shrink-0 text-xs gap-1 ${statusCfg.color}`}>
                          {statusCfg.icon}
                          {statusCfg.label}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        {(projeto.municipio || projeto.estado) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {projeto.municipio}{projeto.estado ? `/${projeto.estado}` : ''}
                          </span>
                        )}
                        {projeto.area_total_ha && (
                          <span className="flex items-center gap-1">
                            <Ruler className="w-3 h-3" />
                            {projeto.area_total_ha.toLocaleString('pt-BR')} ha
                          </span>
                        )}
                        {projeto.bioma && (
                          <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                            {BIOMA_LABEL[projeto.bioma] ?? projeto.bioma}
                          </span>
                        )}
                        <span className="text-gray-400">
                          {new Date(projeto.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteTarget(projeto); }}
                        className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Excluir projeto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight
                        className="w-5 h-5 text-gray-300 group-hover:text-[#00420d] transition-colors cursor-pointer"
                        onClick={() => navigate(`/app/projetos/${projeto.id}`)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
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
              <strong className="text-gray-900">"{deleteTarget.nome}"</strong>?{' '}
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
