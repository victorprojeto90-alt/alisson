// Números no formato brasileiro (vírgula decimal, ponto de milhar)
export const nbr = (v: number | null | undefined, dec = 2) =>
  Number.isFinite(v as number)
    ? (v as number).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
    : '—';
export const pbr = (v: number | null | undefined, dec = 2) => (Number.isFinite(v as number) ? `${nbr(v, dec)}%` : '—');
export const ibr = (v: number | null | undefined) => (Number.isFinite(v as number) ? Math.round(v as number).toLocaleString('pt-BR') : '—');
