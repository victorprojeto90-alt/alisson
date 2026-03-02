import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Trees, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignIn) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error === 'Invalid login credentials'
            ? 'E-mail ou senha incorretos'
            : error
          );
        } else {
          navigate('/app/dashboard');
        }
      } else {
        if (!name.trim()) { toast.error('Informe seu nome'); setLoading(false); return; }
        if (!companyName.trim()) { toast.error('Informe o nome da empresa'); setLoading(false); return; }
        if (password.length < 6) { toast.error('Senha deve ter pelo menos 6 caracteres'); setLoading(false); return; }

        const { error } = await signUp(email, password, name, companyName);
        if (error) {
          toast.error(error);
        } else {
          toast.success('Conta criada! Faça login para continuar.');
          setIsSignIn(true);
          setName('');
          setCompanyName('');
          setPassword('');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B3D2E] via-[#0B3D2E]/95 to-[#16A34A]/80 flex items-center justify-center p-4">
      {/* Background decoration */}
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
          <CardHeader className="space-y-4 pb-6">
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
                {isSignIn ? 'Bem-vindo de volta' : 'Criar conta'}
              </CardTitle>
              <CardDescription className="mt-1">
                {isSignIn
                  ? 'Entre com suas credenciais para acessar a plataforma'
                  : 'Comece seu teste grátis de 14 dias, sem cartão de crédito'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isSignIn && (
                <>
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Nome Completo
                    </label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="João Silva"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required={!isSignIn}
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="company" className="text-sm font-medium text-gray-700">
                      Nome da Empresa / Organização
                    </label>
                    <Input
                      id="company"
                      type="text"
                      placeholder="Consultoria Ambiental Ltda"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      required={!isSignIn}
                    />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  E-mail
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Senha
                </label>
                <div className="relative">
                  <Input
                    id="password"
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
                className="w-full bg-[#0B3D2E] hover:bg-[#0B3D2E]/90 text-white py-2.5 h-auto mt-2"
                disabled={loading}
              >
                {loading
                  ? 'Processando...'
                  : isSignIn
                    ? 'Entrar na plataforma'
                    : 'Criar Conta Grátis'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignIn(!isSignIn);
                    setName('');
                    setCompanyName('');
                    setPassword('');
                  }}
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
          </CardContent>
        </Card>

        {!isSignIn && (
          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            {['14 dias grátis', 'Sem cartão', 'Cancele quando quiser'].map((item, i) => (
              <div key={i} className="bg-white/10 rounded-lg px-3 py-2">
                <p className="text-white text-xs">✓ {item}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
