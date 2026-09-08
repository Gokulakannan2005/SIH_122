import React from 'react';
import { GuidedDemoStep, NavigationTab } from '../types';
import { Play, ArrowRight, ArrowLeft, X, CheckCircle2, ExternalLink, Compass } from 'lucide-react';
import { GUIDED_DEMO_STEPS } from '../utils/guidedDemoData';

interface GuidedDemoBarProps {
  currentStep: GuidedDemoStep;
  currentStepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onExit: () => void;
  onRestart?: () => void;
  onJumpToStep?: (index: number) => void;
  onJumpToTab?: (tab: NavigationTab) => void;
}

export const GuidedDemoBar: React.FC<GuidedDemoBarProps> = ({
  currentStep,
  currentStepIndex,
  totalSteps,
  onNext,
  onPrev,
  onExit,
  onJumpToStep,
  onJumpToTab,
}) => {
  const isLastStep = currentStepIndex === totalSteps - 1;
  const progressPercent = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  const stepLabels = [
    '1. Context',
    '2. Field Reality',
    '3. Photo & OCR',
    '4. AI Match',
    '5. Explain',
    '6. Human Gate',
    '7. Delay Sim',
  ];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 8000,
        width: 'calc(100% - 2rem)',
        maxWidth: '960px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
        padding: '0.85rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Compass size={12} style={{ color: 'var(--brand-primary)' }} />
            <span>TOUR:</span>
          </span>
          {GUIDED_DEMO_STEPS.map((s, idx) => {
            const isActive = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onJumpToStep && onJumpToStep(idx)}
                style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? 'var(--brand-primary)' : isCompleted ? 'rgba(4, 120, 87, 0.12)' : 'var(--bg-surface-secondary)',
                  color: isActive ? '#ffffff' : isCompleted ? 'var(--status-ready-fg)' : 'var(--text-secondary)',
                  border: `1px solid ${isActive ? 'var(--brand-primary)' : isCompleted ? 'var(--status-ready-border)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                {isCompleted && <CheckCircle2 size={10} />}
                <span>{stepLabels[idx] || s.title}</span>
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
          {progressPercent}% Complete
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--brand-primary)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {currentStep.stepNumber}
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {currentStep.title}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {currentStep.description}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          {onJumpToTab && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onJumpToTab(currentStep.targetTab)}
            >
              <ExternalLink size={12} />
              <span>View</span>
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={currentStepIndex === 0}
            onClick={onPrev}
          >
            <ArrowLeft size={12} />
            <span>Back</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onNext}
          >
            <span>{isLastStep ? 'Finish' : 'Next'}</span>
            <ArrowRight size={12} />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onExit}
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
