import React from 'react';
import { Sparkles, Info } from 'lucide-react';

export interface MatchScoreRadarChartProps {
  score: number;
  scoreBreakdown: {
    keywordScore: number;
    disciplineScore: number;
    areaScore: number;
    fuzzyScore: number;
  };
  activityId: string;
  activityName: string;
  isAlternative?: boolean;
  reasons?: string[];
}

export const MatchScoreRadarChart: React.FC<MatchScoreRadarChartProps> = ({
  score,
  scoreBreakdown,
  activityId,
  activityName,
  isAlternative = false,
  reasons = [],
}) => {
  const cx = 120;
  const cy = 110;
  const maxR = 68;

  const sb = scoreBreakdown || { keywordScore: 0, disciplineScore: 0, areaScore: 0, fuzzyScore: 0 };
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0;

  // Normalized values clamped between 0 and 1 with NaN protection
  const kNorm = Number.isFinite(sb.keywordScore) ? Math.min(1, Math.max(0, sb.keywordScore / 50)) : 0;
  const dNorm = Number.isFinite(sb.disciplineScore) ? Math.min(1, Math.max(0, sb.disciplineScore / 20)) : 0;
  const aNorm = Number.isFinite(sb.areaScore) ? Math.min(1, Math.max(0, sb.areaScore / 15)) : 0;
  const fNorm = Number.isFinite(sb.fuzzyScore) ? Math.min(1, Math.max(0, sb.fuzzyScore / 15)) : 0;

  // Coordinates:
  // Top: Keyword
  const x1 = cx;
  const y1 = cy - maxR * kNorm;
  // Right: Discipline
  const x2 = cx + maxR * dNorm;
  const y2 = cy;
  // Bottom: Area
  const x3 = cx;
  const y3 = cy + maxR * aNorm;
  // Left: Fuzzy
  const x4 = cx - maxR * fNorm;
  const y4 = cy;

  const dataPolygon = `${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`;

  // Rings
  const rings = [0.25, 0.5, 0.75, 1.0];

  const badgeColor = safeScore >= 70 ? '#10b981' : safeScore >= 40 ? '#f59e0b' : '#ef4444';
  const badgeBg = safeScore >= 70 ? 'rgba(16, 185, 129, 0.12)' : safeScore >= 40 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)';
  const badgeBorder = safeScore >= 70 ? 'rgba(16, 185, 129, 0.3)' : safeScore >= 40 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)';

  return (
    <div
      id="demo-target-explainability"
      style={{
        background: 'var(--bg-surface-secondary)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
      }}
    >
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Sparkles size={16} style={{ color: 'var(--brand-primary)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
            Multi-Factor Match Score Radar
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 700 }}>
            ({activityId})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isAlternative ? (
            <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', fontWeight: 700 }}>
              Manual Target Selected
            </span>
          ) : (
            <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 700 }}>
              ★ AI Top Candidate
            </span>
          )}
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 800,
              padding: '2px 10px',
              borderRadius: 6,
              background: badgeBg,
              color: badgeColor,
              border: `1px solid ${badgeBorder}`,
            }}
          >
            {safeScore}% Apt Confidence
          </span>
        </div>
      </div>

      {/* 2-Column Visualization: SVG Radar Chart on Left, Breakdown Meters on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, auto) 1fr', gap: '1.25rem', alignItems: 'center' }}>
        {/* SVG Radar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="240" height="220" viewBox="0 0 240 220" style={{ overflow: 'visible' }}>
            {/* Concentric diamond grid rings */}
            {rings.map((r, i) => {
              const rad = maxR * r;
              return (
                <polygon
                  key={i}
                  points={`${cx},${cy - rad} ${cx + rad},${cy} ${cx},${cy + rad} ${cx - rad},${cy}`}
                  fill={i === rings.length - 1 ? 'rgba(0,0,0,0.06)' : 'none'}
                  stroke="var(--border-default)"
                  strokeWidth={i === rings.length - 1 ? '1.2' : '0.8'}
                  strokeDasharray={i === rings.length - 1 ? 'none' : '2 2'}
                  opacity={0.7}
                />
              );
            })}

            {/* Axis grid lines */}
            <line x1={cx} y1={cy - maxR} x2={cx} y2={cy + maxR} stroke="var(--border-default)" strokeWidth="1" strokeDasharray="3 3" opacity={0.8} />
            <line x1={cx - maxR} y1={cy} x2={cx + maxR} y2={cy} stroke="var(--border-default)" strokeWidth="1" strokeDasharray="3 3" opacity={0.8} />

            {/* Data Polygon */}
            <polygon
              points={dataPolygon}
              fill="rgba(14, 165, 233, 0.28)"
              stroke="var(--brand-primary, #0284c7)"
              strokeWidth="2.5"
              style={{ transition: 'all 0.3s ease-out' }}
            />

            {/* Data Vertices */}
            <circle cx={x1} cy={y1} r={4} fill="#fff" stroke="var(--brand-primary, #0284c7)" strokeWidth="2" />
            <circle cx={x2} cy={y2} r={4} fill="#fff" stroke="var(--brand-primary, #0284c7)" strokeWidth="2" />
            <circle cx={x3} cy={y3} r={4} fill="#fff" stroke="var(--brand-primary, #0284c7)" strokeWidth="2" />
            <circle cx={x4} cy={y4} r={4} fill="#fff" stroke="var(--brand-primary, #0284c7)" strokeWidth="2" />

            {/* Axis Labels */}
            <text x={cx} y={cy - maxR - 8} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--text-secondary)">
              Keyword ({sb.keywordScore || 0}/50)
            </text>
            <text x={cx + maxR + 6} y={cy + 4} textAnchor="start" fontSize="10" fontWeight="700" fill="var(--text-secondary)">
              Discipline ({sb.disciplineScore || 0}/20)
            </text>
            <text x={cx} y={cy + maxR + 18} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--text-secondary)">
              Area ({sb.areaScore || 0}/15)
            </text>
            <text x={cx - maxR - 6} y={cy + 4} textAnchor="end" fontSize="10" fontWeight="700" fill="var(--text-secondary)">
              Fuzzy ({sb.fuzzyScore || 0}/15)
            </text>
          </svg>
        </div>

        {/* 4 Multi-Factor Score Meters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', fontWeight: 600 }}>
              <span style={{ color: 'var(--text-muted)' }}>Keyword Weight</span>
              <strong style={{ color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)' }}>{sb.keywordScore || 0}/50</strong>
            </div>
            <div className="progress-bar-container" style={{ marginTop: 5, height: 6 }}>
              <div className="progress-bar-fill blue" style={{ width: `${((sb.keywordScore || 0) / 50) * 100}%`, transition: 'width 0.3s ease' }} />
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', fontWeight: 600 }}>
              <span style={{ color: 'var(--text-muted)' }}>Discipline Match</span>
              <strong style={{ color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)' }}>{sb.disciplineScore || 0}/20</strong>
            </div>
            <div className="progress-bar-container" style={{ marginTop: 5, height: 6 }}>
              <div className="progress-bar-fill green" style={{ width: `${((sb.disciplineScore || 0) / 20) * 100}%`, transition: 'width 0.3s ease' }} />
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', fontWeight: 600 }}>
              <span style={{ color: 'var(--text-muted)' }}>Spatial / Area</span>
              <strong style={{ color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)' }}>{sb.areaScore || 0}/15</strong>
            </div>
            <div className="progress-bar-container" style={{ marginTop: 5, height: 6 }}>
              <div className="progress-bar-fill amber" style={{ width: `${((sb.areaScore || 0) / 15) * 100}%`, transition: 'width 0.3s ease' }} />
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', fontWeight: 600 }}>
              <span style={{ color: 'var(--text-muted)' }}>Fuzzy Similarity</span>
              <strong style={{ color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)' }}>{sb.fuzzyScore || 0}/15</strong>
            </div>
            <div className="progress-bar-container" style={{ marginTop: 5, height: 6 }}>
              <div className="progress-bar-fill blue" style={{ width: `${((sb.fuzzyScore || 0) / 15) * 100}%`, transition: 'width 0.3s ease' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Matching Evidence Rationale tags */}
      {reasons && reasons.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
            Algorithmic Matching Drivers:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {reasons.map((r, i) => (
              <span
                key={i}
                style={{
                  fontSize: '0.725rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>✓</span> {r}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
