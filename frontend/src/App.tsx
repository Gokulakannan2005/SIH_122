import React from 'react';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { Sidebar } from './components/Sidebar';
import { AppHeader } from './components/AppHeader';
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

const AppContent: React.FC = () => {
  const { activeTab } = useProject();

  return (
    <div className="app-layout">
      {/* Modern Left Sidebar Navigation */}
      <Sidebar />

      {/* Main Viewport Content Area */}
      <div className="app-main">
        <AppHeader />

        <div className="page-body">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'site-updates' && <SiteUpdatesView />}
          {activeTab === 'schedule-activities' && <ScheduleActivitiesView />}
          {activeTab === 'planner-review' && <PlannerReviewView />}
          {activeTab === 'supervisor-entry' && <SupervisorEntryView />}
          {activeTab === 'copilot' && <CopilotView />}
          {activeTab === 'upload' && <UploadDemoView />}
        </div>
      </div>

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
