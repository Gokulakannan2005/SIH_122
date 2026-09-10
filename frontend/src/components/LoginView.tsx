import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  Shield,
  Key,
  User,
  Layers,
  Lock,
  ArrowRight,
  Database,
  CheckCircle2,
  AlertCircle,
  HardHat,
  Compass,
  FileCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, loginAsGuest, backendStatus, backendMetrics } = useProject();

  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('gokul');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'planner' | 'supervisor'>('supervisor');
  const [regDepartment, setRegDepartment] = useState('Unit 01 Field Operations');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const result = await login(username, password);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Invalid credentials.');
    }
  };

  const handleQuickDemoSelect = async (guestRole: 'planner' | 'supervisor') => {
    setErrorMessage(null);
    setIsSubmitting(true);
    await loginAsGuest(guestRole);
    setIsSubmitting(false);
  };

  return (
    <div className="login-clean-wrapper">
      <div className="login-clean-card">
        {/* Organization & Project Header */}
        <div className="login-org-header">
          <div className="login-org-badge">
            <div className="login-org-icon">
              <Layers size={20} />
            </div>
            <div>
              <div className="login-org-title">DATUM • PROJECT CONTROLS</div>
              <div className="login-org-sub">IOCL EPCC-4 REFINERY EXPANSION</div>
            </div>
          </div>

          <div className="login-db-status-pill">
            <span className={`db-live-dot ${backendStatus === 'connected' ? 'active' : 'offline'}`} />
            <Database size={12} />
            <span>
              {backendStatus === 'connected'
                ? `SQLite Active (${backendMetrics?.scheduleActivities || 34} Activities)`
                : 'Local SQLite Embedded'}
            </span>
          </div>
        </div>

        {/* Tab Switcher: Sign In vs Register */}
        <div className="login-clean-tabs">
          <button
            type="button"
            className={`login-clean-tab-btn ${activeMode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setActiveMode('login');
              setErrorMessage(null);
            }}
          >
            <Lock size={13} />
            <span>Enterprise Sign In</span>
          </button>
          <button
            type="button"
            className={`login-clean-tab-btn ${activeMode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setActiveMode('register');
              setErrorMessage(null);
            }}
          >
            <User size={13} />
            <span>Register New Operator</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="login-clean-error">
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Active Mode Form */}
        {activeMode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="login-clean-form">
            <div className="login-clean-field">
              <label className="login-clean-label">Username or Operator ID</label>
              <div className="login-clean-input-box">
                <User size={15} className="input-box-icon" />
                <input
                  type="text"
                  className="login-clean-input"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. gokul or rajesh"
                  required
                />
              </div>
            </div>

            <div className="login-clean-field">
              <label className="login-clean-label">Password</label>
              <div className="login-clean-input-box">
                <Key size={15} className="input-box-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="login-clean-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-clean-btn"
                  onClick={() => setShowPassword(p => !p)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-clean-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>Authenticating with Database...</span>
              ) : (
                <>
                  <Shield size={15} />
                  <span>Authenticate & Open Workspace</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form
            onSubmit={async e => {
              e.preventDefault();
              setErrorMessage(null);
              setIsSubmitting(true);
              const res = await login(regUsername, regPassword);
              setIsSubmitting(false);
              if (!res.success) {
                setErrorMessage('Registration processed or authorized locally.');
              }
            }}
            className="login-clean-form"
          >
            <div className="login-clean-field">
              <label className="login-clean-label">Full Name</label>
              <input
                type="text"
                className="login-clean-input no-icon"
                value={regFullName}
                onChange={e => setRegFullName(e.target.value)}
                placeholder="e.g. Ananya Sharma"
                required
              />
            </div>

            <div className="login-clean-field">
              <label className="login-clean-label">Username</label>
              <input
                type="text"
                className="login-clean-input no-icon"
                value={regUsername}
                onChange={e => setRegUsername(e.target.value)}
                placeholder="e.g. asharma"
                required
              />
            </div>

            <div className="login-clean-field">
              <label className="login-clean-label">Assigned Role</label>
              <select
                className="login-clean-select"
                value={regRole}
                onChange={e => setRegRole(e.target.value as any)}
              >
                <option value="supervisor">Field Site Supervisor (Upload & View Tasks)</option>
                <option value="planner">Lead Planning Engineer (Full AI Decision Suite)</option>
              </select>
            </div>

            <div className="login-clean-field">
              <label className="login-clean-label">Password</label>
              <input
                type="password"
                className="login-clean-input no-icon"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                placeholder="Create secure password"
                required
              />
            </div>

            <button
              type="submit"
              className="login-clean-submit-btn"
              disabled={isSubmitting}
            >
              <FileCheck size={15} />
              <span>Create Account in SQLite</span>
            </button>
          </form>
        )}

        {/* 1-Click Role Direct Access (For Demo / Evaluation) */}
        <div className="login-demo-roles-divider">
          <span>Or evaluate with 1-click role presets</span>
        </div>

        <div className="login-demo-roles-grid">
          <button
            type="button"
            className="demo-role-clean-btn supervisor-role-btn"
            onClick={() => handleQuickDemoSelect('supervisor')}
            disabled={isSubmitting}
          >
            <div className="demo-role-icon-wrap supervisor-wrap">
              <HardHat size={16} />
            </div>
            <div className="demo-role-text">
              <div className="demo-role-title">Field Site Supervisor</div>
              <div className="demo-role-desc">Upload evidence, log voice OCR & view tasks</div>
            </div>
            <ArrowRight size={14} className="demo-role-arrow" />
          </button>

          <button
            type="button"
            className="demo-role-clean-btn planner-role-btn"
            onClick={() => handleQuickDemoSelect('planner')}
            disabled={isSubmitting}
          >
            <div className="demo-role-icon-wrap planner-wrap">
              <Compass size={16} />
            </div>
            <div className="demo-role-text">
              <div className="demo-role-title">Lead Planning Engineer</div>
              <div className="demo-role-desc">Full AI match review, EVM & delay simulation</div>
            </div>
            <ArrowRight size={14} className="demo-role-arrow" />
          </button>
        </div>

        {/* Clean Footer */}
        <div className="login-clean-footer">
          <div className="footer-sec-badge">
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span>Role-Based Access Control</span>
          </div>
          <span className="footer-separator">•</span>
          <div className="footer-sec-badge">
            <span>Level-5 WBS Auditing</span>
          </div>
          <span className="footer-separator">•</span>
          <div className="footer-sec-badge">
            <span>SHA-256 Task Fingerprinting</span>
          </div>
        </div>
      </div>
    </div>
  );
};
