import React from 'react';
import { X, CheckCircle2, ArrowRight, ShieldCheck, Layers } from 'lucide-react';
import { SIH_PS_COVERAGE_ITEMS } from '../../utils/projectMemoryData';

interface SihPsCoverageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToStep: (stepNumber: number) => void;
}

export const SihPsCoverageModal: React.FC<SihPsCoverageModalProps> = ({
  isOpen,
  onClose,
  onNavigateToStep,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #0284c7, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                DATUM Enterprise Capabilities & Architecture Matrix
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Intelligent Data Capture & Schedule-Linking Layer for Infrastructure Project Management: Real-Time Actual Progress Tracking
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={onClose}
            style={{ padding: '4px 8px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body: Requirements List */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            Complete architectural compliance across automated data capture, deterministic schedule linking, and operational intelligence:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {SIH_PS_COVERAGE_ITEMS.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                  <CheckCircle2 size={18} style={{ color: '#10b981', marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 2 }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        #{item.requirementNumber}. {item.title}
                      </span>
                      <span
                        style={{
                          fontSize: '0.64rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                        }}
                      >
                        Fully Demonstrated
                      </span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                      <strong>Specification:</strong> {item.psRequirement}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      <strong>DATUM Implementation:</strong> {item.datumCapability}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-xs btn-primary"
                  onClick={() => {
                    onNavigateToStep(item.targetStepNumber);
                    onClose();
                  }}
                  style={{ whiteSpace: 'nowrap', flexShrink: 0, marginTop: 4, padding: '4px 10px', fontSize: '0.72rem' }}
                >
                  <span>Go to Step {item.targetStepNumber}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-subtle)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            All enterprise infrastructure controls verified and active in DATUM.
          </div>
          <button type="button" className="btn btn-sm btn-secondary" onClick={onClose}>
            Close Capabilities Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
