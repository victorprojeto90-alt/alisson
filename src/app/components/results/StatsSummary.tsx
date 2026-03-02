import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { DadosGerais } from '../../lib/calculations';
import { fmt } from '../../lib/calculations';
import { Info } from 'lucide-react';

interface Props {
  dados: DadosGerais;
}

function Row({ label, value, hint, highlight }: { label: string; value: string; hint?: string; highlight?: boolean }) {
  return (
    <tr className={`border-b border-gray-100 ${highlight ? 'bg-amber-50 font-semibold' : ''}`}>
      <td className="py-2.5 px-4 text-gray-700 text-sm">
        <div className="flex items-center gap-1">
          {label}
          {hint && (
            <span title={hint} className="text-gray-400 cursor-help">
              <Info className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </td>
      <td className="py-2.5 px-4 text-right font-mono text-sm text-gray-900 font-medium">{value}</td>
    </tr>
  );
}

export default function StatsSummary({ dados }: Props) {
  const d = dados;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Dados Gerais do Inventário</CardTitle>
        <p className="text-sm text-gray-400">Resumo estatístico — tabela principal exigida pelos órgãos ambientais</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0B3D2E] text-white">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold">Parâmetro</th>
                <th className="py-3 px-4 text-right text-sm font-semibold">Valor</th>
              </tr>
            </thead>
            <tbody>
              <Row label="Área Total (ha)" value={fmt.num(d.area_amostrada_ha, 4)} hint="Área total amostrada pelas parcelas" />
              <Row label="Número de Parcelas (n)" value={String(d.n_parcelas)} />
              <Row label="Número de Indivíduos" value={d.n_individuos.toLocaleString('pt-BR')} />
              <Row label="Número de Espécies" value={String(d.n_especies)} />
              <Row label="Número de Famílias" value={String(d.n_familias)} />
              <Row label="Volume Total Amostrado (m³)" value={fmt.num(d.volume_total_m3, 4)} />
              <Row label="Área Basal Total (m²)" value={fmt.num(d.area_basal_total_m2, 4)} />
              <Row label="Média (m³/ha)" value={fmt.num(d.media_vol_ha, 4)} />
              <Row label="Variância Amostral (s²)" value={fmt.num(d.variancia_amostral, 6)} />
              <Row label="Desvio Padrão (s)" value={fmt.num(d.desvio_padrao, 4)} />
              <Row label="Variância da Média" value={fmt.num(d.variancia_media, 6)} />
              <Row label="Erro Padrão da Média (EP)" value={fmt.num(d.erro_padrao, 4)} />
              <Row label="Coeficiente de Variação (%)" value={fmt.pct(d.coeficiente_variacao_pct)} />
              <Row label="t-Student" value={fmt.num(d.t_student, 3)} />
              <Row label="Erro de Amostragem Absoluto (m³/ha)" value={fmt.num(d.erro_abs, 4)} />
              <Row
                label="Erro de Amostragem Relativo (%)"
                value={fmt.pct(d.erro_rel_pct)}
                hint="≤10% é considerado aceitável pela maioria dos órgãos ambientais"
                highlight={d.erro_rel_pct > 10}
              />
              <Row label="IC Inferior — por Hectare (m³/ha)" value={fmt.num(d.ic_inferior_ha, 4)} />
              <Row label="IC Superior — por Hectare (m³/ha)" value={fmt.num(d.ic_superior_ha, 4)} />
              <Row label="IC Inferior — População (m³)" value={fmt.num(d.ic_inferior_pop, 2)} />
              <Row label="IC Superior — População (m³)" value={fmt.num(d.ic_superior_pop, 2)} />
              <Row
                label="Volume Estimado Total (m³)"
                value={fmt.num(d.volume_estimado_total, 2)}
                highlight
              />
            </tbody>
          </table>
        </div>

        {d.erro_rel_pct > 10 && (
          <div className="m-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
            <strong>Atenção:</strong> O erro amostral ({fmt.pct(d.erro_rel_pct)}) está acima do limite recomendado de 10%.
            Considere aumentar o número de parcelas para melhorar a precisão.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
