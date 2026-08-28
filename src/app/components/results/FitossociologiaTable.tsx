import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import type { ResultadoEspecie, ResultadoFamilia } from '../../lib/calculations';
import { fmt } from '../../lib/calculations';

interface Props {
  especies: ResultadoEspecie[];
  familias: ResultadoFamilia[];
}

function THead({ cols }: { cols: string[] }) {
  return (
    <thead className="bg-[#0B3D2E] text-white sticky top-0 z-10">
      <tr>
        {cols.map(c => (
          <th key={c} className="py-2.5 px-3 text-left text-xs font-semibold whitespace-nowrap">{c}</th>
        ))}
      </tr>
    </thead>
  );
}

export default function FitossociologiaTable({ especies, familias }: Props) {
  const sorted = [...especies].sort((a, b) => b.vi - a.vi);

  // Totals for the espécies por VI% table
  const totNI = sorted.reduce((s, e) => s + e.n_individuos, 0);
  const totDA = sorted.reduce((s, e) => s + e.da, 0);
  const totAB = sorted.reduce((s, e) => s + e.area_basal_m2, 0);
  const totDoA = sorted.reduce((s, e) => s + e.doa, 0);
  const totVI = sorted.reduce((s, e) => s + e.vi, 0);
  const totVol = sorted.reduce((s, e) => s + e.vol_ha, 0);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Análise Fitossociológica da Estrutura Horizontal</CardTitle>
        <p className="text-sm text-gray-400">Parâmetros fitossociológicos das espécies e famílias amostradas</p>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="especies_vi">
          <div className="px-6 pt-2 pb-0">
            <TabsList className="bg-gray-100 p-0.5 rounded-lg h-auto flex-wrap gap-1">
              <TabsTrigger value="especies_vi" className="text-xs rounded py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Espécies por VI%
              </TabsTrigger>
              <TabsTrigger value="especies_n" className="text-xs rounded py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Espécies por Nº ind.
              </TabsTrigger>
              <TabsTrigger value="familias_n" className="text-xs rounded py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Famílias por Nº ind.
              </TabsTrigger>
              <TabsTrigger value="familias_vi" className="text-xs rounded py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Famílias por VI
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Espécies por VI% */}
          <TabsContent value="especies_vi" className="mt-0">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs">
                <THead cols={['#', 'Nome Comum', 'Nome Científico', 'Família', 'NI', 'DA', 'DR%', 'AB (m²)', 'DoA', 'DoR%', 'U', 'FA%', 'FR%', 'VI (0-300)', 'VI% (0-100)', 'Vol. (m³/ha)']} />
                <tbody>
                  {sorted.map((e, i) => (
                    <tr key={e.nome_comum} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                      <td className="py-2 px-3 font-medium text-gray-900 whitespace-nowrap">{e.nome_comum}</td>
                      <td className="py-2 px-3 italic text-gray-500 whitespace-nowrap">{e.nome_cientifico || '—'}</td>
                      <td className="py-2 px-3 text-gray-500 whitespace-nowrap">{e.familia || '—'}</td>
                      <td className="py-2 px-3 font-mono text-right">{e.n_individuos}</td>
                      <td className="py-2 px-3 font-mono text-right">{fmt.num(e.da, 2)}</td>
                      <td className="py-2 px-3 font-mono text-right">{fmt.num(e.dr, 2)}</td>
                      <td className="py-2 px-3 font-mono text-right">{fmt.num(e.area_basal_m2, 4)}</td>
                      <td className="py-2 px-3 font-mono text-right">{fmt.num(e.doa, 4)}</td>
                      <td className="py-2 px-3 font-mono text-right">{fmt.num(e.dor, 2)}</td>
                      <td className="py-2 px-3 font-mono text-right">{e.n_parcelas}</td>
                      <td className="py-2 px-3 font-mono text-right">{fmt.num(e.fa, 2)}</td>
                      <td className="py-2 px-3 font-mono text-right">{fmt.num(e.fr, 2)}</td>
                      <td className="py-2 px-3 font-mono text-right font-semibold">{fmt.num(e.vi, 2)}</td>
                      <td className="py-2 px-3 font-mono text-right font-semibold text-[#0B3D2E]">{fmt.num(e.vi_pct, 2)}</td>
                      <td className="py-2 px-3 font-mono text-right">{fmt.num(e.vol_ha, 4)}</td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="bg-[#0B3D2E]/5 border-t-2 border-[#0B3D2E]/30 font-bold text-xs">
                    <td className="py-2 px-3 text-gray-500"></td>
                    <td className="py-2 px-3 text-gray-800" colSpan={3}>TOTAL</td>
                    <td className="py-2 px-3 font-mono text-right">{totNI}</td>
                    <td className="py-2 px-3 font-mono text-right">{fmt.num(totDA, 2)}</td>
                    <td className="py-2 px-3 font-mono text-right">100,00</td>
                    <td className="py-2 px-3 font-mono text-right">{fmt.num(totAB, 4)}</td>
                    <td className="py-2 px-3 font-mono text-right">{fmt.num(totDoA, 4)}</td>
                    <td className="py-2 px-3 font-mono text-right">100,00</td>
                    <td className="py-2 px-3 font-mono text-right">—</td>
                    <td className="py-2 px-3 font-mono text-right">—</td>
                    <td className="py-2 px-3 font-mono text-right">100,00</td>
                    <td className="py-2 px-3 font-mono text-right">{fmt.num(totVI, 2)}</td>
                    <td className="py-2 px-3 font-mono text-right text-[#0B3D2E]">100,00</td>
                    <td className="py-2 px-3 font-mono text-right">{fmt.num(totVol, 4)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Legend */}
            <div className="px-4 py-3 border-t bg-gray-50">
              <p className="text-xs font-semibold text-gray-600 mb-1">Legenda das colunas:</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                <strong>NI</strong> = Nº de Indivíduos &nbsp;·&nbsp;
                <strong>DA</strong> = Densidade Absoluta (ind/ha) &nbsp;·&nbsp;
                <strong>DR%</strong> = Densidade Relativa (%) &nbsp;·&nbsp;
                <strong>AB</strong> = Área Basal (m²) &nbsp;·&nbsp;
                <strong>DoA</strong> = Dominância Absoluta (m²/ha) &nbsp;·&nbsp;
                <strong>DoR%</strong> = Dominância Relativa (%) &nbsp;·&nbsp;
                <strong>U</strong> = Nº de Parcelas onde a espécie ocorre &nbsp;·&nbsp;
                <strong>FA%</strong> = Frequência Absoluta (%) &nbsp;·&nbsp;
                <strong>FR%</strong> = Frequência Relativa (%) &nbsp;·&nbsp;
                <strong>VI (0-300)</strong> = Valor de Importância bruto, soma de DR% + DoR% + FR% (varia de 0 a 300) &nbsp;·&nbsp;
                <strong>VI% (0-100)</strong> = VI ÷ 3 — <strong>métrica de referência recomendada</strong> para comparar a importância entre espécies
              </p>
            </div>
          </TabsContent>

          {/* Espécies por Nº de indivíduos */}
          <TabsContent value="especies_n" className="mt-0">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs">
                <THead cols={['#', 'Nome Comum', 'Nome Científico', 'Família', 'NI', 'DR%', 'AB (m²)', 'DoR%', 'Vol. (m³)', 'VI% (0-100)']} />
                <tbody>
                  {[...especies]
                    .sort((a, b) => b.n_individuos - a.n_individuos)
                    .map((e, i) => (
                      <tr key={e.nome_comum} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                        <td className="py-2 px-3 font-medium">{e.nome_comum}</td>
                        <td className="py-2 px-3 italic text-gray-500">{e.nome_cientifico || '—'}</td>
                        <td className="py-2 px-3 text-gray-500">{e.familia || '—'}</td>
                        <td className="py-2 px-3 font-mono text-right font-semibold">{e.n_individuos}</td>
                        <td className="py-2 px-3 font-mono text-right">{fmt.num(e.dr, 2)}</td>
                        <td className="py-2 px-3 font-mono text-right">{fmt.num(e.area_basal_m2, 4)}</td>
                        <td className="py-2 px-3 font-mono text-right">{fmt.num(e.dor, 2)}</td>
                        <td className="py-2 px-3 font-mono text-right">{fmt.num(e.volume_m3, 4)}</td>
                        <td className="py-2 px-3 font-mono text-right font-semibold text-[#0B3D2E]">{fmt.num(e.vi_pct, 2)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Famílias por Nº de indivíduos */}
          <TabsContent value="familias_n" className="mt-0">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs">
                <THead cols={['#', 'Família', 'Nº Espécies', 'Nº Indivíduos', '% Indivíduos', 'VI Médio (%)']} />
                <tbody>
                  {familias.map((f, i) => (
                    <tr key={f.familia} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                      <td className="py-2 px-3 font-medium italic">{f.familia}</td>
                      <td className="py-2 px-3 font-mono text-right">{f.n_especies}</td>
                      <td className="py-2 px-3 font-mono text-right font-semibold">{f.n_individuos}</td>
                      <td className="py-2 px-3 font-mono text-right">{fmt.num(f.pct_individuos, 2)}%</td>
                      <td className="py-2 px-3 font-mono text-right text-[#0B3D2E] font-semibold">{fmt.num(f.vi_medio, 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Famílias por VI — ResultadoFamilia não tem um campo "vi" separado, só
              vi_medio (média do VI% das espécies da família), que já é a métrica de
              importância da família — não duplicamos criando um segundo campo. */}
          <TabsContent value="familias_vi" className="mt-0">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs">
                <THead cols={['#', 'Família', 'Nº Espécies', 'Nº Indivíduos', '% Indivíduos', 'VI Médio (%)']} />
                <tbody>
                  {[...familias]
                    .sort((a, b) => b.vi_medio - a.vi_medio)
                    .map((f, i) => (
                      <tr key={f.familia} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                        <td className="py-2 px-3 font-medium italic">{f.familia}</td>
                        <td className="py-2 px-3 font-mono text-right">{f.n_especies}</td>
                        <td className="py-2 px-3 font-mono text-right font-semibold">{f.n_individuos}</td>
                        <td className="py-2 px-3 font-mono text-right">{fmt.num(f.pct_individuos, 2)}%</td>
                        <td className="py-2 px-3 font-mono text-right text-[#0B3D2E] font-semibold">{fmt.num(f.vi_medio, 2)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
