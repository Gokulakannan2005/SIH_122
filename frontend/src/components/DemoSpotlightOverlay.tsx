import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GuidedDemoStep, NavigationTab } from '../types';
import { DemoInstructionCard } from './DemoInstructionCard';
import { useProject } from '../context/ProjectContext';
import { Play, Pause, X, ExternalLink, Layers } from 'lucide-react';

interface DemoSpotlightOverlayProps {
  currentStep: GuidedDemoStep;
  currentStepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onJumpToTab?: (tab: NavigationTab) => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  found: boolean;
}

const SPOTLIGHT_PADDING = 14;

export const DemoSpotlightOverlay: React.FC<DemoSpotlightOverlayProps> = ({
  currentStep,
  currentStepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  onJumpToTab,
}) => {
  const {
    selectedInspectorUpdateId,
    setSelectedInspectorUpdateId,
    selectedScheduleActivityId,
    setSelectedScheduleActivityId,
    selectedReviewUpdateId,
    setSelectedReviewUpdateId,
    selectedAuditUpdateId,
    setSelectedAuditUpdateId,
  } = useProject();

  const [targetRect, setTargetRect] = useState<TargetRect>({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    found: false,
  });

  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  const [isManualPaused, setIsManualPaused] = useState(false);

  // Any active drawer or manual minimize constitutes inspecting mode
  const isDrawerOpen = Boolean(
    selectedInspectorUpdateId ||
    selectedScheduleActivityId ||
    selectedReviewUpdateId ||
    selectedAuditUpdateId
  );

  const isInspecting = isDrawerOpen || isManualPaused;

  const activeElementRef = useRef<HTMLElement | null>(null);

  // Helper to find and calculate target rect
  const updateTargetRect = useCallback(() => {
    if (isInspecting || !currentStep.targetSelector) {
      if (activeElementRef.current) {
        activeElementRef.current.classList.remove('demo-spotlight-active-target');
        activeElementRef.current = null;
      }
      setTargetRect(prev => ({ ...prev, found: false }));
      return;
    }

    const selectors = currentStep.targetSelector.split(',').map(s => s.trim());
    let element: HTMLElement | null = null;

    for (const sel of selectors) {
      const el = document.querySelector(sel) as HTMLElement;
      if (el) {
        element = el;
        break;
      }
    }

    if (element) {
      // Manage active target class
      if (activeElementRef.current && activeElementRef.current !== element) {
        activeElementRef.current.classList.remove('demo-spotlight-active-target');
      }
      element.classList.add('demo-spotlight-active-target');
      activeElementRef.current = element;

      const rect = element.getBoundingClientRect();
      const p = SPOTLIGHT_PADDING;
      const newTop = Math.max(0, rect.top - p);
      const newLeft = Math.max(0, rect.left - p);
      const newWidth = rect.width + p * 2;
      const newHeight = rect.height + p * 2;
      
      setTargetRect(prev => {
        if (
          prev.found &&
          Math.abs(prev.top - newTop) < 1 &&
          Math.abs(prev.left - newLeft) < 1 &&
          Math.abs(prev.width - newWidth) < 1 &&
          Math.abs(prev.height - newHeight) < 1
        ) {
          return prev;
        }
        return {
          top: newTop,
          left: newLeft,
          width: newWidth,
          height: newHeight,
          found: true,
        };
      });
    } else {
      if (activeElementRef.current) {
        activeElementRef.current.classList.remove('demo-spotlight-active-target');
        activeElementRef.current = null;
      }
      setTargetRect(prev => (prev.found ? { ...prev, found: false } : prev));
    }
  }, [currentStep.targetSelector, isInspecting]);

  // Clean up class on unmount
  useEffect(() => {
    return () => {
      if (activeElementRef.current) {
        activeElementRef.current.classList.remove('demo-spotlight-active-target');
      }
    };
  }, []);

  // Scroll to target and switch tab when step changes (only if not inspecting)
  useEffect(() => {
    if (isInspecting) return;

    if (onJumpToTab && currentStep.targetTab) {
      onJumpToTab(currentStep.targetTab);
    }

    // Give DOM time to render the new tab view
    const initialTimer = setTimeout(() => {
      if (currentStep.targetSelector) {
        const selectors = currentStep.targetSelector.split(',').map(s => s.trim());
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            break;
          }
        }
      }
      updateTargetRect();
    }, 150);

    const followUpTimer = setTimeout(updateTargetRect, 450);
    const settleTimer = setTimeout(updateTargetRect, 800);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(followUpTimer);
      clearTimeout(settleTimer);
    };
  }, [currentStepIndex, currentStep, onJumpToTab, updateTargetRect, isInspecting]);

  // Handle resize, scroll, and continuous DOM tracking
  useEffect(() => {
    let ticking = false;

    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      updateTargetRect();
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateTargetRect();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    const interval = setInterval(updateTargetRect, 500);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
      clearInterval(interval);
    };
  }, [updateTargetRect]);

  const handleResume = () => {
    // Close any open drawers
    setSelectedInspectorUpdateId(null);
    setSelectedScheduleActivityId(null);
    setSelectedReviewUpdateId(null);
    setSelectedAuditUpdateId(null);
    setIsManualPaused(false);

    // Scroll to target element if present
    setTimeout(() => {
      if (currentStep.targetSelector) {
        const selectors = currentStep.targetSelector.split(',').map(s => s.trim());
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            break;
          }
        }
      }
      updateTargetRect();
    }, 100);
  };

  // Intelligent Contextual positioning of the card
  const getCardPosition = (): React.CSSProperties => {
    const cardWidth = 330;
    const cardHeight = 220;
    const margin = 16;
    const winW = windowSize.width;
    const winH = windowSize.height;

    if (!targetRect.found) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const { top, left, width, height } = targetRect;
    const spaceAbove = top;
    const spaceBelow = winH - (top + height);
    const spaceRight = winW - (left + width);
    const spaceLeft = left;

    let cardTop = top + height + margin;
    let cardLeft = left + width - cardWidth;

    const preferred = currentStep.cardPlacement || 'bottom-right';

    if (preferred === 'right' && spaceRight >= cardWidth + margin) {
      cardTop = Math.max(margin, top + (height - cardHeight) / 2);
      cardLeft = left + width + margin;
    } else if (preferred === 'bottom-left') {
      cardTop = top + height + margin;
      cardLeft = left;
    } else if (preferred === 'top-right') {
      cardTop = top - cardHeight - margin;
      cardLeft = left + width - cardWidth;
    } else if (preferred === 'top-left') {
      cardTop = top - cardHeight - margin;
      cardLeft = left;
    }

    // Safety checks: ensure it does not overlap target and stays in viewport
    if (cardTop + cardHeight > winH - margin) {
      if (spaceAbove >= cardHeight + margin) {
        cardTop = top - cardHeight - margin;
      } else {
        cardTop = Math.max(margin, winH - cardHeight - margin);
      }
    }

    if (cardTop < margin) {
      if (spaceBelow >= cardHeight + margin) {
        cardTop = top + height + margin;
      } else {
        cardTop = margin;
      }
    }

    // Clamp horizontal position
    if (cardLeft + cardWidth > winW - margin) {
      cardLeft = winW - cardWidth - margin;
    }
    if (cardLeft < margin) {
      cardLeft = margin;
    }

    return {
      top: `${Math.round(cardTop)}px`,
      left: `${Math.round(cardLeft)}px`,
      transform: 'none',
      transition: 'top 0.22s cubic-bezier(0.16, 1, 0.3, 1), left 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
    };
  };

  const backdropBg = 'rgba(10, 15, 29, 0.78)';
  const winW = windowSize.width;
  const winH = windowSize.height;

  // Safe clamping calculations for 4 blocker panels
  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
  const safeTop = clamp(targetRect.top, 0, winH);
  const safeBottom = clamp(targetRect.top + targetRect.height, 0, winH);
  const safeLeft = clamp(targetRect.left, 0, winW);
  const safeRight = clamp(targetRect.left + targetRect.width, 0, winW);

  return (
    <>
      {/* 4 Blocker Backdrop Panels: When NOT inspecting, creates a physical cutout around target */}
      {!isInspecting && targetRect.found ? (
        <div
          className="demo-spotlight-layer"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 8880,
            pointerEvents: 'none',
            overflow: 'hidden',
            opacity: 1,
            transition: 'opacity 0.25s ease',
          }}
        >
          {/* Top Blocker */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: `${safeTop}px`,
              background: backdropBg,
              backdropFilter: 'blur(2px)',
              pointerEvents: 'auto',
              transition: 'height 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={e => e.stopPropagation()}
          />

          {/* Bottom Blocker */}
          <div
            style={{
              position: 'fixed',
              top: `${safeBottom}px`,
              left: 0,
              right: 0,
              bottom: 0,
              background: backdropBg,
              backdropFilter: 'blur(2px)',
              pointerEvents: 'auto',
              transition: 'top 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={e => e.stopPropagation()}
          />

          {/* Left Blocker */}
          <div
            style={{
              position: 'fixed',
              top: `${safeTop}px`,
              left: 0,
              width: `${safeLeft}px`,
              height: `${Math.max(0, safeBottom - safeTop)}px`,
              background: backdropBg,
              backdropFilter: 'blur(2px)',
              pointerEvents: 'auto',
              transition: 'top 0.22s cubic-bezier(0.16, 1, 0.3, 1), width 0.22s cubic-bezier(0.16, 1, 0.3, 1), height 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={e => e.stopPropagation()}
          />

          {/* Right Blocker */}
          <div
            style={{
              position: 'fixed',
              top: `${safeTop}px`,
              left: `${safeRight}px`,
              right: 0,
              height: `${Math.max(0, safeBottom - safeTop)}px`,
              background: backdropBg,
              backdropFilter: 'blur(2px)',
              pointerEvents: 'auto',
              transition: 'top 0.22s cubic-bezier(0.16, 1, 0.3, 1), left 0.22s cubic-bezier(0.16, 1, 0.3, 1), height 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={e => e.stopPropagation()}
          />

          {/* Spotlight Highlight Frame */}
          <div
            className="demo-spotlight-frame"
            style={{
              position: 'fixed',
              top: `${targetRect.top}px`,
              left: `${targetRect.left}px`,
              width: `${targetRect.width}px`,
              height: `${targetRect.height}px`,
              borderRadius: '12px',
              border: '2px solid rgba(59, 130, 246, 0.95)',
              boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.15), 0 0 24px rgba(59, 130, 246, 0.35)',
              pointerEvents: 'none',
              zIndex: 8885,
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>
      ) : !isInspecting && !targetRect.found ? (
        /* Fullscreen Dimmed Backdrop fallback when target is switching */
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: backdropBg,
            backdropFilter: 'blur(2px)',
            pointerEvents: 'auto',
            zIndex: 8880,
          }}
          onClick={e => e.stopPropagation()}
        />
      ) : null}

      {/* Floating Demo Instruction Card OR Docked Bottom Bar */}
      {!isInspecting ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 99999,
          }}
        >
          <DemoInstructionCard
            step={currentStep}
            stepIndex={currentStepIndex}
            totalSteps={totalSteps}
            onNext={onNext}
            onPrev={onPrev}
            onSkip={onSkip}
            onMinimize={() => setIsManualPaused(true)}
            style={getCardPosition()}
          />
        </div>
      ) : (
        /* Animated Docked Bottom Pill when Inspecting or Paused */
        <div
          className="demo-docked-pill-container"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 25000,
            pointerEvents: 'auto',
            animation: 'demoDockSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            style={{
              background: '#0c1322',
              border: '1.5px solid #3b82f6',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.8), 0 0 20px rgba(59, 130, 246, 0.25)',
              borderRadius: '999px',
              padding: '0.55rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              color: '#f8fafc',
            }}
          >
            {/* Status Pulse */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                  display: 'inline-block',
                }}
              />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tour Paused for Inspection
              </span>
            </div>

            {/* Current Step Name */}
            <div
              style={{
                fontSize: '0.8rem',
                color: '#cbd5e1',
                borderLeft: '1px solid rgba(255, 255, 255, 0.15)',
                paddingLeft: '0.85rem',
                maxWidth: '280px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <strong style={{ color: '#ffffff' }}>Step {currentStep.stepNumber}:</strong> {currentStep.title}
            </div>

            {/* Resume Button */}
            <button
              type="button"
              onClick={handleResume}
              style={{
                background: '#2563eb',
                border: '1px solid #60a5fa',
                color: '#ffffff',
                padding: '0.4rem 0.95rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 10px rgba(37, 99, 235, 0.5)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#1d4ed8')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#2563eb')}
            >
              <Play size={13} fill="currentColor" />
              <span>Resume Walkthrough ▶</span>
            </button>

            {/* Exit Demo button */}
            <button
              type="button"
              onClick={onSkip}
              title="Exit Walkthrough"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#94a3b8',
                padding: '0.35rem 0.65rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#ffffff')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#94a3b8')}
            >
              Exit Tour
            </button>
          </div>
        </div>
      )}
    </>
  );
};

