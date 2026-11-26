import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { Estratificacao } from '../../lib/calculations';
import { nbr, ibr, pbr } from '../../lib/formato';

interface EspecieEstrato {
  nome_comum: string;
  nome_cientifico: string;
  estrato: string;
  n_individuos: number;
  pct_estrato: number;
}

interface Props {
  estratos: Estratificacao[];
  especiesEstratos?: EspecieEstrato[];
}

const COR: Record<string, string> = { Inferior: '#86EFAC', 'Médio': '#16A34A', Superior: '#00420d' };
const cor = (estrato: string, i: number) => COR[estrato] ?? ['#86EFAC', '#16A34A', '#00420d'][i % 3];

export default function EstruturaVertical({ estratos, especiesEstratos = [] }: Props) {
  const total = estratos.reduce((s, e) => s + e.n_individuos, 0);
  const abTotal = estratos.reduce((s, e) => s + e.area_basal_m2, 0);
  const pieData = estratos.filter(e => e.n_individuos > 0).map((e, i) => ({ name: e.estrato, value: e.n_individuos, color: cor(e.estrato, i) }));

  const pivot = new Map<string, { inferior: number; medio: number; superior: number }>();
  for (const r of especiesEstratos) {
    if (!pivot.has(r.nome_comum)) pivot.set(r.nome_comum, { inferior: 0, medio: 0, superior: 0 });
    const p = pivot.get(r.nome_comum)!;
    if (r.estrato === 'Inferior') p.inferior += r.n_individuos;
    else if (r.estrato === 'Médio') p.medio += r.n_individuos;
    else if (r.estrato === 'Superior') p.superior += r.n_individuos;
  }
  const linhas = Array.from(pivot.entries()).map(([nome, c]) => ({ nome, ...c, total: c.inferior + c.medio + c.superior })).sort((a, b) => b.total - a.total);
  const maxLinha = Math.max(...linhas.map(l => l.total), 1);
  const tot = { inf: linhas.reduce((s, r) => s + r.inferior, 0), med: linhas.reduce((s, r) => s + r.medio, 0), sup: linhas.reduce((s, r) => s + r.superior, 0) };
  const totAll = tot.inf + tot.med + tot.sup;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Estrutura vertical (estratificação)</CardTitle>
        <p className="text-sm text-gray-400 mt-0.5">Distribuição dos indivíduos pelos estratos de altura</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-[220px_1fr] gap-5 items-center">
          <div className="relative h-48 md:h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius="58%" outerRadius="92%" paddingAngle={2} stroke="none">
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [`${ibr(v)} ind.`, 'Indivíduos']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{ibr(total)}</p>
              <p className="text-[11px] text-gray-500">indivíduos</p>
            </div>
          </div>
          <div className="space-y-2">
            {estratos.map((e, i) => (
              <div key={e.estrato} className="rounded-2xl border border-gray-100 p-3 flex items-center gap-3">
                <span className="w-3 h-10 rounded-full shrink-0" style={{ backgroundColor: cor(e.estrato, i) }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-semibold text-sm text-gray-900">{e.estrato}</p>
                    <p className="text-base font-bold text-[#00420d] tabular-nums">{pbr(e.pct)}</p>
                  </div>
                  <p className="text-xs text-gray-500">{e.descricao.replace(/(\d)\.(\d)/g, '$1,$2')}</p>
                  <p className="text-xs text-gray-500 tabular-nums">{ibr(e.n_individuos)} ind. · AB {nbr(e.area_basal_m2, 4)} m²</p>
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-500 text-right tabular-nums">Total: {ibr(total)} ind. · AB {nbr(abTotal, 4)} m²</p>
          </div>
        </div>

        {linhas.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Estratos por espécie</h4>
            <div className="flex flex-wrap gap-3 text-[11px] text-gray-500 mb-3">
              {(['Inferior', 'Médio', 'Superior'] as const).map((e, i) => (
                <span key={e} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: cor(e, i) }} />{e}</span>
              ))}
            </div>

            {/* celular: barra empilhada por espécie */}
            <div className="md:hidden space-y-2.5">
              {linhas.map(l => (
                <div key={l.nome}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-800 truncate">{l.nome}</span>
                    <span className="text-gray-500 tabular-nums shrink-0 ml-2">{l.inferior} · {l.medio} · {l.superior} = <b className="text-gray-800">{l.total}</b></span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden flex" style={{ width: `${Math.max((l.total / maxLinha) * 100, 8)}%` }}>
                    <span style={{ width: `${(l.inferior / l.total) * 100}%`, backgroundColor: cor('Inferior', 0) }} />
                    <span style={{ width: `${(l.medio / l.total) * 100}%`, backgroundColor: cor('Médio', 1) }} />
                    <span style={{ width: `${(l.superior / l.total) * 100}%`, backgroundColor: cor('Superior', 2) }} />
                  </div>
                </div>
              ))}
              <div className="rounded-xl bg-[#00420d]/5 p-3 grid grid-cols-4 gap-2 text-xs text-center">
                <div><p className="text-gray-500">Inferior</p><p className="font-bold tabular-nums">{ibr(tot.inf)}</p></div>
                <div><p className="text-gray-500">Médio</p><p className="font-bold tabular-nums">{ibr(tot.med)}</p></div>
                <div><p className="text-gray-500">Superior</p><p className="font-bold tabular-nums">{ibr(tot.sup)}</p></div>
                <div><p className="text-gray-500">Total</p><p className="font-bold tabular-nums">{ibr(totAll)}</p></div>
              </div>
            </div>

            {/* computador: tabela */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-xs">
                <thead className="ui-thead">
                  <tr>
                    <th className="py-2.5 px-4 text-left">Espécie</th>
                    <th className="py-2.5 px-4 text-right">Inferior</th>
                    <th className="py-2.5 px-4 text-right">Médio</th>
                    <th className="py-2.5 px-4 text-right">Superior</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                    <th className="py-2.5 px-4 text-left w-48">Distribuição</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l, i) => (
                    <tr key={l.nome} className={i % 2 ? 'bg-[#f8faf7]' : 'bg-white'}>
                      <td className="py-2 px-4 font-medium">{l.nome}</td>
                      <td className="py-2 px-4 text-right tabular-nums">{l.inferior || '—'}</td>
                      <td className="py-2 px-4 text-right tabular-nums">{l.medio || '—'}</td>
                      <td className="py-2 px-4 text-right tabular-nums">{l.superior || '—'}</td>
                      <td className="py-2 px-4 text-right tabular-nums font-semibold">{l.total}</td>
                      <td className="py-2 px-4">
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden flex">
                          <span style={{ width: `${(l.inferior / l.total) * 100}%`, backgroundColor: cor('Inferior', 0) }} />
                          <span style={{ width: `${(l.medio / l.total) * 100}%`, backgroundColor: cor('Médio', 1) }} />
                          <span style={{ width: `${(l.superior / l.total) * 100}%`, backgroundColor: cor('Superior', 2) }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#e2ecdf] font-semibold">
                    <td className="py-2.5 px-4">Total</td>
                    <td className="py-2.5 px-4 text-right tabular-nums">{ibr(tot.inf)} <span className="font-normal text-gray-500">({pbr(totAll ? (tot.inf / totAll) * 100 : 0)})</span></td>
                    <td className="py-2.5 px-4 text-right tabular-nums">{ibr(tot.med)} <span className="font-normal text-gray-500">({pbr(totAll ? (tot.med / totAll) * 100 : 0)})</span></td>
                    <td className="py-2.5 px-4 text-right tabular-nums">{ibr(tot.sup)} <span className="font-normal text-gray-500">({pbr(totAll ? (tot.sup / totAll) * 100 : 0)})</span></td>
                    <td className="py-2.5 px-4 text-right tabular-nums">{ibr(totAll)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
