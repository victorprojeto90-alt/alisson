import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Eye, EyeOff, UserCheck, Briefcase, Mail, KeyRound } from 'lucide-react';
import logoFull from '../../assets/ambisafe-logo-full2.png';
import appCelular from '../../assets/app-celular.jpg';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { validarCpfCnpj, validarEmail } from '../lib/validators';
import { toast } from 'sonner';

type TipoUsuario = 'pessoa_fisica' | 'empresa';

// ─── Animação de entrada (após o login) — estilo aplicativo ─────────────────
function EntradaOverlay({ origem, nome }: { origem: { x: number; y: number }; nome: string }) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6"
      style={{ background: 'radial-gradient(circle at 50% 40%, #0b5a1c 0%, #00420d 55%, #002a08 100%)' }}
      initial={{ clipPath: `circle(0px at ${origem.x}px ${origem.y}px)` }}
      animate={{ clipPath: `circle(150vmax at ${origem.x}px ${origem.y}px)` }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
    >
      <motion.img
        src="/icons/icon-192.png"
        alt=""
        className="w-24 h-24 rounded-[26px] shadow-2xl"
        initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ delay: 0.35, type: 'spring', stiffness: 260, damping: 18 }}
      />
      <motion.div
        className="text-center"
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.4 }}
      >
        <p className="text-white text-xl font-bold">{nome ? `Olá, ${nome}!` : 'Bem-vindo!'}</p>
        <p className="text-white/70 text-sm mt-1">Preparando seu painel…</p>
      </motion.div>
      <motion.div
        className="w-32 h-1 rounded-full bg-white/15 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
      >
        <motion.div
          className="h-full rounded-full bg-[#acd115]"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ delay: 0.7, duration: 0.9, ease: 'easeInOut' }}
        />
      </motion.div>
    </motion.div>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    signIn, signUp, isPasswordRecovery, setIsPasswordRecovery,
    passwordRecoveryError, clearPasswordRecoveryError,
    setEntrando,
  } = useAuth();

  const [isSignIn, setIsSignIn] = useState(searchParams.get('mode') !== 'register');
  const [isForgot, setIsForgot] = useState(false);
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

  // Link de recuperação expirado/já utilizado — Supabase redireciona com
  // #error=...&error_description=... em vez de um token válido. Mostra aviso claro e já
  // leva o usuário para o formulário de "esqueci minha senha" para pedir um novo link.
  useEffect(() => {
    if (passwordRecoveryError) {
      toast.error('Link expirado ou já utilizado. Solicite um novo link de redefinição.');
      setIsForgot(true);
      clearPasswordRecoveryError();
    }
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
      setNewPassword('');
      setConfirmPassword('');
      // Pequeno delay para o toast aparecer antes de sair da tela de recuperação. Só
      // depois de a senha já ter sido trocada com sucesso é que encerramos o estado de
      // recovery e navegamos — antes disso, PublicOnlyRoute mantém o usuário em /auth.
      setTimeout(() => {
        setIsPasswordRecovery(false);
        navigate('/app/dashboard', { replace: true });
      }, 1500);
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

  const [entrada, setEntrada] = useState<{ x: number; y: number; nome: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // origem da animação: centro do botão de enviar
    const btn = (e.currentTarget as HTMLFormElement).querySelector('button[type="submit"]');
    const r = btn?.getBoundingClientRect();
    const origem = r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    try {
      if (isSignIn) {
        setEntrando(true);
        const { error } = await signIn(email, password);
        if (error) {
          setEntrando(false);
          toast.error(error === 'Invalid login credentials' ? 'E-mail ou senha incorretos' : error);
        } else {
          const { data: { user: u } } = await supabase.auth.getUser();
          const nome = String(u?.user_metadata?.name ?? '').split(' ')[0];
          const destino = u?.email === 'admin@ambisafe.com.br' ? '/admin/dashboard' : '/app/dashboard';
          const reduz = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
          setEntrada({ ...origem, nome });
          setTimeout(() => {
            navigate(destino, { replace: true });
            setEntrando(false);
          }, reduz ? 150 : 1650);
        }
      } else {
        if (!name.trim()) { toast.error('Informe seu nome'); return; }
        if (tipoUsuario === 'empresa' && !companyName.trim()) {
          toast.error('Informe o nome da empresa'); return;
        }
        // Todos os dados são obrigatórios — servem para organizar os clientes.
        if (telefone.replace(/\D/g, '').length < 10) { toast.error('Informe um telefone válido com DDD'); return; }
        if (!cidade.trim()) { toast.error('Informe sua cidade'); return; }
        if (!/^[A-Za-z]{2}$/.test(estadoUf.trim())) { toast.error('Informe a UF (ex: PB)'); return; }
        if (!validarEmail(email)) { toast.error('E-mail inválido.'); return; }
        if (password.length < 6) { toast.error('Senha deve ter pelo menos 6 caracteres'); return; }
        // CPF/CNPJ obrigatório e com dígito verificador válido.
        if (!cpfCnpj.trim()) {
          toast.error(`Informe o ${tipoUsuario === 'empresa' ? 'CNPJ' : 'CPF'}`);
          return;
        }
        if (!validarCpfCnpj(cpfCnpj)) {
          toast.error(`${tipoUsuario === 'empresa' ? 'CNPJ' : 'CPF'} inválido. Verifique os dígitos.`);
          return;
        }

        // Um CPF/CNPJ por conta: impede repetir o teste grátis e é usado na cobrança (Asaas)
        const docLabel = tipoUsuario === 'empresa' ? 'CNPJ' : 'CPF';
        const msgDocUsado = `Este ${docLabel} já possui cadastro. Entre com sua conta ou use "Esqueceu a senha?".`;
        const { data: disponivel, error: erroDoc } = await supabase.rpc('documento_disponivel', { p_doc: cpfCnpj });
        if (!erroDoc && disponivel === false) {
          toast.error(msgDocUsado);
          return;
        }

        const resolvedCompanyName = tipoUsuario === 'empresa' ? companyName.trim() : name.trim();
        const { error } = await signUp(
          email, password, name.trim(), resolvedCompanyName,
          { tipoUsuario, telefone, cpfCnpj, cidade, estadoUf }
        );
        if (error) {
          toast.error(/database error|DOCUMENTO_JA_CADASTRADO/i.test(error) ? msgDocUsado : error);
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
    <div className="min-h-[100dvh] bg-gradient-to-br from-[#00420d] via-[#0B3D2E] to-[#16A34A]/80 flex flex-col md:flex-row relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/3 -right-1/3 w-[600px] h-[600px] rounded-full bg-[#16A34A]/10 blur-3xl" />
        <div className="absolute -bottom-1/3 -left-1/3 w-[500px] h-[500px] rounded-full bg-[#10B981]/10 blur-3xl" />
      </div>

      {/* Computador: painel da marca (esquerda) */}
      <div className="hidden md:flex relative md:w-1/2 lg:w-[55%] flex-col justify-between p-10 lg:p-14 text-white">
        <motion.button
          onClick={() => navigate('/')}
          className="self-start"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img src={logoFull} alt="AMBISAFE" className="h-11 w-auto" />
        </motion.button>

        <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-center">
          <div>
            <motion.h2
              className="text-4xl lg:text-5xl font-bold leading-tight"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
            >
              Seu inventário florestal calculado em <span className="text-[#acd115]">minutos</span>
            </motion.h2>
            <ul className="mt-8 space-y-4">
              {[
                'Fitossociologia e estatística 100% automáticas',
                'Relatórios técnicos em PDF, Word e Excel',
                'No escritório ou no campo, pelo celular',
              ].map((item, idx) => (
                <motion.li
                  key={item}
                  className="flex items-center gap-3 text-white/85"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + idx * 0.12, duration: 0.45 }}
                >
                  <span className="w-6 h-6 rounded-full bg-[#acd115] text-[#00420d] flex items-center justify-center text-xs font-black">✓</span>
                  {item}
                </motion.li>
              ))}
            </ul>
          </div>
          <motion.div
            className="hidden lg:block relative"
            initial={{ opacity: 0, y: 40, rotate: 4 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 120, damping: 16 }}
          >
            <div className="absolute inset-0 -m-8 rounded-full blur-3xl bg-[#acd115]/25" />
            <div className="relative w-[230px] rounded-[40px] p-2.5 bg-[#111] shadow-2xl">
              <img src={appCelular} alt="App AMBISAFE no celular" className="w-full rounded-[32px] block" />
            </div>
          </motion.div>
        </div>

        <motion.div
          className="flex gap-3 text-xs text-white/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {['14 dias grátis', 'Sem cartão de crédito', 'Cancele quando quiser'].map(t => (
            <span key={t} className="px-3 py-1.5 rounded-full bg-white/10">✓ {t}</span>
          ))}
        </motion.div>
      </div>

      <div className="relative w-full flex-1 flex flex-col md:w-1/2 lg:w-[45%] md:bg-white md:items-center md:justify-center md:px-10 md:py-10 md:min-h-[100dvh] md:overflow-y-auto">
        <button
          onClick={() => navigate('/')}
          className="self-start md:self-center md:w-full md:max-w-md flex items-center gap-2 text-white/70 hover:text-white md:text-gray-500 md:hover:text-gray-900 transition-colors text-sm mb-2 md:mb-8 mx-5 md:mx-0 mt-[calc(env(safe-area-inset-top)+1rem)] md:mt-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o início
        </button>

        {/* Logo fora do card, sobre o fundo verde */}
        <motion.div
          className="md:hidden flex flex-col items-center justify-center mb-6 px-6 pt-6 pb-2"
          initial={{ opacity: 0, scale: 0.85, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.2, 0.9, 0.3, 1.1] }}
        >
          <img src={logoFull} alt="AMBISAFE" style={{ height: '56px', width: 'auto', objectFit: 'contain' }} />
          <p className="md:hidden text-white/75 text-sm mt-3 text-center">Inventário florestal inteligente</p>
        </motion.div>

        <motion.div
          className="flex-1 md:flex-none flex flex-col md:w-full md:max-w-md"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 30, delay: 0.15 }}
        >
        <Card className="auth-card shadow-2xl md:shadow-none border-0 bg-white flex-1 md:flex-none rounded-t-[28px] rounded-b-none md:rounded-none pb-[env(safe-area-inset-bottom)] md:p-0">
          <CardHeader className="space-y-4 pb-4">
            <div className="text-center md:text-left">
              <CardTitle className="text-xl md:text-3xl md:font-bold">
                {isPasswordRecovery ? 'Criar nova senha'
                  : isForgot ? 'Redefinir senha'
                  : isSignIn ? 'Bem-vindo de volta'
                  : 'Criar conta'}
              </CardTitle>
              <CardDescription className="mt-1 md:mt-2 md:text-base">
                {isPasswordRecovery ? 'Escolha uma senha segura para sua conta'
                  : isForgot ? 'Enviaremos um link para seu e-mail'
                  : isSignIn ? 'Entre com suas credenciais para acessar a plataforma'
                  : 'Teste grátis por 14 dias, sem cartão de crédito'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {/* ── Tela de definir nova senha (vindo do link do e-mail) ── */}
            {isPasswordRecovery && (
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
                  className="w-full bg-[#00420d] hover:bg-[#0B3D2E] text-white h-12 rounded-xl text-base font-semibold"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Definir nova senha'}
                </Button>
              </form>
            )}

            {/* ── Tela de redefinição de senha ── */}
            {!isPasswordRecovery && isForgot && (
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
                  className="w-full bg-[#00420d] hover:bg-[#0B3D2E] text-white h-12 rounded-xl text-base font-semibold"
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
            {!isPasswordRecovery && !isForgot && (
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
                      required
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
                        required
                        placeholder="Consultoria Ambiental Ltda"
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        {tipoUsuario === 'empresa'
                          ? <span>CNPJ *</span>
                          : <span>CPF *</span>
                        }
                      </label>
                      <Input
                        required
                        placeholder={tipoUsuario === 'empresa' ? '00.000.000/0000-00' : '000.000.000-00'}
                        value={cpfCnpj}
                        onChange={e => setCpfCnpj(formatCpfCnpj(e.target.value))}
                        maxLength={tipoUsuario === 'empresa' ? 18 : 14}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Telefone *</label>
                      <Input
                        placeholder="(00) 90000-0000"
                        value={telefone}
                        onChange={e => setTelefone(formatTelefone(e.target.value))}
                        maxLength={15}
                        required
                        type="tel"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Cidade *</label>
                      <Input
                        required
                        placeholder="Ex: Patos"
                        value={cidade}
                        onChange={e => setCidade(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">UF *</label>
                      <Input
                        required
                        placeholder="PB"
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
                className="w-full bg-[#00420d] hover:bg-[#0B3D2E] text-white h-12 mt-2 rounded-xl text-base font-semibold active:scale-[0.98] transition-transform"
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
        </motion.div>

      </div>

      <AnimatePresence>
        {entrada && <EntradaOverlay origem={entrada} nome={entrada.nome} />}
      </AnimatePresence>
    </div>
  );
}
