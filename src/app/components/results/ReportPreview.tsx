import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { FileText, Sparkles, Copy, Check, Loader2, Pencil, RotateCcw, AlertTriangle, Download, X } from 'lucide-react';
import {
  gerarRelatorioCompleto, textosValidos, baseDoResultado,
  type SecaoRelatorio, type ProjetoParaRelatorio, type TextosSalvos, type ChaveSecao,
} from '../../lib/reportText';
import { FINALIDADES } from '../../lib/relatorio/modelo';
import type { ResultadoInventario } from '../../lib/calculations';
import { supabase } from '../../lib/supabase';
import { projectId } from '/utils/supabase/info';
import { toast } from 'sonner';

interface Props {
  projetoId: string;
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
    relatorio_textos?: TextosSalvos | null;
  };
  resultado: ResultadoInventario;
  onSalvo: (t: TextosSalvos | null) => void;
  onIrExportar?: () => void;
}

type Origem = 'auto' | 'editado' | 'ia';
const ROTULO: Record<Origem, { txt: string; cls: string }> = {
  auto: { txt: 'Automático', cls: 'bg-gray-100 text-gray-600' },
  editado: { txt: 'Editado', cls: 'bg-blue-50 text-blue-700' },
  ia: { txt: 'Melhorado com IA', cls: 'bg-violet-50 text-violet-700' },
};

