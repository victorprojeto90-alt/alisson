import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { calcularInventario, type Arvore, type Parcela, type ResultadoInventario } from '../lib/calculations';
import { toast } from 'sonner';

interface ProcessOptions {
  projetoId: string;
  arvores: Arvore[];
  parcelas: Parcela[];
  config: {
    area_total_ha: number;
    fator_forma: number;
    nivel_confianca: number;
    tamanho_parcela_m2: number;
  };
}

export function useCalculations() {
  const [resultado, setResultado] = useState<ResultadoInventario | null>(null);
  const [processing, setProcessing] = useState(false);

  const processar = useCallback(async (opts: ProcessOptions) => {
    setProcessing(true);
    try {
      const res = calcularInventario(opts.arvores, opts.parcelas, opts.config);
      setResultado(res);

      // Save to Supabase
      await supabase
        .from('resultados')
        .upsert({
          projeto_id: opts.projetoId,
          dados: res as unknown as Record<string, unknown>,
          score: res.score as unknown as Record<string, unknown>,
        }, { onConflict: 'projeto_id' });

      // Update project status
      await supabase
        .from('projetos')
        .update({ status: 'processado' })
        .eq('id', opts.projetoId);

      toast.success('Inventário processado com sucesso!');
      return res;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro desconhecido';
      toast.error('Erro ao processar inventário: ' + message);
      return null;
    } finally {
      setProcessing(false);
    }
  }, []);

  const loadResultado = useCallback(async (projetoId: string) => {
    const { data } = await supabase
      .from('resultados')
      .select('dados, score')
      .eq('projeto_id', projetoId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data?.dados) {
      setResultado(data.dados as unknown as ResultadoInventario);
      return data.dados as unknown as ResultadoInventario;
    }
    return null;
  }, []);

  return { resultado, processing, processar, loadResultado };
}
