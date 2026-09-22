import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  BookOpen,
  X,
  UploadCloud,
  CheckCircle2,
  Calendar,
  Layers,
  HelpCircle,
  FileCheck2,
  HardHat,
  Compass,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { NavigationTab } from '../types';

interface GuideSection {
  id: string;
  title: string;
  role: 'planner' | 'supervisor' | 'all';
  tab: NavigationTab;
  badge: string;
  description: string;
  steps: string[];
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'guide-upload',
    title: '1. Ingestion Suite & Auto-Matching',
    role: 'planner',
    tab: 'upload',
    badge: 'Step 1 & 2',
    description: 'The starting gateway for new and existing projects. Here you ingest master schedules and daily site progress logs.',
    steps: [
      'Upload Master Schedule (Primavera P6 XLSX/XER or MS Project CSV) to create the official execution baseline.',
      'Upload Daily Progress Reports (TXT daily logs or XLSX progress spreadsheets).',
      'Observe the animated parsing progress bar as DATUM tokenizes text and extracts disciplines, workfront areas, and tags.',
      'Review the split results: Auto Matched Reports (high-confidence matches) vs Human Verification Queue (uncertain / out-of-baseline).',
    ],
  },
  {
    id: 'guide-calendar',
    title: '2. Master Schedule Calendar & Live Clock',
    role: 'planner',
    tab: 'calendar',
    badge: 'Step 2.1',
    description: 'Dynamic visual mapping of baseline tasks to calendar dates with continuous temporal tracking.',
    steps: [
      'Live ticking digital clock (HH:MM:SS) and dynamic Project Day Counter (e.g. Day 22 of 90) run continuously.',
      'Activities automatically map onto calendar days based on planned start and finish windows.',
      'Filter activities by engineering discipline (Civil, Piping, Electrical, HSE) or click any day to inspect concurrent workfront operations.',
    ],
  },
  {
    id: 'guide-review',
    title: '3. Human Verification & Frictionless Approval Queue',
    role: 'planner',
    tab: 'planner-review',
    badge: 'Step 2.3 & 2.6',
    description: 'Human-in-the-loop decision suite designed for zero-friction review of ambiguous and out-of-baseline work.',
    steps: [
      'Review items flagged with uncertain AI confidence (e.g. cable pulling missing feeder numbers).',
      'Review out-of-baseline items flagged as Unplanned (e.g. small-bore drain lines not in the original contract).',
      'One-click action buttons: Approve recommended linkage, Search & Relink to another schedule activity, or Mark as Unplanned variation.',
      'Every planner decision is recorded with a cryptographic SHA-256 digital signature.',
    ],
  },
  {
    id: 'guide-inspector',
    title: '4. Structured Data Mapping & Evidence Inspector',
    role: 'planner',
    tab: 'site-updates',
    badge: 'Step 2.4 & 2.7',
    description: 'Comprehensive structured view of all matched Level-5/Level-6 activities with audit-ready evidence.',
    steps: [
      'Fully scrollable table displaying L5 codes, disciplines, planned vs actual dates, and human-readable variance ("Delayed by 3 Days" or "On Schedule").',
      'Click any activity or site report to slide out the working Inspector Tab.',
      'Inspect AI confidence score breakdown, keyword matching reasons, supervisor line evidence, and photo OCR tags.',
      'Use the "Re-verify Match with AI" button anytime to re-evaluate scoring if discrepancies are identified.',
    ],
  },
  {
    id: 'guide-supervisor',
    title: '5. Field Supervisor Multimodal Portal',
    role: 'supervisor',
    tab: 'supervisor-entry',
    badge: 'Field Ops',
    description: 'Dedicated lightweight portal for on-site supervisors to log progress and inspect workfront delays without altering schedules.',
    steps: [
      'Submit daily progress via voice dictation, photo uploads with automated OCR equipment tagging, or quick text entries.',
      'View schedule tasks assigned to your workfront with simple delay indicators only ("Delayed by X Days", "On Schedule").',
      'Baseline schedule alteration controls are restricted to Lead Planners for contractual integrity.',
    ],
  },
  {
    id: 'guide-analytics',
    title: '6. Standardized CSV Export & Analytics',
    role: 'planner',
    tab: 'dashboard',
    badge: 'Problem Statement CSV',
    description: 'Export verified alignment matrix into the official SIH problem statement structure and view instant bottleneck analytics.',
    steps: [
      'Generate a standardized CSV containing Activity ID, L5 Code, WBS, Planned Start/Finish, Verified Status, Extracted Quantities, and Variance.',
      'View instant graphical charts of critical path delay bottlenecks, discipline progress, and match distributions.',
      'Export the cleaned dataset to train future AI planning models for upcoming EPC mega-projects.',
    ],
  },
];