function AreaTexto({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 4}px`;
  }, [valor]);
  return (
    <textarea
      ref={ref}
      value={valor}
      onChange={e => onChange(e.target.value)}
      autoFocus
      className="w-full min-h-[160px] rounded-xl border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A] resize-none"
    />
  );
}

async function chamarIA(projeto: ProjetoParaRelatorio, secoes: SecaoRelatorio[]): Promise<SecaoRelatorio[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const resp = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-eed79e88/ai/aprimorar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify({ projeto, secoes }),
  });
  if (!resp.ok) {
    const erro = await resp.json().catch(() => ({})) as { error?: string };
    throw new Error(erro.error || 'a IA não respondeu agora. Tente de novo em instantes.');
  }
  const data = await resp.json() as { secoes?: SecaoRelatorio[] };
  if (!data.secoes?.length) throw new Error('resposta vazia');
  return data.secoes;
}

export default function ReportPreview({ projetoId, projeto, resultado, onSalvo, onIrExportar }: Props) {
  const projetoRel: ProjetoParaRelatorio = useMemo(() => ({
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
  }), [projeto]);

  const automaticas = useMemo(() => gerarRelatorioCompleto(projetoRel, resultado), [projetoRel, resultado]);
  const salvos = projeto.relatorio_textos ?? null;
  const validos = textosValidos(salvos, resultado);
  const antigos = !!salvos && !validos && Object.keys(salvos.secoes ?? {}).length > 0;
  const secoesSalvas = validos ? salvos!.secoes : {};

  const atual = (s: SecaoRelatorio) => secoesSalvas[s.chave]?.texto ?? s.conteudo;
  const origem = (s: SecaoRelatorio): Origem => secoesSalvas[s.chave]?.origem ?? 'auto';

  const [editando, setEditando] = useState<ChaveSecao | null>(null);
  const [rascunho, setRascunho] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [iaSecao, setIaSecao] = useState<ChaveSecao | null>(null);
  const [iaTudo, setIaTudo] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [ativa, setAtiva] = useState<ChaveSecao>('introducao');

  const nEditadas = Object.keys(secoesSalvas).length;

  const gravar = async (novas: TextosSalvos['secoes']) => {
    const limpo = Object.fromEntries(Object.entries(novas).filter(([, v]) => v && v.texto.trim())) as TextosSalvos['secoes'];
    const payload: TextosSalvos | null = Object.keys(limpo).length
      ? { versao: 1, base: baseDoResultado(resultado), secoes: limpo }
      : null;
    setSalvando(true);
    const { error } = await supabase.from('projetos').update({ relatorio_textos: payload }).eq('id', projetoId);
    setSalvando(false);
    if (error) { toast.error('Não foi possível salvar: ' + error.message); return false; }
    onSalvo(payload);
    return true;
  };

  const salvarEdicao = async (s: SecaoRelatorio) => {
    const texto = rascunho.replace(/\n{3,}/g, '\n\n').trim();
    const igualAuto = texto === s.conteudo.trim();
    const novas = { ...secoesSalvas };
    if (igualAuto || !texto) delete novas[s.chave];
    else novas[s.chave] = { texto, origem: 'editado', em: new Date().toISOString() };
    if (await gravar(novas)) {
      setEditando(null);
      toast.success('Texto salvo. Ele vai assim para o PDF e o Word.');
    }
  };

  const restaurar = async (chave: ChaveSecao) => {
    const novas = { ...secoesSalvas };
    delete novas[chave];
    if (await gravar(novas)) toast.success('Texto automático restaurado.');
  };

  const restaurarTudo = async () => {
    if (await gravar({})) toast.success('Todos os textos voltaram ao automático.');
  };

  const melhorar = async (lista: SecaoRelatorio[], tudo: boolean) => {
    if (tudo) setIaTudo(true); else setIaSecao(lista[0].chave);
    try {
      const enviar = lista.map(s => ({ chave: s.chave, titulo: s.titulo, conteudo: atual(s) }));
      const voltas = await chamarIA(projetoRel, enviar);
      const novas = { ...secoesSalvas };
      let mudou = 0;
      voltas.forEach(v => {
        const original = enviar.find(e => e.chave === v.chave);
        if (!original || !v.conteudo?.trim() || v.conteudo.trim() === original.conteudo.trim()) return;
        novas[v.chave] = { texto: v.conteudo.trim(), origem: 'ia', em: new Date().toISOString() };
        mudou++;
      });
      if (!mudou) { toast.message('A IA não sugeriu mudanças.'); return; }
      if (await gravar(novas)) toast.success(`${mudou === 1 ? 'Seção melhorada' : mudou + ' seções melhoradas'} com IA. Confira os números antes de exportar.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível melhorar com IA agora.');
    } finally {
      setIaTudo(false);
      setIaSecao(null);
    }
  };

  const copiar = (id: string, texto: string) => {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(id);
      setTimeout(() => setCopiado(null), 1800);
    }).catch(() => toast.error('Não foi possível copiar.'));
  };

  const copiarTudo = () => copiar('tudo', automaticas.map(s => `${s.titulo}\n\n${atual(s)}`).join('\n\n'));

  // seção visível (menu lateral)
  useEffect(() => {
    const onScroll = () => {
      let atualId: ChaveSecao = automaticas[0]?.chave ?? 'introducao';
      for (const s of automaticas) {
        const el = document.getElementById(`rel-${s.chave}`);
        if (el && el.getBoundingClientRect().top < 220) atualId = s.chave;
      }
      setAtiva(atualId);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [automaticas]);

  const ocupado = salvando || iaTudo || !!iaSecao;

  return (
    <div className="space-y-5">
      <Card className="shadow-sm">
        <CardContent className="pt-4 md:pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#00420d]/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-[#00420d]" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Texto do relatório técnico</h2>
                <p className="text-sm text-gray-500">
                  Gerado a partir dos resultados, para a finalidade <b className="text-gray-700">{FINALIDADES[projeto.motivo_inventario] ?? 'não informada'}</b>.
                  Edite o que quiser: o que você salvar vai para o PDF e o Word.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#f4f8f3] text-[#0B5A1E] font-medium">{automaticas.length} seções</span>
                  {nEditadas > 0 && <span className="text-[11px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">{nEditadas} {nEditadas === 1 ? 'personalizada' : 'personalizadas'}</span>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:flex gap-2 shrink-0 [&_button]:whitespace-nowrap">
              <Button onClick={() => melhorar(automaticas, true)} disabled={ocupado} variant="outline" className="gap-2 rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800 col-span-2 sm:col-auto">
                {iaTudo ? <><Loader2 className="w-4 h-4 animate-spin" /> Melhorando...</> : <><Sparkles className="w-4 h-4" /> Melhorar tudo com IA</>}
              </Button>
              <Button onClick={copiarTudo} variant="outline" className="gap-2 rounded-xl">
                {copiado === 'tudo' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />} Copiar tudo
              </Button>
              {onIrExportar && (
                <Button onClick={onIrExportar} className="gap-2 rounded-xl bg-[#00420d] hover:bg-[#0B5A1E] text-white">
                  <Download className="w-4 h-4" /> Exportar
                </Button>
              )}
            </div>
          </div>
          {nEditadas > 0 && (
            <button onClick={restaurarTudo} disabled={ocupado} className="mt-3 text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" /> Voltar todos os textos para o automático
            </button>
          )}
        </CardContent>
      </Card>

      {antigos && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 flex-1">
            O inventário foi reprocessado depois que você editou o texto. As edições antigas não estão sendo usadas, porque podem ter números desatualizados.
          </p>
          <Button size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100 rounded-xl" disabled={ocupado} onClick={restaurarTudo}>
            Descartar edições antigas
          </Button>
        </div>
      )}

      <div className="grid lg:grid-cols-[220px_1fr] gap-5 items-start">
        <nav className="hidden lg:block sticky top-6 rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
          {automaticas.map(s => {
            const o = origem(s);
            return (
              <button
                key={s.chave}
                onClick={() => document.getElementById(`rel-${s.chave}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className={`w-full flex items-center gap-2 text-left text-[13px] px-3 py-2 rounded-xl transition-colors ${ativa === s.chave ? 'bg-[#00420d] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${o === 'auto' ? (ativa === s.chave ? 'bg-white/50' : 'bg-gray-300') : o === 'ia' ? 'bg-violet-400' : 'bg-blue-400'}`} />
                <span className="truncate">{s.titulo}</span>
              </button>
            );
          })}
        </nav>

        <div className="space-y-4">
          {automaticas.map(s => {
            const o = origem(s);
            const texto = atual(s);
            const emEdicao = editando === s.chave;
            const sub = /^\d+\.\d/.test(s.titulo);
            return (
              <section key={s.chave} id={`rel-${s.chave}`} className="scroll-mt-40 lg:scroll-mt-6 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <header className="flex flex-wrap items-center gap-2 justify-between px-4 md:px-6 py-3 border-b border-gray-50 bg-[#fbfcfb]">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className={`font-semibold truncate ${sub ? 'text-[#0B5A1E] text-sm' : 'text-[#00420d] text-[15px] uppercase tracking-wide'}`}>{s.titulo}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${ROTULO[o].cls}`}>{ROTULO[o].txt}</span>
                  </div>
                  {!emEdicao && (
                    <div className="flex items-center gap-1">
                      <button title="Copiar" onClick={() => copiar(s.chave, texto)} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                        {copiado === s.chave ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button title="Melhorar com IA" disabled={ocupado} onClick={() => melhorar([s], false)} className="p-2 rounded-lg text-violet-500 hover:text-violet-700 hover:bg-violet-50 disabled:opacity-40">
                        {iaSecao === s.chave ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      </button>
                      {o !== 'auto' && (
                        <button title="Voltar ao automático" disabled={ocupado} onClick={() => restaurar(s.chave)} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      <Button size="sm" variant="outline" disabled={ocupado} onClick={() => { setEditando(s.chave); setRascunho(texto); }} className="gap-1.5 rounded-lg h-8 ml-1">
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </Button>
                    </div>
                  )}
                </header>
                <div className="px-4 md:px-6 py-4">
                  {emEdicao ? (
                    <div className="space-y-3">
                      <AreaTexto valor={rascunho} onChange={setRascunho} />
                      <p className="text-[11px] text-gray-400">Deixe uma linha em branco entre os parágrafos.</p>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => salvarEdicao(s)} disabled={salvando} className="gap-2 rounded-xl bg-[#00420d] hover:bg-[#0B5A1E] text-white">
                          {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Salvar texto
                        </Button>
                        <Button variant="ghost" onClick={() => setEditando(null)} disabled={salvando} className="gap-2 rounded-xl">
                          <X className="w-4 h-4" /> Cancelar
                        </Button>
                        <Button variant="ghost" onClick={() => setRascunho(s.conteudo)} disabled={salvando} className="gap-2 rounded-xl text-gray-500 ml-auto">
                          <RotateCcw className="w-4 h-4" /> Usar texto automático
                        </Button>
                      </div>
                    </div>
                  ) : (
                    texto.split('\n\n').map((p, i) => (
                      <p key={i} className="text-sm text-gray-700 leading-relaxed mb-3 last:mb-0 text-justify md:indent-8">{p}</p>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
