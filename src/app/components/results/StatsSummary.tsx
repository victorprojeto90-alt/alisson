import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { DadosGerais } from '../../lib/calculations';
import { nbr, pbr, ibr } from '../../lib/formato';
import { Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '../ui/utils';

interface Props {
  dados: DadosGerais;
  precisaoRequerida?: number;
  areaTotalHa?: number;
}

function Linha({ label, value, hint, tom }: { label: string; value: ReactNode; hint?: string; tom?: 'verde' | 'vermelho' }) {
  return (
    <div className={cn(
      'flex items-center justify-between gap-4 px-4 py-2.5 border-b border-gray-50 last:border-0',
      tom === 'verde' && 'bg-green-50/70', tom === 'vermelho' && 'bg-red-50/70'
    )}>
      <span className="text-sm text-gray-600 flex items-center gap-1 min-w-0">
        <span>{label}</span>
        {hint && <span title={hint} className="text-gray-300 cursor-help shrink-0"><Info className="w-3.5 h-3.5" /></span>}
      </span>
      <span className={cn('text-sm font-semibold tabular-nums text-right shrink-0', tom === 'vermelho' ? 'text-red-700' : tom === 'verde' ? 'text-green-800' : 'text-gray-900')}>{value}</span>
    </div>
  );
}

function LinhaIC({ label, li, media, ls, dec = 4 }: { label: string; li: number; media: number; ls: number; dec?: number }) {
  return (
    <div className="px-4 py-3 border-b border-gray-50 last:border-0">
      <p className="text-sm text-gray-600">{label}</p>
      <div className="mt-1.5 flex items-center gap-2 text-sm tabular-nums">
        <span className="text-gray-500">{nbr(li, dec)}</span>
        <span className="flex-1 h-1.5 rounded-full bg-gradient-to-r from-[#acd115]/40 via-[#16A34A] to-[#acd115]/40 relative">
          <span className="absolute left-1/2 -translate-x-1/2 -top-[3px] w-3 h-3 rounded-full bg-[#00420d] ring-2 ring-white" />
        </span>
        <span className="text-gray-500">{nbr(ls, dec)}</span>
      </div>
      <p className="text-center text-sm font-bold text-[#00420d] tabular-nums mt-1">média {nbr(media, dec)}</p>
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white">
      <p className="px-4 py-2 bg-[#eef3ec] text-[11px] font-bold uppercase tracking-wide text-[#0B3D2E]">{titulo}</p>
      {children}
    </div>
  );
}

export default function StatsSummary({ dados, precisaoRequerida, areaTotalHa }: Props) {
  const d = dados;
  const limiteErro = precisaoRequerida ?? 10;
  const erroOk = d.erro_rel_pct <= limiteErro;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Dados gerais do inventário</CardTitle>
            <p className="text-sm text-gray-400">Resumo estatístico exigido pelos órgãos ambientais</p>
          </div>
          <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0 ${erroOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {erroOk ? <><CheckCircle2 className="w-3.5 h-3.5" />Erro ≤ {limiteErro}%</> : <><AlertTriangle className="w-3.5 h-3.5" />Erro &gt; {limiteErro}%</>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* destaques */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          {[
            { r: 'Volume estimado (área total)', v: `${nbr(d.volume_estimado_total, 2)} m³` },
            { r: 'Volume médio', v: `${nbr(d.media_vol_ha, 2)} m³/ha` },
            { r: 'Erro amostral', v: pbr(d.erro_rel_pct), ok: erroOk },
            { r: 'Coef. de variação', v: pbr(d.coeficiente_variacao_pct) },
          ].map(x => (
            <div key={x.r} className={cn('rounded-2xl p-3', x.ok === false ? 'bg-red-50' : 'bg-[#f4f8f3]')}>
              <p className={cn('text-base md:text-lg font-bold tabular-nums leading-tight', x.ok === false ? 'text-red-700' : 'text-[#00420d]')}>{x.v}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{x.r}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-4 items-start">
          <div className="space-y-4">
            <Grupo titulo="Amostragem">
              <Linha label="Parcelas (n)" value={ibr(d.n_parcelas)} />
              <Linha label="Parcelas possíveis na área (N)" value={ibr(d.n_parcelas_possiveis)} hint="Número de parcelas que caberiam na área total" />
              <Linha
                label="Área amostrada (ha)"
                value={areaTotalHa !== undefined ? nbr(areaTotalHa, 4) : nbr(d.area_amostrada_ha, 4)}
                hint="Área total do empreendimento informada no cadastro do projeto"
              />
              <Linha label="Indivíduos" value={ibr(d.n_individuos)} />
              <Linha label="Espécies" value={ibr(d.n_especies)} />
              <Linha label="Famílias" value={ibr(d.n_familias)} />
              <Linha label="Volume total amostrado (m³)" value={nbr(d.volume_total_m3, 4)} />
              <Linha label="Área basal total (m²)" value={nbr(d.area_basal_total_m2, 4)} />
            </Grupo>
            <Grupo titulo="Intervalo de confiança">
              <LinhaIC label="Por parcela (m³/parcela)" li={d.ic_inferior_parcela} media={d.media_vol_parcela} ls={d.ic_superior_parcela} />
              <LinhaIC label="Por hectare (m³/ha)" li={d.ic_inferior_ha} media={d.media_vol_ha} ls={d.ic_superior_ha} />
              <LinhaIC label="População (m³)" li={d.ic_inferior_pop} media={d.volume_estimado_total} ls={d.ic_superior_pop} dec={2} />
            </Grupo>
          </div>
          <Grupo titulo="Estatística da amostragem">
            <Linha label="Média (m³/parcela)" value={nbr(d.media_vol_parcela, 4)} hint="Volume médio por parcela" />
            <Linha label="Variância amostral" value={nbr(d.variancia_amostral, 6)} />
            <Linha label="Desvio padrão" value={nbr(d.desvio_padrao, 4)} />
            <Linha label="Fator de correção (FC)" value={nbr(d.fator_correcao, 4)} hint="FC = (N-n)/N. FC ≥ 0,98: população infinita" />
            <Linha label="Variância da média" value={nbr(d.variancia_media, 6)} />
            <Linha label="Erro padrão da média" value={nbr(d.erro_padrao, 4)} />
            <Linha label="Coeficiente de variação" value={pbr(d.coeficiente_variacao_pct)} />
            <Linha label="t de Student" value={nbr(d.t_student, 3)} />
            <Linha label="Erro amostral absoluto (m³)" value={nbr(d.erro_abs, 4)} hint="t × erro padrão da média" />
            <Linha label="Erro amostral relativo" value={pbr(d.erro_rel_pct)} tom={erroOk ? 'verde' : 'vermelho'} hint={`Limite deste inventário: ${limiteErro}%`} />
            <Linha label="Volume estimado para a área total (m³)" value={nbr(d.volume_estimado_total, 2)} tom="verde" />
          </Grupo>
        </div>

        {!erroOk && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
            <strong>Atenção:</strong> o erro amostral ({pbr(d.erro_rel_pct)}) está acima do limite de {limiteErro}%. Considere aumentar o número de parcelas.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
