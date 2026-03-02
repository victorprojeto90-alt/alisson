import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { User, Building2, Crown, Loader2, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function Configuracoes() {
  const { user, profile, empresa } = useAuth();
  const [name, setName] = useState(profile?.name ?? '');
  const [companyName, setCompanyName] = useState(empresa?.name ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmpresa, setSavingEmpresa] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ name: name.trim() })
      .eq('id', user.id);
    setSavingProfile(false);
    if (error) toast.error('Erro ao salvar perfil: ' + error.message);
    else toast.success('Perfil atualizado!');
  };

  const handleSaveEmpresa = async () => {
    if (!empresa) return;
    setSavingEmpresa(true);
    const { error } = await supabase
      .from('empresas')
      .update({ name: companyName.trim() })
      .eq('id', empresa.id);
    setSavingEmpresa(false);
    if (error) toast.error('Erro ao salvar empresa: ' + error.message);
    else toast.success('Empresa atualizada!');
  };

  const trialEndsAt = empresa?.trial_ends_at ? new Date(empresa.trial_ends_at) : null;
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const isTrialExpired = trialEndsAt ? trialEndsAt < new Date() : false;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-400 text-sm mt-1">Gerencie seu perfil e dados da empresa</p>
      </div>

      <div className="space-y-6">
        {/* Perfil */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0B3D2E]/10 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-[#0B3D2E]" />
              </div>
              <div>
                <CardTitle className="text-base">Perfil</CardTitle>
                <CardDescription className="text-xs">Suas informações pessoais</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Nome</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input
                value={user?.email ?? ''}
                disabled
                className="bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400">O e-mail não pode ser alterado</p>
            </div>
            <div className="space-y-1.5">
              <Label>Função</Label>
              <Input
                value={profile?.role === 'admin' ? 'Administrador' : profile?.role ?? '—'}
                disabled
                className="bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile || !name.trim()}
              className="bg-[#0B3D2E] hover:bg-[#0B3D2E]/90 text-white"
            >
              {savingProfile
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Salvando...</>
                : <><Check className="w-4 h-4 mr-2" />Salvar Perfil</>
              }
            </Button>
          </CardContent>
        </Card>

        {/* Empresa */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0B3D2E]/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#0B3D2E]" />
              </div>
              <div>
                <CardTitle className="text-base">Empresa</CardTitle>
                <CardDescription className="text-xs">Dados da sua organização</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="company-name">Nome da Empresa</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Nome da organização"
              />
            </div>

            {/* Plano */}
            <div className="space-y-1.5">
              <Label>Plano Atual</Label>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                {empresa?.plan === 'profissional' ? (
                  <div className="flex items-center gap-3 flex-1">
                    <Crown className="w-5 h-5 text-[#16A34A]" />
                    <div>
                      <p className="font-semibold text-[#0B3D2E]">Profissional</p>
                      <p className="text-xs text-gray-500">Acesso completo a todos os recursos</p>
                    </div>
                    <Badge className="ml-auto bg-[#16A34A] text-white border-0">Ativo</Badge>
                  </div>
                ) : (
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold text-gray-800">Trial</span>
                      {!isTrialExpired ? (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50 ml-auto">
                          {trialDaysLeft} dias restantes
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 ml-auto">
                          Expirado
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      Para assinar o plano Profissional, entre em contato: <strong>contato@ambisafe.com.br</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleSaveEmpresa}
              disabled={savingEmpresa || !companyName.trim()}
              className="bg-[#0B3D2E] hover:bg-[#0B3D2E]/90 text-white"
            >
              {savingEmpresa
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Salvando...</>
                : <><Check className="w-4 h-4 mr-2" />Salvar Empresa</>
              }
            </Button>
          </CardContent>
        </Card>

        {/* Conta */}
        <Card className="border-0 shadow-sm border-red-100">
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-gray-700">Zona de Perigo</CardTitle>
            <CardDescription className="text-xs">Ações irreversíveis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border border-red-100 rounded-xl bg-red-50/50">
              <div>
                <p className="text-sm font-medium text-gray-800">Excluir minha conta</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Remove permanentemente todos os seus dados e projetos
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => toast.error('Para excluir sua conta, entre em contato com contato@ambisafe.com.br')}
              >
                Excluir Conta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
