import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { PontoCurvaColetor } from '../../lib/calculations';

interface Props {
  pontos: PontoCurvaColetor[];
  totalParcelas: number;
}

export default function CurvaColetor({ pontos, totalParcelas }: Props) {
  if (!pontos || pontos.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-8 text-center text-gray-400 text-sm">
          Dados insuficientes para gerar a curva do coletor.
        </CardContent>
      </Card>
    );
  }

  // Ponto de estabilização: primeira parcela (após a 3ª) em que o número de espécies
  // novas cai abaixo de 10% da média de espécies novas por parcela — heurística simples
  // para sinalizar quando a amostragem parou de agregar diversidade nova relevante.
  const mediaEspeciesNovas = pontos.reduce((s, p) => s + p.especies_novas, 0) / pontos.length;
  const pontoEstabilizacao = pontos.find(
    p => p.parcela > 3 && p.especies_novas < mediaEspeciesNovas * 0.1
  );

  const ultimoPonto = pontos[pontos.length - 1];
  const totalEspecies = ultimoPonto?.especies_acumuladas ?? 0;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Curva do Coletor de Espécies por Parcela</CardTitle>
        <p className="text-sm text-gray-400">Acumulação de espécies ao longo das parcelas amostradas</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cards de resumo */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{totalEspecies}</p>
            <p className="text-xs text-green-600">Espécies totais</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{totalParcelas}</p>
            <p className="text-xs text-green-600">Parcelas amostradas</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-700">
              {pontoEstabilizacao ? pontoEstabilizacao.parcela : '—'}
            </p>
            <p className="text-xs text-green-600">Parcela de estabilização</p>
          </div>
        </div>

        {/* Gráfico */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={pontos} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="parcela"
                label={{ value: 'Número de parcelas', position: 'insideBottom', offset: -4, fontSize: 12, fill: '#666' }}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                label={{ value: 'Espécies acumuladas', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#666' }}
                tick={{ fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip
                formatter={(value: number) => [value, 'Espécies acumuladas']}
                labelFormatter={(label) => `Parcela ${label}`}
              />
              {pontoEstabilizacao && (
                <ReferenceLine
                  x={pontoEstabilizacao.parcela}
                  stroke="#acd115"
                  strokeDasharray="4 4"
                  label={{ value: 'Estabilização', fontSize: 11, fill: '#acd115' }}
                />
              )}
              <Line
                type="monotone"
                dataKey="especies_acumuladas"
                stroke="#00420d"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#00420d' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela de dados */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-700">Dados da curva por parcela</p>
          </div>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-500">Parcela</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-500">Espécies novas</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-500">Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pontos.map(ponto => (
                  <tr
                    key={ponto.parcela}
                    className={pontoEstabilizacao?.parcela === ponto.parcela ? 'bg-yellow-50' : 'hover:bg-gray-50'}
                  >
                    <td className="px-4 py-2 text-gray-700">
                      Parcela {ponto.numero_parcela}
                      {pontoEstabilizacao?.parcela === ponto.parcela && (
                        <span className="ml-2 text-xs text-yellow-600 font-medium">← estabilização</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-600">+{ponto.especies_novas}</td>
                    <td className="px-4 py-2 text-right font-medium text-green-700">{ponto.especies_acumuladas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Interpretação */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-sm font-medium text-blue-800 mb-1">📊 Interpretação</p>
          <p className="text-sm text-blue-700">
            {pontoEstabilizacao
              ? `A curva atingiu estabilização a partir da parcela ${pontoEstabilizacao.parcela}, indicando que a amostragem foi suficiente para representar a diversidade da área.`
              : 'A curva ainda não atingiu estabilização clara, sugerindo que a amostragem pode ser ampliada para maior representatividade.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
