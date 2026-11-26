import { useState, useEffect } from 'react';
import { PageSkeleton } from '../components/ui/skeletons';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { PageHeader, HeaderStats } from '../components/layout/PageHeader';
import {
  FileText,
  BarChart3,
  ChevronRight,
  Trees,
  MapPin,
  Calendar,
  CheckCircle2,
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
  status: string;
  created_at: string;
}

const MOTIVO_LABEL: Record<string, string> = {
  licenciamento: 'Licenciamento Ambiental',
  manejo: 'Manejo Florestal',
  supressao: 'Supressão Vegetal',
  academico: 'Levantamento Acadêmico',
};

export default function Relatorios() {
  const navigate = useNavigate();
  const { empresa } = useAuth();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!empresa?.id) return;
    supabase
      .from('projetos')
      .select('id, nome, municipio, estado, area_total_ha, tipo_inventario, motivo_inventario, status, created_at')
      .eq('empresa_id', empresa.id)
      .in('status', ['processado', 'finalizado'])
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error('Erro ao carregar relatórios');
        else setProjetos(data ?? []);
        setLoading(false);
      });
  }, [empresa?.id]);

  if (loading) {
    return (
      <PageSkeleton />
    );
  }

  const nProcessados = projetos.filter(p => p.status === 'processado').length;
  const nFinalizados = projetos.filter(p => p.status === 'finalizado').length;
  const areaTotal = projetos.reduce((s, p) => s + (p.area_total_ha ?? 0), 0);
  const local = (p: Projeto) => [p.municipio, p.estado].filter(Boolean).join('/');
  const StatusBadge = ({ status }: { status: string }) => (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${
      status === 'finalizado' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'
    }`}>
      {status === 'finalizado' ? <CheckCircle2 className="w-3 h-3" /> : <BarChart3 className="w-3 h-3" />}
      {status === 'finalizado' ? 'Finalizado' : 'Processado'}
    </span>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Relatórios"
        subtitle="Inventários processados, prontos para gerar e exportar o relatório técnico"
      >
        <HeaderStats
          items={[
            { label: 'Disponíveis', value: projetos.length, active: true },
            { label: 'Prontos', value: nProcessados },
            { label: 'Finalizados', value: nFinalizados },
            { label: 'Hectares', value: areaTotal.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) },
          ]}
        />
      </PageHeader>

      {projetos.length === 0 ? (
        <div className="text-center py-16 md:py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-white">
          <div className="w-16 h-16 rounded-2xl bg-[#00420d]/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-[#00420d]" />
          </div>
          <h3 className="text-gray-800 font-semibold mb-1">Nenhum relatório disponível</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto px-6">
            Inventários processados ou finalizados aparecem aqui para exportação.
          </p>
          <Button onClick={() => navigate('/app/projetos')} className="bg-[#00420d] hover:bg-[#00420d]/90 text-white gap-2 h-11 rounded-xl">
            <Trees className="w-4 h-4" /> Ver meus inventários
          </Button>
        </div>
      ) : (
        <>
          {/* Celular: cartões */}
          <div className="md:hidden space-y-3">
            {projetos.map(projeto => (
              <div
                key={projeto.id}
                onClick={() => navigate(`/app/projetos/${projeto.id}`)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 active:scale-[0.99] active:bg-gray-50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-[#00420d]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-[#00420d]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">{projeto.nome}</h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <StatusBadge status={projeto.status} />
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{new Date(projeto.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 mt-3" />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 text-xs">
                  <div className="min-w-0">
                    <p className="text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />Local</p>
                    <p className="text-gray-800 font-medium truncate mt-0.5">{local(projeto) || '—'}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-400 flex items-center gap-1"><Trees className="w-3 h-3" />Área</p>
                    <p className="text-gray-800 font-medium mt-0.5">{projeto.area_total_ha ? `${projeto.area_total_ha.toLocaleString('pt-BR')} ha` : '—'}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-400 flex items-center gap-1"><FileText className="w-3 h-3" />Finalidade</p>
                    <p className="text-gray-800 font-medium truncate mt-0.5">{projeto.motivo_inventario ? (MOTIVO_LABEL[projeto.motivo_inventario] ?? projeto.motivo_inventario) : '—'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Computador: tabela */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="ui-thead">
                <tr className="text-left">
                  <th className="px-5 py-3.5">Inventário</th>
                  <th className="px-4 py-3.5">Local</th>
                  <th className="px-4 py-3.5 text-right">Área</th>
                  <th className="px-4 py-3.5">Finalidade</th>
                  <th className="px-4 py-3.5">Data</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Relatório</th>
                </tr>
              </thead>
              <tbody>
                {projetos.map(projeto => (
                  <tr
                    key={projeto.id}
                    onClick={() => navigate(`/app/projetos/${projeto.id}`)}
                    className="border-b border-gray-50 last:border-0 cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#00420d]/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#00420d] transition-colors">
                          <FileText className="w-5 h-5 text-[#00420d] group-hover:text-[#acd115] transition-colors" />
                        </div>
                        <p className="font-semibold text-gray-900">{projeto.nome}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{local(projeto) || '—'}</td>
                    <td className="px-4 py-4 text-right font-medium text-gray-900 tabular-nums">{projeto.area_total_ha ? `${projeto.area_total_ha.toLocaleString('pt-BR')} ha` : '—'}</td>
                    <td className="px-4 py-4 text-gray-600">{projeto.motivo_inventario ? (MOTIVO_LABEL[projeto.motivo_inventario] ?? projeto.motivo_inventario) : '—'}</td>
                    <td className="px-4 py-4 text-gray-500 tabular-nums">{new Date(projeto.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-4"><StatusBadge status={projeto.status} /></td>
                    <td className="px-4 py-4 text-right">
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#00420d] group-hover:underline">
                        Abrir <ChevronRight className="w-4 h-4" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
