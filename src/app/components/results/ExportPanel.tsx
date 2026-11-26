import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { FileText, Download, Table2, FileType2, Loader2, CheckCircle2 } from 'lucide-react';
import type { ResultadoInventario } from '../../lib/calculations';
import type { ProjetoParaRelatorio } from '../../lib/reportText';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { Link } from 'react-router';

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
    data_inventario?: string | null;
  };
  resultado: ResultadoInventario;
}

type ExportType = 'pdf' | 'word' | 'excel';

const OPTIONS: { type: ExportType; label: string; formato: string; desc: string; icon: React.ReactNode; cor: string }[] = [
  {
    type: 'pdf',
    label: 'Exportar PDF',
    formato: 'PDF',
    desc: 'Relatório pronto para protocolar: capa, sumário, textos técnicos, tabelas, gráficos, assinatura e anexo.',
    icon: <FileText className="w-6 h-6" />,
    cor: 'bg-red-50 text-red-600',
  },
  {
    type: 'word',
    label: 'Exportar Word',
    formato: 'DOCX',
    desc: 'O mesmo relatório do PDF, em Word editável, para ajustar o texto antes de entregar.',
    icon: <FileType2 className="w-6 h-6" />,
    cor: 'bg-blue-50 text-blue-600',
  },
  {
    type: 'excel',
    label: 'Exportar Excel',
    formato: 'XLSX',
    desc: 'Planilha com 9 abas formatadas: resumo, parâmetros, espécies, famílias, parcelas, estruturas, diversidade e dados de campo.',
    icon: <Table2 className="w-6 h-6" />,
    cor: 'bg-green-50 text-green-700',
  },
];

export default function ExportPanel({ projeto, resultado }: Props) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState<ExportType | null>(null);
  const [done, setDone] = useState<ExportType[]>([]);

  const nomeArquivo = 'Relatorio_' + projeto.nome
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '_').substring(0, 50);

  const projetoRelatorio: ProjetoParaRelatorio & { nome: string } = {
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

  const ctx = {
    empresa: profile?.empresa?.name ?? null,
    responsavel: profile?.name ?? null,
    cidade: profile?.cidade ?? profile?.empresa?.cidade ?? null,
    uf: profile?.estado_uf ?? profile?.empresa?.estado_uf ?? null,
    dataInventario: projeto.data_inventario ?? null,
    registro: profile?.registro_profissional ?? null,
    marca: {
      ativa: !!profile?.empresa?.marca_ativa,
      nome: profile?.empresa?.marca_nome,
      logoPath: profile?.empresa?.marca_logo_path,
      corPrimaria: profile?.empresa?.marca_cor_primaria,
      corSecundaria: profile?.empresa?.marca_cor_secundaria,
      contato: profile?.empresa?.marca_contato,
    },
  };
  const usandoMarca = !!profile?.empresa?.marca_ativa;

  const handleExport = async (type: ExportType) => {
    setLoading(type);
    try {
      if (type === 'pdf') {
        const { exportarPDF } = await import('../../lib/exportPDF');
        await exportarPDF(nomeArquivo, projetoRelatorio, resultado, ctx);
      } else if (type === 'excel') {
        const { exportarExcel } = await import('../../lib/exportExcel');
        await exportarExcel(nomeArquivo, resultado, projetoRelatorio, ctx);
      } else {
        const { exportarWord } = await import('../../lib/exportWord');
        await exportarWord(nomeArquivo, projetoRelatorio, resultado, ctx);
      }
      setDone(prev => (prev.includes(type) ? prev : [...prev, type]));
      toast.success('Arquivo gerado. Confira seus downloads.');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro desconhecido';
      toast.error('Não foi possível gerar o arquivo: ' + message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="w-5 h-5 text-[#16A34A]" />
            Exportar relatório
          </CardTitle>
          <p className="text-sm text-gray-500">
            Os três formatos usam os mesmos dados e textos. O responsável técnico, o registro profissional e a empresa vêm do seu cadastro.
          </p>
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between rounded-xl bg-[#f4f8f3] px-4 py-3">
            <p className="text-xs text-gray-600">
              {usandoMarca
                ? <>Os relatórios saem com <b>a sua marca</b> ({profile?.empresa?.marca_nome || profile?.empresa?.name}). A AMBISAFE aparece só como crédito no rodapé.</>
                : <>Os relatórios saem com a <b>marca AMBISAFE</b>. Você pode colocar o seu logo, suas cores e o nome da sua empresa.</>}
            </p>
            <Link to="/app/configuracoes#marca" className="text-xs font-semibold text-[#0B5A1E] hover:underline whitespace-nowrap">
              {usandoMarca ? 'Alterar marca' : 'Usar minha marca'} →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {OPTIONS.map(opt => {
              const isDone = done.includes(opt.type);
              const isLoading = loading === opt.type;
              return (
                <div key={opt.type} className={`relative flex flex-col p-5 rounded-2xl border transition-all ${isDone ? 'border-green-300 bg-green-50/40' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${opt.cor}`}>{opt.icon}</div>
                    {isDone ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700"><CheckCircle2 className="w-4 h-4" /> Baixado</span>
                    ) : (
                      <span className="text-[11px] font-bold tracking-wide text-gray-400">{opt.formato}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{opt.label}</h3>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed flex-1">{opt.desc}</p>
                  <Button
                    onClick={() => handleExport(opt.type)}
                    disabled={loading !== null}
                    className="w-full gap-2 text-sm h-11 rounded-xl bg-[#00420d] hover:bg-[#0B5A1E] text-white"
                  >
                    {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</> : <><Download className="w-4 h-4" /> {isDone ? 'Baixar novamente' : `Baixar ${opt.formato}`}</>}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">O que vai no relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {[
              { titulo: 'Abertura', itens: ['Capa com projeto e responsável', 'Sumário com páginas', 'Ficha de identificação', 'Resumo dos resultados'] },
              { titulo: 'Texto técnico', itens: ['Introdução e objetivo', 'Material e métodos', 'Resultados e discussão', 'Conclusão por finalidade'] },
              { titulo: 'Tabelas e gráficos', itens: ['Parâmetros estatísticos', 'Fitossociologia (todas as espécies)', 'Famílias, classes de DAP e estratos', 'Gráficos de VI% e diamétrico'] },
              { titulo: 'Fechamento', itens: ['Score AMBISAFE detalhado', 'Local, data e assinatura', 'Referências (ABNT)', 'Anexo: resultados por parcela'] },
            ].map(section => (
              <div key={section.titulo} className="bg-[#f4f8f3] rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-3">{section.titulo}</h4>
                <ul className="space-y-1.5">
                  {section.itens.map(item => (
                    <li key={item} className="flex items-center gap-2 text-gray-600 text-xs">
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
