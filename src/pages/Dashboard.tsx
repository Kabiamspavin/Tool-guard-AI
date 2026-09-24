import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  Layers,
  Wrench,
  AlertOctagon,
  Clock,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Sliders,
  CheckCircle,
  HelpCircle,
  BarChart3,
  Bot,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { MetricCard } from '../components/MetricCard';
import { DashboardData } from '../types';
import { PageId } from '../components/Sidebar';

interface DashboardProps {
  data: DashboardData | null;
  onNavigate: (page: PageId) => void;
  onLoadDemo: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onNavigate, onLoadDemo }) => {
  const [activeSensor, setActiveSensor] = useState<'force' | 'vibration' | 'acoustic' | 'all'>('force');

  const isDemo = data?.isDemo ?? true;
  const latest = data?.latestPrediction || {
    wear: 0.174,
    risk: 'MEDIUM' as const,
    health: 'Moderate Wear',
    rul: '35 cycles',
    isDemo: true,
    timestamp: new Date().toISOString(),
  };

  const getRiskBadgeType = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'success';
      case 'MEDIUM':
        return 'warning';
      case 'HIGH':
        return 'danger';
      case 'CRITICAL':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const riskBadgeType = getRiskBadgeType(latest.risk);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              ToolGuard <span className="text-cyan-400">AI</span>
            </h1>
            {isDemo && (
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
                DEMO DATA
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Intelligent Tool Wear Prediction for Smart CNC Manufacturing
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('prediction')}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Cpu className="w-4 h-4" />
            <span>New Prediction</span>
          </button>
          <button
            onClick={() => onNavigate('upload')}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-all cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>Train on Dataset</span>
          </button>
          <button
            onClick={() => onNavigate('copilot')}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 font-medium text-xs border border-indigo-500/30 transition-all cursor-pointer"
          >
            <Bot className="w-4 h-4 text-indigo-400" />
            <span>Ask Copilot</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Machine Status */}
        <MetricCard
          title="Machine Status"
          value={data?.machineStatus || 'ONLINE'}
          subtitle="DMG Mori 5-Axis Milling"
          icon={<Activity className="w-5 h-5 text-emerald-400" />}
          badge="HEALTHY"
          badgeType="success"
        />

        {/* 2. Current Tool */}
        <MetricCard
          title="Current Tool"
          value={data?.currentTool || 'Tool T01'}
          subtitle="3-Flute Carbide Cutter"
          icon={<Wrench className="w-5 h-5 text-cyan-400" />}
          badge="ACTIVE"
          badgeType="info"
        />

        {/* 3. Predicted Wear */}
        <MetricCard
          title="Predicted Wear"
          value={`${Number(latest.wear).toFixed(3)} mm`}
          subtitle="Flank Wear (VB)"
          icon={<TrendingUp className="w-5 h-5 text-amber-400" />}
          badge={latest.risk}
          badgeType={riskBadgeType as any}
          isDemo={latest.isDemo}
        />

        {/* 4. Tool Health */}
        <MetricCard
          title="Tool Health"
          value={latest.health}
          subtitle="Degradation Phase 2"
          icon={<Layers className="w-5 h-5 text-blue-400" />}
          badge="EVALUATED"
          badgeType="info"
          isDemo={latest.isDemo}
        />

        {/* 5. Risk Level */}
        <MetricCard
          title="Risk Level"
          value={latest.risk}
          subtitle="ISO Tolerance Limit"
          icon={<AlertOctagon className="w-5 h-5 text-rose-400" />}
          badge={latest.risk}
          badgeType={riskBadgeType as any}
          isDemo={latest.isDemo}
        />

        {/* 6. Remaining Useful Life */}
        <MetricCard
          title="Remaining Useful Life"
          value={latest.rul}
          subtitle="Until Critical Threshold"
          icon={<Clock className="w-5 h-5 text-purple-400" />}
          badge={latest.rul.includes('unavailable') ? 'N/A' : 'ESTIMATE'}
          badgeType={latest.rul.includes('unavailable') ? 'neutral' : 'info'}
          isDemo={latest.isDemo}
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sensor Trends (2 Columns) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                <span>CNC Multi-Sensor Telemetry Trends</span>
              </h3>
              <p className="text-xs text-slate-400">
                Cutting Force (N), Vibration RMS (g), and Acoustic Emission (V) over machining cycles
              </p>
            </div>

            {/* Sensor Switcher */}
            <div className="flex items-center space-x-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setActiveSensor('force')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeSensor === 'force' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Force (N)
              </button>
              <button
                onClick={() => setActiveSensor('vibration')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeSensor === 'vibration' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Vibration (g)
              </button>
              <button
                onClick={() => setActiveSensor('acoustic')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeSensor === 'acoustic' ? 'bg-purple-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                AE (V)
              </button>
              <button
                onClick={() => setActiveSensor('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeSensor === 'all' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Combined
              </button>
            </div>
          </div>

          {/* Line Chart */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.sensorTrends || []} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="sample"
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                  label={{ value: 'Cycle / Sample', position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                  }}
                  itemStyle={{ fontSize: 12 }}
                  labelStyle={{ color: '#94a3b8', fontSize: 11, fontFamily: 'monospace', marginBottom: 4 }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />

                {(activeSensor === 'force' || activeSensor === 'all') && (
                  <Line
                    type="monotone"
                    dataKey="cuttingForce"
                    name="Cutting Force (N)"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: '#06b6d4' }}
                  />
                )}

                {(activeSensor === 'vibration' || activeSensor === 'all') && (
                  <Line
                    type="monotone"
                    dataKey="vibration"
                    name="Vibration (g RMS)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: '#f59e0b' }}
                  />
                )}

                {(activeSensor === 'acoustic' || activeSensor === 'all') && (
                  <Line
                    type="monotone"
                    dataKey="acousticEmission"
                    name="Acoustic Emission (V)"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: '#a855f7' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Donut Chart (1 Column) */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Tool Health Risk Profile</span>
            </h3>
            <p className="text-xs text-slate-400">Distribution across wear severity levels</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.riskDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(data?.riskDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-800">
            {(data?.riskDistribution || []).map((item) => (
              <div key={item.name} className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-400 truncate">{item.name}:</span>
                <span className="text-white font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tool Wear Progression Chart & Recent Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tool Wear Progression Curve */}
        <div className="lg:col-span-1 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>Tool Wear Degradation Curve</span>
            </h3>
            <p className="text-xs text-slate-400">Cumulative Flank Wear ($V_B$) vs Cycle</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.wearTrends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="sample" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} unit="mm" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }}
                />
                <Line
                  type="monotone"
                  dataKey="toolWear"
                  name="Flank Wear (mm)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Critical ISO Limit: <strong className="text-rose-400 font-mono">0.300 mm</strong></span>
            <button
              onClick={() => onNavigate('explainability')}
              className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1"
            >
              <span>View SHAP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Predictions Table */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <span>Recent Tool Wear Predictions</span>
              </h3>
              <p className="text-xs text-slate-400">Evaluated by XGBoost Regression Engine</p>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1"
            >
              <span>Full History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Tool ID</th>
                  <th className="py-2.5 px-3">Cycle</th>
                  <th className="py-2.5 px-3">Predicted Wear</th>
                  <th className="py-2.5 px-3">Risk</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {(data?.recentPredictions || []).slice(0, 5).map((pred) => (
                  <tr key={pred.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(pred.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 font-semibold text-white">{pred.toolId}</td>
                    <td className="py-3 px-3 text-slate-300">{pred.cycle}</td>
                    <td className="py-3 px-3 font-bold text-cyan-400">
                      {Number(pred.predictedWear).toFixed(3)} mm
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          pred.riskLevel === 'LOW'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : pred.riskLevel === 'MEDIUM'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {pred.riskLevel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-sans">{pred.toolHealth}</td>
                    <td className="py-3 px-3 text-right font-sans">
                      <button
                        onClick={() => onNavigate('explainability')}
                        className="text-cyan-400 hover:text-cyan-300 hover:underline"
                      >
                        Explain
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
