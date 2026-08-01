import { CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { ScoreAmbisafe } from '../../lib/calculations';

interface Props {
  score: ScoreAmbisafe;
  precisaoRequerida?: number;
  erroRelPct?: number;
}

const SCORE_ITEMS = [
  {
    key: 'regularidade' as const,
    label: 'Regularidade Estatística',
    weight: '30%',
    desc: 'Avalia se o erro de amostragem obtido está dentro do limite de precisão requerido. Verde (Excelente): ≤ metade do limite. Verde (Muito Bom): dentro do limite. Vermelho (Ruim): fora do limite.',
  },
  {
    key: 'diversidade' as const,
    label: 'Diversidade Florística',
    weight: '20%',
    desc: "Baseado no índice de Shannon-Weaver (H'). Florestas com H' ≥ 3,5 indicam altíssima diversidade de espécies — característica de florestas maduras e bem conservadas.",
  },
  {
    key: 'sustentabilidade' as const,
    label: 'Sustentabilidade Ecológica',
    weight: '20%',
    desc: 'Verifica se a distribuição diamétrica segue o padrão "J-invertido" (mais indivíduos nas menores classes). Esse padrão indica floresta com regeneração natural contínua e capacidade de auto-renovação.',
  },
  {
    key: 'conformidade' as const,
    label: 'Conformidade Ambiental',
    weight: '20%',
    desc: 'Avalia a homogeneidade dos dados pelo Coeficiente de Variação (CV%). Inventários com CV ≤ 20% indicam dados bem distribuídos e metodologia adequada — fundamental para laudos técnicos.',
  },
  {
    key: 'consistencia' as const,
    label: 'Consistência dos Dados',
    weight: '10%',
    desc: 'Percentual de registros válidos na planilha importada — árvores com CAP e altura devidamente preenchidos. Registros inválidos são excluídos dos cálculos e reduzem este indicador.',
  },
];

interface Classificacao {
  label: 'Excelente' | 'Muito Bom' | 'Ruim';
  corTexto: string;
  corBarra: string;
  msg: string | null;
}

export default function ScoreCard({ score, precisaoRequerida, erroRelPct }: Props) {
  const total = score.total;
  const isExcelente = total >= 80;
  const isBom = total >= 50; // "Muito Bom" — nunca amarelo, sempre verde (tom mais claro que Excelente)

  const mainColor = isExcelente ? '#16A34A' : isBom ? '#22C55E' : '#dc2626';
  const bgClass = isExcelente || isBom ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  const Icon = isExcelente || isBom ? CheckCircle2 : XCircle;

  const circumference = 2 * Math.PI * 52;
  const offset = circumference * (1 - total / 100);

  const temLimiteRegularidade = precisaoRequerida !== undefined && erroRelPct !== undefined;

  // Classifica cada sub-item em Excelente / Muito Bom / Ruim — nunca existe um estado
  // "amarelo"/intermediário de alerta. Regularidade Estatística é o único sub-item com
  // um "limite" bruto e configurável pelo usuário (precisaoRequerida comparado ao
  // erroRelPct obtido) — para ele, aplicamos a regra de metade do limite / limite cheio.
  // Os demais sub-itens (Diversidade, Sustentabilidade, Conformidade, Consistência) não
  // têm um limite configurável equivalente: chegam prontos como um score 0-100 "quanto
  // maior, melhor" (ex.: Shannon H' não tem teto definido pelo usuário; CV% e % de
  // registros válidos não são campos configuráveis no projeto). Para esses, reaproveitamos
  // os mesmos cortes 80/50 que já definiam a cor antes desta mudança, só substituindo o
  // amarelo por um verde "Muito Bom".
  const classificarSubItem = (key: typeof SCORE_ITEMS[number]['key'], value: number): Classificacao => {
    if (key === 'regularidade' && temLimiteRegularidade) {
      const limite = precisaoRequerida!;
      if (erroRelPct! <= limite / 2) {
        return { label: 'Excelente', corTexto: 'text-green-700', corBarra: 'bg-green-500', msg: 'Inventário com excelente precisão estatística.' };
      }
      if (erroRelPct! <= limite) {
        return { label: 'Muito Bom', corTexto: 'text-green-600', corBarra: 'bg-green-500', msg: 'Inventário dentro do limite aceitável de precisão.' };
      }
      return { label: 'Ruim', corTexto: 'text-red-600', corBarra: 'bg-red-500', msg: 'Erro acima do limite. Recomenda-se amostrar mais parcelas.' };
    }
    if (value >= 80) return { label: 'Excelente', corTexto: 'text-green-700', corBarra: 'bg-green-500', msg: null };
    if (value >= 50) return { label: 'Muito Bom', corTexto: 'text-green-600', corBarra: 'bg-green-500', msg: null };
    return { label: 'Ruim', corTexto: 'text-red-600', corBarra: 'bg-red-500', msg: null };
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="w-5 h-5" style={{ color: mainColor }} />
          Score AMBISAFE
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`rounded-2xl border p-6 ${bgClass} mb-6`}>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Circular progress */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke={mainColor}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">{score.total}</span>
                <span className="text-xs text-gray-500">/ 100</span>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5" style={{ color: mainColor }} />
                <span className="text-xl font-bold" style={{ color: mainColor }}>
                  {score.nivel}
                </span>
              </div>
              <p className="text-gray-600 text-sm">
                {isExcelente
                  ? 'O inventário apresenta excelentes indicadores de qualidade estatística, diversidade e sustentabilidade ecológica.'
                  : isBom
                    ? 'O inventário apresenta bons indicadores, com oportunidades de melhoria em alguns aspectos técnicos.'
                    : 'Recomenda-se revisar os dados e a metodologia de coleta para melhorar a qualidade do inventário.'}
              </p>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-gray-700">Detalhamento dos componentes:</h4>
          {SCORE_ITEMS.map(item => {
            const value = score[item.key];
            const classificacao = classificarSubItem(item.key, value);
            return (
              <div key={item.key} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 font-medium">
                    {item.label}
                    <span className="text-gray-400 ml-1 text-xs font-normal">({item.weight})</span>
                    <span className={`ml-2 text-xs font-semibold ${classificacao.corTexto}`}>
                      — {classificacao.label}
                    </span>
                  </span>
                  <span className="font-bold text-gray-900">{value}/100</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${classificacao.corBarra}`}
                    style={{ width: `${value}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                {classificacao.msg && (
                  <p className={`text-xs font-medium ${classificacao.corTexto}`}>
                    {classificacao.msg}
                  </p>
                )}
                {item.key === 'regularidade' && temLimiteRegularidade && (
                  <p className="text-xs text-gray-500">
                    Erro obtido: <strong>{erroRelPct!.toFixed(2)}%</strong> · Limite: <strong>{precisaoRequerida}%</strong> · Metade do limite: <strong>{(precisaoRequerida! / 2).toFixed(1)}%</strong>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
