import React from 'react';
import { useProject } from '../context/ProjectContext';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';
import { ToastNotification } from '../types';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useProject();

  if (!toasts || toasts.length === 0) return null;

  const getIcon = (type: ToastNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} style={{ color: '#047857', flexShrink: 0 }} />;
      case 'warning':
        return <AlertTriangle size={18} style={{ color: '#b45309', flexShrink: 0 }} />;
      case 'error':
        return <AlertOctagon size={18} style={{ color: '#b91c1c', flexShrink: 0 }} />;
      case 'info':
      default:
        return <Info size={18} style={{ color: '#0284c7', flexShrink: 0 }} />;
    }
  };

  const getBorderColor = (type: ToastNotification['type']) => {
    switch (type) {
      case 'success':
        return '#6ee7b7';
      case 'warning':
        return '#fcd34d';
      case 'error':
        return '#fca5a5';
      case 'info':
      default:
        return '#bae6fd';
    }
  };

  const getBgColor = (type: ToastNotification['type']) => {
    switch (type) {
      case 'success':
        return '#f0fdf4';
      case 'warning':
        return '#fffbeb';
      case 'error':
        return '#fef2f2';
      case 'info':
      default:
        return '#f0f9ff';
    }
  };

  return (
    <aside
      aria-label="System Notifications"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        maxWidth: '420px',
        width: 'calc(100vw - 3rem)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast-item toast-${toast.type}`}
          role="alert"
          style={{
            pointerEvents: 'auto',
            background: '#ffffff',
            border: `1px solid ${getBorderColor(toast.type)}`,
            borderLeft: `4px solid ${
              toast.type === 'success'
                ? '#059669'
                : toast.type === 'warning'
                ? '#d97706'
                : toast.type === 'error'
                ? '#dc2626'
                : '#0284c7'
            }`,
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 4px 14px rgba(12, 35, 64, 0.12), 0 1px 3px rgba(12, 35, 64, 0.08)',
            padding: '0.75rem 0.9rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            backgroundColor: getBgColor(toast.type),
            animation: 'toastSlideIn 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <div style={{ marginTop: 1 }}>{getIcon(toast.type)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: '0.825rem',
                color: 'var(--text-primary)',
                lineHeight: 1.3,
                marginBottom: 2,
              }}
            >
              {toast.title}
            </div>
            <div
              style={{
                fontSize: '0.775rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.35,
                wordBreak: 'break-word',
              }}
            >
              {toast.message}
            </div>
            {toast.actionLabel && toast.onAction && (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.();
                  removeToast(toast.id);
                }}
                style={{
                  marginTop: '0.4rem',
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  color: 'var(--brand-primary)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                {toast.actionLabel}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss notification"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-xs)',
              marginLeft: '0.25rem',
            }}
            title="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </aside>
  );
};
