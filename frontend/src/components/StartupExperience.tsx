import React, { useState, useEffect } from 'react';
import { Layers, ArrowRight, Activity, Sparkles } from 'lucide-react';

interface StartupExperienceProps {
  onComplete: () => void;
}

export const StartupExperience: React.FC<StartupExperienceProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'mark' | 'connect' | 'fadeout'>('mark');

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      onComplete();
      return;
    }

    // Step 1: Mark appears (0 - 800ms)
    // Step 2: Connection appears (800ms - 1500ms)
    // Step 3: Fadeout (1500ms - 1800ms)
    const t1 = setTimeout(() => {
      setStage('connect');
    }, 750);

    const t2 = setTimeout(() => {
      setStage('fadeout');
    }, 1500);

    const t3 = setTimeout(() => {
      onComplete();
    }, 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: '#07101e',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: stage === 'fadeout' ? 0 : 1,
        transition: 'opacity 0.3s ease-out',
        pointerEvents: stage === 'fadeout' ? 'none' : 'auto',
      }}
    >
      {/* Background Subtle Radial Glow */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Brand Icon & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              background: '#1d4ed8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(29, 78, 216, 0.4)',
            }}
          >
            <Layers size={24} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '1.8rem',
                fontWeight: 900,
                letterSpacing: '0.08em',
                lineHeight: 1.1,
                color: '#ffffff',
              }}
            >
              DATUM
            </span>
            <span
              style={{
                fontSize: '0.775rem',
                color: '#94a3b8',
                letterSpacing: '0.04em',
                fontWeight: 500,
              }}
            >
              The Record of Execution
            </span>
          </div>
        </div>

        {/* Dynamic Process Connection (Stages) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            marginTop: '1rem',
            padding: '0.5rem 1.25rem',
            borderRadius: 999,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            opacity: stage === 'connect' || stage === 'fadeout' ? 1 : 0,
            transform: stage === 'connect' || stage === 'fadeout' ? 'translateY(0)' : 'translateY(8px)',
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#38bdf8',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Field Reality
          </span>
          <ArrowRight size={14} style={{ color: '#64748b' }} />
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#4ade80',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Schedule Intelligence
          </span>
        </div>
      </div>
    </div>
  );
};
