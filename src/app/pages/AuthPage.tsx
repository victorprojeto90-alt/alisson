import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Trees, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthPageProps {
  onBack: () => void;
}

export default function AuthPage({ onBack }: AuthPageProps) {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isSignIn) {
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(signInError.message || 'Erro ao fazer login');
        }
      } else {
        const { error: signUpError } = await signUp(email, password, name);
        if (signUpError) {
          setError(signUpError);
        } else {
          setSuccess('Conta criada com sucesso! Faça login para continuar.');
          setIsSignIn(true);
          setEmail('');
          setPassword('');
          setName('');
          setCompanyName('');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="text-white hover:bg-white/10 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="shadow-2xl">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Trees className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">AMBISAFE</h1>
                <p className="text-xs text-muted-foreground">Geotecnologias</p>
              </div>
            </div>
            <div className="text-center">
              <CardTitle className="text-2xl">
                {isSignIn ? 'Bem-vindo de volta' : 'Criar conta'}
              </CardTitle>
              <CardDescription>
                {isSignIn 
                  ? 'Entre com suas credenciais para acessar a plataforma' 
                  : 'Comece seu teste grátis de 14 dias'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isSignIn && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Nome Completo
                    </label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="João Silva"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="company" className="text-sm font-medium">
                      Nome da Empresa
                    </label>
                    <Input
                      id="company"
                      type="text"
                      placeholder="Consultoria Ambiental Ltda"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  E-mail
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-secondary/10 border border-secondary/20 text-secondary px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={loading}
              >
                {loading 
                  ? 'Processando...' 
                  : isSignIn 
                    ? 'Entrar' 
                    : 'Criar Conta Grátis'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignIn(!isSignIn);
                    setError('');
                    setSuccess('');
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  {isSignIn 
                    ? 'Não tem uma conta? Cadastre-se' 
                    : 'Já tem uma conta? Entre'}
                </button>
              </div>

              {!isSignIn && (
                <p className="text-xs text-center text-muted-foreground">
                  Ao criar uma conta, você concorda com nossos Termos de Serviço e Política de Privacidade
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {!isSignIn && (
          <div className="mt-6 text-center text-white text-sm">
            <p className="mb-2">✓ 14 dias de teste grátis</p>
            <p className="mb-2">✓ Sem cartão de crédito</p>
            <p>✓ Cancele quando quiser</p>
          </div>
        )}
      </div>
    </div>
  );
}
