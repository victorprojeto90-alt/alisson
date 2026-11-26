// Opções usadas na criação e na edição do inventário (mesmos rótulos nas duas telas)
import { FileCheck2, Sprout, Axe, GraduationCap, Shuffle, ListChecks, type LucideIcon } from 'lucide-react';

export const BIOMAS = [
  { value: 'amazonia', label: 'Amazônia' },
  { value: 'cerrado', label: 'Cerrado' },
  { value: 'mata_atlantica', label: 'Mata Atlântica' },
  { value: 'caatinga', label: 'Caatinga' },
  { value: 'pampa', label: 'Pampa' },
  { value: 'pantanal', label: 'Pantanal' },
];

export const ESTADOS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT',
  'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
];

export const TIPOS_INVENTARIO: { value: string; label: string; desc: string; icon: LucideIcon }[] = [
  { value: 'casual_simples', label: 'Amostragem casual simples', desc: 'Parcelas sorteadas na área; os resultados são estimados para a área toda', icon: Shuffle },
  { value: 'censo', label: 'Inventário 100% (censo)', desc: 'Todas as árvores da área são medidas', icon: ListChecks },
];

export const FINALIDADES: { value: string; label: string; desc: string; icon: LucideIcon }[] = [
  { value: 'licenciamento', label: 'Licenciamento ambiental', desc: 'Instruir processo de licença no órgão ambiental', icon: FileCheck2 },
  { value: 'supressao', label: 'Supressão de vegetação', desc: 'Autorização de supressão e compensação', icon: Axe },
  { value: 'manejo', label: 'Plano de manejo', desc: 'Manejo florestal sustentável (PMFS)', icon: Sprout },
  { value: 'academico', label: 'Estudo acadêmico', desc: 'Pesquisa, TCC, dissertação ou monitoramento', icon: GraduationCap },
];

export const PARCELAS_SUGERIDAS = [100, 200, 400, 600, 1000];
export const PRECISOES = ['5', '10', '15', '20'];
export const CONFIANCAS = [
  { value: '90', label: '90% (recomendado)' },
  { value: '95', label: '95%' },
  { value: '99', label: '99%' },
];

export const rotuloBioma = (v?: string | null) => BIOMAS.find(b => b.value === v)?.label ?? '';
export const rotuloFinalidade = (v?: string | null) => FINALIDADES.find(f => f.value === v)?.label ?? '';
export const rotuloTipo = (v?: string | null) => TIPOS_INVENTARIO.find(t => t.value === v)?.label ?? '';
