import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Search,
  Bell,
  ChevronDown,
  Sun,
  Moon,
  ShieldCheck,
  HardHat,
  Download,
  RotateCcw,
  Layers,
  ChevronRight,
  Check,
  Compass,
  AlertTriangle,
  Clock,
  ExternalLink,
  Command,
  Info,
  FileText,
  Database
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'warning' | 'critical' | 'success' | 'info';
  title: string;
  time: string;
  desc: string;
  read: boolean;
  tab: 'planner-review' | 'copilot' | 'site-updates' | 'dashboard' | 'schedule-activities';
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'warning',
    title: '3 Field Reports Require Review',
    time: '10m ago',
    desc: 'Unit-04 piping installation reports require planner alignment confirmation.',
    read: false,
    tab: 'planner-review',
  },
  {
    id: 'notif-2',
    type: 'critical',
    title: 'Critical Path Schedule Variance',
    time: '25m ago',
    desc: 'ISO-004-C hydrotest line delayed by -4.2 days. Float exhausted.',
    read: false,
    tab: 'copilot',
  },
  {
    id: 'notif-3',
    type: 'success',
    title: '14 Field Reports Auto-Matched',
    time: '1h ago',
    desc: 'AI confidence score >90% on civil and structural foundation logs.',
    read: false,
    tab: 'site-updates',
  },
  {
    id: 'notif-4',
    type: 'info',
    title: 'Primavera P6 Sync Ready',
    time: '3h ago',
    desc: 'Weekly schedule snapshot XML verified and ready for project export.',
    read: true,
    tab: 'dashboard',
  },
];

