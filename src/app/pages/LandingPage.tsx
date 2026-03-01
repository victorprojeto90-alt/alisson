import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { 
  Trees, 
  BarChart3, 
  Brain, 
  Shield, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Users,
  FileText,
  Sparkles
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onContactSpecialist: () => void;
}

export default function LandingPage({ onGetStarted, onContactSpecialist }: LandingPageProps) {
  const features = [
    {
      icon: <Trees className="w-8 h-8 text-secondary" />,
      title: "Inventário Florestal Completo",
      description: "Suporte a múltiplos métodos de amostragem com cálculos estatísticos automatizados"
    },
    {
      icon: <Brain className="w-8 h-8 text-secondary" />,
      title: "Inteligência Artificial Gemini",
      description: "Relatórios automáticos, detecção de anomalias e simulações de cenários"
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-secondary" />,
      title: "Dashboard Executivo",
      description: "Indicadores estratégicos e Score AMBISAFE em tempo real"
    },
    {
      icon: <Shield className="w-8 h-8 text-secondary" />,
      title: "Segurança Multi-Tenant",
      description: "Isolamento total de dados com Row Level Security"
    }
  ];

  const benefits = [
    "Redução de 80% no tempo de processamento",
    "Relatórios técnicos gerados automaticamente",
    "Conformidade ambiental garantida",
    "Análise de biodiversidade em segundos",
    "Simulações de manejo sustentável",
    "Suporte técnico especializado"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Trees className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">AMBISAFE</h1>
              <p className="text-xs text-muted-foreground">Geotecnologias</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onContactSpecialist} className="hidden md:inline-flex">
              Falar com Especialista
            </Button>
            <Button onClick={onGetStarted}>Entrar</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-secondary text-white py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <ImageWithFallback 
            src="https://images.unsplash.com/photo-1650006883843-c0335fd03c39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3Jlc3QlMjBhZXJpYWwlMjB2aWV3JTIwZ3JlZW58ZW58MXx8fHwxNzcyMzMwMTYwfDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Forest aerial view"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Plataforma Nacional Inteligente</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Gestão Florestal Inteligente para Decisões Estratégicas
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              O padrão nacional de inventário e gestão ambiental
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={onGetStarted} 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 text-lg px-8"
              >
                Teste Grátis 14 Dias
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                onClick={onContactSpecialist} 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 text-lg px-8"
              >
                Falar com Especialista
              </Button>
            </div>
            <p className="mt-6 text-sm text-white/80">
              ✓ Sem cartão de crédito • ✓ Acesso completo • ✓ Suporte incluído
            </p>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              O Problema do Mercado Tradicional
            </h2>
            <p className="text-lg text-muted-foreground">
              Inventários florestais lentos, propensos a erros, sem integração com IA e 
              que não oferecem visão estratégica para tomada de decisão.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-destructive">❌ Modelo Tradicional</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Processamento manual demorado</li>
                  <li>• Planilhas desconexas</li>
                  <li>• Erros estatísticos frequentes</li>
                  <li>• Sem inteligência de negócio</li>
                  <li>• Relatórios genéricos</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-secondary/20 bg-secondary/5">
              <CardHeader>
                <CardTitle className="text-secondary">✓ AMBISAFE Geotecnologias</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• IA detecta e corrige automaticamente</li>
                  <li>• Plataforma unificada na nuvem</li>
                  <li>• Cálculos validados e auditáveis</li>
                  <li>• Score AMBISAFE estratégico</li>
                  <li>• Relatórios técnicos + executivos</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Uma Plataforma Completa
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa para gestão florestal inteligente em um único lugar
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mb-4">{feature.icon}</div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Benefícios Comprovados
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Empresas de consultoria ambiental e gestores florestais que utilizam 
                AMBISAFE reportam resultados excepcionais
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="text-base">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1608222351212-18fe0ec7b13b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwZGFzaGJvYXJkJTIwYW5hbHl0aWNzfGVufDF8fHx8MTc3MjI3NjUyMXww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Dashboard analytics"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Como Funciona
            </h2>
            <p className="text-lg text-muted-foreground">
              Simples, rápido e inteligente
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              { step: "1", title: "Upload de Dados", desc: "Envie suas planilhas CSV ou XLSX", icon: <FileText className="w-6 h-6" /> },
              { step: "2", title: "IA Processa", desc: "Análise automática e validação", icon: <Brain className="w-6 h-6" /> },
              { step: "3", title: "Visualize Resultados", desc: "Dashboard com indicadores chave", icon: <BarChart3 className="w-6 h-6" /> },
              { step: "4", title: "Exporte Relatórios", desc: "Documentos técnicos prontos", icon: <TrendingUp className="w-6 h-6" /> }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                  {item.icon}
                </div>
                <div className="text-2xl font-bold text-primary mb-2">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary to-secondary text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Plano Único e Transparente
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Tudo que você precisa, sem complicação
            </p>
            
            <Card className="bg-white text-foreground shadow-2xl">
              <CardHeader className="text-center pb-8">
                <div className="inline-flex items-center justify-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full mb-4">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-semibold">Plano Profissional</span>
                </div>
                <div className="text-5xl font-bold mb-2">
                  R$ 300<span className="text-2xl text-muted-foreground">/mês</span>
                </div>
                <CardDescription className="text-base">
                  14 dias grátis • Cancele quando quiser
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pb-8">
                <div className="space-y-3">
                  {[
                    "Usuários ilimitados",
                    "Projetos ilimitados",
                    "Integração completa com Gemini AI",
                    "Dashboard executivo",
                    "Relatórios automáticos",
                    "Suporte prioritário",
                    "Todas as atualizações incluídas"
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={onGetStarted} 
                  size="lg" 
                  className="w-full bg-primary hover:bg-primary/90 text-lg"
                >
                  Começar Teste Grátis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Garantia de 14 dias • Sem compromisso
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center bg-muted/30 rounded-2xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Pronto para Revolucionar sua Gestão Florestal?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Junte-se às empresas que escolheram o padrão nacional de gestão ambiental inteligente
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={onGetStarted} size="lg" className="text-lg px-8">
                Iniciar Teste Grátis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button onClick={onContactSpecialist} size="lg" variant="outline" className="text-lg px-8">
                Agendar Demonstração
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Trees className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-primary">AMBISAFE</h3>
                  <p className="text-xs text-muted-foreground">Geotecnologias</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Plataforma Nacional Inteligente de Gestão Florestal e Ambiental
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Funcionalidades</li>
                <li>Preços</li>
                <li>Segurança</li>
                <li>Atualizações</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Sobre</li>
                <li>Blog</li>
                <li>Carreiras</li>
                <li>Contato</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Documentação</li>
                <li>Ajuda</li>
                <li>Status</li>
                <li>API</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 AMBISAFE Geotecnologias. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
