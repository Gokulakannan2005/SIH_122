import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('DATUM Uncaught Exception caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    // Clear potentially corrupted session state
    try {
      localStorage.removeItem('datum_current_project_id');
      localStorage.removeItem('datum_is_clean_project');
      localStorage.removeItem('datum_manual_task_progress');
    } catch {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleHardReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#07101e',
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
            zIndex: 999999,
          }}
        >
          <div
            style={{
              maxWidth: 680,
              width: '100%',
              background: '#0f172a',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 16,
              padding: '2.25rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                  fontSize: '1.5rem',
                  fontWeight: 900,
                }}
              >
                !
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                  DATUM Client Runtime Recovered
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '3px 0 0 0' }}>
                  An unexpected UI rendering exception was captured safely.
                </p>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid #1e293b',
                borderRadius: 8,
                padding: '1rem',
                fontSize: '0.78rem',
                fontFamily: 'JetBrains Mono, monospace',
                color: '#fca5a5',
                maxHeight: 180,
                overflowY: 'auto',
                marginBottom: '1.5rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error?.toString() || 'Unknown runtime error occurred.'}
              {this.state.errorInfo?.componentStack && (
                <div style={{ marginTop: '0.75rem', color: '#94a3b8', fontSize: '0.7rem' }}>
                  {this.state.errorInfo.componentStack}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={this.handleHardReset}
                style={{
                  padding: '0.65rem 1.25rem',
                  background: 'transparent',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  color: '#94a3b8',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Reset All Local Storage
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '0.65rem 1.4rem',
                  background: '#0284c7',
                  border: 'none',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
                  transition: 'all 0.15s ease',
                }}
              >
                Reload & Restore Session
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
