import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { FileText, Sparkles, Copy, Check, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { gerarRelatorioCompleto, type SecaoRelatorio, type ProjetoParaRelatorio } from '../../lib/reportText';
import type { ResultadoInventario } from '../../lib/calculations';
import { supabase } from '../../lib/supabase';
import { projectId } from '/utils/supabase/info';
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

function Section({ secao }: { secao: SecaoRelatorio }) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(secao.conteudo);
    setCopied(true);
    toast.success('Texto copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <h3 className="font-semibold text-gray-900 text-sm">{secao.titulo}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); handleCopy(); }}
            className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors"
            title="Copiar texto"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>
      {expanded && (
        <div className="px-5 py-4 bg-white">
          {secao.conteudo.split('\n\n').map((para, i) => (
            <p key={i} className="text-sm text-gray-700 leading-relaxed mb-3 last:mb-0 text-justify">
              {para}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReportPreview({ projeto, resultado }: Props) {
  const [gerandoIA, setGerandoIA] = useState(false);
  const [relatorio, setRelatorio] = useState<SecaoRelatorio[] | null>(null);

  const projetoParaRelatorio: ProjetoParaRelatorio = {
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

  const handleGerarRelatorio = () => {
    const secoes = gerarRelatorioCompleto(projetoParaRelatorio, resultado);
    setRelatorio(secoes);
  };

  const handleGerarComIA = async () => {
    setGerandoIA(true);
    const secoes = gerarRelatorioCompleto(projetoParaRelatorio, resultado);
    setRelatorio(secoes);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-eed79e88/ai/aprimorar`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ projeto: projetoParaRelatorio, secoes }),
        }
      );
      if (!response.ok) throw new Error('Erro ao chamar API de IA');
      const data = await response.json() as { secoes: SecaoRelatorio[] };
      if (data.secoes?.length) {
        setRelatorio(data.secoes);
        toast.success('Relatório aprimorado com Gemini AI!');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido';
      toast.error('Erro ao aprimorar com IA: ' + msg);
    } finally {
      setGerandoIA(false);
    }
  };

  const handleCopyAll = () => {
    if (!relatorio) return;
    const text = relatorio.map(s => `${s.titulo}\n\n${s.conteudo}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
    toast.success('Relatório completo copiado!');
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#16A34A]" />
            Pré-Relatório Técnico Automático
          </CardTitle>
          <p className="text-sm text-gray-400">
            Texto gerado automaticamente baseado nos resultados do inventário.
            Linguagem adaptada ao motivo: <strong className="text-gray-700">{projeto.motivo_inventario}</strong>.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleGerarRelatorio}
              className="bg-[#0B3D2E] hover:bg-[#0B3D2E]/90 text-white gap-2"
            >
              <FileText className="w-4 h-4" />
              Gerar Pré-Relatório
            </Button>
            <Button
              onClick={handleGerarComIA}
              disabled={gerandoIA}
              variant="outline"
              className="border-[#16A34A] text-[#16A34A] hover:bg-[#16A34A]/10 gap-2"
            >
              {gerandoIA ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Gerando com IA...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Aprimorar com IA Gemini</>
              )}
            </Button>
            {relatorio && (
              <Button variant="ghost" onClick={handleCopyAll} className="gap-2 text-gray-500">
                <Copy className="w-4 h-4" />
                Copiar tudo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {!relatorio && (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-gray-500 font-medium mb-2">Pré-relatório não gerado</h3>
          <p className="text-gray-400 text-sm mb-6">
            Clique em &quot;Gerar Pré-Relatório&quot; para criar o texto técnico automático
          </p>
          <Button
            onClick={handleGerarRelatorio}
            className="bg-[#0B3D2E] hover:bg-[#0B3D2E]/90 text-white gap-2"
          >
            <FileText className="w-4 h-4" />
            Gerar Agora
          </Button>
        </div>
      )}

      {relatorio && (
        <div className="space-y-3">
          {/* Report header */}
          <div className="bg-[#0B3D2E] text-white rounded-2xl p-6">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Relatório Técnico de Inventário Florestal</p>
            <h2 className="text-xl font-bold mb-1">{projeto.nome}</h2>
            {projeto.municipio && (
              <p className="text-white/70 text-sm">
                {projeto.municipio}{projeto.estado ? `/${projeto.estado}` : ''} · {projeto.area_total_ha.toLocaleString('pt-BR')} ha
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="bg-white/10 text-white/80 text-xs px-3 py-1 rounded-full">
                {resultado.dados_gerais.n_individuos.toLocaleString('pt-BR')} indivíduos
              </span>
              <span className="bg-white/10 text-white/80 text-xs px-3 py-1 rounded-full">
                {resultado.dados_gerais.n_especies} espécies
              </span>
              <span className="bg-white/10 text-white/80 text-xs px-3 py-1 rounded-full">
                Score: {resultado.score.total}/100
              </span>
            </div>
          </div>

          {relatorio.map((secao, i) => (
            <Section key={i} secao={secao} />
          ))}
        </div>
      )}
    </div>
  );
}
