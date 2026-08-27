export interface Plano {
  id: string;
  nome: string;
  preco: number;
  precoFormatado: string;
  periodo: string;
  cicloAsaas: 'MONTHLY';
  fidelidade: number | null;
  desconto: number | null;
  totalPeriodo?: number;
  economia?: number;
  destaque: boolean;
  beneficios: string[];
}

export const PLANOS: Plano[] = [
  {
    id: 'mensal',
    nome: 'Mensal',
    preco: 299.90,
    precoFormatado: 'R$ 299,90',
    periodo: 'mês',
    cicloAsaas: 'MONTHLY',
    fidelidade: null,
    desconto: null,
    destaque: false,
    beneficios: [
      'Projetos ilimitados',
      'Cálculos ilimitados',
      'Amostragem Casual Simples e Censo',
      'Estrutura horizontal, vertical e diamétrica',
      'Pré-relatório com IA',
      'Exportação PDF e Word',
      'Banco de espécies por bioma',
      'Suporte por WhatsApp',
    ],
  },
  {
    id: 'trimestral',
    nome: 'Trimestral',
    preco: 269.90,
    precoFormatado: 'R$ 269,90',
    periodo: 'mês',
    cicloAsaas: 'MONTHLY',
    fidelidade: 3,
    desconto: 10,
    totalPeriodo: 809.70,
    economia: 90.00,
    destaque: false,
    beneficios: [
      'Tudo do plano Mensal',
      'Fidelidade de 3 meses',
      '10% de desconto',
      'Economia de R$ 90 no período',
    ],
  },
  {
    id: 'semestral',
    nome: 'Semestral',
    preco: 249.90,
    precoFormatado: 'R$ 249,90',
    periodo: 'mês',
    cicloAsaas: 'MONTHLY',
    fidelidade: 6,
    desconto: 17,
    totalPeriodo: 1499.40,
    economia: 300.00,
    destaque: true, // badge "Mais Popular"
    beneficios: [
      'Tudo do plano Mensal',
      'Fidelidade de 6 meses',
      '17% de desconto',
      'Economia de R$ 300 no período',
    ],
  },
  {
    id: 'anual',
    nome: 'Anual',
    preco: 229.90,
    precoFormatado: 'R$ 229,90',
    periodo: 'mês',
    cicloAsaas: 'MONTHLY',
    fidelidade: 12,
    desconto: 23,
    totalPeriodo: 2758.80,
    economia: 840.00,
    destaque: false,
    beneficios: [
      'Tudo do plano Mensal',
      'Fidelidade de 12 meses',
      '23% de desconto',
      'Economia de R$ 840 no período',
      'Prioridade no suporte',
    ],
  },
];
