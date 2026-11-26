// Recursos carregados só na hora de exportar (fontes, logos e gráficos).
import logoEscuroUrl from '../../../assets/ambisafe-logo-full.png';
import logoClaroUrl from '../../../assets/ambisafe-logo-full2.png';

export interface Imagem {
  dataUrl: string;
  base64: string;
  bytes: Uint8Array;
  largura: number;
  altura: number;
}

function base64ParaBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesParaBase64(bytes: Uint8Array): string {
  let bin = '';
  const passo = 0x8000;
  for (let i = 0; i < bytes.length; i += passo) {
    bin += String.fromCharCode(...bytes.subarray(i, i + passo));
  }
  return btoa(bin);
}

export async function carregarImagem(url: string, maxLado = 1600): Promise<Imagem> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Não foi possível carregar a imagem');
  const blob = await resp.blob();
  const objUrl = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = objUrl;
    });
    const escala = Math.min(1, maxLado / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * escala));
    const h = Math.max(1, Math.round(img.naturalHeight * escala));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    return { dataUrl, base64, bytes: base64ParaBytes(base64), largura: w, altura: h };
  } finally {
    URL.revokeObjectURL(objUrl);
  }
}

export const carregarLogos = async () => {
  const [escuro, claro] = await Promise.all([carregarImagem(logoEscuroUrl), carregarImagem(logoClaroUrl)]);
  return { escuro, claro };
};

// Fonte embutida no PDF (Carlito, licença SIL OFL) — tem ≤, ³, ², acentos etc.
export async function carregarFontesPDF(): Promise<Record<'normal' | 'bold' | 'italic' | 'bolditalic', string>> {
  const nomes = { normal: 'Regular', bold: 'Bold', italic: 'Italic', bolditalic: 'BoldItalic' } as const;
  const entradas = await Promise.all(
    (Object.keys(nomes) as (keyof typeof nomes)[]).map(async estilo => {
      const resp = await fetch(`/fonts/Carlito-${nomes[estilo]}.ttf`);
      if (!resp.ok) throw new Error('Não foi possível carregar a fonte do PDF');
      const bytes = new Uint8Array(await resp.arrayBuffer());
      return [estilo, bytesParaBase64(bytes)] as const;
    })
  );
  return Object.fromEntries(entradas) as Record<keyof typeof nomes, string>;
}

// ---------- Gráficos (desenhados em canvas e usados no PDF e no Word) ----------
export interface DadosGrafico {
  tipo: 'colunas' | 'barras';
  cores?: { forte: string; suave: string };
  rotulos: string[];
  valores: number[];
  eixo: string;
  formato?: (v: number) => string;
}

const CINZA_TEXTO = '#374151';
const CINZA_LINHA = '#E5E7EB';

function passoBonito(max: number): number {
  if (max <= 0) return 1;
  const bruto = max / 5;
  const pot = Math.pow(10, Math.floor(Math.log10(bruto)));
  const n = bruto / pot;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pot;
}

