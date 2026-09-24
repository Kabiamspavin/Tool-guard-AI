import React, { useState, useEffect } from 'react';
import {
  History as HistoryIcon,
  Download,
  Trash2,
  Filter,
  Search,
  RotateCw,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../services/api';
import { PredictionItem } from '../types';

export const History: React.FC = () => {
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [toolFilter, setToolFilter] = useState('');

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getHistory({
        search: search || undefined,
        riskLevel: riskFilter || undefined,
        toolId: toolFilter || undefined,
      });
      setPredictions(data.predictions);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [riskFilter, toolFilter]);

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear all prediction history records?')) {
      await api.clearHistory();
      setPredictions([]);
    }
  };

  const exportCSV = () => {
    if (predictions.length === 0) return;
    const headers = [
      'Timestamp',
      'Tool_ID',
      'Cycle',
      'Cutting_Force_N',
      'Vibration_g',
      'Acoustic_Emission_V',
      'Spindle_Speed_RPM',
      'Feed_Rate_mmpm',
      'Depth_Of_Cut_mm',
      'Predicted_Wear_mm',
      'Risk_Level',
      'Tool_Health',
      'RUL_Cycles',
      'Model_Version',
    ];

    const rows = predictions.map((p) => [
      p.timestamp,
      p.toolId,
      p.cycle,
      p.cuttingForce,
      p.vibration,
      p.acousticEmission,
      p.spindleSpeed,
      p.feedRate,
      p.depthOfCut,
      p.predictedWear,
      p.riskLevel,
      `"${p.toolHealth}"`,
      p.rulCycles ?? '',
      p.modelVersion,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `toolguard_prediction_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center space-x-3">
            <span>Prediction Audit & Telemetry History</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Historical log of all machine learning inference runs, sensor vectors, and risk evaluations.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={exportCSV}
            disabled={predictions.length === 0}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export History CSV</span>
          </button>

          <button
            onClick={handleClear}
            disabled={predictions.length === 0}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer disabled:opacity-50"
            title="Clear History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tool or health status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadHistory()}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3 w-full sm:w-auto text-xs font-mono">
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900">All Levels</option>
              <option value="LOW" className="bg-slate-900">Low Risk</option>
              <option value="MEDIUM" className="bg-slate-900">Medium Risk</option>
              <option value="HIGH" className="bg-slate-900">High Risk</option>
              <option value="CRITICAL" className="bg-slate-900">Critical Risk</option>
            </select>
          </div>

          <button
            onClick={loadHistory}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Reload"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Date / Time</th>
                <th className="py-2.5 px-3">Tool ID</th>
                <th className="py-2.5 px-3">Cycle</th>
                <th className="py-2.5 px-3">Force (N)</th>
                <th className="py-2.5 px-3">Vib (g)</th>
                <th className="py-2.5 px-3">AE (V)</th>
                <th className="py-2.5 px-3">Predicted Wear</th>
                <th className="py-2.5 px-3">Risk Level</th>
                <th className="py-2.5 px-3">Tool Health</th>
                <th className="py-2.5 px-3">Model</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {predictions.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                    {new Date(p.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-3 font-bold text-white">{p.toolId}</td>
                  <td className="py-3 px-3 text-slate-300">#{p.cycle}</td>
                  <td className="py-3 px-3 text-cyan-400">{Number(p.cuttingForce).toFixed(1)}</td>
                  <td className="py-3 px-3 text-amber-400">{Number(p.vibration).toFixed(3)}</td>
                  <td className="py-3 px-3 text-purple-400">{Number(p.acousticEmission).toFixed(3)}</td>
                  <td className="py-3 px-3 font-bold text-cyan-300">
                    {Number(p.predictedWear).toFixed(3)} mm
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        p.riskLevel === 'LOW'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : p.riskLevel === 'MEDIUM'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : p.riskLevel === 'HIGH'
                          ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {p.riskLevel}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300 font-sans">{p.toolHealth}</td>
                  <td className="py-3 px-3 text-slate-500 text-[10px]">{p.modelVersion}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {predictions.length === 0 && (
            <div className="py-12 text-center text-slate-400 font-sans text-xs">
              No prediction records matched your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
