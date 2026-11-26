// Blocos visuais das páginas admin, no mesmo padrão do app (cartões, títulos, etiquetas).
import type { ReactNode } from 'react';
import { cn } from '../../components/ui/utils';

export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const dataBR = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—');

export function Secao({ titulo, contagem, descricao, icone, acoes, children, className, semPadding }: {
  titulo: string;
  contagem?: number;
  descricao?: string;
  icone?: ReactNode;
  acoes?: ReactNode;
  children: ReactNode;
  className?: string;
  semPadding?: boolean;
}) {
  return (
    <section className={cn('rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden', className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 px-4 md:px-6 pt-4 md:pt-5 pb-3">
        <div className="flex items-start gap-3 min-w-0">
          {icone && <div className="w-9 h-9 rounded-xl bg-[#00420d]/10 text-[#00420d] flex items-center justify-center shrink-0">{icone}</div>}
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900 text-[15px] flex items-center gap-2">
              {titulo}
              {contagem !== undefined && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#f4f8f3] text-[#0B5A1E]">{contagem}</span>}
            </h2>
            {descricao && <p className="text-xs text-gray-500 mt-0.5">{descricao}</p>}
          </div>
        </div>
        {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
      </header>
      <div className={semPadding ? '' : 'px-4 md:px-6 pb-4 md:pb-6'}>{children}</div>
    </section>
  );
}

const TONS = {
  verde: 'bg-green-50 text-green-700 border-green-200',
  amarelo: 'bg-amber-50 text-amber-700 border-amber-200',
  vermelho: 'bg-red-50 text-red-700 border-red-200',
  azul: 'bg-blue-50 text-blue-700 border-blue-200',
  cinza: 'bg-gray-100 text-gray-600 border-gray-200',
  lima: 'bg-[#acd115]/20 text-[#00420d] border-[#acd115]/40',
} as const;

export function Etiqueta({ tom, children, icone }: { tom: keyof typeof TONS; children: ReactNode; icone?: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap', TONS[tom])}>
      {icone}{children}
    </span>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="text-sm text-gray-400 text-center py-8">{children}</p>;
}

// Indicador secundário (abaixo do cabeçalho)
export function Indicador({ rotulo, valor, detalhe, icone, tom = 'verde' }: { rotulo: string; valor: ReactNode; detalhe?: string; icone: ReactNode; tom?: 'verde' | 'azul' | 'amarelo' | 'vermelho' }) {
  const cores = {
    verde: 'bg-green-50 text-green-700',
    azul: 'bg-blue-50 text-blue-700',
    amarelo: 'bg-amber-50 text-amber-700',
    vermelho: 'bg-red-50 text-red-700',
  }[tom];
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-3 md:p-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
      <div className={cn('w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0', cores)}>{icone}</div>
      <div className="min-w-0">
        <p className="text-base md:text-xl font-bold text-gray-900 leading-tight whitespace-nowrap">{valor}</p>
        <p className="text-[11px] md:text-xs text-gray-500 leading-snug">{rotulo}{detalhe ? <span className="text-gray-400"> · {detalhe}</span> : null}</p>
      </div>
    </div>
  );
}
