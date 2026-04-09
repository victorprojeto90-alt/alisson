import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Trees, ArrowLeft, Eye, EyeOff, UserCheck, Briefcase, Mail, KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

type TipoUsuario = 'pessoa_fisica' | 'empresa';

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const [isSignIn, setIsSignIn] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario>('pessoa_fisica');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [cidade, setCidade] = useState('');
  const [estadoUf, setEstadoUf] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Detecta redirecionamento do Supabase com token no hash
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error('Senha deve ter pelo menos 6 caracteres'); return; }
    if (newPassword !== confirmPassword) { toast.error('As senhas não coincidem'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      toast.error('Erro ao atualizar senha: ' + error.message);
    } else {
      toast.success('Senha atualizada com sucesso! Redirecionando...');
      setIsRecovery(false);
      setNewPassword('');
      setConfirmPassword('');
      // Pequeno delay para o toast aparecer antes de redirecionar
      setTimeout(() => navigate('/app/dashboard'), 1500);
    }
  };

  const formatCpfCnpj = (v: string) => {
    const digits = v.replace(/\D/g, '');
    if (tipoUsuario === 'pessoa_fisica') {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').slice(0, 14);
    }
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5').slice(0, 18);
  };

  const formatTelefone = (v: string) => {
    const digits = v.replace(/\D/g, '');
    if (digits.length <= 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3').slice(0, 15);
  };

  const resetForm = () => {
    setName(''); setCompanyName(''); setPassword('');
    setTelefone(''); setCpfCnpj(''); setCidade(''); setEstadoUf('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignIn) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error === 'Invalid login credentials' ? 'E-mail ou senha incorretos' : error);
        } else {
          navigate('/app/dashboard');
        }
      } else {
        if (!name.trim()) { toast.error('Informe seu nome'); return; }
        if (tipoUsuario === 'empresa' && !companyName.trim()) {
          toast.error('Informe o nome da empresa'); return;
        }
        if (password.length < 6) { toast.error('Senha deve ter pelo menos 6 caracteres'); return; }

        const resolvedCompanyName = tipoUsuario === 'empresa' ? companyName.trim() : name.trim();
        const { error } = await signUp(
          email, password, name.trim(), resolvedCompanyName,
          { tipoUsuario, telefone, cpfCnpj, cidade, estadoUf }
        );
        if (error) {
          toast.error(error);
        } else {
          toast.success('Conta criada! Faça login para continuar.');
          setIsSignIn(true);
          resetForm();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Informe seu e-mail'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth`,
    });
    setLoading(false);
    if (error) {
      toast.error('Erro ao enviar e-mail: ' + error.message);
    } else {
      toast.success('Link enviado! Verifique sua caixa de entrada.');
      setIsForgot(false);
    }
  };

  const switchMode = () => {
    setIsSignIn(!isSignIn);
    setIsForgot(false);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B3D2E] via-[#0B3D2E]/95 to-[#16A34A]/80 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/3 -right-1/3 w-[600px] h-[600px] rounded-full bg-[#16A34A]/10 blur-3xl" />
        <div className="absolute -bottom-1/3 -left-1/3 w-[500px] h-[500px] rounded-full bg-[#10B981]/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o início
        </button>

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-4 pb-4">
            <div className="flex items-center justify-center gap-2">
              <div className="w-12 h-12 bg-[#0B3D2E] rounded-xl flex items-center justify-center">
                <Trees className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#0B3D2E]">AMBISAFE</h1>
                <p className="text-xs text-gray-400">Geotecnologias</p>
              </div>
            </div>
            <div className="text-center">
              <CardTitle className="text-xl">
                {isRecovery ? 'Criar nova senha'
                  : isForgot ? 'Redefinir senha'
                  : isSignIn ? 'Bem-vindo de volta'
                  : 'Criar conta'}
              </CardTitle>
              <CardDescription className="mt-1">
                {isRecovery ? 'Escolha uma senha segura para sua conta'
                  : isForgot ? 'Enviaremos um link para seu e-mail'
                  : isSignIn ? 'Entre com suas credenciais para acessar a plataforma'
                  : 'Teste grátis por 14 dias, sem cartão de crédito'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {/* ── Tela de definir nova senha (vindo do link do e-mail) ── */}
            {isRecovery && (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="text-center mb-2">
                  <div className="w-12 h-12 bg-[#0B3D2E]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <KeyRound className="w-6 h-6 text-[#0B3D2E]" />
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Digite sua nova senha abaixo. Use pelo menos 6 caracteres.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Nova senha *</label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      autoFocus
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Confirmar senha *</label>
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#0B3D2E] hover:bg-[#0B3D2E]/90 text-white h-auto py-2.5"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Definir nova senha'}
                </Button>
              </form>
            )}

            {/* ── Tela de redefinição de senha ── */}
            {!isRecovery && isForgot && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="text-center mb-2">
                  <div className="w-12 h-12 bg-[#0B3D2E]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-6 h-6 text-[#0B3D2E]" />
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Informe o e-mail cadastrado e enviaremos um link para redefinir sua senha.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">E-mail *</label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#0B3D2E] hover:bg-[#0B3D2E]/90 text-white h-auto py-2.5"
                  disabled={loading}
                >
                  {loading ? 'Enviando...' : 'Enviar link de redefinição'}
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsForgot(false)}
                    className="text-sm text-[#16A34A] hover:text-[#15803d] hover:underline"
                  >
                    Voltar para o login
                  </button>
                </div>
              </form>
            )}

            {/* ── Tela de login / cadastro ── */}
            {!isRecovery && !isForgot && (
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Tipo de usuário — só no cadastro */}
              {!isSignIn && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Tipo de conta</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTipoUsuario('pessoa_fisica')}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-colors ${
                        tipoUsuario === 'pessoa_fisica'
                          ? 'border-[#16A34A] bg-green-50'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <UserCheck className={`w-5 h-5 ${tipoUsuario === 'pessoa_fisica' ? 'text-[#16A34A]' : 'text-gray-400'}`} />
                      <span className="text-xs font-medium text-gray-800">Pessoa Física</span>
                      <span className="text-[10px] text-gray-400 text-center leading-tight">
                        Engenheiro, consultor, estudante
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoUsuario('empresa')}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-colors ${
                        tipoUsuario === 'empresa'
                          ? 'border-[#16A34A] bg-green-50'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <Briefcase className={`w-5 h-5 ${tipoUsuario === 'empresa' ? 'text-[#16A34A]' : 'text-gray-400'}`} />
                      <span className="text-xs font-medium text-gray-800">Empresa</span>
                      <span className="text-[10px] text-gray-400 text-center leading-tight">
                        Consultoria, órgão, empresa
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Campos de cadastro */}
              {!isSignIn && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      {tipoUsuario === 'empresa' ? 'Nome do Responsável' : 'Nome Completo'} *
                    </label>
                    <Input
                      placeholder="João da Silva"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>

                  {tipoUsuario === 'empresa' && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Nome da Empresa *</label>
                      <Input
                        placeholder="Consultoria Ambiental Ltda"
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        CPF ou CNPJ <span className="text-gray-400 font-normal">(opcional)</span>
                      </label>
                      <Input
                        placeholder={tipoUsuario === 'empresa' ? 'CNPJ (opcional)' : 'CPF (opcional)'}
                        value={cpfCnpj}
                        onChange={e => setCpfCnpj(formatCpfCnpj(e.target.value))}
                        maxLength={tipoUsuario === 'empresa' ? 18 : 14}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Telefone</label>
                      <Input
                        placeholder="(00) 90000-0000"
                        value={telefone}
                        onChange={e => setTelefone(formatTelefone(e.target.value))}
                        maxLength={15}
                        type="tel"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Cidade</label>
                      <Input
                        placeholder="Ex: Manaus"
                        value={cidade}
                        onChange={e => setCidade(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">UF</label>
                      <Input
                        placeholder="AM"
                        value={estadoUf}
                        onChange={e => setEstadoUf(e.target.value.toUpperCase().slice(0, 2))}
                        maxLength={2}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* E-mail e senha — sempre visíveis */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">E-mail *</label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Senha *</label>
                  {isSignIn && (
                    <button
                      type="button"
                      onClick={() => setIsForgot(true)}
                      className="text-xs text-[#16A34A] hover:text-[#15803d] hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={isSignIn ? 'current-password' : 'new-password'}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#0B3D2E] hover:bg-[#0B3D2E]/90 text-white py-2.5 h-auto mt-1"
                disabled={loading}
              >
                {loading
                  ? 'Processando...'
                  : isSignIn
                    ? 'Entrar na plataforma'
                    : 'Criar Conta Grátis'
                }
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-sm text-[#16A34A] hover:text-[#15803d] hover:underline"
                >
                  {isSignIn
                    ? 'Não tem conta? Crie gratuitamente'
                    : 'Já tem conta? Entre aqui'}
                </button>
              </div>

              {!isSignIn && (
                <p className="text-xs text-center text-gray-400">
                  Ao criar uma conta, você concorda com os Termos de Serviço e Política de Privacidade
                </p>
              )}
            </form>
            )}
          </CardContent>
        </Card>

        {!isSignIn && (
          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            {['14 dias grátis', 'Sem cartão', 'Cancele quando quiser'].map((item) => (
              <div key={item} className="bg-white/10 rounded-lg px-3 py-2">
                <p className="text-white text-xs">✓ {item}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
