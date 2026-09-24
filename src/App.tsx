/**
 * ToolGuard AI — Intelligent Tool Wear Prediction for Smart CNC Manufacturing
 * Main Application Component
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, PageId } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './pages/Dashboard';
import { DataUpload } from './pages/DataUpload';
import { Prediction } from './pages/Prediction';
import { Analytics } from './pages/Analytics';
import { Explainability } from './pages/Explainability';
import { Maintenance } from './pages/Maintenance';
import { History } from './pages/History';
import { AIAssistant } from './pages/AIAssistant';
import { ModelPerformance } from './pages/ModelPerformance';
import { Settings } from './pages/Settings';
import { api } from './services/api';
import { DashboardData, SystemHealth, PredictionItem } from './types';

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      const [h, d] = await Promise.all([api.getHealth(), api.getDashboard()]);
      setHealth(h);
      setDashboardData(d);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickLoadDemo = async () => {
    setIsLoadingDemo(true);
    try {
      await api.loadSampleDataset(315);
      await loadData();
      showToast('PHM 2010 CNC Milling dataset loaded and ready!');
    } catch (err: any) {
      showToast('Failed to load sample dataset: ' + err.message);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const handlePredictionComplete = (pred: PredictionItem) => {
    loadData();
    showToast(`Prediction: ${pred.predictedWear.toFixed(3)} mm (${pred.riskLevel} Risk)`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Persistent Left Sidebar */}
      <Sidebar
        activePage={activePage}
        onSelectPage={(page) => setActivePage(page)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        modelTrained={health?.modelTrained || false}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 min-h-screen ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Top Navigation Bar */}
        <TopBar
          health={health}
          onQuickLoadDemo={handleQuickLoadDemo}
          isLoadingDemo={isLoadingDemo}
          onRefresh={loadData}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activePage === 'dashboard' && (
            <Dashboard
              data={dashboardData}
              onNavigate={(page) => setActivePage(page)}
              onLoadDemo={handleQuickLoadDemo}
            />
          )}

          {activePage === 'upload' && (
            <DataUpload
              onNavigate={(page) => setActivePage(page)}
              onDatasetReady={loadData}
            />
          )}

          {activePage === 'prediction' && (
            <Prediction
              onNavigate={(page) => setActivePage(page)}
              onPredictionComplete={handlePredictionComplete}
            />
          )}

          {activePage === 'analytics' && (
            <Analytics data={dashboardData} />
          )}

          {activePage === 'explainability' && (
            <Explainability onNavigate={(page) => setActivePage(page)} />
          )}

          {activePage === 'maintenance' && (
            <Maintenance data={dashboardData} />
          )}

          {activePage === 'history' && (
            <History />
          )}

          {activePage === 'copilot' && (
            <AIAssistant data={dashboardData} />
          )}

          {activePage === 'model' && (
            <ModelPerformance onNavigate={(page) => setActivePage(page)} />
          )}

          {activePage === 'settings' && (
            <Settings onSettingsUpdated={loadData} />
          )}
        </main>

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-cyan-950/90 border border-cyan-500/40 text-cyan-200 text-xs font-mono shadow-2xl backdrop-blur-md animate-bounce">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}
