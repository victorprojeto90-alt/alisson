import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { Estratificacao } from '../../lib/calculations';
import { fmt } from '../../lib/calculations';

interface EspecieEstrato {
  nome_comum: string;
  nome_cientifico: string;
  estrato: string;
  n_individuos: number;
  pct_estrato: number;
}

interface Props {
  estratos: Estratificacao[];
  especiesEstratos?: EspecieEstrato[];
}

const COLORS = ['#6EE7B7', '#00420d', '#acd115'];

export default function EstruturaVertical({ estratos, especiesEstratos = [] }: Props) {
  const total = estratos.reduce((s, e) => s + e.n_individuos, 0);

  const pieData = estratos
    .filter(e => e.n_individuos > 0)
    .map((e, i) => ({
      name: e.estrato,
      value: e.n_individuos,
      color: COLORS[i % COLORS.length],
    }));

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Estrutura Vertical (Estratificação)</CardTitle>
        <p className="text-sm text-gray-400 mt-0.5">Distribuição dos indivíduos nos estratos da floresta</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart + summary table */}
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

          {/* Strata summary table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-xs">
              <thead className="bg-[#00420d] text-white">
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
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
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
                <tr className="bg-[#00420d]/5 font-semibold border-t">
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

        {/* Per-species strata table */}
        {especiesEstratos.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-3">
              Distribuição Vertical por Espécie
            </h4>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-xs">
                <thead className="bg-[#00420d]/80 text-white">
                  <tr>
                    <th className="py-2.5 px-4 text-left font-semibold">Espécie</th>
                    <th className="py-2.5 px-4 text-left font-semibold hidden sm:table-cell">Nome Científico</th>
                    <th className="py-2.5 px-4 text-left font-semibold">Estrato</th>
                    <th className="py-2.5 px-4 text-right font-semibold">NI</th>
                    <th className="py-2.5 px-4 text-right font-semibold">% no Estrato</th>
                  </tr>
                </thead>
                <tbody>
                  {especiesEstratos.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-2 px-4 font-medium">{row.nome_comum}</td>
                      <td className="py-2 px-4 italic text-gray-400 hidden sm:table-cell">{row.nome_cientifico}</td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          row.estrato === 'Superior'
                            ? 'bg-green-100 text-green-700'
                            : row.estrato === 'Médio'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          {row.estrato}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-right font-mono">{row.n_individuos}</td>
                      <td className="py-2 px-4 text-right font-mono">{fmt.pct(row.pct_estrato)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
