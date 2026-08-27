import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PLANOS } from '../lib/planos';
import PlanoModal from './payment/PlanoModal';
import logoFull from '../../assets/ambisafe-logo-full2.png';
import { LogOut, MessageCircle } from 'lucide-react';

const SUBTITULOS: Record<string, string> = {
  'Trial expirado': 'Seu período gratuito de 14 dias encerrou.',
  'Assinatura cancelada': 'Sua assinatura foi cancelada.',
  'Pagamento em atraso': 'Identificamos um pagamento em atraso.',
  'Cancelamento solicitado pelo usuário': 'Sua assinatura foi cancelada a pedido.',
};

interface Props {
  reason?: string | null;
}

export default function BlockedScreen({ reason }: Props) {
  const { signOut } = useAuth();
  const [planoModalAberto, setPlanoModalAberto] = useState<string | null>(null);

  const subtitulo = (reason && SUBTITULOS[reason]) || 'Seu acesso à plataforma está temporariamente suspenso.';

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#00420d' }}>
      <button
        onClick={() => signOut()}
        className="absolute top-4 right-4 flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sair
      </button>

      <div className="max-w-5xl w-full text-center">
        <img src={logoFull} alt="AMBISAFE" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} className="mx-auto mb-8" />

        <h1 className="text-3xl font-bold text-white mb-2">Seu acesso está suspenso</h1>
        <p className="text-white/70 mb-10">{subtitulo}</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {PLANOS.map(plano => (
            <div key={plano.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left relative">
              {plano.destaque && (
                <span className="absolute -top-2 right-3 bg-[#acd115] text-[#00420d] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Mais Popular
                </span>
              )}
              <p className="text-white font-semibold">{plano.nome}</p>
              <p className="text-2xl font-black text-[#acd115] mt-1">
                {plano.precoFormatado}<span className="text-xs font-normal text-white/50">/mês</span>
              </p>
              {plano.fidelidade && (
                <p className="text-white/50 text-xs mt-1">
                  Fidelidade {plano.fidelidade} meses · {plano.desconto}% off
                </p>
              )}
              <button
                onClick={() => setPlanoModalAberto(plano.id)}
                className="w-full mt-4 py-2.5 rounded-full font-bold text-sm bg-[#acd115] text-[#00420d] hover:opacity-90 transition-opacity"
              >
                Assinar
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => window.open('https://wa.me/5583991144456', '_blank')}
          className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Falar com suporte
        </button>
      </div>

      {planoModalAberto && (
        <PlanoModal planoInicial={planoModalAberto} onClose={() => setPlanoModalAberto(null)} />
      )}
    </div>
  );
}
