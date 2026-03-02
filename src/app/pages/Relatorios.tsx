import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  FileText,
  BarChart3,
  ChevronRight,
  Loader2,
  Trees,
  MapPin,
  Calendar,
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-400 text-sm mt-1">
          Projetos processados prontos para geração e exportação de relatório
        </p>
      </div>

      {projetos.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-gray-500 font-medium mb-2">Nenhum relatório disponível</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
            Projetos com status &quot;Processado&quot; ou &quot;Finalizado&quot; aparecerão aqui para exportação.
          </p>
          <Button
            onClick={() => navigate('/app/dashboard')}
            className="bg-[#0B3D2E] hover:bg-[#0B3D2E]/90 text-white gap-2"
          >
            <Trees className="w-4 h-4" />
            Ver Meus Projetos
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 font-medium">
            {projetos.length} projeto{projetos.length !== 1 ? 's' : ''} disponíve{projetos.length !== 1 ? 'is' : 'l'}
          </p>
          {projetos.map(projeto => (
            <Card key={projeto.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#0B3D2E]/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BarChart3 className="w-6 h-6 text-[#0B3D2E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 text-base truncate">{projeto.nome}</h3>
                      <Badge
                        variant="outline"
                        className={
                          projeto.status === 'finalizado'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }
                      >
                        {projeto.status === 'finalizado' ? 'Finalizado' : 'Processado'}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                      {(projeto.municipio || projeto.estado) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {projeto.municipio}{projeto.estado ? `/${projeto.estado}` : ''}
                        </span>
                      )}
                      {projeto.area_total_ha && (
                        <span className="flex items-center gap-1">
                          <Trees className="w-3.5 h-3.5" />
                          {projeto.area_total_ha.toLocaleString('pt-BR')} ha
                        </span>
                      )}
                      {projeto.motivo_inventario && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          {MOTIVO_LABEL[projeto.motivo_inventario] ?? projeto.motivo_inventario}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(projeto.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate(`/app/projetos/${projeto.id}`)}
                    variant="ghost"
                    size="sm"
                    className="text-[#0B3D2E] hover:bg-[#0B3D2E]/10 gap-1 flex-shrink-0"
                  >
                    Ver Relatório
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
