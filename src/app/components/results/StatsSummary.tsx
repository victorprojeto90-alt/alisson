import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { DadosGerais } from '../../lib/calculations';
import { fmt } from '../../lib/calculations';
import { Info, CheckCircle2, AlertTriangle } from 'lucide-react';

interface Props {
  dados: DadosGerais;
  precisaoRequerida?: number;
  areaTotalHa?: number;
}

function Row({ label, value, hint, highlight, highlightGreen }: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
  highlightGreen?: boolean;
}) {
  return (
    <tr className={`border-b border-gray-100 ${highlight ? 'bg-red-50 font-semibold' : highlightGreen ? 'bg-green-50 font-semibold' : ''}`}>
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

function IcRow({ label, li, media, ls }: { label: string; li: number; media: number; ls: number }) {
  return (
    <tr className="border-b border-gray-100">
      <td className="py-2.5 px-4 text-gray-700 text-sm">{label}</td>
      <td className="py-2.5 px-4 text-right font-mono text-sm text-gray-900">
        <span className="text-gray-400">{fmt.num(li, 4)} ≤ </span>
        <span className="font-bold text-[#0B3D2E]">{fmt.num(media, 4)}</span>
        <span className="text-gray-400"> ≤ {fmt.num(ls, 4)}</span>
      </td>
    </tr>
  );
}

export default function StatsSummary({ dados, precisaoRequerida, areaTotalHa }: Props) {
  const d = dados;
  const limiteErro = precisaoRequerida ?? 10;
  const erroOk = d.erro_rel_pct <= limiteErro;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Dados Gerais do Inventário</CardTitle>
            <p className="text-sm text-gray-400">Resumo estatístico — tabela principal exigida pelos órgãos ambientais</p>
          </div>
          <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0 ${
            erroOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {erroOk
              ? <><CheckCircle2 className="w-3.5 h-3.5" />Erro ≤ {limiteErro}% ✓</>
              : <><AlertTriangle className="w-3.5 h-3.5" />Erro &gt; {limiteErro}%</>
            }
          </div>
        </div>
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
              {areaTotalHa !== undefined && (
                <Row label="Área Total do Empreendimento (ha)" value={fmt.ha(areaTotalHa, 4)} hint="Área total informada no cadastro do projeto" highlightGreen />
              )}
              <Row label="Número de Parcelas (n)" value={String(d.n_parcelas)} />
              <Row
                label="Parcelas Possíveis na Área (N)"
                value={String(d.n_parcelas_possiveis)}
                hint="Número total de parcelas que caberiam na área total"
              />
              <Row label="Área Amostrada (ha)" value={fmt.num(d.area_amostrada_ha, 4)} hint="Área total coberta pelas parcelas" />
              <Row label="Número de Indivíduos" value={d.n_individuos.toLocaleString('pt-BR')} />
              <Row label="Número de Espécies" value={String(d.n_especies)} />
              <Row label="Número de Famílias" value={String(d.n_familias)} />
              <Row label="Volume Total Amostrado (m³)" value={fmt.num(d.volume_total_m3, 4)} />
              <Row label="Área Basal Total (m²)" value={fmt.num(d.area_basal_total_m2, 4)} />
              <Row
                label="Média (m³/parcela)"
                value={fmt.num(d.media_vol_parcela, 4)}
                hint="Volume médio por parcela"
              />
              <Row
                label="Variância Amostral"
                value={fmt.num(d.variancia_amostral, 6)}
                hint="VAR.A — Variância amostral dos volumes por parcela"
              />
              <Row
                label="Desvio Padrão"
                value={fmt.num(d.desvio_padrao, 4)}
                hint="DESVPAD.A — Raiz da variância amostral"
              />
              <Row
                label="Fator de Correção (FC)"
                value={fmt.num(d.fator_correcao, 4)}
                hint="FC = (N-n)/N. FC ≥ 0,98: população infinita; FC < 0,98: população finita"
              />
              <Row label="Variância da Média" value={fmt.num(d.variancia_media, 6)} />
              <Row
                label="Erro Padrão da Média"
                value={fmt.num(d.erro_padrao, 4)}
                hint="Raiz quadrada da variância da média"
              />
              <Row label="Coeficiente de Variação (%)" value={fmt.pct(d.coeficiente_variacao_pct)} />
              <Row label="t-Student" value={fmt.num(d.t_student, 3)} />
              <Row
                label="Erro de Amostragem Absoluto (m³)"
                value={fmt.num(d.erro_abs, 4)}
                hint="t × Erro Padrão da Média"
              />
              <Row
                label="Erro de Amostragem Relativo (%)"
                value={fmt.pct(d.erro_rel_pct)}
                hint={`≤${limiteErro}% é o limite de precisão exigido para este inventário`}
                highlight={!erroOk}
                highlightGreen={erroOk}
              />
            </tbody>
          </table>

          {/* IC Section */}
          <table className="w-full mt-0">
            <thead className="bg-[#0B3D2E]/80 text-white">
              <tr>
                <th className="py-2.5 px-4 text-left text-xs font-semibold">
                  Intervalo de Confiança — IC = LI ≤ Média ≤ LS
                </th>
                <th className="py-2.5 px-4 text-right text-xs font-semibold">Valor</th>
              </tr>
            </thead>
            <tbody>
              <IcRow
                label="IC por Parcela (m³/parcela)"
                li={d.ic_inferior_parcela}
                media={d.media_vol_parcela}
                ls={d.ic_superior_parcela}
              />
              <IcRow
                label="IC por Hectare (m³/ha)"
                li={d.ic_inferior_ha}
                media={d.media_vol_ha}
                ls={d.ic_superior_ha}
              />
              <IcRow
                label="IC da População (m³)"
                li={d.ic_inferior_pop}
                media={d.volume_estimado_total}
                ls={d.ic_superior_pop}
              />
            </tbody>
          </table>

          <table className="w-full">
            <tbody>
              <tr className="bg-[#0B3D2E]/5 border-t border-[#0B3D2E]/20 font-semibold">
                <td className="py-2.5 px-4 text-gray-800 text-sm">Volume Estimado para a Área Total (m³)</td>
                <td className="py-2.5 px-4 text-right font-mono text-sm text-[#0B3D2E] font-bold">
                  {fmt.num(d.volume_estimado_total, 2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {!erroOk && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
            <strong>Atenção:</strong> O erro amostral ({fmt.pct(d.erro_rel_pct)}) está acima do limite de precisão
            exigido de {limiteErro}%. Considere aumentar o número de parcelas para melhorar a precisão.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
