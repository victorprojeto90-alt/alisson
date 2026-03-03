import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from 'recharts';
import type { ClasseDiametrica } from '../../lib/calculations';
import { fmt } from '../../lib/calculations';

interface Props {
  classes: ClasseDiametrica[];
}

export default function EstruturaDiametrica({ classes }: Props) {
  const total = classes.reduce((s, c) => s + c.n_individuos, 0);

  // Detect J-inverse
  const nonEmpty = classes.filter(c => c.n_individuos > 0);
  const isJInverse = nonEmpty.length > 2 && nonEmpty
    .slice(0, -1)
    .every((c, i) => c.n_individuos >= nonEmpty[i + 1].n_individuos);

  const chartData = classes.map(c => ({
    classe: c.min_cm === 0 ? '<5' : c.max_cm === Infinity ? `>${c.min_cm}` : `${c.min_cm}–`,
    label: c.classe,
    n: c.n_individuos,
    pct: c.pct,
  }));

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Estrutura Diamétrica (Distribuição por Classes de DAP)</CardTitle>
            <p className="text-sm text-gray-400 mt-0.5">Distribuição dos indivíduos em classes diamétricas de amplitude de 5 cm</p>
          </div>
          <span className={`flex-shrink-0 text-xs px-3 py-1 rounded-full font-semibold ${
            isJInverse ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {isJInverse ? 'J-Invertido ✓' : 'Sem J-Invertido'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 16, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="classe" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'n' ? `${value} ind.` : `${value.toFixed(2)}%`,
                  name === 'n' ? 'Indivíduos' : '%',
                ]}
                labelFormatter={(_: unknown, payload: Array<{payload: {label: string}}>) =>
                  payload[0]?.payload?.label || ''
                }
              />
              <Bar dataKey="n" fill="#0B3D2E" radius={[4, 4, 0, 0]} name="n">
                <LabelList dataKey="n" position="top" style={{ fontSize: 10, fill: '#6b7280' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-xs">
            <thead className="bg-[#0B3D2E] text-white">
              <tr>
                <th className="py-2.5 px-4 text-left font-semibold">Classe DAP (cm)</th>
                <th className="py-2.5 px-4 text-right font-semibold">Nº Indivíduos</th>
                <th className="py-2.5 px-4 text-right font-semibold">%</th>
                <th className="py-2.5 px-4 text-right font-semibold">Área Basal (m²)</th>
                <th className="py-2.5 px-4 text-left font-semibold w-40">Freq. Relativa</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c, i) => (
                <tr key={c.classe} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-2.5 px-4 font-medium">{c.classe}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{c.n_individuos}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{fmt.pct(c.pct)}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{fmt.num(c.area_basal_m2, 4)}</td>
                  <td className="py-2.5 px-4">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0B3D2E] rounded-full"
                        style={{ width: `${total > 0 ? (c.n_individuos / total) * 100 : 0}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-[#0B3D2E]/5 font-semibold border-t border-[#0B3D2E]/20">
                <td className="py-2.5 px-4">TOTAL</td>
                <td className="py-2.5 px-4 text-right font-mono">{total}</td>
                <td className="py-2.5 px-4 text-right font-mono">100%</td>
                <td className="py-2.5 px-4 text-right font-mono">
                  {fmt.num(classes.reduce((s, c) => s + c.area_basal_m2, 0), 4)}
                </td>
                <td className="py-2.5 px-4" />
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-400">
          {isJInverse
            ? '✓ Distribuição em J-invertido confirmada — indica floresta nativa em processo de regeneração contínua com boa capacidade de auto-renovação.'
            : '⚠ Distribuição não segue o padrão J-invertido — pode indicar perturbação histórica ou estágio inicial de sucessão ecológica.'}
        </p>
      </CardContent>
    </Card>
  );
}
