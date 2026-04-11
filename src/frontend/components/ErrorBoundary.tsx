import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-purple-500/5 pointer-events-none" />
          <div className="max-w-md w-full glass-card rounded-[2rem] shadow-2xl p-8 text-center relative z-10 border border-[var(--border-color)]">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/20">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-[var(--text-heading)] mb-3 tracking-tight">System Error</h2>
            <p className="text-[var(--text-color)] mb-8 font-medium">
              {this.state.error?.message || "An unexpected anomaly occurred in the matrix."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="relative w-full py-4 bg-[var(--text-heading)] text-[var(--bg-main)] rounded-xl font-black uppercase tracking-widest text-xs transition-all overflow-hidden group/btn shadow-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-rose-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 group-hover/btn:text-white transition-colors">
                Reboot System
              </span>
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
