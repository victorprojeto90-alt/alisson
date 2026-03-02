import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { IndicesDiversidade as IndicesType } from '../../lib/calculations';
import { fmt } from '../../lib/calculations';

interface Props {
  indices: IndicesType;
}

function IndiceBar({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-mono font-semibold text-gray-900">{fmt.num(value, 4)}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function IndicesDiversidade({ indices }: Props) {
  const { shannon_h, simpson_c, pielou_j } = indices;

  const interpShannon = shannon_h >= 3.5 ? 'Muito Alta' : shannon_h >= 2.5 ? 'Alta' : shannon_h >= 1.5 ? 'Moderada' : 'Baixa';
  const interpPielou = pielou_j >= 0.8 ? 'Alta' : pielou_j >= 0.6 ? 'Moderada' : 'Baixa';
  const interpSimpson = simpson_c >= 0.9 ? 'Alta Diversidade' : simpson_c >= 0.7 ? 'Moderada' : 'Baixa Diversidade';

  const colorShannon = shannon_h >= 2.5 ? '#16A34A' : shannon_h >= 1.5 ? '#d97706' : '#dc2626';
  const colorPielou = pielou_j >= 0.6 ? '#16A34A' : pielou_j >= 0.4 ? '#d97706' : '#dc2626';
  const colorSimpson = simpson_c >= 0.7 ? '#16A34A' : simpson_c >= 0.5 ? '#d97706' : '#dc2626';

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Índices de Diversidade Florística</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Shannon-Weaver (H')",
              value: fmt.num(shannon_h, 4),
              unit: 'nats/ind.',
              interp: interpShannon,
              color: colorShannon,
              desc: 'Mede riqueza e equabilidade',
            },
            {
              label: 'Dominância de Simpson (C)',
              value: fmt.num(simpson_c, 4),
              unit: 'adimensional',
              interp: interpSimpson,
              color: colorSimpson,
              desc: '1 = alta diversidade',
            },
            {
              label: 'Equabilidade de Pielou (J)',
              value: fmt.num(pielou_j, 4),
              unit: 'adimensional',
              interp: interpPielou,
              color: colorPielou,
              desc: '1 = distribuição perfeitamente uniforme',
            },
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-2">{item.label}</p>
              <p className="text-3xl font-bold text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-400 mb-2">{item.unit}</p>
              <span
                className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold text-white"
                style={{ backgroundColor: item.color }}
              >
                {item.interp}
              </span>
              <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="space-y-4 pt-2">
          <IndiceBar value={shannon_h} max={Math.max(shannon_h, 4)} label="Shannon-Weaver (H')" color={colorShannon} />
          <IndiceBar value={pielou_j} max={1} label="Pielou (J)" color={colorPielou} />
          <IndiceBar value={simpson_c} max={1} label="Simpson (C)" color={colorSimpson} />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-[#0B3D2E] text-white">
              <tr>
                <th className="py-2.5 px-4 text-left font-semibold">Índice</th>
                <th className="py-2.5 px-4 text-center font-semibold">Valor</th>
                <th className="py-2.5 px-4 text-center font-semibold">Interpretação</th>
                <th className="py-2.5 px-4 text-left font-semibold">Referência</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-2.5 px-4">Shannon-Weaver H&apos;</td>
                <td className="py-2.5 px-4 text-center font-mono">{fmt.num(shannon_h, 4)}</td>
                <td className="py-2.5 px-4 text-center">
                  <span className="text-xs px-2 py-0.5 rounded-full text-white font-semibold" style={{ backgroundColor: colorShannon }}>
                    {interpShannon}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-gray-400 text-xs">{'> 3,5 = muito alta'}</td>
              </tr>
              <tr className="border-b border-gray-100 bg-gray-50">
                <td className="py-2.5 px-4">Dominância de Simpson C</td>
                <td className="py-2.5 px-4 text-center font-mono">{fmt.num(simpson_c, 4)}</td>
                <td className="py-2.5 px-4 text-center">
                  <span className="text-xs px-2 py-0.5 rounded-full text-white font-semibold" style={{ backgroundColor: colorSimpson }}>
                    {interpSimpson}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-gray-400 text-xs">{'> 0,9 = alta diversidade'}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4">Equabilidade de Pielou J</td>
                <td className="py-2.5 px-4 text-center font-mono">{fmt.num(pielou_j, 4)}</td>
                <td className="py-2.5 px-4 text-center">
                  <span className="text-xs px-2 py-0.5 rounded-full text-white font-semibold" style={{ backgroundColor: colorPielou }}>
                    {interpPielou}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-gray-400 text-xs">{'≥ 0,8 = alta uniformidade'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500">
          Total: <strong>{indices.n_individuos.toLocaleString('pt-BR')} indivíduos</strong> de{' '}
          <strong>{indices.n_especies} espécies</strong> considerados no cálculo dos índices.
        </div>
      </CardContent>
    </Card>
  );
}
