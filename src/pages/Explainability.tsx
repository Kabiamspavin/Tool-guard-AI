import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  TrendingUp,
  RotateCw,
  Sliders,
  CheckCircle2,
  Bot,
  Info,
  ShieldAlert,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts';
import { api } from '../services/api';
import { ShapData } from '../types';
import { PageId } from '../components/Sidebar';

interface ExplainabilityProps {
  onNavigate: (page: PageId) => void;
}

export const Explainability: React.FC<ExplainabilityProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [shapData, setShapData] = useState<ShapData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Input states for live SHAP exploration
  const [cuttingForce, setCuttingForce] = useState(215.0);
  const [vibration, setVibration] = useState(0.28);
  const [acousticEmission, setAcousticEmission] = useState(0.075);
  const [spindleSpeed, setSpindleSpeed] = useState(10400);
  const [feedRate, setFeedRate] = useState(1550);
  const [depthOfCut, setDepthOfCut] = useState(0.75);

  const fetchShap = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getShapExplanation({
        cuttingForce,
        vibration,
        acousticEmission,
        spindleSpeed,
        feedRate,
        depthOfCut,
      });
      setShapData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate TreeSHAP explanation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShap();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center space-x-3">
            <span>Model Explainability (Tree SHAP)</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Deconstruct black-box XGBoost decisions into additive Shapley contributions for root-cause verification.
          </p>
        </div>

        <button
          onClick={() => onNavigate('copilot')}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 font-semibold text-xs border border-indigo-500/30 transition-all cursor-pointer shrink-0"
        >
          <Bot className="w-4 h-4 text-indigo-400" />
          <span>Ask Copilot to Interpret</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Main Grid: Telemetry Adjuster (Left) + SHAP Visualizer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Input Adjuster (4 Cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <span>Simulate Telemetry</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Live Tree Explainer</span>
          </div>

          <div className="space-y-4 text-xs font-mono">
            {/* Cutting Force */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-300 font-semibold">Cutting Force (N):</span>
                <span className="text-cyan-400 font-bold">{cuttingForce} N</span>
              </div>
              <input
                type="range"
                min="80"
                max="350"
                step="1"
                value={cuttingForce}
                onChange={(e) => setCuttingForce(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Vibration */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-300 font-semibold">Vibration (RMS g):</span>
                <span className="text-amber-400 font-bold">{vibration} g</span>
              </div>
              <input
                type="range"
                min="0.08"
                max="0.55"
                step="0.005"
                value={vibration}
                onChange={(e) => setVibration(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Acoustic Emission */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-300 font-semibold">Acoustic Emission:</span>
                <span className="text-purple-400 font-bold">{acousticEmission} V</span>
              </div>
              <input
                type="range"
                min="0.02"
                max="0.18"
                step="0.002"
                value={acousticEmission}
                onChange={(e) => setAcousticEmission(Number(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer"
              />
            </div>

            {/* Spindle Speed */}
            <div className="space-y-1">
              <span className="text-slate-300 font-semibold block">Spindle Speed (RPM):</span>
              <input
                type="number"
                value={spindleSpeed}
                onChange={(e) => setSpindleSpeed(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
              />
            </div>

            {/* Feed Rate */}
            <div className="space-y-1">
              <span className="text-slate-300 font-semibold block">Feed Rate (mm/min):</span>
              <input
                type="number"
                value={feedRate}
                onChange={(e) => setFeedRate(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
              />
            </div>

            <button
              onClick={fetchShap}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
              <span>Recalculate SHAP Values</span>
            </button>
          </div>
        </div>

        {/* Right: SHAP Bar Chart & Attribution Table (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {shapData ? (
            <>
              {/* Baseline vs Prediction Hero Card */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center font-mono">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">Base Value E[f(x)]</span>
                    <span className="text-xl font-bold text-slate-300">{shapData.baseValue.toFixed(4)} mm</span>
                    <span className="text-[10px] text-slate-400 block">Dataset Mean Wear</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">Cumulative SHAP ($\sum \phi_i$)</span>
                    <span className="text-xl font-bold text-amber-400">
                      {(shapData.predictedValue - shapData.baseValue >= 0 ? '+' : '')}
                      {(shapData.predictedValue - shapData.baseValue).toFixed(4)} mm
                    </span>
                    <span className="text-[10px] text-slate-400 block">Net Feature Displacement</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/40">
                    <span className="text-cyan-400 text-[10px] uppercase block font-bold">Predicted Wear ($f(x)$)</span>
                    <span className="text-2xl font-extrabold text-cyan-400">{shapData.predictedValue.toFixed(4)} mm</span>
                    <span className="text-[10px] text-slate-400 block">XGBoost Regressor Output</span>
                  </div>
                </div>
              </div>

              {/* SHAP Feature Contribution Bar Chart */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-amber-400" />
                      <span>Feature Attributions ($\phi_i$)</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      <span className="text-amber-400 font-bold">Warm colors</span> push wear prediction up. <span className="text-cyan-400 font-bold">Cool colors</span> push it down.
                    </p>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={shapData.shapValues.slice(0, 8)}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} unit=" mm" />
                      <YAxis
                        type="category"
                        dataKey="feature"
                        stroke="#64748b"
                        tick={{ fontSize: 11, fill: '#cbd5e1', fontFamily: 'monospace' }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }}
                        formatter={(value: any) => [`${Number(value).toFixed(4)} mm`, 'SHAP Value']}
                      />
                      <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={1.5} />
                      <Bar dataKey="contribution" radius={[4, 4, 4, 4]}>
                        {shapData.shapValues.slice(0, 8).map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.contribution >= 0 ? '#f59e0b' : '#06b6d4'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Attribution Ranking Table */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Info className="w-5 h-5 text-blue-400" />
                  <span>Feature Contribution Ranking</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Feature Name</th>
                        <th className="py-2.5 px-3">Sensor Value</th>
                        <th className="py-2.5 px-3">SHAP Value ($\phi$)</th>
                        <th className="py-2.5 px-3">Directional Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {shapData.shapValues.map((row) => (
                        <tr key={row.feature} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-semibold text-slate-200">{row.feature}</td>
                          <td className="py-2.5 px-3 text-cyan-400">{row.value.toFixed(3)}</td>
                          <td className="py-2.5 px-3 font-bold">
                            <span className={row.contribution >= 0 ? 'text-amber-400' : 'text-cyan-400'}>
                              {row.contribution >= 0 ? '+' : ''}{row.contribution.toFixed(4)} mm
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {row.contribution >= 0 ? (
                              <span className="flex items-center space-x-1 text-amber-400 font-bold">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                <span>Increases Wear</span>
                              </span>
                            ) : (
                              <span className="flex items-center space-x-1 text-cyan-400 font-bold">
                                <ArrowDownRight className="w-3.5 h-3.5" />
                                <span>Reduces Wear</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400">
              Calculating TreeSHAP explanations...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
