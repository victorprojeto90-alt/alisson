import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Download, Share, X } from 'lucide-react';

// Evento do Chrome/Android para instalar o app
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const CHAVE = 'ambisafe-install-dispensado';

function lerDispensado(): boolean {
  try {
    const v = localStorage.getItem(CHAVE);
    // volta a oferecer depois de 7 dias
    return !!v && Date.now() - Number(v) < 7 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function salvarDispensado() {
  try { localStorage.setItem(CHAVE, String(Date.now())); } catch { /* sem storage */ }
}

function jaInstalado(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches
    || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

export default function InstallPrompt() {
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null);
  const [mostrarIOS, setMostrarIOS] = useState(false);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (jaInstalado() || lerDispensado()) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvento(e as BeforeInstallPromptEvent);
      setVisivel(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    // iPhone/iPad no Safari não tem botão automático: mostramos o passo a passo
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/i.test(ua);
    const safari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (ios && safari) {
      timer = setTimeout(() => { setMostrarIOS(true); setVisivel(true); }, 2500);
    }

    const onInstalled = () => setVisivel(false);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const fechar = () => { setVisivel(false); salvarDispensado(); };

  const instalar = async () => {
    if (!evento) return;
    await evento.prompt();
    await evento.userChoice;
    setEvento(null);
    setVisivel(false);
  };

  return (
    <AnimatePresence>
      {visivel && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="md:hidden fixed left-3 right-3 z-40 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] bg-[#00420d] text-white rounded-2xl shadow-2xl p-4"
          role="dialog"
          aria-label="Instalar aplicativo"
        >
          <button onClick={fechar} aria-label="Fechar" className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white/70 active:bg-white/10">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 pr-6">
            <img src="/icons/icon-192.png" alt="" className="w-12 h-12 rounded-xl flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-[15px] leading-tight">Instale o app AMBISAFE</p>
              {mostrarIOS ? (
                <p className="text-xs text-white/80 mt-1 leading-snug">
                  Toque em <Share className="inline w-3.5 h-3.5 -mt-0.5" /> <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.
                </p>
              ) : (
                <p className="text-xs text-white/80 mt-1 leading-snug">Acesso rápido pela tela inicial, em tela cheia, como um aplicativo.</p>
              )}
            </div>
          </div>
          {!mostrarIOS && (
            <button
              onClick={instalar}
              className="mt-3 w-full h-11 rounded-xl bg-[#acd115] text-[#00420d] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Download className="w-4 h-4" /> Instalar agora
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
