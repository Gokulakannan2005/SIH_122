import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  FolderPlus,
  Compass,
  ArrowRight,
  Sparkles,
  Building2,
  X,
} from 'lucide-react';

export const ProjectSelectionModal: React.FC = () => {
  const {
    isProjectSelectionModalOpen,
    setIsProjectSelectionModalOpen,
    createNewProject,
    loadExistingDemoProject,
    theme,
  } = useProject();

  const isDark = theme === 'dark';

  const [mode, setMode] = useState<'choose' | 'new_form'>('choose');
  const [projectName, setProjectName] = useState('Paradip Refinery Expansion - Package 4');
  const [contractId, setContractId] = useState('IOCL-EPCC-PKG-04');
  const [targetUnit, setTargetUnit] = useState('Unit 01 - Cooling Water & Utilities');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isProjectSelectionModalOpen) return null;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await createNewProject(projectName, contractId);
    setIsSubmitting(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: isDark ? 'rgba(5, 10, 20, 0.88)' : 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          background: isDark ? '#111827' : '#ffffff',
          border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
          borderRadius: 16,
          boxShadow: isDark
            ? '0 25px 60px -15px rgba(0, 0, 0, 0.85)'
            : '0 20px 45px -10px rgba(15, 23, 42, 0.18)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition: 'background 0.2s ease, border 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isDark
              ? 'linear-gradient(to right, rgba(14, 165, 233, 0.12), rgba(17, 24, 39, 0.8))'
              : 'linear-gradient(to right, #f0f9ff, #ffffff)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: isDark ? 'rgba(14, 165, 233, 0.18)' : '#e0f2fe',
                color: isDark ? '#38bdf8' : '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: isDark ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid #bae6fd',
              }}
            >
              <Building2 size={20} />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: isDark ? '#f8fafc' : '#0f172a',
                }}
              >
                Project Workspace Context
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.78rem',
                  color: isDark ? '#94a3b8' : '#64748b',
                }}
              >
                Choose how you want to proceed as Lead Planning Engineer
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsProjectSelectionModalOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: isDark ? '#94a3b8' : '#64748b',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Dismiss Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem' }}>
          {mode === 'choose' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Option 1: Create New Project */}
              <button
                type="button"
                onClick={() => setMode('new_form')}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1.25rem',
                  borderRadius: 12,
                  background: isDark ? 'rgba(14, 165, 233, 0.08)' : '#f0f9ff',
                  border: isDark ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid #bae6fd',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
                className="hover-card"
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: isDark ? 'rgba(14, 165, 233, 0.2)' : '#e0f2fe',
                    color: isDark ? '#38bdf8' : '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FolderPlus size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: isDark ? '#38bdf8' : '#0284c7' }}>
                      Create New Project
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 4,
                        background: isDark ? 'rgba(14, 165, 233, 0.25)' : '#e0f2fe',
                        color: isDark ? '#7dd3fc' : '#0369a1',
                      }}
                    >
                      Clean Baseline
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.82rem',
                      color: isDark ? '#cbd5e1' : '#475569',
                      lineHeight: 1.45,
                    }}
                  >
                    Start a fresh project with zero mock data or placeholder graphs. Upload your Primavera P6 / MS Project file and raw daily logs directly.
                  </p>
                </div>
                <ArrowRight size={18} style={{ color: isDark ? '#38bdf8' : '#0284c7', marginTop: 12 }} />
              </button>

              {/* Option 2: Review Existing Benchmark Project */}
              <button
                type="button"
                onClick={async () => {
                  setIsSubmitting(true);
                  await loadExistingDemoProject();
                  setIsSubmitting(false);
                }}
                disabled={isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1.25rem',
                  borderRadius: 12,
                  background: isDark ? 'rgba(16, 185, 129, 0.08)' : '#f0fdf4',
                  border: isDark ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid #bbf7d0',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
                className="hover-card"
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: isDark ? 'rgba(16, 185, 129, 0.2)' : '#dcfce7',
                    color: isDark ? '#34d399' : '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Compass size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: isDark ? '#34d399' : '#16a34a' }}>
                      Continue Reviewing Existing Project
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 4,
                        background: isDark ? 'rgba(16, 185, 129, 0.25)' : '#dcfce7',
                        color: isDark ? '#a7f3d0' : '#15803d',
                      }}
                    >
                      Pre-loaded Benchmark
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.82rem',
                      color: isDark ? '#cbd5e1' : '#475569',
                      lineHeight: 1.45,
                    }}
                  >
                    Load the IOCL Refinery Cooling Water Package (P4) with 34 Primavera P6 activities, verified field updates, and demo test scenarios.
                  </p>
                </div>
                <ArrowRight size={18} style={{ color: isDark ? '#34d399' : '#16a34a', marginTop: 12 }} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: isDark ? '#f1f5f9' : '#1e293b',
                    marginBottom: 6,
                  }}
                >
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="e.g. Paradip Refinery Expansion - Package 4"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.95rem',
                    borderRadius: 8,
                    border: isDark ? '1.5px solid #334155' : '1.5px solid #cbd5e1',
                    background: isDark ? '#0f172a' : '#ffffff',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease',
                  }}
                  onFocus={e => (e.target.style.borderColor = isDark ? '#38bdf8' : '#0284c7')}
                  onBlur={e => (e.target.style.borderColor = isDark ? '#334155' : '#cbd5e1')}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: isDark ? '#f1f5f9' : '#1e293b',
                      marginBottom: 6,
                    }}
                  >
                    Contract / Job Code
                  </label>
                  <input
                    type="text"
                    value={contractId}
                    onChange={e => setContractId(e.target.value)}
                    placeholder="e.g. IOCL-EPCC-PKG-04"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.95rem',
                      borderRadius: 8,
                      border: isDark ? '1.5px solid #334155' : '1.5px solid #cbd5e1',
                      background: isDark ? '#0f172a' : '#ffffff',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s ease',
                    }}
                    onFocus={e => (e.target.style.borderColor = isDark ? '#38bdf8' : '#0284c7')}
                    onBlur={e => (e.target.style.borderColor = isDark ? '#334155' : '#cbd5e1')}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: isDark ? '#f1f5f9' : '#1e293b',
                      marginBottom: 6,
                    }}
                  >
                    Primary Workfront Area
                  </label>
                  <input
                    type="text"
                    value={targetUnit}
                    onChange={e => setTargetUnit(e.target.value)}
                    placeholder="e.g. Unit 01 - Cooling Water"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.95rem',
                      borderRadius: 8,
                      border: isDark ? '1.5px solid #334155' : '1.5px solid #cbd5e1',
                      background: isDark ? '#0f172a' : '#ffffff',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s ease',
                    }}
                    onFocus={e => (e.target.style.borderColor = isDark ? '#38bdf8' : '#0284c7')}
                    onBlur={e => (e.target.style.borderColor = isDark ? '#334155' : '#cbd5e1')}
                  />
                </div>
              </div>

              {/* Informational Callout Banner with High Contrast */}
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 10,
                  background: isDark ? 'rgba(14, 165, 233, 0.12)' : '#e0f2fe',
                  border: isDark ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid #7dd3fc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: isDark ? '#bae6fd' : '#0369a1',
                  lineHeight: 1.45,
                }}
              >
                <Sparkles size={18} style={{ color: isDark ? '#38bdf8' : '#0284c7', flexShrink: 0 }} />
                <span>
                  After initialization, you will land directly in the Ingestion Suite to upload your schedule. No phantom activities or fake graphs will be shown.
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setMode('choose')}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: 8,
                    border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                    background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
                    color: isDark ? '#cbd5e1' : '#334155',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    transition: 'all 0.15s ease',
                  }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '0.65rem 1.5rem',
                    borderRadius: 8,
                    border: 'none',
                    background: '#0284c7',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isSubmitting ? (
                    'Initializing...'
                  ) : (
                    <>
                      <span>Initialize Clean Project</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
