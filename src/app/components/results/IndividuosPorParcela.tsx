import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { IndividuoCalculado } from '../../lib/calculations';
import { fmt } from '../../lib/calculations';

interface Props {
  individuos: IndividuoCalculado[];
}

const PAGE_SIZE = 50;

export default function IndividuosPorParcela({ individuos }: Props) {
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return individuos;
    return individuos.filter(ind =>
      ind.nome_comum?.toLowerCase().includes(termo) ||
      ind.nome_cientifico?.toLowerCase().includes(termo) ||
      String(ind.parcela_numero).includes(termo)
    );
  }, [individuos, busca]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * PAGE_SIZE;
  const itensPagina = filtrados.slice(inicio, inicio + PAGE_SIZE);

  const handleBusca = (v: string) => {
    setBusca(v);
    setPagina(1);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base">Lista de Indivíduos por Parcela</CardTitle>
            <p className="text-sm text-gray-400">
              {filtrados.length.toLocaleString('pt-BR')} de {individuos.length.toLocaleString('pt-BR')} indivíduos
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              placeholder="Buscar por espécie ou parcela..."
              value={busca}
              onChange={e => handleBusca(e.target.value)}
              className="pl-9 text-sm h-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-xs">
            <thead className="bg-[#0B3D2E] text-white sticky top-0 z-10">
              <tr>
                {['Parcela', 'Nome Comum', 'Nome Científico', 'Altura (m)', 'CAP (cm)', 'DAP (cm)', 'Área Basal (m²)', 'Vol. Cilíndrico (m³)', 'Vol. c/ Fator de Forma (m³)'].map(c => (
                  <th key={c} className="py-2.5 px-3 text-left text-xs font-semibold whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {itensPagina.map((ind, i) => (
                <tr key={`${ind.parcela_numero}-${ind.nome_comum}-${inicio + i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-2 px-3 font-mono">{ind.parcela_numero}</td>
                  <td className="py-2 px-3 font-medium text-gray-900 whitespace-nowrap">{ind.nome_comum}</td>
                  <td className="py-2 px-3 italic text-gray-500 whitespace-nowrap">{ind.nome_cientifico || '—'}</td>
                  <td className="py-2 px-3 font-mono text-right">{ind.altura_total_m != null ? fmt.num(ind.altura_total_m, 2) : '—'}</td>
                  <td className="py-2 px-3 font-mono text-right">{fmt.num(ind.cap_cm, 2)}</td>
                  <td className="py-2 px-3 font-mono text-right">{fmt.num(ind.dap_cm, 2)}</td>
                  <td className="py-2 px-3 font-mono text-right">{fmt.num(ind.area_basal_m2, 4)}</td>
                  <td className="py-2 px-3 font-mono text-right">{fmt.num(ind.volume_cilindrico_m3, 4)}</td>
                  <td className="py-2 px-3 font-mono text-right">{fmt.num(ind.volume_ff_m3, 4)}</td>
                </tr>
              ))}
              {itensPagina.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400">Nenhum indivíduo encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t bg-gray-50">
          <p className="text-xs text-gray-400">
            <strong>Vol. Cilíndrico</strong> = volume do cilindro (área basal × altura), sem correção &nbsp;·&nbsp;
            <strong>Vol. c/ Fator de Forma</strong> = volume cilíndrico corrigido pelo fator de forma do inventário
          </p>
        </div>

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-gray-500">
            <span>Página {paginaAtual} de {totalPaginas}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
