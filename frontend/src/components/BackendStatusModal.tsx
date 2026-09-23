import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Server,
  Terminal,
  ShieldCheck,
  Wifi,
  WifiOff
} from 'lucide-react';
import { api, BackendDiagnostics } from '../services/api';
import { useProject } from '../context/ProjectContext';

interface BackendStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendStatusModal: React.FC<BackendStatusModalProps> = ({ isOpen, onClose }) => {
  const { backendStatus, backendMetrics } = useProject();
  const [diagnostics, setDiagnostics] = useState<BackendDiagnostics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customUrlResult, setCustomUrlResult] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      const res = await api.getDiagnostics();
      setDiagnostics(res);
    } catch (err: any) {
      console.error('Failed to run backend diagnostics', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleApplyCustomUrl = async () => {
    const clean = customUrlInput.trim().replace(/\/$/, '');
    if (!clean) return;
    try {
      setIsLoading(true);
      (window as any).__DATUM_API_URL__ = clean;
      const res = await fetch(`${clean.endsWith('/api') ? clean : `${clean}/api`}/health`);
      if (res.ok) {
        setCustomUrlResult('Success! Connected to custom backend. Reloading...');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setCustomUrlResult(`Failed: HTTP ${res.status}. Expected JSON health response.`);
      }
    } catch (e: any) {
      setCustomUrlResult(`Failed to reach endpoint: ${e.message || 'Network error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const isConnected = backendStatus === 'connected';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: 680,
          width: '100%',
          maxHeight: '90vh',
          background: 'var(--bg-surface, #0f172a)',
          border: '1px solid var(--border-default, #334155)',
          borderRadius: 14,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border-default, #334155)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                color: isConnected ? '#10b981' : '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Database size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                Backend & Database Connectivity
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Vercel Hosting Status, SQLite Sync & Custom Endpoint Setup
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Status Banner */}
          <div
            style={{
              padding: '0.9rem 1.1rem',
              borderRadius: 10,
              background: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(56, 189, 248, 0.08)',
              border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(56, 189, 248, 0.25)'}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.85rem',
            }}
          >
            {isConnected ? (
              <CheckCircle2 size={22} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
            ) : (
              <Server size={22} style={{ color: '#38bdf8', flexShrink: 0, marginTop: 2 }} />
            )}
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: isConnected ? '#34d399' : '#38bdf8' }}>
                {isConnected
                  ? 'Connected: Live SQLite Engine & REST API'
                  : 'Standalone Client Engine Active (Local Simulation Mode)'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: 4, lineHeight: 1.45 }}>
                {isConnected ? (
                  <>
                    DATUM is communicating directly with your live hosted SQLite database (
                    <strong>{diagnostics?.activeApiBase || '/api'}</strong>). Changes persist to the persistent database file.
                  </>
                ) : (
                  <>
                    DATUM is operating as a 100% self-contained client-side application. The parser, multi-factor AI matching engine, schedule simulator, earned value S-curves, and cryptographic SHA-256 evidence logging are executing seamlessly in your browser.
                  </>
                )}
              </div>
              {backendMetrics && (
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: 8, flexWrap: 'wrap' }}>
                  <span className="mono-pill" style={{ fontSize: '0.7rem' }}>
                    {backendMetrics.scheduleActivities} Schedule Tasks
                  </span>
                  <span className="mono-pill" style={{ fontSize: '0.7rem' }}>
                    {backendMetrics.siteUpdates} Field Records
                  </span>
                  <span className="mono-pill" style={{ fontSize: '0.7rem' }}>
                    {backendMetrics.plannerDecisions} Planner Approvals
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Verification & Hosting Guide */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-default, #334155)',
              borderRadius: 10,
              padding: '1rem',
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} style={{ color: '#38bdf8' }} />
              <span>How to Check & Connect Backend/DB in Vercel</span>
            </div>

            <ol style={{ fontSize: '0.78rem', color: '#cbd5e1', paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <li>
                <strong>Understand Vercel Hosting:</strong> Vercel hosts the static frontend single-page application. Because SQLite requires a persistent filesystem (which serverless resets), the Express + SQLite backend runs best on persistent hosts like <strong>Render.com</strong>, <strong>Railway.app</strong>, or <strong>Fly.io</strong>.
              </li>
              <li>
                <strong>Verify if Backend is Live:</strong> Open your backend domain at <code>/api/health</code> in your browser. If online, it returns:
                <div style={{ background: '#090d16', padding: '6px 10px', borderRadius: 6, fontFamily: 'monospace', fontSize: '0.72rem', color: '#34d399', marginTop: 4 }}>
                  {`{"status":"ok","engine":"SQLite (node:sqlite)","metrics":{...}}`}
                </div>
              </li>
              <li>
                <strong>Connect Backend to Vercel in 1 Step:</strong> In your <strong>Vercel Dashboard</strong> &rarr; <strong>Settings</strong> &rarr; <strong>Environment Variables</strong>, add:
                <div
                  style={{
                    background: '#090d16',
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 4,
                  }}
                >
                  <span>VITE_API_URL = https://your-backend.onrender.com/api</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('VITE_API_URL=https://your-backend.onrender.com/api', 'env')}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    {copiedKey === 'env' ? <Check size={14} style={{ color: '#34d399' }} /> : <Copy size={14} />}
                  </button>
                </div>
                Then trigger a new Vercel deployment (or click Redeploy).
              </li>
            </ol>
          </div>

          {/* Quick Endpoint Override (In-Session Testing) */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-default, #334155)',
              borderRadius: 10,
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
              Connect Custom Backend URL (Session Override):
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="e.g. https://my-backend.onrender.com/api"
                value={customUrlInput}
                onChange={e => setCustomUrlInput(e.target.value)}
                style={{
                  flex: 1,
                  background: '#090d16',
                  border: '1px solid #334155',
                  borderRadius: 6,
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.78rem',
                  color: '#fff',
                  fontFamily: 'monospace',
                }}
              />
              <button
                type="button"
                onClick={handleApplyCustomUrl}
                disabled={isLoading || !customUrlInput.trim()}
                style={{
                  background: '#0284c7',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  padding: '0.45rem 1rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Connect & Test
              </button>
            </div>
            {customUrlResult && (
              <div
                style={{
                  fontSize: '0.75rem',
                  color: customUrlResult.startsWith('Success') ? '#34d399' : '#f87171',
                  marginTop: 2,
                }}
              >
                {customUrlResult}
              </div>
            )}
          </div>

          {/* Tested Candidates List */}
          {diagnostics && diagnostics.testedCandidates.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
                Diagnostic Probe Results:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {diagnostics.testedCandidates.map((cand, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid #1e293b',
                      borderRadius: 6,
                      padding: '0.4rem 0.65rem',
                      fontSize: '0.72rem',
                    }}
                  >
                    <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>{cand.url}</span>
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: 4,
                        fontSize: '0.675rem',
                        fontWeight: 700,
                        background: cand.reachable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: cand.reachable ? '#34d399' : '#f87171',
                      }}
                    >
                      {cand.reachable ? 'REACHABLE' : cand.error || 'OFFLINE'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid var(--border-default, #334155)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <button
            type="button"
            onClick={runDiagnostics}
            disabled={isLoading}
            style={{
              background: 'transparent',
              border: '1px solid #334155',
              borderRadius: 6,
              color: '#94a3b8',
              padding: '0.4rem 0.85rem',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <RefreshCw size={12} className={isLoading ? 'spin' : ''} />
            <span>Re-test Connectivity</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#0284c7',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              padding: '0.45rem 1.2rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
