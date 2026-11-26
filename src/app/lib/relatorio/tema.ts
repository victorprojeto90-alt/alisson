// Tema visual do relatório: marca do cliente (logo, cores, nome) ou AMBISAFE por padrão.
import { supabase } from '../supabase';
import { carregarImagem, carregarLogos, type Imagem } from './recursos';

export interface MarcaEmpresa {
  ativa: boolean;
  nome?: string | null;
  logoPath?: string | null;
  corPrimaria?: string | null;
  corSecundaria?: string | null;
  contato?: string | null;
}

export interface Tema {
  proprio: boolean;          // true = marca do cliente
  nome: string;              // nome exibido (cabeçalho, Excel)
  contato: string;           // linha de contato no rodapé
  primaria: string;          // hex sem '#': faixa da capa e cabeçalho das tabelas
  escura: string;            // títulos
  media: string;             // subtítulos e barras
  suave: string;             // barras secundárias do gráfico
  destaque: string;          // filetes de destaque
  zebra: string;             // linhas alternadas
  grupo: string;             // linhas de grupo/total
  linha: string;             // bordas
  sobrePrimaria: string;     // cor do texto em cima da cor primária
  logoCabecalho: Imagem | null;  // logo em fundo branco
  logoCapa: Imagem | null;       // logo para a capa
  logoCapaNoBranco: boolean;     // logo do cliente vai num fundo branco na capa
}

export const CORES_PADRAO = { primaria: '#00420D', secundaria: '#ACD115' };

const limpo = (hex: string) => hex.replace('#', '').toUpperCase();
const rgb = (hex: string) => {
  const h = limpo(hex);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
const paraHex = (c: number[]) => c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
export const misturar = (hex: string, com: string, p: number) => {
  const a = rgb(hex), b = rgb(com);
  return paraHex(a.map((v, i) => v + (b[i] - v) * p));
};
export const luminancia = (hex: string) => {
  const [r, g, b] = rgb(hex).map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const hexValido = (v?: string | null) => !!v && /^#[0-9A-Fa-f]{6}$/.test(v);

export function urlLogoMarca(path?: string | null) {
  if (!path) return null;
  return supabase.storage.from('marcas').getPublicUrl(path).data.publicUrl;
}

export function temaCores(primariaHex: string, secundariaHex?: string | null) {
  const p = limpo(primariaHex);
  const l = luminancia(p);
  const escura = l > 0.3 ? misturar(p, '000000', 0.45) : p;
  const media = l > 0.3 ? misturar(p, '000000', 0.25) : misturar(p, 'FFFFFF', 0.12);
  return {
    primaria: p,
    escura,
    media,
    suave: misturar(p, 'FFFFFF', 0.35),
    destaque: secundariaHex && hexValido(secundariaHex) ? limpo(secundariaHex) : misturar(p, 'FFFFFF', 0.45),
    zebra: misturar(p, 'FFFFFF', 0.95),
    grupo: misturar(p, 'FFFFFF', 0.87),
    linha: misturar(p, 'FFFFFF', 0.78),
    sobrePrimaria: l > 0.5 ? '1F2937' : 'FFFFFF',
  };
}

export async function carregarTema(marca?: MarcaEmpresa | null, empresaNome?: string | null): Promise<Tema> {
  const usarMarca = !!marca?.ativa;
  if (!usarMarca) {
    const logos = await carregarLogos();
    return {
      proprio: false,
      nome: 'AMBISAFE',
      contato: '',
      ...temaCores(CORES_PADRAO.primaria, CORES_PADRAO.secundaria),
      media: '0B5A1E',
      suave: '16A34A',
      logoCabecalho: logos.escuro,
      logoCapa: logos.claro,
      logoCapaNoBranco: false,
    };
  }
  let logo: Imagem | null = null;
  const url = urlLogoMarca(marca!.logoPath);
  if (url) {
    try { logo = await carregarImagem(url); } catch { logo = null; }
  }
  const cores = temaCores(hexValido(marca!.corPrimaria) ? marca!.corPrimaria! : CORES_PADRAO.primaria, marca!.corSecundaria);
  return {
    proprio: true,
    nome: marca!.nome?.trim() || empresaNome?.trim() || 'Relatório técnico',
    contato: marca!.contato?.trim() || '',
    ...cores,
    logoCabecalho: logo,
    logoCapa: logo,
    logoCapaNoBranco: true,
  };
}
