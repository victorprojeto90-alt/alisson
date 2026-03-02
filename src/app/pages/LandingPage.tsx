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
  Star,
  ChevronRight,
  Globe,
  BookOpen,
} from 'lucide-react';
import { Button } from '../components/ui/button';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
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
      description: 'Inteligência artificial Gemini gera o pré-relatório técnico completo, com metodologia, resultados, discussão e conclusão.',
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
  ];

  const steps = [
    { num: '01', title: 'Crie o projeto', desc: 'Informe área, bioma, tipo de inventário e motivo (licenciamento, manejo, supressão, acadêmico).' },
    { num: '02', title: 'Importe os dados', desc: 'Faça upload da planilha de campo. O sistema mapeia e valida os dados automaticamente.' },
    { num: '03', title: 'Processe o inventário', desc: 'Clique em "Processar". Todos os cálculos são realizados instantaneamente.' },
    { num: '04', title: 'Exporte o relatório', desc: 'Gere o pré-relatório técnico com IA e exporte em PDF, Word ou Excel.' },
  ];

  const targetAudience = [
    { icon: <BookOpen className="w-5 h-5" />, label: 'Engenheiros Florestais' },
    { icon: <Globe className="w-5 h-5" />, label: 'Consultores Ambientais' },
    { icon: <Users className="w-5 h-5" />, label: 'Biólogos e Ecólogos' },
    { icon: <Star className="w-5 h-5" />, label: 'Gestores Ambientais' },
    { icon: <Shield className="w-5 h-5" />, label: 'Órgãos Públicos' },
    { icon: <FileText className="w-5 h-5" />, label: 'Universidades' },
  ];

  const differentials = [
    'Identificação automática de nome científico e família por bioma via IA',
    'Geração de pré-relatório técnico com linguagem adaptada ao motivo do inventário',
    'Estrutura diamétrica, vertical e fitossociologia completa em segundos',
    'Score AMBISAFE exclusivo com 5 dimensões de qualidade técnica',
    'Exportação em Word editável — quase pronto para protocolar',
    'Banco de espécies integrado com dados do bioma selecionado',
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0B3D2E]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#16A34A] rounded-lg flex items-center justify-center">
              <Trees className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg tracking-tight">AMBISAFE</span>
              <span className="text-white/50 text-xs ml-1 hidden sm:inline">Geotecnologias</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#planos" className="hover:text-white transition-colors">Planos</a>
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
              className="bg-[#16A34A] hover:bg-[#15803d] text-white text-sm"
              onClick={() => navigate('/auth')}
            >
              Teste Grátis
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen bg-[#0B3D2E] flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] rounded-full bg-[#16A34A]/10 blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-[#10B981]/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-[#16A34A]/20 border border-[#16A34A]/30 rounded-full px-4 py-1.5 mb-8">
              <Zap className="w-4 h-4 text-[#10B981]" />
              <span className="text-[#10B981] text-sm font-medium">Plataforma Nacional de Inventário Florestal com IA</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              Gestão Florestal{' '}
              <span className="text-[#16A34A]">Inteligente</span>{' '}
              para Decisões Estratégicas
            </h1>

            <p className="text-xl text-white/70 mb-10 max-w-2xl leading-relaxed">
              Transforme dados de campo em relatórios técnicos completos. Cálculos estatísticos,
              fitossociologia, índices de diversidade e pré-relatório automático com inteligência artificial.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Button
                size="lg"
                className="bg-[#16A34A] hover:bg-[#15803d] text-white text-base px-8 py-4 h-auto gap-2"
                onClick={() => navigate('/auth')}
              >
                Começar Teste Grátis — 14 dias
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 hover:text-white text-base px-8 py-4 h-auto"
                onClick={() => navigate('/auth')}
              >
                Ver Demonstração
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { value: '100%', label: 'Cálculos automatizados' },
                { value: '12+', label: 'Tabelas geradas' },
                { value: '14 dias', label: 'Trial gratuito' },
                { value: 'IA', label: 'Relatório automático' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-3xl font-bold text-[#10B981]">{stat.value}</p>
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
          <p className="text-center text-gray-500 text-sm font-medium uppercase tracking-widest mb-8">
            Desenvolvido para profissionais da área florestal e ambiental
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {targetAudience.map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-5 py-2.5 shadow-sm">
                <span className="text-[#0B3D2E]">{item.icon}</span>
                <span className="text-gray-700 text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problema vs Solução */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">O problema do mercado</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              O processamento de inventários florestais ainda é feito manualmente, consumindo horas de trabalho e gerando riscos de erros.
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
            <div className="bg-green-50 border border-green-100 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-[#0B3D2E] mb-6">✅ Com AMBISAFE</h3>
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
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Como funciona</h2>
            <p className="text-xl text-gray-500">Em 4 passos simples do campo ao relatório</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="w-14 h-14 bg-[#0B3D2E] rounded-xl flex items-center justify-center mb-4">
                  <span className="text-[#10B981] font-bold text-lg">{step.num}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Funcionalidades completas</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Tudo que um inventário florestal profissional precisa, em uma única plataforma
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="group p-6 rounded-2xl border border-gray-100 hover:border-[#16A34A]/30 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-[#0B3D2E]/10 rounded-xl flex items-center justify-center mb-4 text-[#0B3D2E] group-hover:bg-[#0B3D2E] group-hover:text-white transition-colors">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="py-24 bg-[#0B3D2E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#16A34A]/20 border border-[#16A34A]/30 rounded-full px-4 py-1.5 mb-6">
                <Star className="w-4 h-4 text-[#10B981]" />
                <span className="text-[#10B981] text-sm font-medium">Diferenciais exclusivos</span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-6">
                O padrão nacional de inventário florestal digital
              </h2>
              <p className="text-white/60 text-lg mb-8">
                Desenvolvido especificamente para o mercado brasileiro, com suporte a todos os biomas nacionais e conformidade com a legislação florestal vigente.
              </p>
              <Button
                size="lg"
                className="bg-[#16A34A] hover:bg-[#15803d] text-white gap-2"
                onClick={() => navigate('/auth')}
              >
                Começar agora
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-4">
              {differentials.map((diff, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
                  <CheckCircle2 className="w-5 h-5 text-[#16A34A] mt-0.5 flex-shrink-0" />
                  <p className="text-white/80 text-sm">{diff}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Planos para cada perfil</h2>
            <p className="text-xl text-gray-500">14 dias grátis em qualquer plano · sem cartão de crédito</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">

            {/* Pessoa Física */}
            <div className="rounded-3xl border-2 border-gray-200 p-8 relative overflow-hidden hover:border-[#16A34A]/40 transition-colors">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 rounded-full px-3 py-1 mb-4">
                  <span className="text-[#16A34A] text-xs font-medium">Pessoa Física</span>
                </div>
                <h3 className="text-gray-900 font-bold text-xl mb-1">Profissional</h3>
                <p className="text-gray-500 text-sm">Engenheiro, consultor ou estudante autônomo</p>
              </div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-gray-400 text-lg">R$</span>
                <span className="text-gray-900 font-bold text-6xl">150</span>
                <span className="text-gray-400">/mês</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Até 10 projetos ativos',
                  'Upload CSV e XLSX',
                  'Todos os cálculos florestais',
                  '12+ tabelas automáticas',
                  'Pré-relatório com IA Gemini',
                  'Exportação PDF, Word e Excel',
                  'Score AMBISAFE',
                  '1 usuário',
                  'Suporte por e-mail',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-600 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full bg-[#0B3D2E] hover:bg-[#0B3D2E]/90 text-white py-4 h-auto text-base gap-2"
                onClick={() => navigate('/auth')}
              >
                Começar Teste Grátis
                <ArrowRight className="w-5 h-5" />
              </Button>
              <p className="text-gray-400 text-xs text-center mt-3">
                Sem cartão de crédito · Cancele quando quiser
              </p>
            </div>

            {/* Empresa */}
            <div className="bg-[#0B3D2E] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#16A34A]/20 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex items-center gap-2 bg-[#16A34A]/20 border border-[#16A34A]/30 rounded-full px-3 py-1">
                    <span className="text-[#10B981] text-xs font-medium">Empresa</span>
                  </div>
                  <span className="bg-[#16A34A] text-white text-xs font-bold px-3 py-1 rounded-full">MAIS POPULAR</span>
                </div>
                <h3 className="text-white font-bold text-xl mb-1">Corporativo</h3>
                <p className="text-white/60 text-sm">Consultoria, órgão público ou empresa ambiental</p>
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
                    'Pré-relatório com IA Gemini',
                    'Exportação PDF, Word e Excel',
                    'Score AMBISAFE',
                    'Multiusuário (até 5 usuários)',
                    'Suporte técnico prioritário',
                    'CNPJ e dados empresariais',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-white/80 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-[#16A34A] hover:bg-[#15803d] text-white py-4 h-auto text-base gap-2"
                  onClick={() => navigate('/auth')}
                >
                  Começar Teste Grátis
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <p className="text-white/40 text-xs text-center mt-4">
                  Sem cartão de crédito · Cancele quando quiser
                </p>
              </div>
            </div>

          </div>

          <p className="text-center text-gray-400 text-sm mt-10">
            Precisa de um plano personalizado para grandes volumes?{' '}
            <a href="mailto:contato@ambisafe.com.br" className="text-[#16A34A] hover:underline font-medium">
              Fale conosco
            </a>
          </p>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-gray-50 border-t">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Pronto para modernizar seus inventários florestais?
          </h2>
          <p className="text-xl text-gray-500 mb-10">
            Junte-se a engenheiros florestais e consultores ambientais que já utilizam AMBISAFE para gerar relatórios técnicos com precisão e agilidade.
          </p>
          <Button
            size="lg"
            className="bg-[#0B3D2E] hover:bg-[#0B3D2E]/90 text-white text-base px-8 py-4 h-auto gap-2"
            onClick={() => navigate('/auth')}
          >
            Começar Teste Grátis — 14 dias
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B3D2E] py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#16A34A] rounded-lg flex items-center justify-center">
                <Trees className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold">AMBISAFE</span>
              <span className="text-white/40 text-sm">Geotecnologias</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Suporte</a>
            </div>
            <p className="text-white/30 text-sm">© {new Date().getFullYear()} AMBISAFE Geotecnologias</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
