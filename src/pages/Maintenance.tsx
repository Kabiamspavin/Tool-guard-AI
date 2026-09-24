import React, { useState } from 'react';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  FileText,
  RotateCw,
  Copy,
  Printer,
  ShieldAlert,
  Bot,
  Layers,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardData } from '../types';

interface MaintenanceProps {
  data: DashboardData | null;
}

export const Maintenance: React.FC<MaintenanceProps> = ({ data }) => {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const latest = data?.latestPrediction || {
    wear: 0.174,
    risk: 'MEDIUM' as const,
    health: 'Moderate Wear',
    rul: '35 cycles',
    isDemo: true,
    timestamp: new Date().toISOString(),
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const rep = await api.generateMaintenanceReport({
        toolId: data?.currentTool || 'Tool T01',
        predictedWear: latest.wear,
        riskLevel: latest.risk,
        toolHealth: latest.health,
        sensorValues: {
          cuttingForce: 195.5,
          vibration: 0.245,
          acousticEmission: 0.068,
        },
      });
      setReport(rep);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (report) {
      navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center space-x-3">
            <span>Predictive Maintenance & ISO Tool Health</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Condition-based maintenance protocols, degradation boundary alerts, and AI-authored inspection reports.
          </p>
        </div>

        <button
          onClick={generateReport}
          disabled={loading}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          <span>Generate AI Maintenance Report</span>
        </button>
      </div>

      {/* Health Status Matrix Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">Current Health State</span>
          <div className="text-xl font-bold text-white">{latest.health}</div>
          <span className="text-xs text-slate-400">Tool: {data?.currentTool || 'Tool T01'}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">Predicted Wear ($V_B$)</span>
          <div className="text-xl font-bold font-mono text-cyan-400">{Number(latest.wear).toFixed(3)} mm</div>
          <span className="text-xs text-slate-400">ISO Flank Wear Criterion</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">Severity Risk Band</span>
          <div className="text-xl font-bold font-mono text-amber-400">{latest.risk}</div>
          <span className="text-xs text-slate-400">Condition-based monitoring</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">Estimated Useful Life</span>
          <div className="text-xl font-bold font-mono text-purple-400">{latest.rul}</div>
          <span className="text-xs text-slate-400">Until 0.300 mm threshold</span>
        </div>
      </div>

      {/* Operational Protocol Guidance */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <span>ISO Standard Degradation Protocols & Recommended Actions</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          {/* Low */}
          <div className={`p-4 rounded-xl border ${latest.risk === 'LOW' ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-slate-950 border-slate-800'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-emerald-400">1. LOW RISK (&lt; 0.10 mm)</span>
              {latest.risk === 'LOW' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </div>
            <p className="text-slate-300 font-sans leading-relaxed">
              Normal cutting state. Maintain continuous high-frequency telemetry acquisition. No intervention needed.
            </p>
          </div>

          {/* Medium */}
          <div className={`p-4 rounded-xl border ${latest.risk === 'MEDIUM' ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-950 border-slate-800'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-amber-400">2. MEDIUM RISK (0.10 - 0.20 mm)</span>
              {latest.risk === 'MEDIUM' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
            </div>
            <p className="text-slate-300 font-sans leading-relaxed">
              Steady-state wear. Increase telemetry sampling and schedule optical tool inspection at next routine part unload.
            </p>
          </div>

          {/* High */}
          <div className={`p-4 rounded-xl border ${latest.risk === 'HIGH' ? 'bg-orange-500/10 border-orange-500/40' : 'bg-slate-950 border-slate-800'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-orange-400">3. HIGH RISK (0.20 - 0.30 mm)</span>
              {latest.risk === 'HIGH' && <CheckCircle2 className="w-4 h-4 text-orange-400" />}
            </div>
            <p className="text-slate-300 font-sans leading-relaxed">
              Accelerated wear region. Schedule tool index/replacement prior to beginning precision finishing cuts to prevent chatter marks.
            </p>
          </div>

          {/* Critical */}
          <div className={`p-4 rounded-xl border ${latest.risk === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/40' : 'bg-slate-950 border-slate-800'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-rose-400">4. CRITICAL RISK (&gt; 0.30 mm)</span>
              {latest.risk === 'CRITICAL' && <CheckCircle2 className="w-4 h-4 text-rose-400" />}
            </div>
            <p className="text-slate-300 font-sans leading-relaxed">
              Imminent failure or catastrophic chipping risk. Halt machining cycle at next safe retract position according to plant safety SOPs.
            </p>
          </div>
        </div>
      </div>

      {/* Generated Report Viewer */}
      {report && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-cyan-500/30 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-white font-bold">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span>Official CNC Tool Condition & Maintenance Advisory</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="Copy Markdown"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={() => window.print()}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="Print Report"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="prose prose-invert max-w-none text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans bg-slate-950 p-6 rounded-xl border border-slate-800">
            {report}
          </div>
        </div>
      )}
    </div>
  );
};
