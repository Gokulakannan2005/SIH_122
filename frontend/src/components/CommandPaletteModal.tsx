import React, { useState, useEffect, useRef } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Search,
  Layers,
  FileText,
  Calendar,
  Sparkles,
  ShieldCheck,
  HardHat,
  Sun,
  Moon,
  Download,
  Play,
  ArrowRight,
  TrendingDown,
  X,
  Compass,
  CheckCircle2,
  Clock,
  Flame,
} from 'lucide-react';
import { NavigationTab } from '../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PaletteItem {
  id: string;
  category: 'Navigation' | 'Activities' | 'Field Reports' | 'Actions';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badge?: string;
  badgeType?: 'ready' | 'review' | 'unplanned' | 'info';
  onSelect: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({ isOpen, onClose }) => {
  const {
    setActiveTab,
    enrichedSchedule,
    siteUpdates,
    setSelectedScheduleActivityId,
    setSelectedInspectorUpdateId,
    currentRole,
    setCurrentRole,
    theme,
    toggleTheme,
    exportAlignmentCSV,
    startGuidedDemo,
    addToast,
  } = useProject();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Build items list based on query
  const items: PaletteItem[] = [];

  // 1. Navigation items
  const navItems: { tab: NavigationTab; title: string; subtitle: string; icon: React.ReactNode }[] = [
    { tab: 'home', title: 'Executive Overview', subtitle: 'High-level project intelligence & status', icon: <Compass size={16} /> },
    { tab: 'dashboard', title: "Project Control Center & Today's Tasks", subtitle: "Execution tracking, assigned tasks, and EVM KPIs", icon: <Layers size={16} /> },
    { tab: 'planner-review', title: 'AI Match Matrix', subtitle: 'Deterministic activity alignment & human-in-the-loop review', icon: <Sparkles size={16} /> },
    { tab: 'supervisor-entry', title: 'Field Evidence Capture', subtitle: 'Multilingual speech & handwritten OCR intake', icon: <HardHat size={16} /> },
    { tab: 'site-updates', title: 'Daily Field Reports Feed', subtitle: 'Chronological raw site logs & evidence streams', icon: <FileText size={16} /> },
    { tab: 'schedule-activities', title: '4D Master Schedule & Milestones', subtitle: 'Level-5/6 WBS schedule, gantt, and critical path', icon: <Calendar size={16} /> },
    { tab: 'copilot', title: 'AI Forward Delay Simulator', subtitle: 'What-If schedule risk propagation engine', icon: <TrendingDown size={16} /> },
    { tab: 'upload', title: 'Data Ingestion & Schemas', subtitle: 'Upload Primavera P6, Excel, or contractor logs', icon: <Download size={16} /> },
  ];

  navItems.forEach(n => {
    if (!query || n.title.toLowerCase().includes(query.toLowerCase()) || n.subtitle.toLowerCase().includes(query.toLowerCase())) {
      items.push({
        id: `nav-${n.tab}`,
        category: 'Navigation',
        title: n.title,
        subtitle: n.subtitle,
        icon: n.icon,
        onSelect: () => {
          setActiveTab(n.tab);
          onClose();
        },
      });
    }
  });

  // 2. Action items
  const actionItems = [
    {
      id: 'action-guided-demo',
      title: 'Start Interactive Guided Demo Tour',
      subtitle: '7-step gamified walkthrough across datum features',
      icon: <Play size={16} />,
      onSelect: () => {
        startGuidedDemo();
        onClose();
      },
    },
    {
      id: 'action-role-toggle',
      title: `Switch Perspective: ${currentRole === 'admin' ? 'Site Supervisor' : 'Lead Planner'}`,
      subtitle: `Current: ${currentRole === 'admin' ? 'Lead Planner' : 'Site Supervisor'}`,
      icon: currentRole === 'admin' ? <HardHat size={16} /> : <ShieldCheck size={16} />,
      onSelect: () => {
        const nextRole = currentRole === 'admin' ? 'supervisor' : 'admin';
        setCurrentRole(nextRole);
        addToast({
          type: 'info',
          title: `Role Switched: ${nextRole === 'admin' ? 'Lead Planner' : 'Site Supervisor'}`,
          message: `Perspective updated to ${nextRole === 'admin' ? 'Lead Planner suite' : 'Field Supervisor mode'}.`,
        });
        onClose();
      },
    },
    {
      id: 'action-theme-toggle',
      title: `Switch Theme to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      subtitle: `Toggle visual appearance between clean light & dark slate`,
      icon: theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />,
      onSelect: () => {
        toggleTheme();
        onClose();
      },
    },
    {
      id: 'action-export-csv',
      title: 'Export Alignment Reconciliation CSV',
      subtitle: 'Download reconciled schedule evidence dataset',
      icon: <Download size={16} />,
      onSelect: () => {
        exportAlignmentCSV();
        onClose();
      },
    },
  ];

  actionItems.forEach(a => {
    if (!query || a.title.toLowerCase().includes(query.toLowerCase()) || a.subtitle.toLowerCase().includes(query.toLowerCase())) {
      items.push({
        id: a.id,
        category: 'Actions',
        title: a.title,
        subtitle: a.subtitle,
        icon: a.icon,
        onSelect: a.onSelect,
      });
    }
  });

  // 3. Schedule Activities matches
  if (query.trim().length > 0) {
    const matchedActivities = enrichedSchedule.filter(
      act =>
        act.activityId.toLowerCase().includes(query.toLowerCase()) ||
        act.activityName.toLowerCase().includes(query.toLowerCase()) ||
        act.discipline.toLowerCase().includes(query.toLowerCase()) ||
        act.area.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);

    matchedActivities.forEach(act => {
      items.push({
        id: `act-${act.activityId}`,
        category: 'Activities',
        title: `${act.activityId} — ${act.activityName}`,
        subtitle: `${act.discipline} • ${act.area} • Progress: ${act.progressPercent || 0}% • Status: ${act.status || 'Planned'}`,
        icon: <Calendar size={16} />,
        badge: act.status || 'Planned',
        badgeType: act.status === 'Completed' ? 'ready' : act.status === 'Delayed' ? 'unplanned' : 'review',
        onSelect: () => {
          setSelectedScheduleActivityId(act.activityId);
          setActiveTab('schedule-activities');
          onClose();
        },
      });
    });

    // 4. Field Reports matches
    const matchedReports = siteUpdates.filter(
      rep =>
        rep.rawText.toLowerCase().includes(query.toLowerCase()) ||
        rep.sourceFile.toLowerCase().includes(query.toLowerCase()) ||
        rep.discipline.toLowerCase().includes(query.toLowerCase()) ||
        (rep.confirmedTag && rep.confirmedTag.toLowerCase().includes(query.toLowerCase())) ||
        (rep.extractedDescription && rep.extractedDescription.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 5);

    matchedReports.forEach(rep => {
      items.push({
        id: `rep-${rep.id}`,
        category: 'Field Reports',
        title: rep.extractedDescription || rep.rawText.slice(0, 50) + '...',
        subtitle: `${rep.sourceFile} • ${rep.reportDate} • ${rep.discipline}`,
        icon: <FileText size={16} />,
        badge: rep.eventStatus,
        badgeType: rep.eventStatus === 'Completed' ? 'ready' : 'info',
        onSelect: () => {
          setSelectedInspectorUpdateId(rep.id);
          setActiveTab('site-updates');
          onClose();
        },
      });
    });
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedIndex]) {
        items[selectedIndex].onSelect();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--bg-modal-backdrop)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '75vh',
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.9rem 1.15rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface-secondary)',
          }}
        >
          <Search size={18} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search activities, reports, tags..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.95rem',
              color: 'var(--text-primary)',
              fontWeight: 500,
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
              }}
            >
              <X size={14} />
            </button>
          )}
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 4,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            ESC to close
          </span>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          style={{
            overflowY: 'auto',
            padding: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {items.length === 0 ? (
            <div
              style={{
                padding: '2.5rem 1rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
              }}
            >
              No matching activities, reports, or commands found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            items.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.onSelect()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'var(--brand-surface)' : 'transparent',
                    border: `1px solid ${isSelected ? 'var(--brand-primary)' : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div
                      style={{
                        color: isSelected ? 'var(--brand-primary)' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: '0.725rem',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: 1,
                        }}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, marginLeft: '0.75rem' }}>
                    {item.badge && (
                      <span
                        className={`badge ${
                          item.badgeType === 'ready'
                            ? 'badge-ready'
                            : item.badgeType === 'unplanned'
                            ? 'badge-unplanned'
                            : item.badgeType === 'review'
                            ? 'badge-review'
                            : 'badge-info'
                        }`}
                        style={{ fontSize: '0.65rem', padding: '1px 6px' }}
                      >
                        {item.badge}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: 'var(--text-subtle)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {item.category}
                    </span>
                    <ArrowRight
                      size={13}
                      style={{
                        color: isSelected ? 'var(--brand-primary)' : 'var(--text-subtle)',
                        opacity: isSelected ? 1 : 0,
                        transition: 'opacity 0.15s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div
          style={{
            padding: '0.55rem 1.15rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span><kbd style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>↑↓</kbd> to navigate</span>
            <span><kbd style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>↵</kbd> to select</span>
            <span><kbd style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>esc</kbd> to dismiss</span>
          </div>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>DATUM Intelligence Palette</span>
        </div>
      </div>
    </div>
  );
};
