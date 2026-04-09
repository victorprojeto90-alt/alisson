import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from 'recharts';
import { fmt } from '../../lib/calculations';
import { RefreshCw } from 'lucide-react';

interface ClasseLocal {
  classe: string;
  min_cm: number;
  max_cm: number;
  n_individuos: number;
  pct: number;
  area_basal_m2: number;
}

interface Props {
  individuos: Array<{ dap_cm: number; area_basal_m2: number }>;
}

function calcularSturges(individuos: Array<{ dap_cm: number; area_basal_m2: number }>, ic: number): ClasseLocal[] {
  if (individuos.length === 0) return [];
  const daps = individuos.map(i => i.dap_cm);
  const dapMin = Math.min(...daps);
  const dapMax = Math.max(...daps);

  const classes: ClasseLocal[] = [];
  let inicio = Math.floor(dapMin);
  while (inicio < dapMax) {
    const fim = inicio + ic;
    const label = `${inicio}–${fim} cm`;
    const inC = individuos.filter(i => i.dap_cm >= inicio && i.dap_cm < fim);
    classes.push({
      classe: label,
      min_cm: inicio,
      max_cm: fim,
      n_individuos: inC.length,
      pct: individuos.length > 0 ? (inC.length / individuos.length) * 100 : 0,
      area_basal_m2: inC.reduce((s, i) => s + i.area_basal_m2, 0),
    });
    inicio = fim;
  }
  // Include last point (== dapMax)
  const last = classes[classes.length - 1];
  if (last) {
    const extra = individuos.filter(i => i.dap_cm >= last.max_cm);
    if (extra.length > 0) {
      last.n_individuos += extra.length;
      last.pct = individuos.length > 0 ? (last.n_individuos / individuos.length) * 100 : 0;
      last.area_basal_m2 += extra.reduce((s, i) => s + i.area_basal_m2, 0);
    }
  }
  return classes.filter(c => c.n_individuos > 0);
}

export default function EstruturaDiametrica({ individuos }: Props) {
  const n = individuos.length;

  // Sturges: NC = 1 + 3.322 * log10(n), IC = amplitude / NC (arredondar para cima)
  const icSturges = useMemo(() => {
    if (n < 2) return 5;
    const daps = individuos.map(i => i.dap_cm);
    const dapMin = Math.min(...daps);
    const dapMax = Math.max(...daps);
    const nc = Math.round(1 + 3.322 * Math.log10(n));
    const amplitude = dapMax - dapMin;
    return Math.ceil(amplitude / nc) || 5;
  }, [individuos, n]);

  const [icInput, setIcInput] = useState<string>('');
  const [icAtual, setIcAtual] = useState<number | null>(null);

  const ic = icAtual ?? icSturges;

  const classes = useMemo(() => calcularSturges(individuos, ic), [individuos, ic]);

  const total = classes.reduce((s, c) => s + c.n_individuos, 0);

  const nonEmpty = classes.filter(c => c.n_individuos > 0);
  const isJInverse = nonEmpty.length > 2 && nonEmpty
    .slice(0, -1)
    .every((c, i) => c.n_individuos >= nonEmpty[i + 1].n_individuos);

  const chartData = classes.map(c => ({
    classe: c.classe.replace(' cm', ''),
    label: c.classe,
    n: c.n_individuos,
    pct: c.pct,
  }));

  const handleRecalcular = () => {
    const v = parseFloat(icInput.replace(',', '.'));
    if (!isNaN(v) && v > 0) {
      setIcAtual(Math.ceil(v));
    }
  };

  const handleResetSturges = () => {
    setIcAtual(null);
    setIcInput('');
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-base">Estrutura Diamétrica (Distribuição por Classes de DAP)</CardTitle>
            <p className="text-sm text-gray-400 mt-0.5">
              Intervalo de classe calculado automaticamente pela Fórmula de Sturges: <strong>{icSturges} cm</strong>
            </p>
          </div>
          <span className={`flex-shrink-0 text-xs px-3 py-1 rounded-full font-semibold ${
            isJInverse ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {isJInverse ? 'J-Invertido ✓' : 'Sem J-Invertido'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* IC control */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex-1">
            <p className="text-xs font-semibold text-blue-800 mb-1">
              Intervalo de classe atual: <span className="text-blue-600">{ic} cm</span>
              {icAtual !== null && <span className="ml-2 text-blue-400">(manual)</span>}
              {icAtual === null && <span className="ml-2 text-blue-400">(Sturges automático)</span>}
            </p>
            <p className="text-xs text-blue-600">
              Altere o IC manualmente se desejar. N = {n} indivíduos, Sturges sugere {icSturges} cm.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <input
              type="number"
              min="1"
              placeholder={String(icSturges)}
              value={icInput}
              onChange={e => setIcInput(e.target.value)}
              className="w-20 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              onKeyDown={e => e.key === 'Enter' && handleRecalcular()}
            />
            <span className="text-xs text-blue-500">cm</span>
            <button
              onClick={handleRecalcular}
              className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Recalcular
            </button>
            {icAtual !== null && (
              <button
                onClick={handleResetSturges}
                className="text-xs text-blue-500 hover:text-blue-700 underline"
              >
                Resetar
              </button>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 16, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="classe" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'n' ? `${value} ind.` : `${value.toFixed(2)}%`,
                  name === 'n' ? 'Indivíduos' : '%',
                ]}
                labelFormatter={(_: unknown, payload: Array<{ payload?: { label: string } }>) =>
                  payload[0]?.payload?.label || ''
                }
              />
              <Bar dataKey="n" fill="#00420d" radius={[4, 4, 0, 0]} name="n">
                <LabelList dataKey="n" position="top" style={{ fontSize: 10, fill: '#6b7280' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-xs">
            <thead className="bg-[#00420d] text-white">
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
                        className="h-full bg-[#00420d] rounded-full"
                        style={{ width: `${total > 0 ? (c.n_individuos / total) * 100 : 0}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-[#00420d]/5 font-semibold border-t border-[#00420d]/20">
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
