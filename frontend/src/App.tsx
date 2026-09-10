import React, { useState } from 'react';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { Sidebar } from './components/Sidebar';
import { AppHeader } from './components/AppHeader';
import { HomeIntroductionView } from './components/HomeIntroductionView';
import { Dashboard } from './components/Dashboard';
import { SiteUpdatesView } from './components/SiteUpdatesView';
import { ScheduleActivitiesView } from './components/ScheduleActivitiesView';
import { PlannerReviewView } from './components/PlannerReviewView';
import { UploadDemoView } from './components/UploadDemoView';
import { SupervisorEntryView } from './components/SupervisorEntryView';
import { CopilotView } from './components/CopilotView';
import { InspectorDrawer } from './components/InspectorDrawer';
import { ScheduleActivityDrawer } from './components/ScheduleActivityDrawer';
import { AuditTrailModal } from './components/AuditTrailModal';
import { ToastContainer } from './components/ToastContainer';
import { StartupExperience } from './components/StartupExperience';
import { GuidedDemoModal } from './components/GuidedDemoModal';
import { DemoSpotlightOverlay } from './components/DemoSpotlightOverlay';
import { DemoCompletionModal } from './components/DemoCompletionModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { LoginView } from './components/LoginView';
import { AuditTrailView } from './components/AuditTrailView';
import { GuidedDemoWalkthroughView } from './components/GuidedDemoWalkthroughView';
import { GUIDED_DEMO_STEPS } from './utils/guidedDemoData';

const AppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isAuthenticated,
    isGuidedDemoActive,
    guidedDemoStepIndex,
    currentGuidedDemoStep,
    startGuidedDemo,
    nextGuidedDemoStep,
    prevGuidedDemoStep,
    jumpToGuidedDemoStep,
    exitGuidedDemo,
    isWelcomeModalOpen,
    setIsWelcomeModalOpen,
    isDemoCompletionModalOpen,
    setIsDemoCompletionModalOpen,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    toggleCommandPalette,
  } = useProject();

  const [startupComplete, setStartupComplete] = useState<boolean>(false);

  // Global Ctrl + K / Cmd + K Command Palette Keyboard Shortcut
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [toggleCommandPalette]);

  return (
    <div className="app-layout">
      {/* 1.5s Enterprise Startup Animation */}
      {!startupComplete && (
        <StartupExperience onComplete={() => setStartupComplete(true)} />
      )}

      {/* Enterprise Database Authentication Screen */}
      {startupComplete && !isAuthenticated ? (
        <LoginView />
      ) : (
        <>
          {/* Left Sidebar Navigation */}
          <Sidebar />

          {/* Main Viewport Content Area */}
          <div className="app-main">
            <AppHeader />

            <div className="page-body">
              {activeTab === 'home' && <HomeIntroductionView />}
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'site-updates' && <SiteUpdatesView />}
              {activeTab === 'schedule-activities' && <ScheduleActivitiesView />}
              {activeTab === 'planner-review' && <PlannerReviewView />}
              {activeTab === 'audit-trail' && <AuditTrailView />}
              {activeTab === 'supervisor-entry' && <SupervisorEntryView />}
              {activeTab === 'copilot' && <CopilotView />}
              {activeTab === 'upload' && <UploadDemoView />}
            </div>
          </div>
        </>
      )}

      {/* Full Dedicated Interactive Presentation Walkthrough (Steps 1 to 11 + Summary) */}
      {isGuidedDemoActive && (
        <GuidedDemoWalkthroughView
          currentStepIndex={guidedDemoStepIndex}
          onNext={nextGuidedDemoStep}
          onPrev={prevGuidedDemoStep}
          onJumpToStep={jumpToGuidedDemoStep}
          onRestart={startGuidedDemo}
          onExit={exitGuidedDemo}
        />
      )}

      {/* Onboarding Welcome Prompt Modal */}
      <GuidedDemoModal
        isOpen={startupComplete && isWelcomeModalOpen && !isGuidedDemoActive}
        onStartDemo={startGuidedDemo}
        onExploreWorkspace={() => {
          localStorage.setItem('datum_onboarding_dismissed', 'true');
          setIsWelcomeModalOpen(false);
        }}
        onClose={() => {
          localStorage.setItem('datum_onboarding_dismissed', 'true');
          setIsWelcomeModalOpen(false);
        }}
      />

      {/* Command Palette Modal (Ctrl + K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Slide-over Drawers & Modals */}
      <InspectorDrawer />
      <ScheduleActivityDrawer />
      <AuditTrailModal />

      {/* Global Toast Action-Feedback System */}
      <ToastContainer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  );
};

export default App;
