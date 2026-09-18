import React from 'react';
import { Camera, Check, Sparkles, ExternalLink, ChevronRight } from 'lucide-react';
import { PptScreenshotState } from '../../types';

interface PptScreenshotToolbarProps {
  activeScreenshotState: PptScreenshotState | null;
  onSelectScreenshotState: (stateNum: PptScreenshotState) => void;
  onClearScreenshotState: () => void;
}

export const PPT_SCREENSHOT_CONFIGS: {
  id: PptScreenshotState;
  stepNumber: number;
  title: string;
  tagline: string;
  description: string;
  badge: string;
}[] = [
  {
    id: 1,
    stepNumber: 2,
    title: '1. Multi-Source Ingestion',
    tagline: 'Heterogeneous Discipline Capture',
    description: 'Displays Daily Report TXT, Piping XLSX, scanned diary preview, and P6 schedule export side-by-side.',
    badge: 'Step 2',
  },
  {
    id: 2,
    stepNumber: 4,
    title: '2. Conversational Capture',
    tagline: 'Low-Friction Voice/Text Input',
    description: 'Natural language supervisor report with immediate structured field extraction and confirmation dialog.',
    badge: 'Step 4',
  },
  {
    id: 3,
    stepNumber: 5,
    title: '3. Explainable L5/L6 Match',
    tagline: 'Multi-Factor Schedule Alignment',
    description: 'Candidate PIP-L6-012 with 92% confidence, factor breakdown, and operating threshold notice.',
    badge: 'Step 5',
  },
  {
    id: 4,
    stepNumber: 6,
    title: '4. Human Verification',
    tagline: 'Ambiguity Governance Queue',
    description: 'Ambiguous "cable pulling" report showing competing candidates (63% vs 59%) and planner review actions.',
    badge: 'Step 6',
  },
  {
    id: 5,
    stepNumber: 8,
    title: '5. Real-Time Actuals',
    tagline: 'Planned vs Actual Recalculation',
    description: 'Planned dates vs actual dates, +2 days variance calculation, and live schedule progress status.',
    badge: 'Step 8',
  },
  {
    id: 6,
    stepNumber: 9,
    title: '6. Structured Dataset',
    tagline: 'Discipline-Tagged Execution Data',
    description: 'Clean, queryable execution dataset table with L5/L6 codes, actual dates, progress, and verification status.',
    badge: 'Step 9',
  },
  {
    id: 7,
    stepNumber: 11,
    title: '7. Project Memory',
    tagline: 'Reusable Institutional Learning',
    description: 'Duration variance learnings, recurring bottleneck patterns, productivity norms, and queryable memory.',
    badge: 'Step 11',
  },
  {
    id: 8,
    stepNumber: 12,
    title: '8. Traceable Audit Trail',
    tagline: 'Execution Provenance Chain',
    description: 'End-to-end provenance: Source → Extraction → Match → Verification → Update with SHA-256 fingerprints.',
    badge: 'Step 12',
  },
];

export const PptScreenshotToolbar: React.FC<PptScreenshotToolbarProps> = ({
  activeScreenshotState,
  onSelectScreenshotState,
  onClearScreenshotState,
}) => {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: '0.65rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Camera size={16} style={{ color: 'var(--brand-primary)' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
            Key Architectural Milestones (Core Pipeline Views)
          </span>
          <span
            style={{
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              padding: '2px 8px',
              borderRadius: 10,
            }}
          >
            Click any milestone to inspect that stage in the pipeline
          </span>
        </div>

        {activeScreenshotState !== null && (
          <button
            type="button"
            className="btn btn-xs btn-secondary"
            onClick={onClearScreenshotState}
            style={{ fontSize: '0.7rem', padding: '2px 8px' }}
          >
            Exit Milestone View
          </button>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.45rem',
        }}
      >
        {PPT_SCREENSHOT_CONFIGS.map(cfg => {
          const isActive = activeScreenshotState === cfg.id;
          return (
            <button
              key={cfg.id}
              type="button"
              onClick={() => onSelectScreenshotState(cfg.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.4rem 0.65rem',
                background: isActive ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(16, 185, 129, 0.15))' : 'var(--bg-subtle)',
                border: isActive ? '1px solid var(--brand-primary)' : '1px solid var(--border-default)',
                borderRadius: 6,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: isActive ? 'var(--brand-primary)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cfg.title}
                </div>
                <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cfg.tagline}
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: 4,
                  background: isActive ? 'var(--brand-primary)' : 'var(--bg-surface-secondary)',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  border: isActive ? 'none' : '1px solid var(--border-subtle)',
                  marginLeft: 6,
                  flexShrink: 0,
                }}
              >
                {cfg.badge}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
