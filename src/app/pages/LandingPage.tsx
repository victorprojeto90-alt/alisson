import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router';
import logoFull from '../../assets/ambisafe-logo-full2.png';
import alissonFoto from '../../assets/alisson-monteiro.jpg';

// ─── Brand tokens ──────────────────────────────────────────────────────────
const C = {
  dark: '#0A3D1F',
  lime: '#A8C800',
  white: '#FFFFFF',
  gray: '#F5F5F5',
  text: '#1a1a1a',
  muted: '#6b7280',
};

// ─── Scroll-reveal hook ────────────────────────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

// ─── SVG Dashboard Mockup ─────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <svg
      viewBox="0 0 600 380"
      className="w-full max-w-xl mx-auto drop-shadow-2xl"
      aria-hidden="true"
      style={{ borderRadius: 16 }}
    >
      {/* Window chrome */}
      <rect width="600" height="380" rx="12" fill="#1a2e1a" />
      <rect width="600" height="36" rx="0" fill="#0d210d" />
      <rect y="0" width="600" height="36" rx="12" fill="#0d210d" />
      <circle cx="20" cy="18" r="5" fill="#ff5f57" />
      <circle cx="36" cy="18" r="5" fill="#febc2e" />
      <circle cx="52" cy="18" r="5" fill="#28c840" />
      <text x="76" y="23" fill="#ffffff40" fontSize="11" fontFamily="monospace">AMBISAFE — Inventário Florestal</text>

      {/* Sidebar */}
      <rect x="0" y="36" width="120" height="344" fill="#0A3D1F" />
      {['Painel', 'Inventários', 'Espécies', 'Relatórios'].map((label, i) => (
        <g key={label}>
          <rect x="8" y={56 + i * 38} width="104" height="28" rx="6"
            fill={i === 0 ? '#A8C800' : '#ffffff10'} />
          <text x="20" y={75 + i * 38} fill={i === 0 ? '#0A3D1F' : '#ffffff90'}
            fontSize="11" fontWeight={i === 0 ? 700 : 400} fontFamily="system-ui">
            {label}
          </text>
        </g>
      ))}

      {/* Main area */}
      <rect x="120" y="36" width="480" height="344" fill="#f8faf8" />

      {/* Header bar */}
      <rect x="120" y="36" width="480" height="40" fill="#ffffff" />
      <text x="136" y="61" fill="#0A3D1F" fontSize="13" fontWeight="700" fontFamily="system-ui">
        Painel de Controle
      </text>
      <rect x="490" y="48" width="96" height="18" rx="9" fill="#A8C800" />
      <text x="510" y="60" fill="#0A3D1F" fontSize="9" fontWeight="700" fontFamily="system-ui">
        Novo inventário
      </text>

      {/* Stat cards */}
      {[
        { label: 'Indivíduos', value: '1.248', color: '#A8C800' },
        { label: 'Espécies', value: '34', color: '#60a5fa' },
        { label: 'Score', value: '87/100', color: '#34d399' },
      ].map((card, i) => (
        <g key={card.label}>
          <rect x={136 + i * 126} y="86" width="112" height="56" rx="8" fill="#ffffff"
            style={{ filter: 'drop-shadow(0 1px 4px #0001)' }} />
          <text x={148 + i * 126} y="108" fill={C.muted} fontSize="9" fontFamily="system-ui">
            {card.label}
          </text>
          <text x={148 + i * 126} y="127" fill="#1a2e1a" fontSize="16" fontWeight="700" fontFamily="system-ui">
            {card.value}
          </text>
          <rect x={136 + i * 126} y="86" width="4" height="56" rx="2" fill={card.color} />
        </g>
      ))}

      {/* Bar chart */}
      <rect x="136" y="158" width="220" height="130" rx="8" fill="#ffffff" />
      <text x="150" y="176" fill="#1a2e1a" fontSize="10" fontWeight="600" fontFamily="system-ui">
        Estrutura Diamétrica
      </text>
      {[0.9, 0.7, 0.5, 0.35, 0.2, 0.12].map((h, i) => (
        <rect key={i}
          x={154 + i * 30} y={260 - h * 70} width="18" height={h * 70}
          rx="3" fill={i === 0 ? '#A8C800' : '#0A3D1F'} fillOpacity={0.7 + i * 0.05}
        />
      ))}
      <text x="150" y="283" fill={C.muted} fontSize="7" fontFamily="system-ui">5  10  15  20  25  30 cm</text>

      {/* Table */}
      <rect x="368" y="158" width="218" height="130" rx="8" fill="#ffffff" />
      <text x="382" y="176" fill="#1a2e1a" fontSize="10" fontWeight="600" fontFamily="system-ui">
        Fitossociologia
      </text>
      <rect x="368" y="180" width="218" height="16" fill="#0A3D1F" />
      {['Espécie', 'DA', 'IVI'].map((h, i) => (
        <text key={h} x={378 + i * 72} y="192" fill="#fff" fontSize="8"
          fontWeight="600" fontFamily="system-ui">{h}</text>
      ))}
      {[
        ['Aroeira', '48.2', '32.1%'],
        ['Angico', '31.4', '24.7%'],
        ['Catingueira', '22.8', '18.3%'],
        ['Jurema P.', '18.6', '14.2%'],
      ].map((row, i) => (
        <g key={row[0]}>
          <rect x="368" y={196 + i * 19} width="218" height="19"
            fill={i % 2 === 0 ? '#f8faf8' : '#ffffff'} />
          {row.map((cell, j) => (
            <text key={j} x={378 + j * 72} y={209 + i * 19}
              fill="#374151" fontSize="8" fontFamily="system-ui">{cell}</text>
          ))}
        </g>
      ))}

      {/* Score ring */}
      <circle cx="170" cy="330" r="28" fill="none" stroke="#e5e7eb" strokeWidth="7" />
      <circle cx="170" cy="330" r="28" fill="none" stroke="#A8C800" strokeWidth="7"
        strokeDasharray="175.9" strokeDashoffset="23" strokeLinecap="round"
        transform="rotate(-90 170 330)" />
      <text x="170" y="326" fill="#1a2e1a" fontSize="12" fontWeight="700"
        textAnchor="middle" fontFamily="system-ui">87</text>
      <text x="170" y="338" fill={C.muted} fontSize="7" textAnchor="middle"
        fontFamily="system-ui">Score</text>
      <text x="210" y="322" fill="#1a2e1a" fontSize="10" fontWeight="600"
        fontFamily="system-ui">AMBISAFE Score</text>
      <text x="210" y="336" fill={C.muted} fontSize="9" fontFamily="system-ui">Excelente qualidade técnica</text>

      {/* Progress bars */}
      {[
        { label: 'Regularidade', v: 90 },
        { label: 'Diversidade', v: 80 },
        { label: 'Sustentabilidade', v: 85 },
      ].map((item, i) => (
        <g key={item.label}>
          <text x="370" y={320 + i * 16} fill={C.muted} fontSize="8" fontFamily="system-ui">
            {item.label}
          </text>
          <rect x="460" y={310 + i * 16} width="110" height="7" rx="3" fill="#e5e7eb" />
          <rect x="460" y={310 + i * 16} width={item.v * 1.1} height="7" rx="3" fill="#A8C800" />
        </g>
      ))}
    </svg>
  );
}

