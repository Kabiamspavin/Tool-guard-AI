import React from 'react';
import {
  Activity,
  Cpu,
  Database,
  Layers,
  Sparkles,
  User,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { SystemHealth } from '../types';

interface TopBarProps {
  health: SystemHealth | null;
  onQuickLoadDemo: () => void;
  isLoadingDemo: boolean;
  onRefresh: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  health,
  onQuickLoadDemo,
  isLoadingDemo,
  onRefresh,
}) => {
  const machineStatus = health?.machineStatus || 'ONLINE';
  const isOnline = machineStatus === 'ONLINE';

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Left: Machine & System Status Badges */}
      <div className="flex items-center space-x-4">
        {/* Machine Status */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-300">
            CNC {health?.machineId || 'CELL-01'}:
          </span>
          <span
            className={`text-xs font-mono font-extrabold ${
              isOnline ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {machineStatus}
          </span>
        </div>

        {/* Current Active Tool */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
          <span className="text-slate-400">TOOL:</span>
          <span className="text-cyan-400 font-bold">{health?.activeToolId || 'Tool T01'}</span>
        </div>

        {/* Model Status */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-400">MODEL:</span>
          {health?.modelTrained ? (
            <span className="text-emerald-400 font-bold flex items-center space-x-1">
              <span>XGBoost Regressor</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
            </span>
          ) : (
            <span className="text-amber-400 font-bold flex items-center space-x-1">
              <span>Model Untrained</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 inline" />
            </span>
          )}
        </div>
      </div>

      {/* Right: Quick Action Demo Data + Operator Info */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onQuickLoadDemo}
          disabled={isLoadingDemo}
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium shadow-md shadow-cyan-500/20 transition-all disabled:opacity-50 cursor-pointer"
          title="Instant load verified PHM 2010 Milling sensor dataset"
        >
          {isLoadingDemo ? (
            <RotateCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Database className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">Load PHM 2010 Sample</span>
          <span className="sm:hidden">Sample Data</span>
        </button>

        <button
          onClick={onRefresh}
          className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Refresh Telemetry"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-200">Engineer / Operator</span>
            <span className="text-[10px] text-slate-400 font-mono">Cell DMG-01</span>
          </div>
        </div>
      </div>
    </header>
  );
};
