import React from 'react';

interface ErrorBoundaryState { hasError: boolean; message?: string; }
interface ErrorBoundaryProps { children: React.ReactNode; fallback?: React.ReactNode; }

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError(err: any): ErrorBoundaryState { return { hasError: true, message: err?.message || 'Erro inesperado' }; }
  componentDidCatch(error: any, info: any) {
    if (import.meta.env?.DEV) {
      console.error('[ErrorBoundary] caught', error, info);
    }
  }
  reset = () => this.setState({ hasError: false, message: undefined });
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-red-200 bg-red-50 rounded-xl text-sm text-red-700 flex flex-col gap-2">
          <div className="font-semibold">Ocorreu um erro</div>
          <div className="text-xs opacity-80 break-all">{this.state.message}</div>
          <button onClick={this.reset} className="self-start text-xs px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700">Tentar novamente</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;