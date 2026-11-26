import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { calcularInventario, calcularArvore, type Arvore, type Parcela, type ResultadoInventario, type ArvoreCalculada } from '../lib/calculations';
import { toast } from 'sonner';

export interface ConfigCalculo {
  area_total_ha: number;
  fator_forma: number;
  nivel_confianca: number;
  tamanho_parcela_m2: number;
}

interface ProcessOptions {
  projetoId: string;
  arvores: Arvore[];
  parcelas: Parcela[];
  config: ConfigCalculo;
}

// "Impressão digital" dos dados usados no cálculo. Se mudar depois do processamento
// (nova planilha, área, parcela, fator de forma...), o resultado salvo está desatualizado.
export function assinaturaCalculo(arvores: Arvore[], parcelas: Parcela[], config: ConfigCalculo): string {
  let somaCap = 0, somaHt = 0;
  for (const a of arvores) { somaCap += a.cap_cm ?? 0; somaHt += a.altura_total_m ?? 0; }
  return [
    arvores.length, somaCap.toFixed(2), somaHt.toFixed(2), parcelas.length,
    Number(config.area_total_ha), Number(config.fator_forma), Number(config.nivel_confianca), Number(config.tamanho_parcela_m2),
  ].join('|');
}

type ResultadoSalvo = ResultadoInventario & { _assinatura?: string };

export function useCalculations() {
  const [resultado, setResultado] = useState<ResultadoInventario | null>(null);
  const [assinaturaSalva, setAssinaturaSalva] = useState<string | null>(null);
  const [salvoEm, setSalvoEm] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const processar = useCallback(async (opts: ProcessOptions) => {
    setProcessing(true);
    try {
      const res = calcularInventario(opts.arvores, opts.parcelas, opts.config);
      const assinatura = assinaturaCalculo(opts.arvores, opts.parcelas, opts.config);

      // As árvores calculadas são refeitas a partir da planilha ao abrir o projeto,
      // então não vão para o banco (deixa o registro leve, mesmo com milhares de árvores).
      const paraSalvar: ResultadoSalvo = { ...res, arvores_calculadas: [], arvores_invalidas: [], _assinatura: assinatura };
      const agora = new Date().toISOString();

      const { error: errRes } = await supabase
        .from('resultados')
        .upsert({
          projeto_id: opts.projetoId,
          dados: paraSalvar as unknown as Record<string, unknown>,
          score: res.score as unknown as Record<string, unknown>,
          created_at: agora,
        }, { onConflict: 'projeto_id' });
      if (errRes) throw new Error('não foi possível salvar o resultado (' + errRes.message + ')');

      const { error: errProj } = await supabase.from('projetos').update({ status: 'processado' }).eq('id', opts.projetoId);
      if (errProj) throw new Error('não foi possível atualizar o projeto (' + errProj.message + ')');

      setResultado(res);
      setAssinaturaSalva(assinatura);
      setSalvoEm(agora);
      toast.success('Inventário processado e salvo!');
      return res;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'erro desconhecido';
      toast.error('Erro ao processar: ' + message);
      return null;
    } finally {
      setProcessing(false);
    }
  }, []);

  // Carrega o último resultado salvo e reconstrói a lista de árvores calculadas
  const loadResultado = useCallback(async (projetoId: string, arvores: Arvore[], fatorForma: number) => {
    const { data, error } = await supabase
      .from('resultados')
      .select('dados, created_at')
      .eq('projeto_id', projetoId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data?.dados) return null;

    const salvo = data.dados as unknown as ResultadoSalvo;
    const calculadas: ArvoreCalculada[] = [];
    const invalidas: Arvore[] = [];
    for (const a of arvores) {
      const c = calcularArvore(a, fatorForma);
      if (c) calculadas.push(c); else invalidas.push(a);
    }
    const completo: ResultadoInventario = {
      ...salvo,
      arvores_calculadas: salvo.arvores_calculadas?.length ? salvo.arvores_calculadas : calculadas,
      arvores_invalidas: salvo.arvores_invalidas?.length ? salvo.arvores_invalidas : invalidas,
    };
    setResultado(completo);
    setAssinaturaSalva(salvo._assinatura ?? null);
    setSalvoEm(data.created_at ?? null);
    return completo;
  }, []);

  return { resultado, processing, processar, loadResultado, assinaturaSalva, salvoEm };
}
