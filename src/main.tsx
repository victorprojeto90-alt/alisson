import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './app/App.tsx';
import { ErrorBoundary } from './app/components/ErrorBoundary';
import logoFull from './assets/ambisafe-logo-full2.png';
import './styles/index.css';
import { registerSW } from 'virtual:pwa-register';

// Service worker do app instalável (atualiza sozinho quando há versão nova)
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

// Esconde a tela de abertura depois que o app montou (mínimo de 900ms para a animação)
const splashInicio = performance.now();
function esconderSplash() {
  const el = document.getElementById('splash');
  if (!el) return;
  const espera = Math.max(0, 900 - (performance.now() - splashInicio));
  setTimeout(() => {
    el.classList.add('hide');
    setTimeout(() => el.remove(), 500);
  }, espera);
}

// Tela de erro global (tela branca → tela de erro amigável)
function GlobalFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#00420d',
      gap: '24px',
    }}>
      <img src={logoFull} alt="AMBISAFE" style={{ height: '56px' }} />
      <div style={{ color: 'white', textAlign: 'center' }}>
        <p style={{ fontSize: '18px', fontWeight: 600 }}>
          Ops! Algo inesperado aconteceu.
        </p>
        <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '8px' }}>
          Recarregue a página para continuar.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: '#acd115',
          color: '#00420d',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 24px',
          fontWeight: 700,
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        Recarregar página
      </button>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={<GlobalFallback />} section="Global">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);

requestAnimationFrame(() => esconderSplash());
