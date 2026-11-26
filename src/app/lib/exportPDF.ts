import jsPDF from 'jspdf';
import autoTable, { type RowInput, type CellDef } from 'jspdf-autotable';
import type { ResultadoInventario } from './calculations';
import type { ProjetoParaRelatorio } from './reportText';
import { montarModelo, type Bloco, type ContextoEmissao } from './relatorio/modelo';
import { carregarFontesPDF, carregarLogos, desenharGrafico, prepararFonteCanvas } from './relatorio/recursos';

type RGB = [number, number, number];
const VERDE: RGB = [0, 66, 13];
const VERDE_MEDIO: RGB = [11, 90, 30];
const LIMA: RGB = [172, 209, 21];
const TEXTO: RGB = [33, 37, 41];
const CINZA: RGB = [107, 114, 128];
const LINHA: RGB = [214, 222, 211];
const ZEBRA: RGB = [244, 248, 243];
const GRUPO: RGB = [226, 236, 223];
const F = 'Carlito';

export async function exportarPDF(
  nomeArquivo: string,
  projeto: ProjetoParaRelatorio & { nome: string },
  resultado: ResultadoInventario,
  ctx: ContextoEmissao = {}
) {
  const [fontes, logos] = await Promise.all([carregarFontesPDF(), carregarLogos(), prepararFonteCanvas()]);
  const modelo = montarModelo(projeto, resultado, ctx);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  (['normal', 'bold', 'italic', 'bolditalic'] as const).forEach(est => {
    doc.addFileToVFS(`Carlito-${est}.ttf`, fontes[est]);
    doc.addFont(`Carlito-${est}.ttf`, F, est);
  });
  doc.setFont(F, 'normal');

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  // Margens ABNT NBR 14724: 3 cm (sup./esq.) e 2 cm (inf./dir.)
  const ML = 30, MR = 20, MT = 30, MB = 22;
  const CW = W - ML - MR;
  const LIM = H - MB;
  const LH = 6.1; // entrelinha do corpo (≈1,5 para 12 pt)

  const sumario: { texto: string; nivel: number; pagina: number }[] = [];
  let y = MT;

  const cor = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
  const novaPagina = () => { doc.addPage(); y = MT; };
  const garantir = (alt: number) => { if (y + alt > LIM) novaPagina(); };
  const paginaAtual = () => doc.getNumberOfPages();

  // ================= CAPA =================
  doc.setFillColor(...VERDE);
  doc.rect(0, 0, W, 112, 'F');
  doc.setFillColor(...VERDE_MEDIO);
  doc.circle(W - 18, 18, 46, 'F');
  doc.setFillColor(...VERDE);
  doc.circle(W - 18, 18, 30, 'F');
  doc.setFillColor(...LIMA);
  doc.rect(0, 112, W, 2.2, 'F');
  const logoW = 78;
  doc.addImage(logos.claro.dataUrl, 'PNG', ML, 30, logoW, (logoW * logos.claro.altura) / logos.claro.largura);
  doc.setFont(F, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('RELATÓRIO TÉCNICO DE', ML, 78);
  doc.setFontSize(20);
  doc.text('INVENTÁRIO FLORESTAL', ML, 88);
  doc.setFont(F, 'normal');
  doc.setFontSize(10);
  cor(LIMA);
  doc.text(modelo.capa.finalidade, ML, 97);

  y = 140;
  cor(CINZA);
  doc.setFontSize(10);
  doc.text('PROJETO', ML, y);
  y += 9;
  doc.setFont(F, 'bold');
  doc.setFontSize(24);
  cor(TEXTO);
  const tituloLinhas = doc.splitTextToSize(modelo.capa.projeto, CW);
  doc.text(tituloLinhas, ML, y);
  y += tituloLinhas.length * 9.5;
  doc.setFont(F, 'normal');
  doc.setFontSize(12);
  cor(CINZA);
  doc.text(`${modelo.capa.local}  ·  Bioma ${modelo.capa.bioma}  ·  ${modelo.capa.area}`, ML, y);

  // quadro de informações
  y += 14;
  const info: [string, string][] = [
    ['Responsável técnico', modelo.capa.responsavel],
    ['Empresa', modelo.capa.empresa],
    ['Data do inventário', modelo.capa.dataInventario],
    ['Emissão do relatório', modelo.capa.emissao],
  ];
  const boxH = 12 + info.length * 11;
  doc.setFillColor(...ZEBRA);
  doc.setDrawColor(...LINHA);
  doc.roundedRect(ML, y, CW, boxH, 3, 3, 'FD');
  doc.setFillColor(...VERDE_MEDIO);
  doc.rect(ML, y + 3, 1.6, boxH - 6, 'F');
  let yi = y + 12;
  for (const [k, v] of info) {
    doc.setFontSize(9);
    cor(CINZA);
    doc.text(k.toUpperCase(), ML + 8, yi);
    doc.setFontSize(12);
    doc.setFont(F, 'bold');
    cor(TEXTO);
    doc.text(doc.splitTextToSize(v, CW - 70)[0], ML + 62, yi);
    doc.setFont(F, 'normal');
    yi += 11;
  }

  doc.setFontSize(11);
  cor(TEXTO);
  doc.text(modelo.capa.cidadeData, W / 2, H - 28, { align: 'center' });
  doc.setFontSize(8.5);
  cor(CINZA);
  doc.text('Documento gerado pela plataforma AMBISAFE', W / 2, H - 21, { align: 'center' });

  // ================= SUMÁRIO (preenchido no final) =================
  novaPagina();
  const paginaSumario = paginaAtual();
  novaPagina(); // o conteúdo começa na página seguinte ao sumário

  // ================= CONTEÚDO =================
  const paragrafo = (texto: string) => {
    doc.setFont(F, 'normal');
    doc.setFontSize(12);
    cor(TEXTO);
    const recuo = 12.5; // recuo de primeira linha (1,25 cm)
    const palavras = texto.split(/\s+/);
    const linhas: string[] = [];
    let atual = '';
    let largura = CW - recuo;
    for (const p of palavras) {
      const teste = atual ? `${atual} ${p}` : p;
      if (doc.getTextWidth(teste) > largura && atual) {
        linhas.push(atual);
        atual = p;
        largura = CW;
      } else {
        atual = teste;
      }
    }
    if (atual) linhas.push(atual);
    linhas.forEach((ln, i) => {
      if (y + LH > LIM) novaPagina();
      const x = i === 0 ? ML + recuo : ML;
      const maxW = i === 0 ? CW - recuo : CW;
      const ultima = i === linhas.length - 1;
      if (ultima) {
        doc.text(ln, x, y + 4.2);
      } else {
        // justificado: distribui o espaço entre as palavras
        const ws = ln.split(' ');
        const larguraPalavras = ws.reduce((s, w) => s + doc.getTextWidth(w), 0);
        const gap = ws.length > 1 ? (maxW - larguraPalavras) / (ws.length - 1) : 0;
        let xx = x;
        ws.forEach(w => { doc.text(w, xx, y + 4.2); xx += doc.getTextWidth(w) + gap; });
      }
      y += LH;
    });
    y += 2.5;
  };

  const titulo = (b: Extract<Bloco, { tipo: 'titulo' }>) => {
    if (b.novaPagina && y > MT + 0.1) novaPagina();
    else garantir(b.nivel === 1 ? 32 : 26);
    if (y > MT + 0.1) y += b.nivel === 1 ? 7 : 5;
    sumario.push({ texto: b.texto, nivel: b.nivel, pagina: paginaAtual() });
    doc.setFont(F, 'bold');
    if (b.nivel === 1) {
      doc.setFontSize(14);
      cor(VERDE);
      doc.text(b.texto, ML, y + 5);
      doc.setFillColor(...LIMA);
      doc.rect(ML, y + 8, 18, 0.9, 'F');
      y += 15;
    } else {
      doc.setFontSize(12.5);
      cor(VERDE_MEDIO);
      doc.text(b.texto, ML, y + 4.5);
      y += 10;
    }
  };

  const legenda = (rotulo: string) => {
    doc.setFont(F, 'bold');
    doc.setFontSize(10.5);
    cor(TEXTO);
    const ls = doc.splitTextToSize(rotulo, CW);
    doc.text(ls, ML, y + 3.8);
    y += ls.length * 4.6 + 2;
  };
  const fonte = (nota?: string) => {
    doc.setFont(F, 'normal');
    doc.setFontSize(9);
    cor(CINZA);
    const txt = `Fonte: AMBISAFE (${modelo.ano}).${nota ? ' ' + nota : ''}`;
    const ls = doc.splitTextToSize(txt, CW);
    garantir(ls.length * 4);
    doc.text(ls, ML, y + 3.5);
    y += ls.length * 4 + 6;
  };

  const tabela = (b: Extract<Bloco, { tipo: 'tabela' }>) => {
    garantir(30);
    y += 2;
    legenda(`Tabela ${b.numero} – ${b.titulo}`);
    const n = b.colunas.length;
    const body: RowInput[] = b.linhas.map(l => {
      if (l.tipo === 'grupo') {
        return [{ content: l.texto, colSpan: n, styles: { fillColor: GRUPO, fontStyle: 'bold', textColor: VERDE } } as CellDef];
      }
      return l.celulas.map(c => (l.destaque ? { content: c, styles: { fontStyle: 'bold', textColor: VERDE } } : c)) as RowInput;
    });
    const muitas = n >= 8;
    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: MR, top: MT, bottom: MB },
      head: [b.colunas.map(c => ({ content: c.titulo, styles: { halign: c.alinhar ?? 'left' } }))],
      body,
      foot: b.total ? [b.total] : undefined,
      showHead: 'everyPage',
      showFoot: 'lastPage',
      theme: 'plain',
      styles: {
        font: F, fontSize: muitas ? 8 : 9.5, textColor: TEXTO, cellPadding: { top: 1.7, bottom: 1.7, left: muitas ? 1.2 : 2, right: muitas ? 1.2 : 2 },
        lineColor: LINHA, lineWidth: { bottom: 0.15 } as unknown as number, overflow: 'linebreak', valign: 'middle',
      },
      headStyles: { fillColor: VERDE, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: muitas ? 8 : 9.5, lineWidth: 0 },
      footStyles: { fillColor: GRUPO, textColor: VERDE, fontStyle: 'bold', lineWidth: { top: 0.4 } as unknown as number, lineColor: VERDE },
      alternateRowStyles: { fillColor: ZEBRA },
      columnStyles: Object.fromEntries(b.colunas.map((c, i) => [i, {
        cellWidth: c.largura * CW,
        halign: c.alinhar ?? 'left',
        fontStyle: c.italico ? 'italic' : 'normal',
      }])),
      didParseCell: data => {
        if (data.section === 'foot') {
          const col = b.colunas[data.column.index];
          data.cell.styles.halign = col?.alinhar ?? 'left';
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 1.5;
    fonte(b.nota);
  };

  const figura = (b: Extract<Bloco, { tipo: 'figura' }>) => {
    const img = desenharGrafico(b.grafico);
    const larg = CW;
    const alt = (larg * img.altura) / img.largura;
    garantir(alt + 20);
    y += 2;
    legenda(`Figura ${b.numero} – ${b.titulo}`);
    doc.addImage(img.dataUrl, 'PNG', ML, y, larg, alt);
    y += alt + 1.5;
    fonte();
  };

  const destaques = (b: Extract<Bloco, { tipo: 'destaques' }>) => {
    const cols = 3, gap = 4;
    const bw = (CW - gap * (cols - 1)) / cols, bh = 22;
    garantir(Math.ceil(b.itens.length / cols) * (bh + gap));
    b.itens.forEach((it, i) => {
      const cx = ML + (i % cols) * (bw + gap);
      const cy = y + Math.floor(i / cols) * (bh + gap);
      doc.setFillColor(...ZEBRA);
      doc.setDrawColor(...LINHA);
      doc.roundedRect(cx, cy, bw, bh, 2.5, 2.5, 'FD');
      doc.setFont(F, 'normal');
      doc.setFontSize(8.5);
      cor(CINZA);
      doc.text(it.rotulo.toUpperCase(), cx + 4, cy + 7.5);
      doc.setFont(F, 'bold');
      doc.setFontSize(it.valor.length > 18 ? 11.5 : 14);
      cor(VERDE);
      doc.text(it.valor, cx + 4, cy + 16.5);
    });
    y += Math.ceil(b.itens.length / cols) * (bh + gap) + 4;
  };

  const ficha = (b: Extract<Bloco, { tipo: 'ficha' }>) => {
    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: MR },
      body: b.itens,
      theme: 'plain',
      styles: { font: F, fontSize: 10.5, textColor: TEXTO, cellPadding: { top: 2.2, bottom: 2.2, left: 3, right: 3 }, lineColor: LINHA, lineWidth: { bottom: 0.15 } as unknown as number },
      columnStyles: { 0: { cellWidth: CW * 0.38, textColor: CINZA }, 1: { fontStyle: 'bold' } },
      alternateRowStyles: { fillColor: ZEBRA },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 6;
  };

  const referencias = (b: Extract<Bloco, { tipo: 'referencias' }>) => {
    doc.setFont(F, 'normal');
    doc.setFontSize(11);
    cor(TEXTO);
    for (const ref of b.itens) {
      const ls = doc.splitTextToSize(ref, CW);
      garantir(ls.length * 4.8 + 4);
      doc.text(ls, ML, y + 4);
      y += ls.length * 4.8 + 4;
    }
  };

  const assinatura = (b: Extract<Bloco, { tipo: 'assinatura' }>) => {
    garantir(62);
    y += 10;
    doc.setFont(F, 'normal');
    doc.setFontSize(12);
    cor(TEXTO);
    doc.text(b.local, W - MR, y, { align: 'right' });
    y += 30;
    doc.setDrawColor(...TEXTO);
    doc.setLineWidth(0.3);
    doc.line(W / 2 + 5 - 40, y, W / 2 + 5 + 40, y);
    y += 5;
    const cx = W / 2 + 5;
    doc.setFont(F, 'bold');
    doc.text(b.nome, cx, y, { align: 'center' });
    doc.setFont(F, 'normal');
    doc.setFontSize(10.5);
    cor(CINZA);
    doc.text(b.funcao, cx, y + 5, { align: 'center' });
    if (b.empresa) doc.text(b.empresa, cx, y + 10, { align: 'center' });
    y += 16;
  };

  for (const b of modelo.blocos) {
    switch (b.tipo) {
      case 'titulo': titulo(b); break;
      case 'paragrafo': paragrafo(b.texto); break;
      case 'tabela': tabela(b); break;
      case 'figura': figura(b); break;
      case 'destaques': destaques(b); break;
      case 'ficha': ficha(b); break;
      case 'referencias': referencias(b); break;
      case 'assinatura': assinatura(b); break;
    }
  }

  // ================= SUMÁRIO =================
  doc.setPage(paginaSumario);
  y = MT;
  doc.setFont(F, 'bold');
  doc.setFontSize(14);
  cor(VERDE);
  doc.text('SUMÁRIO', W / 2, y + 5, { align: 'center' });
  y += 18;
  for (const s of sumario) {
    const x = s.nivel === 1 ? ML : ML + 7;
    doc.setFont(F, s.nivel === 1 ? 'bold' : 'normal');
    doc.setFontSize(s.nivel === 1 ? 11.5 : 11);
    cor(TEXTO);
    const pag = String(s.pagina);
    const tw = doc.getTextWidth(s.texto);
    const pw = doc.getTextWidth(pag);
    doc.text(s.texto, x, y);
    doc.text(pag, W - MR, y, { align: 'right' });
    // linha pontilhada até o número
    doc.setFont(F, 'normal');
    cor(CINZA);
    const ini = x + tw + 2, fim = W - MR - pw - 2;
    let pontos = '';
    while (doc.getTextWidth(pontos + ' .') < fim - ini) pontos += ' .';
    doc.text(pontos, fim, y, { align: 'right' });
    y += s.nivel === 1 ? 8 : 7;
  }

  // ================= CABEÇALHO E RODAPÉ =================
  const total = doc.getNumberOfPages();
  const logoH = 5.2;
  const logoHW = (logoH * logos.escuro.largura) / logos.escuro.altura;
  for (let i = 2; i <= total; i++) {
    doc.setPage(i);
    doc.addImage(logos.escuro.dataUrl, 'PNG', ML, 12, logoHW, logoH);
    doc.setFont(F, 'normal');
    doc.setFontSize(8.5);
    cor(CINZA);
    doc.text('Relatório Técnico de Inventário Florestal', W - MR, 16, { align: 'right' });
    doc.setDrawColor(...LINHA);
    doc.setLineWidth(0.25);
    doc.line(ML, 20, W - MR, 20);
    doc.line(ML, H - 14, W - MR, H - 14);
    doc.text(doc.splitTextToSize(modelo.rodape, CW - 30)[0], ML, H - 9.5);
    doc.setFont(F, 'bold');
    cor(VERDE);
    doc.text(`${i} / ${total}`, W - MR, H - 9.5, { align: 'right' });
  }

  doc.setProperties({ title: `Relatório Técnico — ${projeto.nome}`, subject: 'Inventário Florestal', creator: 'AMBISAFE', author: modelo.capa.responsavel });
  doc.save(`${nomeArquivo}.pdf`);
}
