import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { IndicesDiversidade as IndicesType } from '../../lib/calculations';
import { nbr, ibr } from '../../lib/formato';

interface Props {
  indices: IndicesType;
}

export default function IndicesDiversidade({ indices }: Props) {
  const { shannon_h, simpson_c, pielou_j } = indices;

  const cor = (bom: boolean, medio: boolean) => (bom ? '#16A34A' : medio ? '#d97706' : '#dc2626');
  const itens = [
    {
      label: "Shannon-Weaver (H')",
      valor: shannon_h,
      unidade: 'nats/ind.',
      leitura: shannon_h >= 3.5 ? 'Muito alta' : shannon_h >= 2.5 ? 'Alta' : shannon_h >= 1.5 ? 'Moderada' : 'Baixa',
      cor: cor(shannon_h >= 2.5, shannon_h >= 1.5),
      desc: 'Mede riqueza e equabilidade',
      ref: 'acima de 3,5 = muito alta',
      max: Math.max(shannon_h, 4),
    },
    {
      label: 'Simpson (C)',
      valor: simpson_c,
      unidade: 'de 0 a 1',
      leitura: simpson_c >= 0.9 ? 'Alta diversidade' : simpson_c >= 0.7 ? 'Moderada' : 'Baixa diversidade',
      cor: cor(simpson_c >= 0.7, simpson_c >= 0.5),
      desc: 'Perto de 1 = alta diversidade',
      ref: 'acima de 0,9 = alta',
      max: 1,
    },
    {
      label: 'Equabilidade de Pielou (J)',
      valor: pielou_j,
      unidade: 'de 0 a 1',
      leitura: pielou_j >= 0.8 ? 'Alta' : pielou_j >= 0.6 ? 'Moderada' : 'Baixa',
      cor: cor(pielou_j >= 0.6, pielou_j >= 0.4),
      desc: '1 = espécies igualmente distribuídas',
      ref: '0,8 ou mais = alta uniformidade',
      max: 1,
    },
  ];

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Índices de diversidade florística</CardTitle>
        <p className="text-sm text-gray-400">{ibr(indices.n_individuos)} indivíduos de {ibr(indices.n_especies)} espécies</p>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-3 gap-3">
          {itens.map(it => (
            <div key={it.label} className="rounded-2xl bg-[#f8faf7] border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-gray-600">{it.label}</p>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold text-white whitespace-nowrap" style={{ backgroundColor: it.cor }}>{it.leitura}</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 tabular-nums mt-2">{nbr(it.valor, 4)}</p>
              <p className="text-[11px] text-gray-400">{it.unidade}</p>
              <div className="h-2 bg-gray-200/70 rounded-full overflow-hidden mt-3">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min((it.valor / it.max) * 100, 100)}%`, backgroundColor: it.cor }} />
              </div>
              <p className="text-[11px] text-gray-500 mt-2">{it.desc}</p>
              <p className="text-[11px] text-gray-400">Referência: {it.ref}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
