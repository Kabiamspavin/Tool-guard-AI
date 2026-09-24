import React, { useState, useEffect } from 'react';
import {
  Gauge,
  Cpu,
  TrendingUp,
  RotateCw,
  CheckCircle,
  AlertTriangle,
  Sliders,
  BarChart2,
  ScatterChart as ScatterIcon,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Line,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { api } from '../services/api';
import { ModelMetricsData } from '../types';
import { PageId } from '../components/Sidebar';

interface ModelPerformanceProps {
  onNavigate: (page: PageId) => void;
}

export const ModelPerformance: React.FC<ModelPerformanceProps> = ({ onNavigate }) => {
  const [modelData, setModelData] = useState<ModelMetricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hyperparameters
  const [nEstimators, setNEstimators] = useState(45);
  const [maxDepth, setMaxDepth] = useState(4);
  const [learningRate, setLearningRate] = useState(0.08);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await api.getModelMetrics();
      setModelData(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleTrain = async () => {
    setTraining(true);
    setError(null);
    try {
      await api.trainModel({
        targetColumn: 'tool_wear',
        params: {
          nEstimators,
          maxDepth,
          learningRate,
        },
      });
      await fetchMetrics();
    } catch (err: any) {
      setError(err.message || 'Training failed. Please ensure a dataset is uploaded first.');
    } finally {
      setTraining(false);
    }
  };

  // Convert feature importance to array for charts
  const featureImpArray = modelData?.featureImportance
    ? Object.entries(modelData.featureImportance)
        .map(([k, v]) => ({ feature: k, importance: Number(v.toFixed(1)) }))
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 8)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center space-x-3">
            <span>Model Performance & Evaluation</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Validate XGBoost regression accuracy, residual distribution, and feature importance.
          </p>
        </div>

        <button
          onClick={handleTrain}
          disabled={training}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          {training ? <RotateCw className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
          <span>{modelData?.trained ? 'Retrain XGBoost Regressor' : 'Train Model on Dataset'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {modelData && modelData.trained && modelData.metrics ? (
        <>
          {/* Metrics Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 font-mono">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase text-slate-400">Mean Abs Error (MAE)</span>
              <div className="text-xl font-bold text-cyan-400">{modelData.metrics.mae} mm</div>
              <span className="text-[10px] text-slate-500 font-sans">Held-out test set</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase text-slate-400">Root Mean Sq (RMSE)</span>
              <div className="text-xl font-bold text-blue-400">{modelData.metrics.rmse} mm</div>
              <span className="text-[10px] text-slate-500 font-sans">Penalty for large errors</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase text-slate-400">Coefficient ($R^2$ Score)</span>
              <div className="text-xl font-bold text-emerald-400">{modelData.metrics.r2}</div>
              <span className="text-[10px] text-slate-500 font-sans">Variance explained</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase text-slate-400">Mean Squared (MSE)</span>
              <div className="text-xl font-bold text-purple-400">{modelData.metrics.mse}</div>
              <span className="text-[10px] text-slate-500 font-sans">Residual variance</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase text-slate-400">Training Samples</span>
              <div className="text-xl font-bold text-white">{modelData.metrics.trainSamples}</div>
              <span className="text-[10px] text-slate-500 font-sans">80% train partition</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase text-slate-400">Testing Samples</span>
              <div className="text-xl font-bold text-amber-400">{modelData.metrics.testSamples}</div>
              <span className="text-[10px] text-slate-500 font-sans">20% test partition</span>
            </div>
          </div>

          {/* Charts: Actual vs Predicted & Feature Importance */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Actual vs Predicted Scatter Chart (7 Cols) */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <ScatterIcon className="w-5 h-5 text-cyan-400" />
                  <span>Actual vs. Predicted Flank Wear ($V_B$)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Points along the diagonal identity line ($y=x$) indicate perfect prediction accuracy.
                </p>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      type="number"
                      dataKey="actual"
                      name="Actual Wear"
                      unit=" mm"
                      stroke="#64748b"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      domain={[0, 0.35]}
                    />
                    <YAxis
                      type="number"
                      dataKey="predicted"
                      name="Predicted Wear"
                      unit=" mm"
                      stroke="#64748b"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      domain={[0, 0.35]}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }}
                    />
                    <Scatter
                      name="Validation Points"
                      data={modelData.evaluationPoints || []}
                      fill="#06b6d4"
                      shape="circle"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Global Feature Importance Bar Chart (5 Cols) */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <BarChart2 className="w-5 h-5 text-amber-400" />
                  <span>Global Feature Importance (%)</span>
                </h3>
                <p className="text-xs text-slate-400">Relative information gain across boosted tree splits</p>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={featureImpArray}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 90, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                    <YAxis
                      type="category"
                      dataKey="feature"
                      stroke="#64748b"
                      tick={{ fontSize: 11, fill: '#cbd5e1', fontFamily: 'monospace' }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem' }}
                    />
                    <Bar dataKey="importance" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Hyperparameters Config Table */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <span>Trained XGBoost Hyperparameter Configuration</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">N_ESTIMATORS</span>
                <span className="text-base font-bold text-white">{modelData.params?.nEstimators || nEstimators}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">MAX_DEPTH</span>
                <span className="text-base font-bold text-white">{modelData.params?.maxDepth || maxDepth}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">LEARNING_RATE</span>
                <span className="text-base font-bold text-white">{modelData.params?.learningRate || learningRate}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">SUBSAMPLE</span>
                <span className="text-base font-bold text-white">0.85</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">TREE EXPLAINER</span>
                <span className="text-base font-bold text-emerald-400">Exact DP TreeSHAP</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Empty / Untrained state */
        <div className="p-12 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white">Model Not Trained</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Upload a dataset in the Data Upload page or click below to train on the standard PHM 2010 Milling sensor benchmark.
          </p>
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              onClick={() => onNavigate('upload')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 transition-all cursor-pointer"
            >
              Upload Dataset
            </button>
            <button
              onClick={handleTrain}
              disabled={training}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {training ? 'Training...' : 'Train Baseline XGBoost'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
