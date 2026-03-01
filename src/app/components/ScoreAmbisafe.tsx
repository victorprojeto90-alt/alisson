import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface ScoreAmbisafeProps {
  score: number;
  breakdown?: {
    regularidade: number;
    diversidade: number;
    sustentabilidade: number;
    conformidade: number;
    consistencia: number;
  };
}

export default function ScoreAmbisafe({ score, breakdown }: ScoreAmbisafeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-green-500', text: 'text-green-700', icon: CheckCircle2 };
    if (score >= 50) return { bg: 'bg-yellow-500', text: 'text-yellow-700', icon: AlertTriangle };
    return { bg: 'bg-red-500', text: 'text-red-700', icon: XCircle };
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 50) return 'Bom';
    return 'Necessita Atenção';
  };

  const scoreInfo = getScoreColor(score);
  const Icon = scoreInfo.icon;

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={`w-6 h-6 ${scoreInfo.text}`} />
          Score AMBISAFE
        </CardTitle>
        <CardDescription>
          Índice de qualidade e sustentabilidade do inventário
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6 mb-6">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - score / 100)}`}
                className={scoreInfo.text.replace('text-', 'text-')}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{score}</span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
          </div>
          
          <div className="flex-1">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${scoreInfo.bg} bg-opacity-20 mb-2`}>
              <div className={`w-3 h-3 rounded-full ${scoreInfo.bg}`}></div>
              <span className={`font-semibold ${scoreInfo.text}`}>
                {getScoreLabel(score)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {score >= 80 && 'Seu inventário apresenta excelentes indicadores de qualidade e sustentabilidade.'}
              {score >= 50 && score < 80 && 'Há oportunidades de melhoria nos indicadores do seu inventário.'}
              {score < 50 && 'É recomendado revisar os dados e práticas de manejo.'}
            </p>
          </div>
        </div>

        {breakdown && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Detalhamento do Score:</h4>
            {[
              { label: 'Regularidade Estatística', value: breakdown.regularidade, weight: '30%' },
              { label: 'Diversidade', value: breakdown.diversidade, weight: '20%' },
              { label: 'Sustentabilidade', value: breakdown.sustentabilidade, weight: '20%' },
              { label: 'Conformidade Ambiental', value: breakdown.conformidade, weight: '20%' },
              { label: 'Consistência de Dados', value: breakdown.consistencia, weight: '10%' },
            ].map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.label} <span className="text-xs">({item.weight})</span>
                  </span>
                  <span className="font-semibold">{item.value}/100</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getScoreColor(item.value).bg} transition-all duration-500`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
