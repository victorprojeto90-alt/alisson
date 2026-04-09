import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Trees,
  BarChart3,
  FileText,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Upload,
  Calculator,
  Download,
  Users,
  Shield,
  Zap,
  ChevronRight,
  Globe,
  BookOpen,
  Leaf,
  GraduationCap,
  Microscope,
  Landmark,
  Clock,
  TrendingUp,
  Target,
  Layers,
  Brain,
  Database,
  Plus,
  Minus,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import ambiLogo from '../../assets/Ambi.png';
import alissonFoto from '../../assets/alisson-monteiro.jpg';

const PRIMARY = '#00420d';
const ACCENT = '#acd115';

const FAQ_ITEMS = [
  {
    q: 'Como funciona a identificação automática de espécies?',
    a: 'O AMBISAFE possui um banco de dados integrado ao Inventário Florestal Nacional. Ao selecionar o Estado (ex: Paraíba) e digitar o nome popular, nossa IA sugere o nome científico atualizado, o Bioma e a família botânica, corrigindo automaticamente erros de digitação e sinonímias.',
  },
  {
    q: 'Os cálculos estatísticos seguem as normas dos órgãos ambientais?',
    a: 'Sim. O sistema realiza os cálculos de fitossociologia (Densidade, Dominância, Frequência, IVI) e diversidade (Shannon, Simpson, Pielou) seguindo a literatura clássica da engenharia florestal. Os relatórios são gerados em formatos aceitos por órgãos municipais, estaduais e federais.',
  },
  {
    q: 'Posso importar meus dados de uma planilha Excel que já tenho?',
    a: 'Com certeza. Você não precisa digitar árvore por árvore no site. Basta fazer o upload do seu arquivo .csv ou .xlsx e nossa IA fará o mapeamento das colunas (DAP, Altura, Espécie) automaticamente para processar o inventário.',
  },
  {
    q: 'O sistema funciona para quais tipos de inventário?',
    a: 'A plataforma atende a: Amostragem Casual Simples — parcelas alocadas aleatoriamente na área de estudo; e Inventário 100% — Censo Florestal — onde todos os indivíduos da área são mensurados individualmente.',
  },
  {
    q: 'Meus dados estarão seguros e privados?',
    a: 'Privacidade é nossa prioridade. Os dados dos seus projetos são criptografados e pertencem exclusivamente a você. Não compartilhamos informações de áreas privadas ou coordenadas geográficas com terceiros ou órgãos fiscalizadores.',
  },
  {
    q: 'O AMBISAFE gera o relatório técnico final em PDF/Word?',
    a: 'Sim. Além da planilha de cálculos, o sistema utiliza IA para redigir a estrutura do relatório (Metodologia e Resultados explicados), economizando horas de escrita.',
  },
  {
    q: 'Preciso instalar algum software no meu computador?',
    a: 'Não. O AMBISAFE é uma plataforma 100% na nuvem (SaaS). Você pode acessar do escritório pelo computador ou do campo via tablet/celular, bastando ter uma conexão com a internet para sincronizar os dados.',
  },
  {
    q: 'Como é feito o cálculo de suficiência amostral?',
    a: 'O AMBISAFE calcula automaticamente o erro de amostragem e o intervalo de confiança. Se a sua amostragem for insuficiente para atingir o erro máximo permitido pelo órgão ambiental (geralmente 10% ou 20%), o sistema emitirá um alerta sugerindo a inclusão de novas parcelas.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'Identificação Automática por IA',
      description: 'Identificação automática de nome científico e família por bioma via IA, a partir de banco de dados dos inventários florestais nacionais integrado ao sistema.',
    },
    {
      icon: <Upload className="w-6 h-6" />,
      title: 'Upload Inteligente',
      description: 'Importe planilhas CSV ou XLSX. O sistema detecta e mapeia automaticamente as colunas (DAP, CAP, HT, Espécie, Parcela).',
    },
    {
      icon: <Calculator className="w-6 h-6" />,
      title: 'Cálculos Automáticos',
      description: 'Fitossociologia completa, índices de diversidade (Shannon, Simpson, Pielou), estrutura diamétrica, volumes e estatística amostral.',
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'Relatório com IA',
      description: 'Inteligência artificial gera o pré-relatório técnico completo, com metodologia, resultados, discussão e conclusão.',
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: 'Exportação Profissional',
      description: 'Exporte em PDF, Word (.docx) editável, Excel com todas as tabelas e gráficos em PNG. Pronto para protocolar.',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Dashboard Executivo',
      description: 'Visualize volumes, densidades, índices de biodiversidade e o Score AMBISAFE (0–100) com gráficos interativos.',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Segurança Multi-Tenant',
      description: 'Isolamento total de dados por empresa com Row Level Security (RLS). Seus dados são exclusivamente seus.',
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: 'Banco de Espécies por Bioma',
      description: 'Banco de dados de espécies com dados do bioma selecionado, a partir dos inventários florestais nacionais disponíveis no Sistema Florestal Brasileiro.',
    },
  ];

  const benefits = [
    { icon: <Clock className="w-6 h-6" />, title: 'Reduza drasticamente o tempo de processamento de dados' },
    { icon: <CheckCircle2 className="w-6 h-6" />, title: 'Elimine erros de cálculos manuais' },
    { icon: <Zap className="w-6 h-6" />, title: 'Economize horas de trabalho' },
    { icon: <FileText className="w-6 h-6" />, title: 'Padronize seus relatórios' },
    { icon: <TrendingUp className="w-6 h-6" />, title: 'Aumente sua produtividade' },
    { icon: <Target className="w-6 h-6" />, title: 'Escale sua consultoria ambiental' },
    { icon: <Layers className="w-6 h-6" />, title: 'Execute mais projetos em menos tempo' },
    { icon: <Brain className="w-6 h-6" />, title: 'Interprete dados com apoio da IA' },
    { icon: <BarChart3 className="w-6 h-6" />, title: 'Transforme dados brutos em informações estratégicas' },
  ];

  const steps = [
    { num: '01', title: 'Crie o projeto', desc: 'Informe área, bioma e tipo de inventário.' },
    { num: '02', title: 'Importe os dados', desc: 'Faça upload da planilha de campo. O sistema mapeia e valida os dados automaticamente.' },
    { num: '03', title: 'Processe o inventário', desc: 'Clique em "Processar". Todos os cálculos são realizados instantaneamente.' },
    { num: '04', title: 'Exporte o relatório', desc: 'Gere o pré-relatório técnico com IA e exporte em PDF, Word ou Excel.' },
  ];

  const targetAudience = [
    { icon: <Trees className="w-5 h-5" />, label: 'Engenheiros Florestais' },
    { icon: <Leaf className="w-5 h-5" />, label: 'Engenheiros Agrônomos' },
    { icon: <Globe className="w-5 h-5" />, label: 'Engenheiros Ambientais' },
    { icon: <Microscope className="w-5 h-5" />, label: 'Biólogos' },
    { icon: <BookOpen className="w-5 h-5" />, label: 'Tecnólogo ou Técnico Florestal' },
    { icon: <Landmark className="w-5 h-5" />, label: 'Órgãos Públicos' },
    { icon: <GraduationCap className="w-5 h-5" />, label: 'Estudantes universitários' },
    { icon: <Users className="w-5 h-5" />, label: 'Qualquer profissional habilitado a realizar inventários florestais' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b border-white/10" style={{ backgroundColor: `${PRIMARY}f2` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: ACCENT }}>
              <Trees className="w-5 h-5" style={{ color: PRIMARY }} />
            </div>
            <div>
              <span className="text-white font-bold text-lg tracking-tight">AMBISAFE</span>
              <span className="text-white/50 text-xs ml-1 hidden sm:inline">Geotecnologias</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#sobre-o-criador" className="hover:text-white transition-colors">Sobre o Criador</a>
            <a href="#planos" className="hover:text-white transition-colors">Planos</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 text-sm"
              onClick={() => navigate('/auth')}
            >
              Entrar
            </Button>
            <Button
              className="text-sm font-semibold"
              style={{ backgroundColor: ACCENT, color: PRIMARY }}
              onClick={() => navigate('/auth')}
            >
              Teste Grátis
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16" style={{ backgroundColor: PRIMARY }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] rounded-full blur-3xl" style={{ backgroundColor: `${ACCENT}15` }} />
          <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full blur-3xl" style={{ backgroundColor: `${ACCENT}10` }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-4xl">
            <div className="mb-10">
              <img
                src={ambiLogo}
                alt="AMBISAFE"
                className="h-14 w-auto"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </div>

            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 border" style={{ backgroundColor: `${ACCENT}20`, borderColor: `${ACCENT}30` }}>
              <Zap className="w-4 h-4" style={{ color: ACCENT }} />
              <span className="text-sm font-medium" style={{ color: ACCENT }}>Plataforma Nacional de Inventário Florestal com IA</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Seu inventário florestal calculado em até{' '}
              <span style={{ color: ACCENT }}>1 minuto</span>{' '}
              com o AMBISAFE.{' '}
              <span className="text-white/80">Rápido, simples e com Inteligência Artificial.</span>
            </h1>

            <p className="text-xl text-white/70 mb-10 max-w-2xl leading-relaxed">
              Transforme dados de campo em relatórios técnicos completos. Cálculos estatísticos,
              fitossociologia, índices de diversidade, estruturas horizontais e verticais,
              distribuição diamétrica e pré-relatório automático com inteligência artificial.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Button
                size="lg"
                className="text-base px-8 py-4 h-auto gap-2 font-semibold"
                style={{ backgroundColor: ACCENT, color: PRIMARY }}
                onClick={() => navigate('/auth')}
              >
                Começar Teste Grátis
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 hover:text-white text-base px-8 py-4 h-auto"
                onClick={() => window.open('https://wa.me/5583991144456', '_blank')}
              >
                Fale Conosco
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { value: '100%', label: 'Cálculos automatizados' },
                { value: '12+', label: 'Tabelas geradas' },
                { value: '1 min', label: 'Tempo de processamento' },
                { value: 'IA', label: 'Relatório automático' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-3xl font-bold" style={{ color: ACCENT }}>{stat.value}</p>
                  <p className="text-white/50 text-sm mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Público-alvo */}
      <section className="py-16 bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-700 text-base font-medium max-w-2xl mx-auto mb-8 leading-relaxed">
            Uma plataforma criada para quem trabalha com florestas e precisa transformar dados
            de campo em relatórios técnicos completos, com agilidade e precisão.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {targetAudience.map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-5 py-2.5 shadow-sm">
                <span style={{ color: PRIMARY }}>{item.icon}</span>
                <span className="text-gray-700 text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Por que usar o AMBISAFE?</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Transforme dados de campo em relatórios técnicos completos com agilidade e precisão — tudo em uma única plataforma.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white" style={{ backgroundColor: PRIMARY }}>
                  {b.icon}
                </div>
                <p className="text-gray-800 font-medium leading-snug mt-1">{b.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problema vs Solução */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">O problema do mercado</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              O processamento de dados de inventário florestal ainda consome horas em planilhas e cálculos manuais — e isso custa tempo e produtividade.
            </p>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mt-3">
              Esqueça planilhas complexas. O AMBISAFE automatiza a análise dos dados e transforma informações de campo em resultados técnicos com rapidez e precisão.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-red-700 mb-6">❌ Jeito tradicional</h3>
              <ul className="space-y-3">
                {[
                  'Cálculos manuais em planilhas Excel com risco de erro',
                  'Horas para calcular fitossociologia e estatística',
                  'Relatórios criados do zero a cada projeto',
                  'Sem padronização entre diferentes consultores',
                  'Difícil de revisar e auditar os cálculos',
                  'Exportação trabalhosa e sem formatação técnica',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-red-800 text-sm">
                    <span className="mt-0.5 text-red-400 flex-shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl p-8 border" style={{ backgroundColor: `${PRIMARY}08`, borderColor: `${PRIMARY}20` }}>
              <h3 className="text-xl font-bold mb-6" style={{ color: PRIMARY }}>✅ Com AMBISAFE</h3>
              <ul className="space-y-3">
                {[
                  'Upload da planilha → cálculos automáticos em segundos',
                  'Fitossociologia, diversidade e estatística completos',
                  'Pré-relatório técnico gerado por IA em português',
                  'Padronização e qualidade garantidos pelo Score AMBISAFE',
                  'Todos os cálculos rastreáveis e verificáveis',
                  'Exportação em PDF, Word e Excel prontos para uso',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-green-800 text-sm">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: ACCENT }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <img src={ambiLogo} alt="AMBISAFE" className="h-12 w-auto" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Como funciona</h2>
            <p className="text-xl text-gray-500">Em 4 passos simples do campo ao relatório</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: PRIMARY }}>
                  <span className="font-bold text-lg" style={{ color: ACCENT }}>{step.num}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="py-24" style={{ backgroundColor: PRIMARY }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Funcionalidades completas</h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Tudo que um inventário florestal profissional precisa, em uma única plataforma
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, i) => (
              <div key={i} className="group p-5 rounded-2xl border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors" style={{ backgroundColor: `${ACCENT}20`, color: ACCENT }}>
                  {feature.icon}
                </div>
                <h3 className="font-bold text-white mb-2 text-sm">{feature.title}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sobre o Criador */}
      <section id="sobre-o-criador" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900">Quem está por trás do AMBISAFE</h2>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-xl" style={{ backgroundColor: PRIMARY }}>
            <div className="grid md:grid-cols-3 gap-0">
              {/* Foto */}
              <div className="md:col-span-1 flex items-center justify-center p-8 md:p-12">
                <div className="relative">
                  <div className="w-52 h-52 md:w-64 md:h-64 rounded-full overflow-hidden shadow-2xl border-4" style={{ borderColor: ACCENT }}>
                    <img
                      src={alissonFoto}
                      alt="Alisson Monteiro"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold shadow-lg" style={{ backgroundColor: ACCENT, color: PRIMARY }}>
                    Engenheiro Florestal · Fundador do AMBISAFE
                  </div>
                </div>
              </div>

              {/* Texto */}
              <div className="md:col-span-2 p-8 md:p-12 flex flex-col justify-center">
                <h3 className="text-3xl font-bold mb-1" style={{ color: ACCENT }}>Alisson Monteiro</h3>
                <p className="text-white/60 text-sm mb-6">Engenheiro Florestal — UFCG</p>

                <div className="space-y-4 text-white/80 text-sm leading-relaxed overflow-y-auto max-h-96 pr-2">
                  <p>
                    <strong className="text-white">Sou Alisson Monteiro</strong>, Engenheiro Florestal formado pela Universidade Federal de Campina Grande (UFCG), movido pela paixão por inovação, tecnologia e soluções práticas para o setor florestal.
                  </p>
                  <p>
                    Minha trajetória profissional começou antes mesmo da conclusão da graduação. Cerca de um ano e meio antes de me formar, já estava inserido no mercado de trabalho, atuando diretamente na área e adquirindo experiência prática. Essa vivência antecipada me permitiu desenvolver uma visão mais realista das demandas do setor e entender, na prática, os desafios enfrentados pelos profissionais que atuam na área.
                  </p>
                  <p>
                    Concluí minha graduação em 2023 e, desde então, sigo atuando de forma ativa no mercado, sempre buscando aprimorar processos e trazer mais eficiência para as atividades da engenharia florestal.
                  </p>
                  <p>
                    Inclusive, meu Trabalho de Conclusão de Curso (TCC) foi desenvolvido na área de inventário florestal, onde optei por explorar o método de ponto quadrante — uma metodologia ainda pouco utilizada no mercado e com limitada abordagem acadêmica. Escolhi esse tema justamente por seu caráter inovador, já que, por ser pouco aplicado, pode ser considerado uma abordagem ainda recente, onde os estudos demonstraram que esse método pode apresentar eficiência equivalente aos inventários convencionais por parcelas.
                  </p>
                  <p>
                    Foi a partir dessa inquietação e do olhar crítico sobre o mercado que surgiu o sistema AMBISAFE. Ao longo da minha atuação profissional, percebi uma grande lacuna no uso de tecnologia aplicada ao processamento de inventários florestais. Muitos profissionais ainda enfrentam dificuldades com cálculos complexos, processos manuais e alto consumo de tempo.
                  </p>
                  <p>
                    O sistema AMBISAFE nasce com o propósito de transformar essa realidade. Ele foi desenvolvido para facilitar, automatizar e otimizar o cálculo de inventários florestais, permitindo que análises que antes poderiam levar dias sejam realizadas em minutos. Mais do que uma ferramenta, o AMBISAFE é o reflexo do meu compromisso com a modernização do setor florestal, trazendo tecnologia, praticidade e eficiência para o dia a dia dos profissionais.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Plano único, acesso completo</h2>
            <p className="text-xl text-gray-500">14 dias grátis · sem cartão de crédito</p>
          </div>
          <div className="max-w-md mx-auto">
            <div className="rounded-3xl p-8 shadow-2xl relative overflow-hidden" style={{ backgroundColor: PRIMARY }}>
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: `${ACCENT}20` }} />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 border" style={{ backgroundColor: `${ACCENT}20`, borderColor: `${ACCENT}30` }}>
                    <span className="text-xs font-medium" style={{ color: ACCENT }}>Profissional</span>
                  </div>
                  <span className="text-white text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: ACCENT, color: PRIMARY }}>ACESSO TOTAL</span>
                </div>
                <div className="flex items-baseline gap-2 my-6">
                  <span className="text-white/50 text-lg">R$</span>
                  <span className="text-white font-bold text-6xl">300</span>
                  <span className="text-white/50">/mês</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    'Projetos ilimitados',
                    'Upload CSV e XLSX',
                    'Todos os cálculos florestais',
                    '12+ tabelas automáticas',
                    'Pré-relatório com IA',
                    'Exportação PDF, Word e Excel',
                    'Score AMBISAFE',
                    'Banco de espécies integrado',
                    'Suporte técnico',
                    'Conta compartilhada com equipe',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/80 text-sm">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full py-4 h-auto text-base gap-2 font-semibold"
                  style={{ backgroundColor: ACCENT, color: PRIMARY }}
                  onClick={() => navigate('/auth')}
                >
                  Começar Teste Grátis
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <p className="text-white/40 text-xs text-center mt-4">
                  Sem cartão de crédito · Cancele quando quiser
                </p>
                <p className="text-white/50 text-xs text-center mt-2">
                  Aceita cadastro com CPF ou CNPJ — ideal para engenheiros autônomos e empresas.
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-400 text-sm mt-10">
            Precisa de condições especiais para grandes volumes?{' '}
            <a
              href="https://wa.me/5583991144456"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline"
              style={{ color: PRIMARY }}
            >
              Fale conosco pelo WhatsApp
            </a>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Perguntas Frequentes</h2>
          </div>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-gray-200">
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-sm text-white transition-colors"
                  style={{ backgroundColor: openFaq === i ? PRIMARY : '#f8f9fa', color: openFaq === i ? '#fff' : '#1a1a1a' }}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{item.q}</span>
                  {openFaq === i
                    ? <Minus className="w-4 h-4 flex-shrink-0 ml-3" />
                    : <Plus className="w-4 h-4 flex-shrink-0 ml-3" />
                  }
                </button>
                {openFaq === i && (
                  <div className="px-6 py-4 bg-white text-gray-600 text-sm leading-relaxed border-t border-gray-100">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Pronto para <span style={{ color: PRIMARY }}>automatizar</span> seus inventários florestais?
          </h2>
          <p className="text-xl text-gray-500 mb-10">
            Junte-se a engenheiros florestais e consultores ambientais que já utilizam AMBISAFE para gerar relatórios técnicos com precisão e agilidade.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-base px-8 py-4 h-auto gap-2 font-semibold"
              style={{ backgroundColor: PRIMARY, color: '#fff' }}
              onClick={() => navigate('/auth')}
            >
              Começar Teste Grátis
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 py-4 h-auto gap-2"
              style={{ borderColor: PRIMARY, color: PRIMARY }}
              onClick={() => window.open('https://wa.me/5583991144456', '_blank')}
            >
              Fale Conosco no WhatsApp
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10" style={{ backgroundColor: PRIMARY }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: ACCENT }}>
                <Trees className="w-5 h-5" style={{ color: PRIMARY }} />
              </div>
              <span className="text-white font-bold">AMBISAFE</span>
              <span className="text-white/40 text-sm">Geotecnologias</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <a
                href="https://wa.me/5583991144456"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Suporte
              </a>
            </div>
            <p className="text-white/30 text-sm">© {new Date().getFullYear()} AMBISAFE Geotecnologias</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
