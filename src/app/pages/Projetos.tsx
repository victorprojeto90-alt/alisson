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
  Clock, BarChart3, CheckCircle2, Filter, MapPin, Ruler,
} from 'lucide-react';

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

const MOTIVO_LABEL: Record<string, string> = {
  licenciamento: 'Licenciamento',
  manejo: 'Manejo Florestal',
  supressao: 'Supressão Vegetal',
  academico: 'Acadêmico',
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

  useEffect(() => {
    if (!empresa?.id) { setLoading(false); return; }
    supabase
      .from('projetos')
      .select('id, nome, municipio, estado, area_total_ha, tipo_inventario, motivo_inventario, bioma, status, created_at')
      .eq('empresa_id', empresa.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProjetos(data ?? []);
        setLoading(false);
      });
  }, [empresa?.id]);

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
          className="bg-[#0B3D2E] hover:bg-[#0B3D2E]/90 text-white gap-2 self-start sm:self-auto"
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
                  ? 'bg-[#0B3D2E] text-white shadow-sm'
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
          <Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" />
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
              className="bg-[#0B3D2E] hover:bg-[#0B3D2E]/90 text-white gap-2"
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
                className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                onClick={() => navigate(`/app/projetos/${projeto.id}`)}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 bg-[#0B3D2E]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#0B3D2E]/20 transition-colors">
                      <Trees className="w-5 h-5 text-[#0B3D2E]" />
                    </div>

                    <div className="flex-1 min-w-0">
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
                        {projeto.motivo_inventario && (
                          <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                            {MOTIVO_LABEL[projeto.motivo_inventario] ?? projeto.motivo_inventario}
                          </span>
                        )}
                        <span className="text-gray-400">
                          {new Date(projeto.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#16A34A] transition-colors flex-shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
