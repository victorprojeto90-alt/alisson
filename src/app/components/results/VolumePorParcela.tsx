import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { ResultadoParcela } from '../../lib/calculations';
import { nbr, ibr } from '../../lib/formato';

interface Props {
  parcelas: ResultadoParcela[];
}

const TH = 'py-2.5 px-3 text-xs font-semibold whitespace-nowrap';
const TD = 'py-2 px-3 tabular-nums text-right';

export default function VolumePorParcela({ parcelas }: Props) {
  const tot = {
    area: parcelas.reduce((s, p) => s + p.area_m2, 0),
    ni: parcelas.reduce((s, p) => s + p.n_individuos, 0),
    ab: parcelas.reduce((s, p) => s + p.area_basal_m2, 0),
    vol: parcelas.reduce((s, p) => s + p.volume_m3, 0),
  };
  const n = Math.max(parcelas.length, 1);
  const maxVolHa = Math.max(...parcelas.map(p => p.volume_ha), 1);
  const mediaVolHa = parcelas.reduce((s, p) => s + p.volume_ha, 0) / n;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Volume por parcela</CardTitle>
        <p className="text-sm text-gray-400">Resultado de cada unidade amostral · média {nbr(mediaVolHa, 2)} m³/ha</p>
      </CardHeader>
      <CardContent className="px-0 md:px-0 pb-0 md:pb-0">
        {/* celular */}
        <div className="md:hidden px-4 pb-4 space-y-2">
          {parcelas.map(p => (
            <div key={p.numero} className="rounded-2xl border border-gray-100 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm text-gray-900">Parcela {p.numero}</p>
                <p className="text-base font-bold text-[#00420d] tabular-nums">{nbr(p.volume_ha, 2)} <span className="text-[11px] font-normal text-gray-500">m³/ha</span></p>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mt-2">
                <div className="h-full rounded-full bg-gradient-to-r from-[#0B5A1E] to-[#16A34A]" style={{ width: `${(p.volume_ha / maxVolHa) * 100}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-1.5 mt-2.5 text-center">
                {[
                  ['Indivíduos', ibr(p.n_individuos)],
                  ['Volume m³', nbr(p.volume_m3, 4)],
                  ['AB m²', nbr(p.area_basal_m2, 4)],
                  ['Área m²', nbr(p.area_m2, 0)],
                  ['AB m²/ha', nbr(p.area_basal_ha, 2)],
                  ['Densid. ind/ha', nbr(p.densidade_ha, 0)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-[#f8faf7] py-1.5">
                    <p className="text-[10px] text-gray-400 leading-none">{k}</p>
                    <p className="text-xs font-semibold text-gray-800 tabular-nums mt-1">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="rounded-2xl bg-[#00420d]/5 p-3 grid grid-cols-3 gap-2 text-xs text-center">
            <div><p className="text-gray-500">Indivíduos</p><p className="font-bold tabular-nums">{ibr(tot.ni)}</p></div>
            <div><p className="text-gray-500">Volume m³</p><p className="font-bold tabular-nums">{nbr(tot.vol, 4)}</p></div>
            <div><p className="text-gray-500">AB m²</p><p className="font-bold tabular-nums">{nbr(tot.ab, 4)}</p></div>
          </div>
        </div>

        {/* computador */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="ui-thead">
              <tr>
                <th className={`${TH} text-left`}>Parcela</th>
                {['Área (m²)', 'NI', 'AB (m²)', 'Volume (m³)', 'Volume (m³/ha)', 'AB (m²/ha)', 'Densidade (ind/ha)'].map(c => <th key={c} className={`${TH} text-right`}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {parcelas.map((p, i) => (
                <tr key={p.numero} className={i % 2 ? 'bg-[#f8faf7]' : 'bg-white'}>
                  <td className="py-2 px-3 font-medium text-gray-900">{p.numero}</td>
                  <td className={TD}>{nbr(p.area_m2, 2)}</td>
                  <td className={TD}>{ibr(p.n_individuos)}</td>
                  <td className={TD}>{nbr(p.area_basal_m2, 4)}</td>
                  <td className={TD}>{nbr(p.volume_m3, 4)}</td>
                  <td className={`${TD} font-semibold text-[#00420d]`}>{nbr(p.volume_ha, 4)}</td>
                  <td className={TD}>{nbr(p.area_basal_ha, 4)}</td>
                  <td className={TD}>{nbr(p.densidade_ha, 2)}</td>
                </tr>
              ))}
              <tr className="bg-[#e2ecdf] font-bold">
                <td className="py-2 px-3">Total</td>
                <td className={TD}>{nbr(tot.area, 2)}</td>
                <td className={TD}>{ibr(tot.ni)}</td>
                <td className={TD}>{nbr(tot.ab, 4)}</td>
                <td className={TD}>{nbr(tot.vol, 4)}</td>
                <td className={TD}>—</td>
                <td className={TD}>—</td>
                <td className={TD}>—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