export const SystemTourGuideModal: React.FC = () => {
  const { isSystemTourOpen, setIsSystemTourOpen, activeTab, setActiveTab, currentRole, theme } = useProject();
  const [selectedSectionId, setSelectedSectionId] = useState<string>('guide-upload');

  if (!isSystemTourOpen) return null;

  const isDark = theme === 'dark';
  const currentSection = GUIDE_SECTIONS.find(s => s.id === selectedSectionId) || GUIDE_SECTIONS[0];

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
          maxWidth: 840,
          maxHeight: '90vh',
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
        {/* Modal Header */}
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
              <BookOpen size={20} />
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
                DATUM System Tour & Tab Guidebook
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.78rem',
                  color: isDark ? '#94a3b8' : '#64748b',
                }}
              >
                Step-by-step documentation for Lead Planners & Field Supervisors
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSystemTourOpen(false)}
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
            title="Close Guidebook"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content Split */}
        <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr', flex: 1, minHeight: 440, overflow: 'hidden' }}>
          {/* Left Navigation */}
          <div
            style={{
              borderRight: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
              padding: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              background: isDark ? 'rgba(0,0,0,0.25)' : '#f8fafc',
              overflowY: 'auto',
            }}
          >
            {GUIDE_SECTIONS.map(s => {
              const isActive = s.id === selectedSectionId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSectionId(s.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 2,
                    padding: '0.7rem 0.9rem',
                    borderRadius: 8,
                    border: isActive
                      ? (isDark ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid #bae6fd')
                      : '1px solid transparent',
                    background: isActive
                      ? (isDark ? 'rgba(14, 165, 233, 0.18)' : '#e0f2fe')
                      : 'transparent',
                    color: isActive
                      ? (isDark ? '#38bdf8' : '#0284c7')
                      : (isDark ? '#cbd5e1' : '#475569'),
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: isActive ? 800 : 600 }}>
                      {s.title}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      color: isActive
                        ? (isDark ? '#7dd3fc' : '#0369a1')
                        : (isDark ? '#94a3b8' : '#64748b'),
                    }}
                  >
                    {s.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Detailed Description */}
          <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: 'rgba(14, 165, 233, 0.15)',
                    color: '#38bdf8',
                  }}
                >
                  {currentSection.badge}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>
                  Role: {currentSection.role.toUpperCase()}
                </span>
              </div>
              <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
                {currentSection.title}
              </h4>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: isDark ? '#cbd5e1' : '#334155', lineHeight: 1.5 }}>
                {currentSection.description}
              </p>
            </div>

            <div
              style={{
                background: isDark ? 'rgba(0,0,0,0.35)' : '#f8fafc',
                border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '1.15rem',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: isDark ? '#38bdf8' : '#0284c7', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Operational Workflow Steps
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {currentSection.steps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.82rem', color: isDark ? '#cbd5e1' : '#334155', lineHeight: 1.5 }}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: isDark ? 'rgba(14, 165, 233, 0.2)' : '#e0f2fe',
                        color: isDark ? '#38bdf8' : '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      {idx + 1}
                    </div>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Jump to Tab Button */}
            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setIsSystemTourOpen(false);
                  setActiveTab(currentSection.tab);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.25rem',
                  borderRadius: 8,
                  border: 'none',
                  background: '#0284c7',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                <span>Navigate to {currentSection.title.split('.')[1] || currentSection.title}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
