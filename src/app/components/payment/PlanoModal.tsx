import { useState } from 'react';
import { PLANOS, type Plano } from '../../lib/planos';
import {
  criarOuRecuperarCliente, criarAssinatura, buscarPixDaAssinatura, buscarStatusAssinatura,
} from '../../lib/asaasProxy';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import {
  X, QrCode, CreditCard, Copy, Check, Loader2, ArrowLeft, MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';

type Etapa = 'plano' | 'metodo' | 'pix' | 'cartao-indisponivel';

interface Props {
  onClose: () => void;
  /** Plano pré-selecionado (ex: vindo da BlockedScreen) */
  planoInicial?: string;
}

export default function PlanoModal({ onClose, planoInicial }: Props) {
  const { user, profile, empresa } = useAuth();

  const [etapa, setEtapa] = useState<Etapa>('plano');
  const [planoSelecionado, setPlanoSelecionado] = useState<Plano | null>(
    planoInicial ? PLANOS.find(p => p.id === planoInicial) ?? null : null
  );
  const [processando, setProcessando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [pix, setPix] = useState<{ encodedImage?: string; payload?: string } | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  const escolherPlano = (plano: Plano) => {
    setPlanoSelecionado(plano);
    setEtapa('metodo');
  };

  const handlePix = async () => {
    if (!planoSelecionado || !empresa || !user) return;
    setProcessando(true);
    try {
      const { customerId } = await criarOuRecuperarCliente({
        empresaId: empresa.id,
        nome: empresa.name,
        email: user.email ?? '',
        cpfCnpj: empresa.cnpj ?? profile?.cpf_cnpj ?? undefined,
        telefone: empresa.telefone ?? profile?.telefone ?? undefined,
        cidade: empresa.cidade ?? profile?.cidade ?? undefined,
        uf: empresa.estado_uf ?? profile?.estado_uf ?? undefined,
      });
      if (!customerId) throw new Error('Não foi possível criar o cliente no Asaas');

      const { subscriptionId: subId } = await criarAssinatura(
        empresa.id, planoSelecionado.id, planoSelecionado.preco, 'PIX'
      );
      setSubscriptionId(subId);

      const dadosPix = await buscarPixDaAssinatura(subId);
      if (!dadosPix.pendente) throw new Error('Cobrança PIX ainda não disponível — tente novamente em instantes.');
      setPix({ encodedImage: dadosPix.encodedImage, payload: dadosPix.payload });
      setEtapa('pix');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao gerar cobrança PIX');
    } finally {
      setProcessando(false);
    }
  };

  const handleCopiarPix = () => {
    if (!pix?.payload) return;
    navigator.clipboard.writeText(pix.payload);
    setCopiado(true);
    toast.success('Código PIX copiado!');
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleVerificarPagamento = async () => {
    if (!subscriptionId) return;
    setVerificando(true);
    try {
      const status = await buscarStatusAssinatura(subscriptionId);
      if (status.ativo) {
        toast.success('Pagamento confirmado! Seu acesso foi liberado.');
        onClose();
      } else {
        toast.info('Ainda não identificamos o pagamento. Isso pode levar alguns minutos após o PIX ser enviado.');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao verificar pagamento');
    } finally {
      setVerificando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {etapa !== 'plano' && (
              <button
                onClick={() => setEtapa(etapa === 'pix' || etapa === 'cartao-indisponivel' ? 'metodo' : 'plano')}
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h3 className="text-lg font-bold text-gray-900">Assinar plano AMBISAFE</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Etapa 1: seleção do plano */}
        {etapa === 'plano' && (
          <div className="grid sm:grid-cols-2 gap-3">
            {PLANOS.map(plano => (
              <button
                key={plano.id}
                onClick={() => escolherPlano(plano)}
                className="text-left p-4 rounded-xl border-2 border-gray-100 hover:border-[#16A34A] transition-colors relative"
              >
                {plano.destaque && (
                  <span className="absolute -top-2 right-3 bg-[#16A34A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Mais Popular
                  </span>
                )}
                <p className="font-semibold text-gray-900">{plano.nome}</p>
                <p className="text-2xl font-black text-[#0B3D2E] mt-1">
                  {plano.precoFormatado}<span className="text-xs font-normal text-gray-400">/mês</span>
                </p>
                {plano.fidelidade && (
                  <p className="text-xs text-gray-500 mt-1">
                    Fidelidade {plano.fidelidade} meses · {plano.desconto}% off
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Etapa 2: método de pagamento */}
        {etapa === 'metodo' && planoSelecionado && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Plano <strong className="text-gray-900">{planoSelecionado.nome}</strong> — {planoSelecionado.precoFormatado}/mês
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePix}
                disabled={processando}
                className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-gray-100 hover:border-[#16A34A] transition-colors disabled:opacity-50"
              >
                {processando ? <Loader2 className="w-8 h-8 text-[#16A34A] animate-spin" /> : <QrCode className="w-8 h-8 text-[#16A34A]" />}
                <span className="font-semibold text-sm">PIX</span>
              </button>
              <button
                onClick={() => setEtapa('cartao-indisponivel')}
                className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-gray-100 hover:border-gray-300 transition-colors"
              >
                <CreditCard className="w-8 h-8 text-gray-400" />
                <span className="font-semibold text-sm">Cartão de Crédito</span>
              </button>
            </div>
          </div>
        )}

        {/* Cartão — coleta de nº do cartão não implementada de propósito (ver resumo) */}
        {etapa === 'cartao-indisponivel' && (
          <div className="text-center py-6 space-y-4">
            <CreditCard className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm text-gray-600">
              Pagamento por cartão ainda não está disponível diretamente no site.
              Fale com a gente pelo WhatsApp para assinar com cartão de crédito.
            </p>
            <Button
              onClick={() => window.open('https://wa.me/5583991144456', '_blank')}
              className="bg-[#16A34A] hover:bg-[#15803d] text-white gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Falar no WhatsApp
            </Button>
          </div>
        )}

        {/* Etapa 3: PIX */}
        {etapa === 'pix' && pix && (
          <div className="text-center space-y-4">
            {pix.encodedImage && (
              <img
                src={`data:image/png;base64,${pix.encodedImage}`}
                alt="QR Code PIX"
                className="w-48 h-48 mx-auto border border-gray-100 rounded-xl"
              />
            )}
            {pix.payload && (
              <div className="text-left">
                <p className="text-xs text-gray-400 mb-1">Código PIX copia-e-cola:</p>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <code className="text-xs text-gray-600 flex-1 break-all">{pix.payload}</code>
                  <button onClick={handleCopiarPix} className="flex-shrink-0 text-gray-400 hover:text-gray-700">
                    {copiado ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
            <p className="text-xs text-gray-400">
              Após o pagamento, seu acesso será liberado automaticamente (pode levar alguns minutos).
            </p>
            <Button
              onClick={handleVerificarPagamento}
              disabled={verificando}
              variant="outline"
              className="w-full gap-2"
            >
              {verificando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Já paguei — Verificar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
