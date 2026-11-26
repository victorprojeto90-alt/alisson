import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowUp, ChevronDown, FileText, ShieldCheck } from 'lucide-react';
import logoFull from '../../../assets/ambisafe-logo-full2.png';

interface Props {
  tipo: 'privacidade' | 'termos';
  titulo: string;
  resumo: string;
  etiquetas: string[];
  children: ReactNode;
}

interface ItemSumario { id: string; numero: string; texto: string }

/**
 * Molde das páginas legais (Privacidade e Termos de Uso).
 * O conteúdo continua sendo escrito como <section><h2>N. Título</h2>...</section>;
 * este molde numera os blocos, monta o sumário e aplica o visual do app.
 */
export default function LegalLayout({ tipo, titulo, resumo, etiquetas, children }: Props) {
  const navigate = useNavigate();
  const conteudo = useRef<HTMLDivElement>(null);
  const [sumario, setSumario] = useState<ItemSumario[]>([]);
  const [ativo, setAtivo] = useState('');
  const [abertoCel, setAbertoCel] = useState(false);
  const [mostrarTopo, setMostrarTopo] = useState(false);

  // Monta o sumário a partir dos títulos das seções
  useEffect(() => {
    window.scrollTo(0, 0);
    const secoes = Array.from(conteudo.current?.querySelectorAll<HTMLElement>(':scope > section') ?? []);
    const itens = secoes.map((s, i) => {
      const h2 = s.querySelector('h2');
      const bruto = (h2?.textContent ?? '').trim();
      const m = bruto.match(/^(\d+)\.\s*(.*)$/);
      const numero = m ? m[1] : String(i + 1);
      const texto = m ? m[2] : bruto;
      s.id = `secao-${numero}`;
      s.dataset.numero = numero;
      if (h2) h2.dataset.texto = texto;
      return { id: s.id, numero, texto };
    });
    setSumario(itens);

    const obs = new IntersectionObserver(
      (entradas) => {
        const visivel = entradas.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visivel) setAtivo(visivel.target.id);
      },
      { rootMargin: '-90px 0px -65% 0px' },
    );
    secoes.forEach(s => obs.observe(s));
    const onScroll = () => setMostrarTopo(window.scrollY > 900);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { obs.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, []);

  const irPara = (id: string) => {
    setAbertoCel(false);
    // espera o sumário do celular fechar antes de medir a posição
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (!el) return;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 84, behavior: 'smooth' });
    }));
  };

  const Icone = tipo === 'privacidade' ? ShieldCheck : FileText;
  const outro = tipo === 'privacidade'
    ? { to: '/termos-de-uso', rotulo: 'Termos de Uso', comArtigo: 'os Termos de Uso' }
    : { to: '/privacidade', rotulo: 'Política de Privacidade', comArtigo: 'a Política de Privacidade' };

  return (
    <div className="min-h-screen bg-[#f4f7f2] antialiased text-[#1a1a1a]">
      {/* Topo */}
      <header className="sticky top-0 z-50 bg-[#0A3D1F] shadow-[0_2px_16px_rgba(0,0,0,0.18)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="shrink-0">
            <img src={logoFull} alt="AMBISAFE" className="h-8 sm:h-9 w-auto object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
          </Link>
          <button
            onClick={() => navigate('/auth?mode=register')}
            className="px-4 sm:px-5 py-2 rounded-full text-sm font-bold bg-[#A8C800] text-[#0A3D1F] hover:opacity-90 active:scale-95 transition"
          >
            Começar grátis
          </button>
        </div>
      </header>

      {/* Faixa de título */}
      <section className="bg-gradient-to-br from-[#0A3D1F] via-[#0B5A1E] to-[#127a2c] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-10 sm:pt-8 sm:pb-14">
          <nav className="text-xs sm:text-sm text-white/60 mb-5">
            <Link to="/" className="hover:text-white">Início</Link>
            <span className="mx-2">/</span>
            <span className="text-white/85">{titulo}</span>
          </nav>
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/10 border border-white/15 items-center justify-center shrink-0">
              <Icone className="w-7 h-7 text-[#A8C800]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[28px] leading-tight sm:text-4xl font-bold">{titulo}</h1>
              <p className="mt-2 text-sm sm:text-base text-white/75 max-w-2xl">{resumo}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {etiquetas.map(e => (
                  <span key={e} className="text-[11px] sm:text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-white/90">{e}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6 pb-16 lg:grid lg:grid-cols-[260px_1fr] lg:gap-8">
        {/* Sumário — computador */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#0A3D1F]/60 px-2 mb-2">Sumário</p>
            <nav className="space-y-0.5 max-h-[calc(100vh-180px)] overflow-y-auto">
              {sumario.map(s => (
                <button
                  key={s.id}
                  onClick={() => irPara(s.id)}
                  className={`w-full text-left flex gap-2.5 px-2 py-1.5 rounded-lg text-[13px] leading-snug transition ${ativo === s.id ? 'bg-[#0A3D1F]/8 text-[#0A3D1F] font-semibold' : 'text-gray-500 hover:text-[#0A3D1F] hover:bg-gray-50'}`}
                >
                  <span className={`w-5 shrink-0 tabular-nums ${ativo === s.id ? 'text-[#0B5A1E]' : 'text-gray-300'}`}>{s.numero}</span>
                  <span>{s.texto}</span>
                </button>
              ))}
            </nav>
            <Link to={outro.to} className="mt-3 flex items-center gap-2 px-2 pt-3 border-t border-gray-100 text-[13px] font-medium text-[#0B5A1E] hover:underline">
              Ver {outro.rotulo} →
            </Link>
          </div>
        </aside>

        <div className="min-w-0">
          {/* Sumário — celular */}
          <div className="lg:hidden rounded-2xl bg-white border border-gray-100 shadow-sm mb-4 overflow-hidden">
            <button onClick={() => setAbertoCel(v => !v)} className="w-full flex items-center justify-between px-4 py-3.5">
              <span className="text-sm font-semibold text-[#0A3D1F]">Sumário · {sumario.length} seções</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${abertoCel ? 'rotate-180' : ''}`} />
            </button>
            {abertoCel && (
              <nav className="px-2 pb-3 border-t border-gray-100 pt-2">
                {sumario.map(s => (
                  <button key={s.id} onClick={() => irPara(s.id)} className="w-full text-left flex gap-2.5 px-2 py-2 rounded-lg text-sm text-gray-600 active:bg-gray-50">
                    <span className="w-5 shrink-0 tabular-nums text-gray-300">{s.numero}</span>
                    <span>{s.texto}</span>
                  </button>
                ))}
              </nav>
            )}
          </div>

          <div ref={conteudo} className="legal-conteudo space-y-4 text-[15px] leading-relaxed text-gray-700">
            {children}
          </div>

          <div className="mt-6 rounded-2xl bg-[#0A3D1F] text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold">Ficou com alguma dúvida?</p>
              <p className="text-sm text-white/70">Fale com a AMBISAFE pelo WhatsApp ou leia também {outro.comArtigo}.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="https://wa.me/5583996028738" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-full bg-[#A8C800] text-[#0A3D1F] text-sm font-bold">WhatsApp</a>
              <Link to={outro.to} className="px-4 py-2 rounded-full border border-white/25 text-sm font-semibold">{outro.rotulo}</Link>
            </div>
          </div>
        </div>
      </main>

      {mostrarTopo && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Voltar ao topo"
          className="fixed bottom-5 right-5 z-40 w-11 h-11 rounded-full bg-[#0A3D1F] text-white shadow-lg flex items-center justify-center"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      <footer className="py-10 bg-[#0A3D1F]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <img src={logoFull} alt="AMBISAFE" className="h-8 w-auto" style={{ filter: 'brightness(0) invert(1)' }} />
          <div className="flex items-center gap-6 text-sm text-white/50">
            <Link to="/termos-de-uso" className="hover:text-white transition-colors">Termos de uso</Link>
            <Link to="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
            <a href="https://wa.me/5583996028738" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Contato</a>
          </div>
          <p className="text-white/35 text-sm text-center">© {new Date().getFullYear()} AMBISAFE — Software de cálculo de inventário florestal</p>
        </div>
      </footer>
    </div>
  );
}
