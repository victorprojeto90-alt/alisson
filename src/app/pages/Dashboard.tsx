import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import ProjectsModule from '../components/ProjectsModule';
import { 
  Trees, 
  BarChart3, 
  FileText, 
  Settings, 
  LogOut, 
  Plus,
  TrendingUp,
  Users,
  Crown,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface DashboardProps {
  userRole: 'admin' | 'user';
}

export default function Dashboard({ userRole }: DashboardProps) {
  const { user, signOut, empresa } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'reports' | 'settings' | 'admin'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'projects', label: 'Projetos', icon: <Trees className="w-5 h-5" /> },
    { id: 'reports', label: 'Relatórios', icon: <FileText className="w-5 h-5" /> },
    { id: 'settings', label: 'Configurações', icon: <Settings className="w-5 h-5" /> },
  ];

  if (userRole === 'admin') {
    menuItems.push({ id: 'admin', label: 'Admin Supremo', icon: <Crown className="w-5 h-5" /> });
  }

  const stats = [
    { 
      title: 'Projetos Ativos', 
      value: '12', 
      change: '+3 este mês',
      icon: <Trees className="w-8 h-8 text-secondary" />,
      color: 'bg-secondary/10'
    },
    { 
      title: 'Volume Total (m³)', 
      value: '45.890', 
      change: '+12% vs mês anterior',
      icon: <TrendingUp className="w-8 h-8 text-primary" />,
      color: 'bg-primary/10'
    },
    { 
      title: 'Score AMBISAFE', 
      value: '87/100', 
      change: 'Excelente',
      icon: <BarChart3 className="w-8 h-8 text-accent" />,
      color: 'bg-accent/10'
    },
    { 
      title: 'Usuários Ativos', 
      value: '8', 
      change: 'Consultores',
      icon: <Users className="w-8 h-8 text-muted-foreground" />,
      color: 'bg-muted'
    },
  ];

  const recentProjects = [
    { name: 'Fazenda Santa Helena', area: '1.250 ha', status: 'Em análise', score: 92 },
    { name: 'Reserva Amazônia Verde', area: '3.800 ha', status: 'Concluído', score: 88 },
    { name: 'Mata Atlântica Sul', area: '850 ha', status: 'Em processamento', score: 75 },
    { name: 'Floresta Nacional do Norte', area: '5.200 ha', status: 'Aguardando dados', score: null },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col w-64 bg-sidebar text-sidebar-foreground border-r">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <Trees className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">AMBISAFE</h1>
              <p className="text-xs text-sidebar-foreground/70">Geotecnologias</p>
            </div>
          </div>
          {empresa && (
            <p className="text-sm text-sidebar-foreground/90 mt-2">{empresa.nome || 'Minha Empresa'}</p>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 bg-sidebar-primary rounded-full flex items-center justify-center text-white font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-sidebar-foreground/70">
                {userRole === 'admin' ? 'Administrador' : 'Usuário'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-white shadow-lg"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)}>
          <aside className="w-64 h-full bg-sidebar text-sidebar-foreground" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-sidebar-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
                  <Trees className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">AMBISAFE</h1>
                  <p className="text-xs text-sidebar-foreground/70">Geotecnologias</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-sidebar-border">
              <Button
                variant="ghost"
                onClick={signOut}
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Dashboard</h1>
                <p className="text-muted-foreground">Visão geral dos seus projetos e indicadores</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                {stats.map((stat, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-lg ${stat.color}`}>
                          {stat.icon}
                        </div>
                      </div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        {stat.title}
                      </h3>
                      <p className="text-2xl md:text-3xl font-bold mb-1">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.change}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Projects */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Projetos Recentes</CardTitle>
                      <CardDescription>Últimos inventários florestais</CardDescription>
                    </div>
                    <Button onClick={() => setActiveTab('projects')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Projeto
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentProjects.map((project, index) => (
                      <div
                        key={index}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3 cursor-pointer"
                        onClick={() => setActiveTab('projects')}
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{project.name}</h4>
                          <p className="text-sm text-muted-foreground">Área: {project.area}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">{project.status}</p>
                            {project.score !== null && (
                              <p className="text-sm text-muted-foreground">
                                Score: {project.score}/100
                              </p>
                            )}
                          </div>
                          <Button variant="outline" size="sm">
                            Ver detalhes
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <ProjectsModule />
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Relatórios</h1>
                <p className="text-muted-foreground">Documentos técnicos e executivos gerados por IA</p>
              </div>

              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Nenhum Relatório Disponível</h3>
                  <p className="text-muted-foreground">
                    Crie um projeto para gerar relatórios automáticos com IA
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Configurações</h1>
                <p className="text-muted-foreground">Gerencie sua conta e preferências</p>
              </div>

              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações da Conta</CardTitle>
                    <CardDescription>Atualize seus dados pessoais</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">E-mail</label>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                    <Button variant="outline">Editar Perfil</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Assinatura</CardTitle>
                    <CardDescription>Plano Profissional - R$ 300/mês</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Próxima cobrança: 01/04/2026
                    </p>
                    <div className="flex gap-3">
                      <Button variant="outline">Gerenciar Assinatura</Button>
                      <Button variant="outline">Histórico de Pagamentos</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Admin Tab */}
          {activeTab === 'admin' && userRole === 'admin' && (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <Crown className="w-8 h-8 text-yellow-500" />
                  <h1 className="text-3xl md:text-4xl font-bold">Admin Supremo</h1>
                </div>
                <p className="text-muted-foreground">Painel de controle geral da plataforma</p>
              </div>

              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Empresas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold mb-2">245</p>
                      <p className="text-sm text-muted-foreground">+12 este mês</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">MRR</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold mb-2">R$ 73.5K</p>
                      <p className="text-sm text-muted-foreground">+8% vs mês anterior</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Taxa Conversão</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold mb-2">67%</p>
                      <p className="text-sm text-muted-foreground">Trial → Pago</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Controle Operacional</CardTitle>
                    <CardDescription>Ferramentas de administração</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Button variant="outline" className="justify-start">
                        <Users className="w-4 h-4 mr-2" />
                        Gerenciar Empresas
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Consumo de IA
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <FileText className="w-4 h-4 mr-2" />
                        Logs de Auditoria
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <Settings className="w-4 h-4 mr-2" />
                        Configurações Globais
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}