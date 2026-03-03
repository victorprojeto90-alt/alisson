import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle2, Circle, ChevronRight, X, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';

interface Projeto {
  status: string;
}

interface Props {
  projetos: Projeto[];
}

const STORAGE_KEY = 'ambisafe_onboarding_dismissed';

export default function OnboardingCard({ projetos }: Props) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true'
  );

  if (dismissed) return null;

  const temProjeto = projetos.length > 0;
  const temUpload = projetos.some(p => p.status !== 'rascunho' || projetos.length > 0);
  const temProcessado = projetos.some(p => p.status === 'processado' || p.status === 'finalizado');
  const temFinalizado = projetos.some(p => p.status === 'finalizado');

  const steps = [
    { label: 'Conta criada com sucesso', done: true },
    { label: 'Criar seu primeiro inventário', done: temProjeto, action: () => navigate('/app/projetos/novo') },
    { label: 'Importar dados de campo (CSV ou XLSX)', done: temUpload && temProjeto },
    { label: 'Processar inventário e exportar relatório', done: temProcessado || temFinalizado },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setDismissed(true);
  };

  return (
    <div className="bg-gradient-to-r from-[#0B3D2E] to-[#16A34A] rounded-2xl p-6 mb-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        title="Ocultar"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-[#10B981]" />
          <span className="text-[#10B981] text-xs font-semibold uppercase tracking-wider">
            Primeiros passos
          </span>
        </div>
        <h3 className="text-white font-bold text-lg mb-4">
          Configure seu ambiente — {completedCount}/{steps.length} concluídos
        </h3>

        {/* Progress bar */}
        <div className="w-full bg-white/20 rounded-full h-1.5 mb-5">
          <div
            className="bg-[#10B981] h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-2.5 mb-5">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              {step.done
                ? <CheckCircle2 className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                : <Circle className="w-5 h-5 text-white/30 flex-shrink-0" />
              }
              <span className={`text-sm ${step.done ? 'text-white/70 line-through' : 'text-white'}`}>
                {step.label}
              </span>
              {!step.done && step.action && (
                <button
                  onClick={step.action}
                  className="ml-auto text-[#10B981] hover:text-white transition-colors flex-shrink-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {!temProjeto && (
            <Button
              onClick={() => navigate('/app/projetos/novo')}
              className="bg-white text-[#0B3D2E] hover:bg-white/90 text-sm gap-1.5 h-9"
            >
              Criar primeiro inventário
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          )}
          <button
            onClick={handleDismiss}
            className="text-white/50 hover:text-white text-sm transition-colors"
          >
            Ocultar
          </button>
        </div>
      </div>
    </div>
  );
}
