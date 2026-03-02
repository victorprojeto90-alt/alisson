import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
  FileText,
  Download,
  Table2,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { exportarPDF } from '../../lib/exportPDF';
import { exportarExcel } from '../../lib/exportExcel';
import { exportarWord } from '../../lib/exportWord';
import type { ResultadoInventario } from '../../lib/calculations';
import type { ProjetoParaRelatorio } from '../../lib/reportText';
import { toast } from 'sonner';

interface Props {
  projeto: {
    nome: string;
    municipio?: string | null;
    estado?: string | null;
    bioma?: string | null;
    area_total_ha: number;
    tipo_inventario: string;
    motivo_inventario: string;
    tamanho_parcela_m2: number;
    fator_forma: number;
    nivel_confianca: number;
    precisao_requerida: number;
  };
  resultado: ResultadoInventario;
}

type ExportType = 'pdf' | 'word' | 'excel';

interface ExportOption {
  type: ExportType;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}

const OPTIONS: ExportOption[] = [
  {
    type: 'pdf',
    label: 'Exportar PDF',
    desc: 'Relatório técnico completo com tabelas formatadas, capa e textos automáticos.',
    icon: <FileText className="w-6 h-6" />,
    color: 'border-red-200 hover:border-red-300 hover:bg-red-50',
  },
  {
    type: 'word',
    label: 'Exportar Word (.docx)',
    desc: 'Documento Word editável — quase pronto para protocolar. Inclui todas as tabelas e texto técnico.',
    icon: <FileSpreadsheet className="w-6 h-6" />,
    color: 'border-blue-200 hover:border-blue-300 hover:bg-blue-50',
  },
  {
    type: 'excel',
    label: 'Exportar Excel (.xlsx)',
    desc: 'Planilha com 7 abas: dados gerais, fitossociologia, famílias, parcelas, estrutura diamétrica, diversidade e dados brutos.',
    icon: <Table2 className="w-6 h-6" />,
    color: 'border-green-200 hover:border-green-300 hover:bg-green-50',
  },
];

export default function ExportPanel({ projeto, resultado }: Props) {
  const [loading, setLoading] = useState<ExportType | null>(null);
  const [done, setDone] = useState<ExportType[]>([]);

  const nomeArquivo = projeto.nome.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50);

  const projetoRelatorio: ProjetoParaRelatorio = {
    nome: projeto.nome,
    municipio: projeto.municipio ?? undefined,
    estado: projeto.estado ?? undefined,
    bioma: projeto.bioma ?? undefined,
    area_total_ha: projeto.area_total_ha,
    tipo_inventario: projeto.tipo_inventario as ProjetoParaRelatorio['tipo_inventario'],
    motivo_inventario: projeto.motivo_inventario as ProjetoParaRelatorio['motivo_inventario'],
    tamanho_parcela_m2: projeto.tamanho_parcela_m2,
    fator_forma: projeto.fator_forma,
    nivel_confianca: projeto.nivel_confianca,
    precisao_requerida: projeto.precisao_requerida,
  };

  const handleExport = async (type: ExportType) => {
    setLoading(type);
    try {
      if (type === 'pdf') {
        exportarPDF(nomeArquivo, projetoRelatorio, resultado);
      } else if (type === 'excel') {
        exportarExcel(nomeArquivo, resultado);
      } else if (type === 'word') {
        await exportarWord(nomeArquivo, projetoRelatorio, resultado);
      }
      setDone(prev => [...prev, type]);
      toast.success(`Arquivo ${type.toUpperCase()} exportado com sucesso!`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro desconhecido';
      toast.error(`Erro ao exportar ${type.toUpperCase()}: ` + message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="w-5 h-5 text-[#16A34A]" />
            Exportar Relatório
          </CardTitle>
          <p className="text-sm text-gray-400">
            Exporte o relatório técnico nos formatos disponíveis. Os arquivos serão baixados automaticamente.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            {OPTIONS.map(opt => {
              const isDone = done.includes(opt.type);
              const isLoading = loading === opt.type;

              return (
                <div
                  key={opt.type}
                  className={`relative p-5 rounded-2xl border-2 transition-all ${opt.color} ${
                    isDone ? 'bg-green-50 border-green-300' : ''
                  }`}
                >
                  {isDone && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                    opt.type === 'pdf' ? 'bg-red-100 text-red-600' :
                    opt.type === 'word' ? 'bg-blue-100 text-blue-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {opt.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{opt.label}</h3>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">{opt.desc}</p>
                  <Button
                    onClick={() => handleExport(opt.type)}
                    disabled={isLoading}
                    className={`w-full gap-2 text-sm ${
                      opt.type === 'pdf' ? 'bg-red-600 hover:bg-red-700' :
                      opt.type === 'word' ? 'bg-blue-600 hover:bg-blue-700' :
                      'bg-green-600 hover:bg-green-700'
                    } text-white`}
                  >
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</>
                    ) : (
                      <><Download className="w-4 h-4" /> {isDone ? 'Baixar novamente' : opt.label}</>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary of what's included */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">O que está incluído nos relatórios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            {[
              { titulo: 'Texto Técnico', itens: ['Metodologia', 'Resultados Gerais', 'Estrutura Horizontal', 'Estrutura Diamétrica', 'Índices de Diversidade', 'Conclusão Técnica'] },
              { titulo: 'Tabelas', itens: ['Dados gerais do inventário', 'Fitossociologia por espécie', 'Fitossociologia por família', 'Distribuição diamétrica', 'Estratificação vertical', 'Índices de diversidade'] },
              { titulo: 'Estatísticas', itens: ['Média, variância, desvio padrão', 'Coeficiente de variação', 'Erro amostral absoluto e relativo', 'Intervalo de confiança (parcela e população)', 't-Student', 'Volume estimado total'] },
              { titulo: 'Score AMBISAFE', itens: ['Regularidade estatística (30%)', 'Diversidade florística (20%)', 'Sustentabilidade (20%)', 'Conformidade ambiental (20%)', 'Consistência dos dados (10%)', 'Nível: Excelente/Bom/Necessita Atenção'] },
            ].map((section, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-3">{section.titulo}</h4>
                <ul className="space-y-1">
                  {section.itens.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-gray-600 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
