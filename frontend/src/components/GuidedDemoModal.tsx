import React from 'react';
import { Layers, ArrowRight, X, Sparkles } from 'lucide-react';

interface GuidedDemoModalProps {
  isOpen: boolean;
  onStartDemo: () => void;
  onExploreWorkspace: () => void;
  onClose: () => void;
}

export const GuidedDemoModal: React.FC<GuidedDemoModalProps> = ({
  isOpen,
  onStartDemo,
  onExploreWorkspace,
  onClose,
}) => {
  if (!isOpen) return null;

  const stepsList = [
    { num: 1, title: 'Project Context & Baseline' },
    { num: 2, title: 'Field Reality' },
    { num: 3, title: 'Voice, Photo & OCR' },
    { num: 4, title: 'AI Matching' },
    { num: 5, title: 'Explainability' },
    { num: 6, title: 'Human Verification' },
    { num: 7, title: 'Project Impact & Simulation' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        background: 'rgba(10, 15, 29, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'linear-gradient(160deg, #131c31, #0c1222)',
          border: '1px solid rgba(96, 165, 250, 0.25)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)',
          padding: '2.25rem 2rem',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '1.25rem',
          color: '#ffffff',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#94a3b8',
            padding: 4,
            display: 'flex',
          }}
          title="Close dialog"
        >
          <X size={18} />
        </button>

        {/* Brand Logo & Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: '#38bdf8',
              fontSize: '0.8rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            <Layers size={18} />
            <span>DATUM</span>
          </div>

          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              margin: '0.2rem 0',
            }}
          >
            Interactive Demo
          </h2>

          <p
            style={{
              fontSize: '0.85rem',
              color: '#94a3b8',
              lineHeight: 1.45,
              margin: 0,
              maxWidth: '360px',
            }}
          >
            In the next few steps, you&apos;ll see how real site updates become verified project intelligence.
          </p>
        </div>

        {/* 7 Numbered Steps List */}
        <div
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            textAlign: 'left',
          }}
        >
          {stepsList.map(s => (
            <div
              key={s.num}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.825rem',
                color: '#e2e8f0',
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#93c5fd',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {s.num}
              </div>
              <span style={{ fontWeight: 600 }}>{s.title}</span>
            </div>
          ))}
        </div>

        {/* Action Button: Let's Begin */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.8rem 1.25rem',
              fontWeight: 800,
              fontSize: '0.925rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: '#2563eb',
              border: '1px solid #3b82f6',
              borderRadius: '8px',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
              cursor: 'pointer',
              color: '#ffffff',
            }}
            onClick={onStartDemo}
          >
            <span>Let&apos;s Begin</span>
            <ArrowRight size={15} />
          </button>

          <button
            type="button"
            onClick={onExploreWorkspace}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={e => ((e.target as HTMLElement).style.color = '#94a3b8')}
            onMouseLeave={e => ((e.target as HTMLElement).style.color = '#64748b')}
          >
            Explore on My Own
          </button>
        </div>
      </div>
    </div>
  );
};
