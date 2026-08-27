import { Component, ReactNode } from 'react';
import logoIcon from '../../assets/ambisafe-logo-icon.png';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  section?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error(`[ErrorBoundary${this.props.section ? ` — ${this.props.section}` : ''}]`, error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          padding: '40px',
          textAlign: 'center',
          gap: '16px',
        }}>
          <img src={logoIcon} alt="AMBISAFE" style={{ height: '40px', opacity: 0.5 }} />
          <p style={{ color: '#666', fontSize: '14px' }}>
            {this.props.section
              ? `Algo deu errado em "${this.props.section}".`
              : 'Algo deu errado nesta seção.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              background: '#00420d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
