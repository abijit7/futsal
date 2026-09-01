import { Component, type ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
          <div className="panel w-full max-w-md text-center p-8">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle size={32} />
              </div>
            </div>
            <h1 className="mb-2 text-2xl font-black text-slate-950">Something went wrong</h1>
            <p className="mb-6 text-slate-600">
              We apologize for the inconvenience. An unexpected error occurred.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-sm font-semibold text-slate-500 cursor-pointer">Error details</summary>
                <pre className="mt-3 rounded-2xl bg-slate-100 p-4 text-xs font-mono text-red-700 overflow-auto max-h-48">
                  {this.state.error.message}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </details>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Reload Page
              </button>
              <Link to="/" className="btn-soft flex items-center justify-center gap-2">
                <Home size={18} />
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}