export const AppHeader: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentRole,
    setCurrentRole,
    currentUser,
    logout,
    theme,
    toggleTheme,
    exportAlignmentCSV,
    loadDemoData,
    addToast,
    setIsCommandPaletteOpen,
    startGuidedDemo,
  } = useProject();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdowns on outside click or escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserDropdown(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleRoleToggle = (targetRole: 'admin' | 'supervisor') => {
    setCurrentRole(targetRole);
    setShowUserDropdown(false);
    addToast({
      type: 'info',
      title: `Role Switched: ${targetRole === 'admin' ? 'Lead Planner' : 'Site Supervisor'}`,
      message: `Switched perspective to ${targetRole === 'admin' ? 'Lead Planner decision matrix' : 'Field Supervisor evidence capture'}.`,
    });
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    // Mark as read
    setNotifications(prev => prev.map(n => (n.id === notif.id ? { ...n, read: true } : n)));
    setShowNotifications(false);
    setActiveTab(notif.tab);
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    addToast({
      type: 'info',
      title: 'Notifications Cleared',
      message: 'All system notifications marked as read.',
    });
  };

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'home': return 'Overview';
      case 'supervisor-entry': return isSupervisor ? "Today's Field Tasks" : 'Field Entry Portal';
      case 'site-updates': return 'Daily Site Reports';
      case 'dashboard': return 'Project Control Center';
      case 'planner-review': return 'AI Matching & Field Review';
      case 'schedule-activities': return 'Project Schedule & 4D Gantt';
      case 'copilot': return 'Delay Simulator';
      case 'upload': return 'Data Ingestion & Uploads Hub';
      default: return 'Overview';
    }
  };

  const isSupervisor = currentRole === 'supervisor';

  return (
    <header
      className="app-header"
      style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0.55rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.25rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Left: Breadcrumbs & Page Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            style={{
              fontWeight: 600,
              color: 'var(--text-secondary)',
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textDecoration: 'none',
            }}
            title="Go to Project Control Center"
          >
            IOCL Refinery - P4
          </button>
          <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{getPageTitle(activeTab)}</span>
        </div>
      </div>

      {/* Center: Global Search & Quick Workspace Shortcuts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, maxWidth: '640px' }}>
        <div
          onClick={() => setIsCommandPaletteOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.35rem 0.65rem',
            gap: '0.5rem',
            flex: 1,
            transition: 'all 0.15s ease',
            cursor: 'pointer',
          }}
          title="Open Quick Search & Command Palette (Ctrl + K)"
        >
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <span
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              flex: 1,
              userSelect: 'none',
            }}
          >
            Search activities, reports, tags, or press <strong style={{ color: 'var(--text-secondary)' }}>Ctrl+K</strong>...
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              padding: '1px 5px',
              borderRadius: 3,
              fontFamily: 'var(--font-mono)',
              whiteSpace: 'nowrap',
            }}
          >
            Ctrl K
          </span>
        </div>

        {/* Universal Quick Action: Upload / Ingest Data */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('upload')}
            title="Upload schedule baselines, daily supervisor logs, or excel progress files"
            style={{ padding: '0.32rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, gap: 5 }}
          >
            <Database size={13} />
            <span>Upload / Ingest Data</span>
          </button>
        </div>
      </div>

      {/* Right Controls: Theme, Export, Notifications, User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        {/* Theme Switcher */}
        <button
          type="button"
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
          aria-label="Toggle visual theme"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Export Data */}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={exportAlignmentCSV}
          title="Export CSV alignment report"
          style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', gap: 4 }}
        >
          <Download size={13} />
          <span>Export</span>
        </button>

        {/* Notifications Bell with Popover */}
        <div ref={notificationsRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-expanded={showNotifications}
            aria-label="View System Notifications"
            style={{
              position: 'relative',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              background: showNotifications ? 'var(--bg-subtle)' : 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  minWidth: 14,
                  height: 14,
                  borderRadius: 7,
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                  boxShadow: '0 0 0 2px var(--bg-surface)',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 330,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28), 0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 300,
                display: 'flex',
                flexDirection: 'column',
                animation: 'fadeIn 0.15s ease-out',
                overflow: 'hidden',
              }}
            >
              {/* Notifications Header */}
              <div
                style={{
                  padding: '0.75rem 0.85rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Bell size={14} style={{ color: 'var(--brand-primary)' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    System Alerts & Telemetry
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllNotificationsRead}
                    style={{
                      fontSize: '0.675rem',
                      fontWeight: 600,
                      color: 'var(--brand-primary)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.map((notif) => {
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        background: notif.read ? 'var(--bg-surface)' : 'var(--brand-surface)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                        display: 'flex',
                        gap: '0.65rem',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          marginTop: 5,
                          flexShrink: 0,
                          background: notif.read
                            ? 'transparent'
                            : notif.type === 'critical'
                            ? '#ef4444'
                            : notif.type === 'warning'
                            ? '#f59e0b'
                            : notif.type === 'success'
                            ? '#10b981'
                            : 'var(--brand-primary)',
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: notif.read ? 600 : 700, color: 'var(--text-primary)' }}>
                            {notif.title}
                          </span>
                          <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>{notif.time}</span>
                        </div>
                        <div style={{ fontSize: '0.675rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                          {notif.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Notifications Footer */}
              <div
                style={{
                  padding: '0.5rem 0.85rem',
                  borderTop: '1px solid var(--border-subtle)',
                  background: 'var(--bg-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(false);
                    setActiveTab('planner-review');
                  }}
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span>Review Audit Logs</span>
                  <ExternalLink size={11} />
                </button>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                  Auto-synced with edge nodes
                </span>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar & Name with Rich Dropdown */}
        <div ref={userDropdownRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            aria-expanded={showUserDropdown}
            aria-label="User Profile & Settings Menu"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              background: showUserDropdown ? 'var(--bg-subtle)' : 'transparent',
              border: '1px solid var(--border-subtle)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: isSupervisor ? '#0284c7' : '#0f172a',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isSupervisor ? 'S' : 'L'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {isSupervisor ? 'Site Supervisor' : 'Lead Planner'}
              </span>
              <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                {isSupervisor ? 'Unit 01 • Pump Bay' : 'Project Controls'}
              </span>
            </div>

            <ChevronDown
              size={12}
              style={{
                color: 'var(--text-muted)',
                transform: showUserDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s ease',
              }}
            />
          </button>

          {/* User Menu Dropdown Popover */}
          {showUserDropdown && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 260,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28), 0 4px 12px rgba(0, 0, 0, 0.15)',
                padding: '0.5rem',
                zIndex: 300,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                animation: 'fadeIn 0.15s ease-out',
              }}
            >
              {/* User Profile Header Card */}
              <div
                style={{
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  marginBottom: 2,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: currentRole === 'admin' ? '#047857' : '#0369a1',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {currentUser?.avatarLetter || (currentRole === 'admin' ? 'G' : 'R')}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.775rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentUser?.fullName || (currentRole === 'admin' ? 'Gokulakannan P.' : 'Rajesh Kumar')}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentUser?.department || (currentRole === 'admin' ? 'Project Controls Lead' : 'Field Supervisor')}
                  </div>
                </div>
              </div>

              {/* Perspective Role Switch Section */}
              <div style={{ padding: '0.2rem 0.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.45rem' }}>
                <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                  Active Perspective
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <button
                    type="button"
                    onClick={() => handleRoleToggle('admin')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.4rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: currentRole === 'admin' ? 'var(--brand-surface)' : 'transparent',
                      border: `1px solid ${currentRole === 'admin' ? 'var(--brand-primary)' : 'transparent'}`,
                      color: currentRole === 'admin' ? 'var(--brand-primary)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.725rem',
                      fontWeight: currentRole === 'admin' ? 700 : 500,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ShieldCheck size={14} />
                      <span>Lead Planning Engineer</span>
                    </div>
                    {currentRole === 'admin' && <Check size={12} strokeWidth={3} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleToggle('supervisor')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.4rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: currentRole === 'supervisor' ? 'var(--brand-surface)' : 'transparent',
                      border: `1px solid ${currentRole === 'supervisor' ? 'var(--brand-primary)' : 'transparent'}`,
                      color: currentRole === 'supervisor' ? 'var(--brand-primary)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.725rem',
                      fontWeight: currentRole === 'supervisor' ? 700 : 500,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <HardHat size={14} />
                      <span>Field Site Supervisor</span>
                    </div>
                    {currentRole === 'supervisor' && <Check size={12} strokeWidth={3} />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 2 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start', width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.725rem' }}
                  onClick={() => {
                    setShowUserDropdown(false);
                    startGuidedDemo();
                  }}
                >
                  <Compass size={13} style={{ color: 'var(--brand-primary)' }} />
                  <span>Start Guided Demo Tour</span>
                </button>

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start', width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.725rem' }}
                  onClick={() => {
                    setShowUserDropdown(false);
                    setIsCommandPaletteOpen(true);
                  }}
                >
                  <Command size={13} />
                  <span>Command Palette (Ctrl+K)</span>
                </button>

                {currentRole === 'admin' && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ justifyContent: 'flex-start', width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.725rem' }}
                    onClick={() => {
                      setShowUserDropdown(false);
                      loadDemoData();
                    }}
                  >
                    <RotateCcw size={13} />
                    <span>Reset Benchmark Dataset</span>
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start', width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.725rem', color: 'var(--status-critical-fg)' }}
                  onClick={() => {
                    setShowUserDropdown(false);
                    logout();
                  }}
                >
                  <span>Sign Out Session</span>
                </button>
              </div>

              {/* License / Version Footer */}
              <div
                style={{
                  marginTop: 4,
                  paddingTop: '0.45rem',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingLeft: '0.35rem',
                  paddingRight: '0.35rem',
                }}
              >
                <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                  IOCL EPCC-4 Enterprise
                </span>
                <span style={{ fontSize: '0.625rem', color: 'var(--status-ready-fg)', fontWeight: 700 }}>
                  ● Auth Verified
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

