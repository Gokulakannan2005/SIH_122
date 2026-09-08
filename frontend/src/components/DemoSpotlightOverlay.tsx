import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GuidedDemoStep, NavigationTab } from '../types';
import { DemoInstructionCard } from './DemoInstructionCard';

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

  const activeElementRef = useRef<HTMLElement | null>(null);

  // Helper to find and calculate target rect
  const updateTargetRect = useCallback(() => {
    if (!currentStep.targetSelector) {
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
  }, [currentStep.targetSelector]);

  // Clean up class on unmount
  useEffect(() => {
    return () => {
      if (activeElementRef.current) {
        activeElementRef.current.classList.remove('demo-spotlight-active-target');
      }
    };
  }, []);

  // Scroll to target and switch tab when step changes
  useEffect(() => {
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
  }, [currentStepIndex, currentStep, onJumpToTab, updateTargetRect]);

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

    // Periodic check for dynamic content resizing
    const interval = setInterval(updateTargetRect, 500);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
      clearInterval(interval);
    };
  }, [updateTargetRect]);

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
        // Flip to above
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
      {/* 4 Blocker Backdrop Panels: Creates an unobstructed physical cutout hole around the target */}
      {targetRect.found ? (
        <div
          className="demo-spotlight-layer"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 8880,
            pointerEvents: 'none',
            overflow: 'hidden',
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

          {/* Spotlight Highlight Frame with subtle elevation and accent border around the cutout */}
          <div
            className="demo-spotlight-frame"
            style={{
              position: 'fixed',
              top: `${targetRect.top}px`,
              left: `${targetRect.left}px`,
              width: `${targetRect.width}px`,
              height: `${targetRect.height}px`,
              borderRadius: '12px',
              border: '1.5px solid rgba(59, 130, 246, 0.85)',
              boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 20px rgba(59, 130, 246, 0.2), inset 0 0 15px rgba(59, 130, 246, 0.05)',
              pointerEvents: 'none',
              zIndex: 8885,
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>
      ) : (
        /* Fullscreen Dimmed Backdrop fallback when target is locating/switching */
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
      )}

      {/* Floating Demo Instruction Card with top-level z-index layer */}
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
          style={getCardPosition()}
        />
      </div>
    </>
  );
};