export function desenharGrafico(d: DadosGrafico): Imagem {
  const VERDE = d.cores?.forte ?? '#0B5A1E';
  const VERDE_CLARO = d.cores?.suave ?? '#16A34A';
  const W = 1800;
  const H = d.tipo === 'colunas' ? 860 : Math.max(620, 110 + d.rotulos.length * 74);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);
  const fmt = d.formato ?? ((v: number) => v.toLocaleString('pt-BR'));
  const max = Math.max(...d.valores, 0);
  const passo = passoBonito(max);
  const topo = Math.ceil((max * 1.12) / passo) * passo || passo;
  ctx.font = '30px Carlito, Calibri, Arial, sans-serif';

  if (d.tipo === 'colunas') {
    const esq = 130, dir = 40, cima = 50, baixo = 130;
    const aw = W - esq - dir, ah = H - cima - baixo;
    // grade
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let v = 0; v <= topo + 1e-9; v += passo) {
      const y = cima + ah - (v / topo) * ah;
      ctx.strokeStyle = CINZA_LINHA;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(esq, y); ctx.lineTo(W - dir, y); ctx.stroke();
      ctx.fillStyle = '#6B7280';
      ctx.fillText(v.toLocaleString('pt-BR'), esq - 16, y);
    }
    const n = d.valores.length;
    const slot = aw / n;
    const larg = Math.min(slot * 0.66, 170);
    d.valores.forEach((v, i) => {
      const x = esq + slot * i + (slot - larg) / 2;
      const h = (v / topo) * ah;
      const y = cima + ah - h;
      const grad = ctx.createLinearGradient(0, y, 0, y + h);
      grad.addColorStop(0, VERDE_CLARO);
      grad.addColorStop(1, VERDE);
      ctx.fillStyle = grad;
      const r = Math.min(10, larg / 4, h / 2);
      ctx.beginPath();
      ctx.moveTo(x, y + h); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.lineTo(x + larg - r, y); ctx.quadraticCurveTo(x + larg, y, x + larg, y + r);
      ctx.lineTo(x + larg, y + h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = CINZA_TEXTO;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.font = 'bold 30px Carlito, Calibri, Arial, sans-serif';
      ctx.fillText(fmt(v), x + larg / 2, y - 8);
      ctx.font = '28px Carlito, Calibri, Arial, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText(d.rotulos[i], esq + slot * i + slot / 2, cima + ah + 16);
    });
    ctx.strokeStyle = '#9CA3AF';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(esq, cima + ah); ctx.lineTo(W - dir, cima + ah); ctx.stroke();
    ctx.fillStyle = '#6B7280';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = '28px Carlito, Calibri, Arial, sans-serif';
    ctx.fillText(d.eixo, esq + aw / 2, H - 10);
  } else {
    const esq = 520, dir = 140, cima = 30, baixo = 80;
    const aw = W - esq - dir, ah = H - cima - baixo;
    const n = d.valores.length;
    const slot = ah / n;
    const alt = Math.min(slot * 0.68, 56);
    ctx.textBaseline = 'middle';
    for (let v = 0; v <= topo + 1e-9; v += passo) {
      const x = esq + (v / topo) * aw;
      ctx.strokeStyle = CINZA_LINHA; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, cima); ctx.lineTo(x, cima + ah); ctx.stroke();
      ctx.fillStyle = '#6B7280'; ctx.textAlign = 'center';
      ctx.fillText(v.toLocaleString('pt-BR'), x, cima + ah + 26);
    }
    d.valores.forEach((v, i) => {
      const y = cima + slot * i + (slot - alt) / 2;
      const w = (v / topo) * aw;
      ctx.fillStyle = i < 3 ? VERDE : VERDE_CLARO;
      ctx.fillRect(esq, y, w, alt);
      ctx.fillStyle = CINZA_TEXTO;
      ctx.textAlign = 'right';
      ctx.font = 'italic 30px Carlito, Calibri, Arial, sans-serif';
      let rot = d.rotulos[i];
      while (ctx.measureText(rot).width > esq - 30 && rot.length > 4) rot = rot.slice(0, -2) + '…';
      ctx.fillText(rot, esq - 18, y + alt / 2);
      ctx.textAlign = 'left';
      ctx.font = 'bold 30px Carlito, Calibri, Arial, sans-serif';
      ctx.fillText(fmt(v), esq + w + 12, y + alt / 2);
      ctx.font = '30px Carlito, Calibri, Arial, sans-serif';
    });
    ctx.fillStyle = '#6B7280'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(d.eixo, esq + aw / 2, H - 6);
  }

  const dataUrl = canvas.toDataURL('image/png');
  const base64 = dataUrl.split(',')[1];
  return { dataUrl, base64, bytes: base64ParaBytes(base64), largura: W, altura: H };
}

// Garante que o navegador carregou a Carlito antes de desenhar os gráficos
export async function prepararFonteCanvas() {
  try {
    if (!('fonts' in document)) return;
    const estilos: [string, string][] = [['Regular', 'normal'], ['Bold', 'bold'], ['Italic', 'italic']];
    await Promise.all(estilos.map(async ([arq, est]) => {
      const f = new FontFace('Carlito', `url(/fonts/Carlito-${arq}.ttf)`, {
        weight: est === 'bold' ? '700' : '400',
        style: est === 'italic' ? 'italic' : 'normal',
      });
      await f.load();
      document.fonts.add(f);
    }));
  } catch {
    // sem a fonte, o gráfico usa Calibri/Arial
  }
}
