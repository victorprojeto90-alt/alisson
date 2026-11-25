import { cn } from './utils';

// Blocos cinza de "carregando" (skeleton) usados no lugar de spinners de página.
export function Bone({ className }: { className?: string }) {
  return <div className={cn('bg-gray-200/80 animate-pulse rounded-md', className)} />;
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white">
          <Bone className="w-11 h-11 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-2/3" />
            <Bone className="h-3 w-1/3" />
          </div>
          <Bone className="h-6 w-16 rounded-full hidden sm:block" />
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-2xl border border-gray-100 bg-white space-y-3">
          <Bone className="w-9 h-9 rounded-lg" />
          <Bone className="h-6 w-1/2" />
          <Bone className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6" aria-busy="true" aria-label="Carregando">
      <div className="space-y-2">
        <Bone className="h-7 w-56" />
        <Bone className="h-4 w-72 max-w-full" />
      </div>
      <StatsSkeleton count={4} />
      <ListSkeleton rows={4} />
    </div>
  );
}

export function TableRowsSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-gray-50">
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="px-4 py-3">
              <Bone className={cn('h-4', c === 0 ? 'w-3/4' : 'w-1/2')} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
