import React, { useState } from 'react';
import {
  Cpu,
  TrendingUp,
  AlertTriangle,
  RotateCw,
  HelpCircle,
  Bot,
  Zap,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  ShieldAlert,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../services/api';
import { PageId } from '../components/Sidebar';
import { PredictionItem } from '../types';

interface PredictionProps {
  onNavigate: (page: PageId) => void;
  onPredictionComplete?: (pred: PredictionItem) => void;
}

export const Prediction: React.FC<PredictionProps> = ({ onNavigate, onPredictionComplete }) => {
  const [mode, setMode] = useState<'manual' | 'csv'>('manual');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    prediction: PredictionItem;
    recommendedAction: string;
    thresholds: any;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Manual Input State
  const [toolId, setToolId] = useState('Tool_T01');
  const [cycle, setCycle] = useState(62);
  const [cuttingForce, setCuttingForce] = useState(195.5);
  const [vibration, setVibration] = useState(0.245);
  const [acousticEmission, setAcousticEmission] = useState(0.068);
  const [spindleSpeed, setSpindleSpeed] = useState(10400);
  const [feedRate, setFeedRate] = useState(1550);
  const [depthOfCut, setDepthOfCut] = useState(0.75);

  // Quick Preset Scenarios (Realistic Physical Degradation Stages)
  const applyPreset = (preset: {
    name: string;
    cycle: number;
    force: number;
    vib: number;
    ae: number;
    speed: number;
    feed: number;
    depth: number;
  }) => {
    setCycle(preset.cycle);
    setCuttingForce(preset.force);
    setVibration(preset.vib);
    setAcousticEmission(preset.ae);
    setSpindleSpeed(preset.speed);
    setFeedRate(preset.feed);
    setDepthOfCut(preset.depth);
  };

  const handlePredict = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await api.predictWear({
        toolId,
        cycle,
        cuttingForce,
        vibration,
        acousticEmission,
        spindleSpeed,
        feedRate,
        depthOfCut,
      });

      setResult(data);
      if (onPredictionComplete) onPredictionComplete(data.prediction);
    } catch (err: any) {
      setError(err.message || 'Prediction failed.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'MEDIUM':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'HIGH':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center space-x-3">
            <span>Tool Wear Prediction Engine</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Predict flank wear ($V_B$) and remaining useful life using trained XGBoost Regressor.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center space-x-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setMode('manual')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              mode === 'manual' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Manual Telemetry Input
          </button>
          <button
            onClick={() => setMode('csv')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              mode === 'csv' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Batch CSV Ingestion
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {mode === 'manual' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Sensor Inputs (7 Cols) */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <span>Sensor Telemetry & Process Parameters</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">DMG Mori 50kHz Stream</span>
            </div>

            {/* Presets Bar */}
            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-mono uppercase block">Load Test Condition Preset:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={() =>
                    applyPreset({
                      name: 'Fresh Tool',
                      cycle: 8,
                      force: 135.2,
                      vib: 0.165,
                      ae: 0.048,
                      speed: 10400,
                      feed: 1550,
                      depth: 0.75,
                    })
                  }
                  className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-left hover:text-emerald-400 transition-all"
                >
                  <span className="font-bold block text-emerald-400">1. Fresh Tool</span>
                  <span className="text-[10px] text-slate-400">Cycle 8 • Low Wear</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyPreset({
                      name: 'Mid-Life',
                      cycle: 52,
                      force: 198.4,
                      vib: 0.248,
                      ae: 0.068,
                      speed: 10400,
                      feed: 1550,
                      depth: 0.75,
                    })
                  }
                  className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-left hover:text-amber-400 transition-all"
                >
                  <span className="font-bold block text-amber-400">2. Steady Wear</span>
                  <span className="text-[10px] text-slate-400">Cycle 52 • Moderate</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyPreset({
                      name: 'High Wear',
                      cycle: 88,
                      force: 258.9,
                      vib: 0.325,
                      ae: 0.092,
                      speed: 10380,
                      feed: 1550,
                      depth: 0.75,
                    })
                  }
                  className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-orange-500/40 text-left hover:text-orange-400 transition-all"
                >
                  <span className="font-bold block text-orange-400">3. High Flank</span>
                  <span className="text-[10px] text-slate-400">Cycle 88 • Inspection</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyPreset({
                      name: 'Critical Tool',
                      cycle: 104,
                      force: 325.4,
                      vib: 0.445,
                      ae: 0.128,
                      speed: 10350,
                      feed: 1550,
                      depth: 0.75,
                    })
                  }
                  className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-500/40 text-left hover:text-rose-400 transition-all"
                >
                  <span className="font-bold block text-rose-400">4. Critical / EOL</span>
                  <span className="text-[10px] text-slate-400">Cycle 104 • Halt Cell</span>
                </button>
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handlePredict} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                {/* Tool ID */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Tool Identifier:</label>
                  <input
                    type="text"
                    value={toolId}
                    onChange={(e) => setToolId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                    placeholder="e.g. Tool_T01"
                  />
                </div>

                {/* Machining Cycle */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Machining Cut / Cycle #:</label>
                  <input
                    type="number"
                    value={cycle}
                    onChange={(e) => setCycle(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Cutting Force */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-slate-300 font-semibold">Resultant Cutting Force:</label>
                    <span className="text-cyan-400 font-bold">{cuttingForce} N</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="400"
                    step="0.5"
                    value={cuttingForce}
                    onChange={(e) => setCuttingForce(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Vibration */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-slate-300 font-semibold">Vibration (RMS):</label>
                    <span className="text-amber-400 font-bold">{vibration} g</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.6"
                    step="0.005"
                    value={vibration}
                    onChange={(e) => setVibration(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                {/* Acoustic Emission */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-slate-300 font-semibold">Acoustic Emission:</label>
                    <span className="text-purple-400 font-bold">{acousticEmission} V</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.2"
                    step="0.002"
                    value={acousticEmission}
                    onChange={(e) => setAcousticEmission(Number(e.target.value))}
                    className="w-full accent-purple-400 cursor-pointer"
                  />
                </div>

                {/* Spindle Speed */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Spindle Speed (RPM):</label>
                  <input
                    type="number"
                    value={spindleSpeed}
                    onChange={(e) => setSpindleSpeed(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Feed Rate */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Feed Rate (mm/min):</label>
                  <input
                    type="number"
                    value={feedRate}
                    onChange={(e) => setFeedRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Depth of Cut */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Depth of Cut (mm):</label>
                  <input
                    type="number"
                    step="0.05"
                    value={depthOfCut}
                    onChange={(e) => setDepthOfCut(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <RotateCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                  <span>Predict Tool Wear (Run XGBoost)</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Panel: Prediction Results & Decision Support (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {result ? (
              <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/40 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-mono text-slate-400 block">OUTPUT INFERENCE</span>
                    <h3 className="text-base font-bold text-white">Prediction Results</h3>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase border ${getRiskColor(
                      result.prediction.riskLevel
                    )}`}
                  >
                    {result.prediction.riskLevel} RISK
                  </span>
                </div>

                {/* Predicted Wear Metric Hero */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                    Predicted Flank Wear ($V_B$)
                  </span>
                  <div className="text-4xl font-extrabold font-mono text-cyan-400 tracking-tight">
                    {Number(result.prediction.predictedWear).toFixed(3)} <span className="text-lg text-slate-400">mm</span>
                  </div>
                  <span className="text-xs text-slate-400 block">{result.prediction.toolHealth}</span>
                </div>

                {/* RUL & Health Details */}
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">ESTIMATED RUL</span>
                    <span className="text-lg font-bold text-purple-400 flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-purple-400 inline" />
                      <span>
                        {result.prediction.rulCycles !== null
                          ? `${result.prediction.rulCycles} Cycles`
                          : 'Unavailable'}
                      </span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">CRITICAL LIMIT</span>
                    <span className="text-lg font-bold text-rose-400">
                      {result.thresholds.critical.toFixed(3)} mm
                    </span>
                  </div>
                </div>

                {/* Recommended Operational Action */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Recommended Maintenance Action</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{result.recommendedAction}</p>
                </div>

                {/* Action Shortcuts */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => onNavigate('explainability')}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-xs border border-slate-700 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Explain (SHAP)</span>
                  </button>

                  <button
                    onClick={() => onNavigate('copilot')}
                    className="py-2.5 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 font-semibold text-xs border border-indigo-500/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <Bot className="w-4 h-4 text-indigo-400" />
                    <span>Ask Copilot</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center text-center space-y-3 h-full min-h-[380px]">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-200">No Prediction Generated Yet</h3>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Adjust the sensor telemetry sliders on the left or select a preset scenario, then click "Predict Tool Wear".
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Mode B: CSV Batch Prediction */
        <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 text-center max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-cyan-400">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-white">Batch CSV Tool Wear Prediction</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Upload new sensor batches to score all machining cuts simultaneously and output risk classifications.
          </p>
          <button
            onClick={() => onNavigate('upload')}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer transition-all"
          >
            Go to Dataset Upload Pipeline
          </button>
        </div>
      )}
    </div>
  );
};
