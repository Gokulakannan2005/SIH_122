import React from 'react';
import { CheckCircle2, RotateCcw, Compass, ArrowRight } from 'lucide-react';

interface DemoCompletionModalProps {
  isOpen: boolean;
  onReplayDemo: () => void;
  onExploreWorkspace: () => void;
}

export const DemoCompletionModal: React.FC<DemoCompletionModalProps> = ({
  isOpen,
  onReplayDemo,
  onExploreWorkspace,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(10, 15, 29, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'linear-gradient(160deg, #131c31, #0b1120)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 40px rgba(16, 185, 129, 0.12)',
          padding: '2.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '1.25rem',
          color: '#ffffff',
          position: 'relative',
        }}
      >
        {/* Emerald Checkmark Badge */}
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid #10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981',
            boxShadow: '0 0 24px rgba(16, 185, 129, 0.35)',
          }}
        >
          <CheckCircle2 size={32} />
        </div>

        {/* Title & Headline */}
        <div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#34d399',
            }}
          >
            Demo Complete
          </span>
          <h2
            style={{
              fontSize: '1.45rem',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              marginTop: '0.35rem',
              marginBottom: '0.5rem',
            }}
          >
            You&apos;ve seen the full DATUM workflow.
          </h2>
          <p
            style={{
              fontSize: '0.875rem',
              color: '#94a3b8',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            From field reality to project intelligence.
            <br />
            <strong style={{ color: '#e2e8f0' }}>Real data. Real decisions. Real impact.</strong>
          </p>
        </div>

        {/* Core Value Recap Pills */}
        <div
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: '#cbd5e1',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#10b981' }}>✓</span> Evidence captured
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#10b981' }}>✓</span> Information structured
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#10b981' }}>✓</span> Matches explained
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#10b981' }}>✓</span> Humans in control
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={onReplayDemo}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <RotateCcw size={14} />
            <span>Replay Demo</span>
          </button>

          <button
            type="button"
            onClick={onExploreWorkspace}
            style={{
              flex: 1.2,
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid #2563eb',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Explore on My Own</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* DATUM Brand Tagline */}
        <div
          style={{
            fontSize: '0.7rem',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginTop: '0.25rem',
          }}
        >
          <strong>DATUM</strong> • The Record of Execution
        </div>
      </div>
    </div>
  );
};
