import React, { useState } from 'react';
import {
  Layers,
  ArrowDown,
  ArrowRight,
  Database,
  FileText,
  FileSpreadsheet,
  Mic,
  Scan,
  TrendingUp,
  AlertTriangle,
  Compass,
  Sparkles,
  GitBranch,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Building2,
} from 'lucide-react';

interface DatumArchitectureVisualProps {
  onSelectStep?: (stepNumber: number) => void;
  compact?: boolean;
}

export const DatumArchitectureVisual: React.FC<DatumArchitectureVisualProps> = ({
  onSelectStep,
  compact = false,
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  return (
    <div
      className="datum-architecture-card"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: compact ? '1.25rem' : '1.75rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Accent Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.7,
          pointerEvents: 'none',
        }}
      />

      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #0284c7, #0f766e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
            }}
          >
            <GitBranch size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              DATUM Architecture: The Planning-to-Execution Bridge
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Transforming fragmented discipline field evidence into verified L5/L6 actuals & reusable institutional memory
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(2, 132, 199, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '4px 10px',
            borderRadius: 20,
            fontSize: '0.72rem',
            fontWeight: 700,
            color: '#38bdf8',
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#38bdf8' }} />
          Enterprise Solution Model
        </div>
      </div>

      {/* Main Flow Diagram */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.9rem',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Tier 1: Project Plan & Schedule Baseline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: onSelectStep ? 'pointer' : 'default',
          }}
          onClick={() => onSelectStep && onSelectStep(1)}
          onMouseEnter={() => setHoveredNode('plan')}
          onMouseLeave={() => setHoveredNode(null)}
        >
          <div
            style={{
              padding: '0.6rem 1.4rem',
              background: 'var(--bg-subtle)',
              border: hoveredNode === 'plan' ? '1px solid var(--brand-primary)' : '1px solid var(--border-default)',
              borderRadius: 8,
              textAlign: 'center',
              boxShadow: hoveredNode === 'plan' ? '0 0 16px rgba(56, 189, 248, 0.25)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              PROJECT PLAN
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Primavera P6 / MS Project Baseline
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              Structured WBS • Activity IDs • Planned Start & Finish Targets
            </div>
          </div>

          <ArrowDown size={18} style={{ color: '#0284c7', margin: '4px 0' }} />

          <div
            style={{
              padding: '0.45rem 1.2rem',
              background: 'rgba(2, 132, 199, 0.12)',
              border: '1px solid rgba(2, 132, 199, 0.4)',
              borderRadius: 6,
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#38bdf8',
            }}
          >
            L5 / L6 Master Schedule Baseline (PIP-L6-012, CIV-L6-002, etc.)
          </div>
        </div>

        {/* Tier 2: The DATUM Bridge Layer (Heterogeneous Inputs Converging) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.25rem',
            width: '100%',
            maxWidth: '820px',
            marginTop: '0.2rem',
          }}
        >
          {/* Left Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1, alignItems: 'flex-end' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0.45rem 0.8rem',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: 6,
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                width: '100%',
                maxWidth: '220px',
                cursor: onSelectStep ? 'pointer' : 'default',
              }}
              onClick={() => onSelectStep && onSelectStep(2)}
            >
              <FileText size={14} style={{ color: '#38bdf8' }} />
              <span>Daily Report (TXT)</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0.45rem 0.8rem',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: 6,
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                width: '100%',
                maxWidth: '220px',
                cursor: onSelectStep ? 'pointer' : 'default',
              }}
              onClick={() => onSelectStep && onSelectStep(4)}
            >
              <Mic size={14} style={{ color: '#a855f7' }} />
              <span>Voice / Conversational</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0.45rem 0.8rem',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: 6,
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                width: '100%',
                maxWidth: '220px',
              }}
            >
              <Building2 size={14} style={{ color: '#f59e0b' }} />
              <span>Mobile Field Input</span>
            </div>
          </div>

          <ArrowRight size={20} style={{ color: '#0284c7', flexShrink: 0 }} />

          {/* Central DATUM Engine */}
          <div
            style={{
              padding: '1rem 1.6rem',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.25), rgba(15, 118, 110, 0.25))',
              border: '2px solid #0284c7',
              borderRadius: 12,
              textAlign: 'center',
              boxShadow: '0 0 28px rgba(2, 132, 199, 0.35)',
              position: 'relative',
              minWidth: '220px',
            }}
          >
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              INTELLIGENT LINKING LAYER
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff', letterSpacing: '0.04em', margin: '2px 0' }}>
              DATUM
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e2e8f0' }}>
              Planning-to-Execution Bridge
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginTop: 6,
                fontSize: '0.66rem',
                color: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              <span>Capture</span> • <span>Understand</span> • <span>Match</span> • <span>Verify</span>
            </div>
          </div>

          <ArrowRight size={20} style={{ color: '#0284c7', transform: 'rotate(180deg)', flexShrink: 0 }} />

          {/* Right Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1, alignItems: 'flex-start' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0.45rem 0.8rem',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: 6,
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                width: '100%',
                maxWidth: '220px',
                cursor: onSelectStep ? 'pointer' : 'default',
              }}
              onClick={() => onSelectStep && onSelectStep(2)}
            >
              <FileSpreadsheet size={14} style={{ color: '#10b981' }} />
              <span>Spreadsheet (XLSX)</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0.45rem 0.8rem',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: 6,
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                width: '100%',
                maxWidth: '220px',
              }}
            >
              <Scan size={14} style={{ color: '#ec4899' }} />
              <span>Scanned Diary / OCR</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0.45rem 0.8rem',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-default)',
                borderRadius: 6,
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                width: '100%',
                maxWidth: '220px',
              }}
            >
              <Database size={14} style={{ color: '#f97316' }} />
              <span>Contractor Submissions</span>
            </div>
          </div>
        </div>

        <ArrowDown size={18} style={{ color: '#0284c7' }} />

        {/* Tier 3: Structured Actuals Output */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: onSelectStep ? 'pointer' : 'default',
          }}
          onClick={() => onSelectStep && onSelectStep(9)}
        >
          <div
            style={{
              padding: '0.55rem 1.6rem',
              background: 'var(--bg-subtle)',
              border: '1px solid #10b981',
              borderRadius: 8,
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.12)',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              STRUCTURED ACTUAL PROGRESS DATASET
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Discipline-Tagged • Activity-Level Actuals • Cryptographic Provenance
            </div>
          </div>
        </div>

        {/* Tier 4: Downstream Operational Intelligence */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            width: '100%',
            maxWidth: '650px',
            marginTop: '0.2rem',
          }}
        >
          <div
            style={{
              padding: '0.55rem',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 6,
              textAlign: 'center',
              cursor: onSelectStep ? 'pointer' : 'default',
            }}
            onClick={() => onSelectStep && onSelectStep(8)}
          >
            <CheckCircle2 size={15} style={{ color: '#0284c7', margin: '0 auto 4px' }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Real-Time Progress</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Verified L5/L6 Status</div>
          </div>

          <div
            style={{
              padding: '0.55rem',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 6,
              textAlign: 'center',
              cursor: onSelectStep ? 'pointer' : 'default',
            }}
            onClick={() => onSelectStep && onSelectStep(10)}
          >
            <TrendingUp size={15} style={{ color: '#ef4444', margin: '0 auto 4px' }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Delay & Variance</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Bottleneck Identification</div>
          </div>

          <div
            style={{
              padding: '0.55rem',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 6,
              textAlign: 'center',
              cursor: onSelectStep ? 'pointer' : 'default',
            }}
            onClick={() => onSelectStep && onSelectStep(7)}
          >
            <AlertTriangle size={15} style={{ color: '#f59e0b', margin: '0 auto 4px' }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Out-of-Baseline</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Surfaced for Review</div>
          </div>
        </div>

        <ArrowDown size={18} style={{ color: '#0284c7' }} />

        {/* Tier 5: Institutional Project Memory & Future Planning */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: onSelectStep ? 'pointer' : 'default',
          }}
          onClick={() => onSelectStep && onSelectStep(11)}
        >
          <div
            style={{
              padding: '0.7rem 1.8rem',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(59, 130, 246, 0.08))',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              borderRadius: 8,
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(168, 85, 247, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 2 }}>
              <Sparkles size={15} style={{ color: '#a855f7' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                PROJECT MEMORY & INSTITUTIONAL KNOWLEDGE
              </span>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Past Execution Becomes Calibrated Knowledge for Future Project Planning
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 3 }}>
              Actual Durations • Recurring Delays • Empirical Productivity Norms • Queryable Repository
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
