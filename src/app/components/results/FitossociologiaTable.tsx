import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { ResultadoEspecie, ResultadoFamilia } from '../../lib/calculations';
import { nbr, ibr } from '../../lib/formato';
import { cn } from '../ui/utils';

interface Props {
  especies: ResultadoEspecie[];
  familias: ResultadoFamilia[];
}

type Visao = 'especies_vi' | 'especies_n' | 'familias_n' | 'familias_vi';
const VISOES: { id: Visao; label: string }[] = [
  { id: 'especies_vi', label: 'Espécies por VI%' },
  { id: 'especies_n', label: 'Espécies por nº' },
  { id: 'familias_n', label: 'Famílias por nº' },
  { id: 'familias_vi', label: 'Famílias por VI' },
];

const TH = 'py-2.5 px-3 text-xs font-semibold whitespace-nowrap';
const TD = 'py-2 px-3 tabular-nums text-right whitespace-nowrap';

function Barra({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
      <div className="h-full rounded-full bg-gradient-to-r from-[#0B5A1E] to-[#16A34A]" style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

function Mini({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg bg-[#f8faf7] px-2 py-1.5">
      <p className="text-[10px] text-gray-400 leading-none">{k}</p>
      <p className="text-xs font-semibold text-gray-800 tabular-nums mt-1">{v}</p>
    </div>
  );
}

export default function FitossociologiaTable({ especies, familias }: Props) {
  const [visao, setVisao] = useState<Visao>('especies_vi');
  const porVI = [...especies].sort((a, b) => b.vi - a.vi);
  const porN = [...especies].sort((a, b) => b.n_individuos - a.n_individuos);
  const famN = [...familias].sort((a, b) => b.n_individuos - a.n_individuos);
  const famVI = [...familias].sort((a, b) => b.vi_medio - a.vi_medio);
  const maxVI = Math.max(...especies.map(e => e.vi_pct), 1);
  const maxN = Math.max(...especies.map(e => e.n_individuos), 1);

  const tot = {
    ni: especies.reduce((s, e) => s + e.n_individuos, 0),
    da: especies.reduce((s, e) => s + e.da, 0),
    ab: especies.reduce((s, e) => s + e.area_basal_m2, 0),
    doa: especies.reduce((s, e) => s + e.doa, 0),
    vi: especies.reduce((s, e) => s + e.vi, 0),
    vol: especies.reduce((s, e) => s + e.vol_ha, 0),
  };

  const listaEsp = visao === 'especies_n' ? porN : porVI;
  const listaFam = visao === 'familias_vi' ? famVI : famN;
  const ehEspecie = visao.startsWith('especies');

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Análise fitossociológica (estrutura horizontal)</CardTitle>
        <p className="text-sm text-gray-400">Parâmetros das espécies e famílias amostradas</p>
      </CardHeader>
      <CardContent className="px-0 md:px-0 pb-0 md:pb-0">
        <div className="px-4 md:px-6 pb-3">
          <div className="grid grid-cols-2 sm:flex gap-1 p-1 rounded-xl bg-gray-100 sm:w-fit">
            {VISOES.map(v => (
              <button
                key={v.id}
                onClick={() => setVisao(v.id)}
                className={cn('px-3 py-2 rounded-lg text-xs font-semibold transition-colors', visao === v.id ? 'bg-white text-[#00420d] shadow-sm' : 'text-gray-600')}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {ehEspecie ? (
          <>
            {/* celular: cartões */}
            <div className="md:hidden px-4 space-y-2.5 pb-4">
              {listaEsp.map((e, i) => (
                <div key={e.nome_comum} className="rounded-2xl border border-gray-100 p-3">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-[#00420d]/10 text-[#00420d] text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm leading-tight">{e.nome_comum}</p>
                          <p className="text-xs italic text-gray-500 truncate">{e.nome_cientifico || '—'}</p>
                          <p className="text-[11px] text-gray-400">{e.familia || '—'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-[#00420d] tabular-nums leading-none">{visao === 'especies_n' ? ibr(e.n_individuos) : `${nbr(e.vi_pct, 2)}%`}</p>
                          <p className="text-[10px] text-gray-400">{visao === 'especies_n' ? 'indivíduos' : 'VI%'}</p>
                        </div>
                      </div>
                      <div className="mt-2"><Barra pct={visao === 'especies_n' ? (e.n_individuos / maxN) * 100 : (e.vi_pct / maxVI) * 100} /></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 mt-3">
                    <Mini k="NI" v={ibr(e.n_individuos)} />
                    <Mini k="U" v={ibr(e.n_parcelas)} />
                    <Mini k="DA" v={nbr(e.da, 2)} />
                    <Mini k="DR%" v={nbr(e.dr, 2)} />
                    <Mini k="AB m²" v={nbr(e.area_basal_m2, 4)} />
                    <Mini k="DoA" v={nbr(e.doa, 4)} />
                    <Mini k="DoR%" v={nbr(e.dor, 2)} />
                    <Mini k="FA%" v={nbr(e.fa, 2)} />
                    <Mini k="FR%" v={nbr(e.fr, 2)} />
                    <Mini k="VI" v={nbr(e.vi, 2)} />
                    <Mini k="VI%" v={nbr(e.vi_pct, 2)} />
                    <Mini k="Vol m³/ha" v={nbr(e.vol_ha, 4)} />
                  </div>
                </div>
              ))}
              <div className="rounded-2xl bg-[#00420d]/5 p-3 grid grid-cols-3 gap-2 text-xs">
                <div><p className="text-gray-500">Indivíduos</p><p className="font-bold tabular-nums">{ibr(tot.ni)}</p></div>
                <div><p className="text-gray-500">DA total</p><p className="font-bold tabular-nums">{nbr(tot.da, 2)}</p></div>
                <div><p className="text-gray-500">Vol. m³/ha</p><p className="font-bold tabular-nums">{nbr(tot.vol, 4)}</p></div>
              </div>
            </div>

            {/* computador: tabela */}
            <div className="hidden md:block overflow-x-auto max-h-[560px]">
              <table className="w-full text-xs">
                <thead className="ui-thead sticky top-0 z-10">
                  <tr>
                    <th className={cn(TH, 'text-left')}>#</th>
                    <th className={cn(TH, 'text-left')}>Nome comum</th>
                    <th className={cn(TH, 'text-left')}>Nome científico</th>
                    <th className={cn(TH, 'text-left')}>Família</th>
                    {['NI', 'DA', 'DR%', 'AB (m²)', 'DoA', 'DoR%', 'U', 'FA%', 'FR%', 'VI', 'VI%', 'Vol. (m³/ha)'].map(c => <th key={c} className={cn(TH, 'text-right')}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {listaEsp.map((e, i) => (
                    <tr key={e.nome_comum} className={i % 2 ? 'bg-[#f8faf7]' : 'bg-white'}>
                      <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                      <td className="py-2 px-3 font-medium text-gray-900 whitespace-nowrap">{e.nome_comum}</td>
                      <td className="py-2 px-3 italic text-gray-500 whitespace-nowrap">{e.nome_cientifico || '—'}</td>
                      <td className="py-2 px-3 text-gray-500 whitespace-nowrap">{e.familia || '—'}</td>
                      <td className={TD}>{ibr(e.n_individuos)}</td>
                      <td className={TD}>{nbr(e.da, 2)}</td>
                      <td className={TD}>{nbr(e.dr, 2)}</td>
                      <td className={TD}>{nbr(e.area_basal_m2, 4)}</td>
                      <td className={TD}>{nbr(e.doa, 4)}</td>
                      <td className={TD}>{nbr(e.dor, 2)}</td>
                      <td className={TD}>{ibr(e.n_parcelas)}</td>
                      <td className={TD}>{nbr(e.fa, 2)}</td>
                      <td className={TD}>{nbr(e.fr, 2)}</td>
                      <td className={cn(TD, 'font-semibold')}>{nbr(e.vi, 2)}</td>
                      <td className={cn(TD, 'font-bold text-[#00420d]')}>{nbr(e.vi_pct, 2)}</td>
                      <td className={TD}>{nbr(e.vol_ha, 4)}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#e2ecdf] font-bold border-t-2 border-[#0B5A1E]/30">
                    <td className="py-2 px-3" />
                    <td className="py-2 px-3 text-[#00420d]" colSpan={3}>Total</td>
                    <td className={TD}>{ibr(tot.ni)}</td>
                    <td className={TD}>{nbr(tot.da, 2)}</td>
                    <td className={TD}>100,00</td>
                    <td className={TD}>{nbr(tot.ab, 4)}</td>
                    <td className={TD}>{nbr(tot.doa, 4)}</td>
                    <td className={TD}>100,00</td>
                    <td className={TD}>—</td>
                    <td className={TD}>—</td>
                    <td className={TD}>100,00</td>
                    <td className={TD}>{nbr(tot.vi, 2)}</td>
                    <td className={cn(TD, 'text-[#00420d]')}>100,00</td>
                    <td className={TD}>{nbr(tot.vol, 4)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <div className="md:hidden px-4 space-y-2 pb-4">
              {listaFam.map((f, i) => (
                <div key={f.familia} className="rounded-2xl border border-gray-100 p-3 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#00420d]/10 text-[#00420d] text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm italic text-gray-900">{f.familia}</p>
                    <p className="text-xs text-gray-500">{ibr(f.n_especies)} espécie{f.n_especies !== 1 ? 's' : ''} · {ibr(f.n_individuos)} ind. ({nbr(f.pct_individuos, 2)}%)</p>
                    <div className="mt-1.5"><Barra pct={f.pct_individuos} /></div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-[#00420d] tabular-nums">{nbr(f.vi_medio, 2)}</p>
                    <p className="text-[10px] text-gray-400">VI% médio</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="ui-thead">
                  <tr>
                    <th className={cn(TH, 'text-left')}>#</th>
                    <th className={cn(TH, 'text-left')}>Família</th>
                    {['Espécies', 'Indivíduos', '% indivíduos', 'VI% médio'].map(c => <th key={c} className={cn(TH, 'text-right')}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {listaFam.map((f, i) => (
                    <tr key={f.familia} className={i % 2 ? 'bg-[#f8faf7]' : 'bg-white'}>
                      <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                      <td className="py-2 px-3 font-medium italic">{f.familia}</td>
                      <td className={TD}>{ibr(f.n_especies)}</td>
                      <td className={cn(TD, 'font-semibold')}>{ibr(f.n_individuos)}</td>
                      <td className={TD}>{nbr(f.pct_individuos, 2)}%</td>
                      <td className={cn(TD, 'font-bold text-[#00420d]')}>{nbr(f.vi_medio, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="px-4 md:px-6 py-3 border-t bg-gray-50 rounded-b-2xl">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            <b>NI</b> nº de indivíduos · <b>U</b> parcelas onde ocorre · <b>DA</b> densidade absoluta (ind/ha) · <b>DR</b> densidade relativa ·
            <b> AB</b> área basal · <b>DoA</b> dominância absoluta (m²/ha) · <b>DoR</b> dominância relativa · <b>FA</b> frequência absoluta ·
            <b> FR</b> frequência relativa · <b>VI</b> valor de importância (0–300) · <b>VI%</b> VI ÷ 3, referência para comparar espécies
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
