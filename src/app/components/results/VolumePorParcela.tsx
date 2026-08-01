import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { ResultadoParcela } from '../../lib/calculations';
import { fmt } from '../../lib/calculations';

interface Props {
  parcelas: ResultadoParcela[];
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

export default function VolumePorParcela({ parcelas }: Props) {
  const totArea = parcelas.reduce((s, p) => s + p.area_m2, 0);
  const totNI = parcelas.reduce((s, p) => s + p.n_individuos, 0);
  const totAB = parcelas.reduce((s, p) => s + p.area_basal_m2, 0);
  const totVol = parcelas.reduce((s, p) => s + p.volume_m3, 0);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Volume por Parcela</CardTitle>
        <p className="text-sm text-gray-400">Resultados individuais de cada unidade amostral</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-xs">
            <THead cols={['Parcela', 'Área (m²)', 'NI', 'AB (m²)', 'Volume (m³)', 'Volume (m³/ha)', 'AB (m²/ha)', 'Densidade (ind/ha)']} />
            <tbody>
              {parcelas.map((p, i) => (
                <tr key={p.numero} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-2 px-3 font-medium text-gray-900">{p.numero}</td>
                  <td className="py-2 px-3 font-mono text-right">{fmt.num(p.area_m2, 2)}</td>
                  <td className="py-2 px-3 font-mono text-right">{p.n_individuos}</td>
                  <td className="py-2 px-3 font-mono text-right">{fmt.num(p.area_basal_m2, 4)}</td>
                  <td className="py-2 px-3 font-mono text-right">{fmt.num(p.volume_m3, 4)}</td>
                  <td className="py-2 px-3 font-mono text-right">{fmt.num(p.volume_ha, 4)}</td>
                  <td className="py-2 px-3 font-mono text-right">{fmt.num(p.area_basal_ha, 4)}</td>
                  <td className="py-2 px-3 font-mono text-right">{fmt.num(p.densidade_ha, 2)}</td>
                </tr>
              ))}
              {/* Totals row — colunas por hectare não são somáveis entre parcelas, exibidas como — */}
              <tr className="bg-[#0B3D2E]/5 border-t-2 border-[#0B3D2E]/30 font-bold text-xs">
                <td className="py-2 px-3 text-gray-800">TOTAL</td>
                <td className="py-2 px-3 font-mono text-right">{fmt.num(totArea, 2)}</td>
                <td className="py-2 px-3 font-mono text-right">{totNI}</td>
                <td className="py-2 px-3 font-mono text-right">{fmt.num(totAB, 4)}</td>
                <td className="py-2 px-3 font-mono text-right">{fmt.num(totVol, 4)}</td>
                <td className="py-2 px-3 font-mono text-right">—</td>
                <td className="py-2 px-3 font-mono text-right">—</td>
                <td className="py-2 px-3 font-mono text-right">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