// ─── FAQ data ──────────────────────────────────────────────────────────────
const FAQ = [
  {
    q: 'Como funciona a identificação automática de espécies?',
    a: 'O AMBISAFE possui banco de dados integrado ao IFN. Ao digitar o nome popular, o sistema sugere nome científico, família e bioma, corrigindo erros de digitação e sinonímias automaticamente.',
  },
  {
    q: 'Os cálculos seguem as normas dos órgãos ambientais?',
    a: 'Sim. Fitossociologia (Densidade, Dominância, Frequência, IVI) e diversidade (Shannon, Simpson, Pielou) seguem a literatura clássica da engenharia florestal — aceitos por órgãos municipais, estaduais e federais.',
  },
  {
    q: 'Posso importar dados de uma planilha Excel?',
    a: 'Com certeza. Faça upload do seu .csv ou .xlsx e a IA mapeia as colunas (DAP, Altura, Espécie) automaticamente, sem digitar árvore por árvore.',
  },
  {
    q: 'Quais tipos de inventário são suportados?',
    a: 'Amostragem Casual Simples (parcelas aleatórias) e Inventário 100% — Censo Florestal (todos os indivíduos mensurados individualmente).',
  },
  {
    q: 'Meus dados ficam seguros e privados?',
    a: 'Sim. Os dados são criptografados e pertencem exclusivamente a você. Não compartilhamos coordenadas ou informações de áreas privadas com terceiros.',
  },
  {
    q: 'O sistema gera relatório em PDF/Word?',
    a: 'Sim. Além da planilha de cálculos, a IA redige Metodologia e Resultados, economizando horas de escrita. Exporte em PDF, Word (.docx) editável e Excel.',
  },
  {
    q: 'Como é calculada a suficiência amostral?',
    a: 'O AMBISAFE calcula automaticamente o erro de amostragem e intervalo de confiança. Se insuficiente para o limite do órgão (10% ou 20%), emite alerta sugerindo novas parcelas.',
  },
];

