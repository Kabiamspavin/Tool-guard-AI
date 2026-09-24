import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  Cpu,
  LineChart,
  HelpCircle,
  Wrench,
  History,
  Bot,
  Gauge,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Activity,
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'upload'
  | 'prediction'
  | 'analytics'
  | 'explainability'
  | 'maintenance'
  | 'history'
  | 'copilot'
  | 'model'
  | 'settings';

interface SidebarProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  modelTrained: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  collapsed,
  onToggleCollapse,
  modelTrained,
}) => {
  const navItems: { id: PageId; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'upload', label: 'Data Upload', icon: <UploadCloud className="w-5 h-5" /> },
    { id: 'prediction', label: 'Tool Wear Prediction', icon: <Cpu className="w-5 h-5" /> },
    { id: 'analytics', label: 'Sensor Analytics', icon: <LineChart className="w-5 h-5" /> },
    { id: 'explainability', label: 'Explainability (SHAP)', icon: <HelpCircle className="w-5 h-5" /> },
    { id: 'maintenance', label: 'Predictive Maintenance', icon: <Wrench className="w-5 h-5" /> },
    { id: 'history', label: 'Prediction History', icon: <History className="w-5 h-5" /> },
    { id: 'copilot', label: 'ToolGuard Copilot', icon: <Bot className="w-5 h-5 text-cyan-400" />, badge: 'AI' },
    {
      id: 'model',
      label: 'Model Performance',
      icon: <Gauge className="w-5 h-5" />,
      badge: modelTrained ? 'Trained' : 'Untrained',
    },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 z-30 flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-wide bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                ToolGuard <span className="text-cyan-400">AI</span>
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                CNC Smart Prognostics
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={`w-full flex items-center ${
                collapsed ? 'justify-center px-0' : 'justify-between px-3'
              } py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center space-x-3">
                <span className={`${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {item.icon}
                </span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!collapsed && item.badge && (
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                    item.badge === 'Trained'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : item.badge === 'AI'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Machine Telemetry Badge */}
      {!collapsed && (
        <div className="p-3 mx-3 mb-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-mono">Telemetry</span>
            <span className="flex items-center space-x-1.5 text-emerald-400 font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            XGBoost Regression + Tree SHAP Explainability active.
          </p>
        </div>
      )}
    </aside>
  );
};
