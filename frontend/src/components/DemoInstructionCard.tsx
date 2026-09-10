import React from 'react';
import { GuidedDemoStep } from '../types';
import { ArrowRight, ArrowLeft, X, Sparkles, Check } from 'lucide-react';

interface DemoInstructionCardProps {
  step: GuidedDemoStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onMinimize?: () => void;
  style?: React.CSSProperties;
}

export const DemoInstructionCard: React.FC<DemoInstructionCardProps> = ({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  onMinimize,
  style,
}) => {
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === totalSteps - 1;

  return (
    <div
      className="demo-instruction-card"
      style={{
        position: 'fixed',
        zIndex: 99999,
        pointerEvents: 'auto',
        width: '330px',
        maxWidth: 'calc(100vw - 32px)',
        background: 'linear-gradient(145deg, #131c31, #0e1628)',
        border: '1px solid rgba(96, 165, 250, 0.35)',
        borderRadius: '12px',
        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        padding: '1.25rem',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        animation: 'demoCardFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        backdropFilter: 'blur(16px)',
        ...style,
      }}
    >
      {/* Top Header: Step Counter, Dot Progress & Minimize / Close */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: '#93c5fd',
              textTransform: 'uppercase',
            }}
          >
            Step {step.stepNumber} of {totalSteps}
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 600,
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: '#bfdbfe',
              padding: '1px 6px',
              borderRadius: '999px',
            }}
          >
            Live Demo
          </span>
        </div>

        {/* Minimal dot progress + Dock button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: idx === stepIndex ? 14 : 4,
                  height: 4,
                  borderRadius: 2,
                  background: idx === stepIndex ? '#3b82f6' : idx < stepIndex ? '#10b981' : 'rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </div>

          {onMinimize && (
            <button
              type="button"
              onClick={onMinimize}
              title="Dock demo & inspect page freely"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.65rem',
                cursor: 'pointer',
                marginLeft: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.18)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.08)')}
            >
              Dock ▾
            </button>
          )}
        </div>
      </div>

      {/* Step Title & Main Instruction */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <h3
          style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.01em',
            margin: 0,
            lineHeight: 1.25,
          }}
        >
          {step.title}
        </h3>
        <p
          style={{
            fontSize: '0.825rem',
            color: '#cbd5e1',
            lineHeight: 1.45,
            margin: 0,
          }}
        >
          {step.description}
        </p>
      </div>

      {/* Action Buttons: Skip, Back, Next */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0.35rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <button
          type="button"
          onClick={onSkip}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '0.775rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: 4,
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={e => ((e.target as HTMLElement).style.color = '#ffffff')}
          onMouseLeave={e => ((e.target as HTMLElement).style.color = '#94a3b8')}
        >
          Skip
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {!isFirstStep && (
            <button
              type="button"
              onClick={onPrev}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#e2e8f0',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.775rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Back
            </button>
          )}

          <button
            type="button"
            onClick={onNext}
            style={{
              background: '#2563eb',
              border: '1px solid #3b82f6',
              color: '#ffffff',
              padding: '0.4rem 0.95rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{isLastStep ? 'Finish Demo' : 'Next'}</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
