import type React from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../ui/utils';

// ─── Padrão visual AMBISAFE ──────────────────────────────────────────────────
// Toda tela interna começa com este cabeçalho verde. Ações principais ficam
// dentro dele (nunca botões soltos ou flutuantes) e números/filtros ficam na
// faixa de baixo (HeaderStats).

interface PageHeaderProps {
  title: ReactNode;
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  onBack?: () => void;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function PageHeader({ title, eyebrow, subtitle, badge, onBack, actions, children, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#00420d] via-[#0B5A1E] to-[#16A34A] text-white p-5 md:p-8 mb-5 md:mb-6 shadow-lg',
        className
      )}
    >
      <div className="absolute -top-12 -right-12 w-44 h-44 md:w-72 md:h-72 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute -bottom-20 right-40 w-56 h-56 rounded-full bg-[#acd115]/10 pointer-events-none hidden md:block" />

      <div className="relative md:flex md:items-start md:justify-between md:gap-6">
        <div className="min-w-0">
          {(onBack || eyebrow) && (
            <div className="flex items-center gap-2 mb-1.5">
              {onBack && (
                <button
                  onClick={onBack}
                  aria-label="Voltar"
                  className="w-8 h-8 -ml-1 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 active:bg-white/25 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              {eyebrow && <span className="text-white/70 text-sm truncate">{eyebrow}</span>}
            </div>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold leading-tight break-words">{title}</h1>
            {badge}
          </div>
          {subtitle && <div className="text-white/75 text-sm mt-1.5">{subtitle}</div>}
        </div>
        {actions && (
          <div className="relative flex flex-wrap md:flex-nowrap gap-2 md:gap-3 mt-4 md:mt-0 flex-shrink-0">{actions}</div>
        )}
      </div>

      {children && <div className="relative mt-5 md:mt-7">{children}</div>}
    </div>
  );
}

// Botão principal (branco) e secundário (contorno) para usar em `actions`
export function HeaderButton({
  children, onClick, variant = 'primary', disabled, className,
}: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'outline'; disabled?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-11 md:h-12 px-5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:pointer-events-none active:scale-[0.98]',
        variant === 'primary'
          ? 'bg-white text-[#00420d] shadow-md hover:shadow-lg hover:-translate-y-0.5'
          : 'border border-white/30 text-white hover:bg-white/10',
        className
      )}
    >
      {children}
    </button>
  );
}

export interface HeaderStatItem {
  label: string;
  value: ReactNode;
  active?: boolean;
  onClick?: () => void;
}

// Faixa de números dentro do cabeçalho. Com onClick vira filtro (item ativo fica branco).
export function HeaderStats({ items, className, colunasCelular }: { items: HeaderStatItem[]; className?: string; colunasCelular?: number }) {
  return (
    <div
      className={cn('grid gap-2 md:max-w-3xl grid-cols-[repeat(var(--hs-m),minmax(0,1fr))] md:grid-cols-[repeat(var(--hs),minmax(0,1fr))]', className)}
      style={{ '--hs': items.length, '--hs-m': colunasCelular ?? items.length } as React.CSSProperties}
    >
      {items.map(item => {
        const Tag = item.onClick ? 'button' : 'div';
        return (
          <Tag
            key={item.label}
            onClick={item.onClick}
            className={cn(
              'rounded-2xl py-2.5 md:py-3 px-1 text-center transition-all min-w-0',
              item.active ? 'bg-white text-[#00420d] shadow-md' : 'bg-white/10 text-white',
              item.onClick && !item.active && 'hover:bg-white/15'
            )}
          >
            <p className="text-lg md:text-2xl font-bold leading-none truncate">{item.value}</p>
            <p className={cn('text-[10px] sm:text-[11px] md:text-xs mt-1 leading-tight truncate', item.active ? 'text-[#00420d]/80 font-semibold' : 'text-white/75')}>
              {item.label}
            </p>
          </Tag>
        );
      })}
    </div>
  );
}

// Etiqueta dentro do cabeçalho (ex.: status do projeto)
export function HeaderBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#acd115] text-[#00420d] whitespace-nowrap">
      {children}
    </span>
  );
}
