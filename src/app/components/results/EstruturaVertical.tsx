import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { Estratificacao } from '../../lib/calculations';
import { fmt } from '../../lib/calculations';

interface Props {
  estratos: Estratificacao[];
}

const COLORS = ['#6EE7B7', '#16A34A', '#0B3D2E'];

export default function EstruturaVertical({ estratos }: Props) {
  const total = estratos.reduce((s, e) => s + e.n_individuos, 0);

  const pieData = estratos
    .filter(e => e.n_individuos > 0)
    .map((e, i) => ({
      name: e.estrato,
      value: e.n_individuos,
      color: COLORS[i],
    }));

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Estrutura Vertical (Estratificação)</CardTitle>
        <p className="text-sm text-gray-400 mt-0.5">Distribuição dos indivíduos nos estratos da floresta</p>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pie chart */}
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(1)}%`
                  }
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v} ind.`, 'Indivíduos']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-xs">
              <thead className="bg-[#0B3D2E] text-white">
                <tr>
                  <th className="py-2.5 px-3 text-left font-semibold">Estrato</th>
                  <th className="py-2.5 px-3 text-left font-semibold">Amplitude</th>
                  <th className="py-2.5 px-3 text-right font-semibold">NI</th>
                  <th className="py-2.5 px-3 text-right font-semibold">%</th>
                  <th className="py-2.5 px-3 text-right font-semibold">AB (m²)</th>
                </tr>
              </thead>
              <tbody>
                {estratos.map((e, i) => (
                  <tr key={e.estrato} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[i] }}
                        />
                        <span className="font-medium">{e.estrato}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 text-xs">{e.descricao}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{e.n_individuos}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{fmt.pct(e.pct)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{fmt.num(e.area_basal_m2, 4)}</td>
                  </tr>
                ))}
                <tr className="bg-[#0B3D2E]/5 font-semibold border-t">
                  <td className="py-2.5 px-3" colSpan={2}>TOTAL</td>
                  <td className="py-2.5 px-3 text-right font-mono">{total}</td>
                  <td className="py-2.5 px-3 text-right font-mono">100%</td>
                  <td className="py-2.5 px-3 text-right font-mono">
                    {fmt.num(estratos.reduce((s, e) => s + e.area_basal_m2, 0), 4)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
