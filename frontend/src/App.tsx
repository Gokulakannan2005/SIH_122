import React from 'react';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { Navbar } from './components/Navbar';
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

const AppContent: React.FC = () => {
  const { activeTab } = useProject();

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'site-updates' && <SiteUpdatesView />}
        {activeTab === 'schedule-activities' && <ScheduleActivitiesView />}
        {activeTab === 'planner-review' && <PlannerReviewView />}
        {activeTab === 'supervisor-entry' && <SupervisorEntryView />}
        {activeTab === 'copilot' && <CopilotView />}
        {activeTab === 'upload' && <UploadDemoView />}
      </main>

      {/* Slide-over Drawers & Modals */}
      <InspectorDrawer />
      <ScheduleActivityDrawer />
      <AuditTrailModal />
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