// ─── Reveal wrapper ────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = '' }: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goAuth = useCallback(() => navigate('/auth?mode=register'), [navigate]);

  const navLinks = [
    { href: '#como-funciona', label: 'Como funciona' },
    { href: '#planos', label: 'Planos' },
    { href: '#sobre-o-criador', label: 'Sobre' },
    { href: '#faq', label: 'FAQ' },
  ];

  return (
    <div className="min-h-screen bg-white antialiased" style={{ color: C.text }}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrolled ? C.dark : 'transparent',
          boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex-shrink-0">
            <img src={logoFull} alt="AMBISAFE" className="h-9 w-auto object-contain"
              style={{ filter: 'brightness(0) invert(1)' }} />
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-white/80">
            {navLinks.map(l => (
              <a key={l.href} href={l.href}
                className="hover:text-white transition-colors">{l.label}</a>
            ))}
            <button
              onClick={goAuth}
              className="hover:text-white transition-colors"
            >
              Entrar
            </button>
            <button
              onClick={goAuth}
              className="px-5 py-2 rounded-full text-sm font-bold transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: C.lime, color: C.dark }}
            >
              Começar grátis
            </button>
          </nav>

          {/* Hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Menu"
          >
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 origin-center ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-6 h-0.5 bg-white transition-opacity duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 origin-center ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>

        {/* Mobile nav drawer */}
        <div
          className="md:hidden overflow-hidden transition-all duration-300"
          style={{
            maxHeight: mobileOpen ? '320px' : '0',
            backgroundColor: C.dark,
          }}
        >
          <div className="px-6 py-4 flex flex-col gap-4">
            {navLinks.map(l => (
              <a key={l.href} href={l.href}
                className="text-white/80 hover:text-white font-medium py-1"
                onClick={() => setMobileOpen(false)}>
                {l.label}
              </a>
            ))}
            <button onClick={goAuth}
              className="text-white/80 hover:text-white font-medium py-1 text-left">
              Entrar
            </button>
            <button
              onClick={goAuth}
              className="w-full py-3 rounded-full font-bold text-sm mt-1 transition-all hover:opacity-90"
              style={{ backgroundColor: C.lime, color: C.dark }}
            >
              Começar grátis
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ backgroundColor: C.dark }}
      >
        {/* Background texture */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: C.lime }} />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full blur-3xl opacity-10"
            style={{ backgroundColor: C.lime }} />
          {/* Grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <div>
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-xs font-semibold tracking-wide uppercase border"
                style={{ backgroundColor: `${C.lime}20`, borderColor: `${C.lime}40`, color: C.lime }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: C.lime }} />
                Plataforma Nacional de Inventário Florestal
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-white leading-tight mb-6">
                Seu inventário florestal calculado em{' '}
                <span style={{ color: C.lime }}>minutos</span>
              </h1>

              <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-lg">
                Automatize cálculos estatísticos, gere relatórios profissionais e gerencie suas parcelas com precisão e inteligência artificial.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mb-10">
                {[
                  { value: '100%', label: 'Cálculos automáticos' },
                  { value: '12+', label: 'Tabelas técnicas' },
                  { value: '< 1 min', label: 'Processamento' },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-2xl font-bold" style={{ color: C.lime }}>{s.value}</p>
                    <p className="text-white/50 text-xs mt-0.5 leading-snug">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={goAuth}
                  className="px-8 py-3.5 rounded-full font-bold text-sm transition-all hover:opacity-90 hover:scale-105 active:scale-95 shadow-lg"
                  style={{ backgroundColor: C.lime, color: C.dark,
                    boxShadow: `0 4px 24px ${C.lime}50` }}
                >
                  Começar grátis
                </button>
                <button
                  onClick={() => window.open('https://wa.me/5583991144456', '_blank')}
                  className="px-8 py-3.5 rounded-full font-bold text-sm border-2 text-white hover:bg-white/10 transition-all"
                  style={{ borderColor: 'rgba(255,255,255,0.3)' }}
                >
                  Fale conosco
                </button>
              </div>
            </div>

            {/* Right: dashboard mockup */}
            <div className="hidden lg:block">
              <DashboardMockup />
            </div>
          </div>

          {/* Mobile mockup */}
          <div className="lg:hidden mt-12">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ───────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-widest mb-3"
              style={{ color: C.lime }}>
              Simples e rápido
            </p>
            <h2 className="text-4xl font-bold mb-4" style={{ color: C.dark }}>
              Como funciona
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: C.muted }}>
              Do campo ao relatório técnico em 4 passos simples
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                num: '01',
                title: 'Crie o projeto',
                desc: 'Informe área, bioma e tipo de inventário. O sistema configura os parâmetros automaticamente.',
                icon: (
                  <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none">
                    <rect x="6" y="6" width="28" height="28" rx="6" stroke="currentColor" strokeWidth="2" />
                    <path d="M14 20h12M20 14v12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                num: '02',
                title: 'Importe os dados',
                desc: 'Faça upload da sua planilha .csv ou .xlsx. A IA mapeia e valida as colunas automaticamente.',
                icon: (
                  <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none">
                    <rect x="6" y="8" width="28" height="24" rx="4" stroke="currentColor" strokeWidth="2" />
                    <path d="M20 25V15M15 20l5-5 5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                num: '03',
                title: 'Calcule automaticamente',
                desc: 'Fitossociologia, índices de diversidade, estrutura diamétrica e estatística amostral em segundos.',
                icon: (
                  <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none">
                    <rect x="6" y="6" width="28" height="28" rx="6" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 26l6-8 5 6 4-5 5 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
              {
                num: '04',
                title: 'Gere relatórios',
                desc: 'PDFs profissionais com IA, Word editável e Excel completo — prontos para protocolar.',
                icon: (
                  <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none">
                    <rect x="8" y="4" width="24" height="32" rx="4" stroke="currentColor" strokeWidth="2" />
                    <path d="M14 14h12M14 20h12M14 26h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M24 28l4 4 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
            ].map((step, i) => (
              <Reveal key={step.num} delay={i * 100}>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${C.dark}10`, color: C.dark }}
                  >
                    {step.icon}
                  </div>
                  <div
                    className="text-xs font-black tracking-widest mb-2"
                    style={{ color: C.lime }}
                  >
                    {step.num}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-base">{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEMA vs SOLUÇÃO ─────────────────────────────────────────── */}
      <section className="py-24" style={{ backgroundColor: C.gray }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: C.dark }}>
              O problema do mercado
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: C.muted }}>
              O processamento de dados de inventário florestal ainda consome horas em planilhas manuais. O AMBISAFE resolve isso em minutos.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <Reveal delay={0}>
              <div className="bg-red-50 border border-red-100 rounded-2xl p-8 h-full">
                <h3 className="text-lg font-bold text-red-700 mb-5">❌ Jeito tradicional</h3>
                <ul className="space-y-3">
                  {[
                    'Horas em planilhas Excel com risco de erro humano',
                    'Cálculos de fitossociologia e estatística manuais',
                    'Relatórios criados do zero para cada projeto',
                    'Sem padronização entre consultores',
                    'Difícil de revisar e auditar',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-3 text-red-800 text-sm">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="rounded-2xl p-8 h-full border"
                style={{ backgroundColor: `${C.dark}08`, borderColor: `${C.dark}20` }}>
                <h3 className="text-lg font-bold mb-5" style={{ color: C.dark }}>✅ Com AMBISAFE</h3>
                <ul className="space-y-3">
                  {[
                    'Upload da planilha → resultados em segundos',
                    'Fitossociologia e estatística 100% automáticos',
                    'Pré-relatório técnico gerado por IA em português',
                    'Padronização garantida pelo Score AMBISAFE',
                    'Exportação em PDF, Word e Excel prontos para uso',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-3 text-green-800 text-sm">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" fill={C.lime} />
                        <path d="M5 8l2 2 4-4" stroke={C.dark} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── BENEFÍCIOS ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: C.dark }}>
              Por que engenheiros florestais escolhem o AMBISAFE
            </h2>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: (
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                ),
                title: 'Cálculos conforme normas',
                desc: 'Metodologia alinhada com a literatura clássica da engenharia florestal e exigências dos órgãos ambientais.',
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M6.343 17.657A8 8 0 1117.657 6.343 8 8 0 016.343 17.657z" />
                  </svg>
                ),
                title: 'Múltiplas espécies e biomas',
                desc: 'Suporte a todos os biomas brasileiros com banco de espécies integrado ao Inventário Florestal Nacional.',
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 21h10M12 21V3M4 7l8-4 8 4" />
                  </svg>
                ),
                title: 'Relatórios em PDF automatizados',
                desc: 'IA redige metodologia e resultados. Exporte em PDF, Word editável e Excel com 12+ tabelas técnicas.',
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" />
                    <path d="M12 18h.01" />
                  </svg>
                ),
                title: 'Acesso de qualquer dispositivo',
                desc: 'Plataforma 100% na nuvem. Use no escritório ou no campo via tablet/celular — sem instalação.',
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <div className="group p-6 rounded-2xl border border-gray-100 hover:border-transparent hover:shadow-xl transition-all duration-300 h-full"
                  style={{ ['--hover-border' as string]: C.lime }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300"
                    style={{ backgroundColor: `${C.dark}10`, color: C.dark }}>
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ─────────────────────────────────────────────── */}
      <section
        id="funcionalidades"
        className="py-24"
        style={{ backgroundColor: C.dark }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Tudo em uma plataforma</h2>
            <p className="text-lg text-white/60 max-w-xl mx-auto">
              Funcionalidades completas para inventários florestais profissionais
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'Identificação automática de nome científico e família via IA',
              'Upload de planilhas CSV/XLSX com mapeamento automático de colunas',
              'Fitossociologia completa: DA, DR, DoA, DoR, FA, FR, IVI',
              'Índices de diversidade: Shannon, Simpson, Pielou',
              'Estrutura diamétrica com Fórmula de Sturges automática',
              'Estrutura vertical com tabela por estrato e por espécie',
              'Suficiência amostral e intervalo de confiança automáticos',
              'Score AMBISAFE — 5 dimensões de qualidade técnica',
              'Banco de espécies integrado ao IFN por estado/bioma',
              'Pré-relatório técnico com IA (metodologia + resultados)',
              'Exportação em PDF, Word (.docx) editável e Excel',
              'Dados isolados por empresa com RLS — total privacidade',
            ].map((feat, i) => (
              <Reveal key={feat} delay={(i % 6) * 60}>
                <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                  <div
                    className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ backgroundColor: C.lime }}
                  >
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6l2.5 2.5 5-5" stroke={C.dark} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-white/80 text-sm leading-snug">{feat}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS ──────────────────────────────────────────────────────── */}
      <section id="planos" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: C.dark }}>
              Plano único, acesso total
            </h2>
            <p className="text-lg" style={{ color: C.muted }}>
              14 dias grátis · sem cartão de crédito
            </p>
          </Reveal>

          <Reveal>
            <div className="max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl"
              style={{ backgroundColor: C.dark }}>
              <div className="relative p-8">
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 -translate-y-1/4 translate-x-1/4"
                  style={{ backgroundColor: C.lime }} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <span
                      className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                      style={{ backgroundColor: `${C.lime}20`, color: C.lime }}
                    >
                      Profissional
                    </span>
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-full"
                      style={{ backgroundColor: C.lime, color: C.dark }}
                    >
                      ACESSO TOTAL
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-8">
                    <span className="text-white/50 text-xl">R$</span>
                    <span className="text-white font-black text-6xl">300</span>
                    <span className="text-white/50">/mês</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {[
                      'Projetos e cálculos ilimitados',
                      'Conta compartilhada com equipe',
                      'Todos os cálculos florestais',
                      'Pré-relatório com IA incluído',
                      'Exportação PDF, Word e Excel',
                      'Score AMBISAFE exclusivo',
                      'Banco de espécies integrado',
                      'Suporte técnico por WhatsApp',
                    ].map(item => (
                      <li key={item} className="flex items-center gap-3 text-white/80 text-sm">
                        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" fill={C.lime} />
                          <path d="M5 8l2 2 4-4" stroke={C.dark} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={goAuth}
                    className="w-full py-4 rounded-full font-bold text-sm transition-all hover:opacity-90 hover:scale-[1.02] active:scale-95"
                    style={{ backgroundColor: C.lime, color: C.dark }}
                  >
                    Começar 14 dias grátis
                  </button>
                  <p className="text-white/30 text-xs text-center mt-3">
                    Sem cartão · Aceita CPF ou CNPJ · Cancele quando quiser
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── SOBRE O CRIADOR ─────────────────────────────────────────────── */}
      <section id="sobre-o-criador" className="py-24" style={{ backgroundColor: C.gray }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <h2 className="text-4xl font-bold" style={{ color: C.dark }}>
              Quem está por trás do AMBISAFE
            </h2>
          </Reveal>

          <Reveal>
            <div className="rounded-3xl overflow-hidden shadow-xl" style={{ backgroundColor: C.dark }}>
              <div className="grid md:grid-cols-3">
                {/* Photo */}
                <div className="flex items-center justify-center p-8 md:p-12">
                  <div className="relative">
                    <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 shadow-2xl"
                      style={{ borderColor: C.lime }}>
                      <img src={alissonFoto} alt="Alisson Monteiro"
                        style={{
                          width: '100%', height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center 15%',
                          transform: 'scale(1.3)',
                          transformOrigin: 'center 20%',
                        }} />
                    </div>
                    <div
                      className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold shadow-lg"
                      style={{ backgroundColor: C.lime, color: C.dark }}
                    >
                      Eng. Florestal · Fundador
                    </div>
                  </div>
                </div>

                {/* Text */}
                <div className="md:col-span-2 p-8 md:p-12 flex flex-col justify-center">
                  <h3 className="text-2xl font-bold mb-1" style={{ color: C.lime }}>
                    Alisson Monteiro
                  </h3>
                  <p className="text-white/50 text-sm mb-6">Engenheiro Florestal — UFCG</p>
                  <div className="space-y-3 text-white/75 text-sm leading-relaxed overflow-y-auto max-h-80 pr-1">
                    <p>
                      <strong className="text-white">Sou Alisson Monteiro</strong>, Engenheiro Florestal formado pela Universidade Federal de Campina Grande (UFCG), movido pela paixão por inovação, tecnologia e soluções práticas para o setor florestal.
                    </p>
                    <p>
                      Minha trajetória começou antes mesmo de me formar — cerca de um ano e meio antes já atuava no mercado, desenvolvendo visão prática das demandas reais do setor. Conclui a graduação em 2023 e o meu TCC explorou o método de ponto quadrante no inventário florestal, uma metodologia inovadora que pode apresentar eficiência equivalente aos inventários convencionais por parcelas.
                    </p>
                    <p>
                      Foi desse olhar crítico sobre o mercado que surgiu o AMBISAFE. Percebi uma grande lacuna no uso de tecnologia aplicada ao processamento de inventários: muitos profissionais ainda enfrentam cálculos complexos, processos manuais e alto consumo de tempo.
                    </p>
                    <p>
                      O AMBISAFE nasce para transformar essa realidade — automatizando análises que antes levavam dias para serem concluídas em minutos, com precisão e padronização técnica.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <h2 className="text-4xl font-bold" style={{ color: C.dark }}>
              Perguntas frequentes
            </h2>
          </Reveal>

          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <Reveal key={i} delay={i * 40}>
                <div className="rounded-2xl overflow-hidden border border-gray-200">
                  <button
                    className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-sm transition-colors"
                    style={{
                      backgroundColor: openFaq === i ? C.dark : '#f8f9fa',
                      color: openFaq === i ? '#fff' : C.dark,
                    }}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span>{item.q}</span>
                    <span
                      className="flex-shrink-0 ml-3 w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300"
                      style={{
                        backgroundColor: openFaq === i ? `${C.lime}30` : `${C.dark}10`,
                        color: openFaq === i ? C.lime : C.dark,
                        transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)',
                      }}
                    >
                      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
                        <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{ maxHeight: openFaq === i ? '200px' : '0' }}
                  >
                    <p className="px-6 py-4 text-sm leading-relaxed border-t border-gray-100"
                      style={{ color: C.muted }}>
                      {item.a}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────────── */}
      <section className="py-24" style={{ backgroundColor: C.dark }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Pronto para{' '}
              <span style={{ color: C.lime }}>automatizar</span>{' '}
              seu inventário?
            </h2>
            <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
              Junte-se a engenheiros florestais e consultores que já usam o AMBISAFE para gerar relatórios técnicos com precisão em minutos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={goAuth}
                className="px-10 py-4 rounded-full font-bold text-base transition-all hover:opacity-90 hover:scale-105 active:scale-95 shadow-xl"
                style={{
                  backgroundColor: C.lime,
                  color: C.dark,
                  boxShadow: `0 8px 32px ${C.lime}40`,
                }}
              >
                Criar conta grátis
              </button>
              <button
                onClick={() => window.open('https://wa.me/5583991144456', '_blank')}
                className="px-10 py-4 rounded-full font-bold text-base border-2 text-white hover:bg-white/10 transition-all"
                style={{ borderColor: 'rgba(255,255,255,0.25)' }}
              >
                Falar no WhatsApp
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="py-10 border-t border-white/10" style={{ backgroundColor: C.dark }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <img src={logoFull} alt="AMBISAFE" className="h-8 w-auto"
              style={{ filter: 'brightness(0) invert(1)' }} />

            <div className="flex items-center gap-6 text-sm text-white/40">
              <Link to="/termos-de-uso" className="hover:text-white transition-colors">Termos de uso</Link>
              <Link to="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
              <a
                href="https://wa.me/5583991144456"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Contato
              </a>
            </div>

            <p className="text-white/30 text-sm text-center">
              © {new Date().getFullYear()} AMBISAFE — Software de cálculo de inventário florestal
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
