import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Cpu,
  Activity,
  Sliders,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';
import { AppSettings } from '../types';

interface SettingsProps {
  onSettingsUpdated: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onSettingsUpdated }) => {
  const [settings, setSettings] = useState<AppSettings>({
    lowThreshold: 0.1,
    mediumThreshold: 0.2,
    highThreshold: 0.3,
    criticalThreshold: 0.35,
    machineId: 'CELL-01',
    machineStatus: 'ONLINE',
    toolId: 'Tool_T01',
    samplingRateHz: 50000,
    enableAlerts: true,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getSettings().then((s) => setSettings(s)).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      setSaved(true);
      onSettingsUpdated();
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center space-x-3">
            <span>CNC Cell & Prognostics Settings</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure wear degradation boundaries, machine telemetry sampling, and active tool identification.
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Settings successfully saved and applied to predictive maintenance engine.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Wear & Risk Severity Thresholds */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span>Tool Flank Wear Degradation Thresholds ($V_B$)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Calibrated against ISO 8688-2 tool life testing standards for carbide milling inserts.
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Configurable Thresholds
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            {/* Low Wear */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-emerald-400 font-bold block">1. LOW / FRESH BOUND</span>
              <label className="text-slate-400 block text-[10px]">Max wear for LOW risk (mm):</label>
              <input
                type="number"
                step="0.01"
                min="0.02"
                max="0.2"
                value={settings.lowThreshold}
                onChange={(e) => setSettings({ ...settings, lowThreshold: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-bold"
              />
              <span className="text-[10px] text-slate-500 block">Default: 0.100 mm</span>
            </div>

            {/* Medium Wear */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-amber-400 font-bold block">2. MEDIUM / STEADY BOUND</span>
              <label className="text-slate-400 block text-[10px]">Max wear for MEDIUM (mm):</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                max="0.28"
                value={settings.mediumThreshold}
                onChange={(e) => setSettings({ ...settings, mediumThreshold: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-bold"
              />
              <span className="text-[10px] text-slate-500 block">Default: 0.200 mm</span>
            </div>

            {/* High Wear */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-orange-400 font-bold block">3. HIGH / INSPECTION</span>
              <label className="text-slate-400 block text-[10px]">Max wear for HIGH (mm):</label>
              <input
                type="number"
                step="0.01"
                min="0.2"
                max="0.4"
                value={settings.highThreshold}
                onChange={(e) => setSettings({ ...settings, highThreshold: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-bold"
              />
              <span className="text-[10px] text-slate-500 block">Default: 0.300 mm</span>
            </div>

            {/* Critical Wear */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-rose-400 font-bold block">4. CRITICAL / EOL LIMIT</span>
              <label className="text-slate-400 block text-[10px]">Trigger CRITICAL at (mm):</label>
              <input
                type="number"
                step="0.01"
                min="0.25"
                max="0.5"
                value={settings.criticalThreshold}
                onChange={(e) => setSettings({ ...settings, criticalThreshold: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-bold"
              />
              <span className="text-[10px] text-slate-500 block">Default: 0.350 mm</span>
            </div>
          </div>
        </div>

        {/* Section 2: Machine & Telemetry Parameters */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>CNC Machining Cell Telemetry Identity</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            {/* Machine ID */}
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Machine ID / Cell:</label>
              <input
                type="text"
                value={settings.machineId}
                onChange={(e) => setSettings({ ...settings, machineId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Active Tool */}
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Default Active Tool:</label>
              <input
                type="text"
                value={settings.toolId}
                onChange={(e) => setSettings({ ...settings, toolId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Machine Status */}
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Current Machine Operational Status:</label>
              <select
                value={settings.machineStatus}
                onChange={(e) => setSettings({ ...settings, machineStatus: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="ONLINE">ONLINE (In Machining Cycle)</option>
                <option value="STANDBY">STANDBY (Awaiting Part Load)</option>
                <option value="MAINTENANCE">MAINTENANCE (Tool Setup)</option>
                <option value="ALERT">ALERT (Emergency Stop)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
