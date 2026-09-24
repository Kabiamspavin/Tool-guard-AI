import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  Database,
  ArrowRight,
  Filter,
  Layers,
  SlidersHorizontal,
  Table,
  Cpu,
} from 'lucide-react';
import { api } from '../services/api';
import { PageId } from '../components/Sidebar';

interface DataUploadProps {
  onNavigate: (page: PageId) => void;
  onDatasetReady: () => void;
}

export const DataUpload: React.FC<DataUploadProps> = ({ onNavigate, onDatasetReady }) => {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [preprocessResult, setPreprocessResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Column mapping states
  const [targetCol, setTargetCol] = useState<string>('tool_wear');
  const [toolIdCol, setToolIdCol] = useState<string>('tool_id');
  const [cycleCol, setCycleCol] = useState<string>('cycle');
  const [forceCol, setForceCol] = useState<string>('cutting_force');
  const [vibCol, setVibCol] = useState<string>('vibration');
  const [aeCol, setAeCol] = useState<string>('acoustic_emission');
  const [speedCol, setSpeedCol] = useState<string>('spindle_speed');
  const [feedCol, setFeedCol] = useState<string>('feed_rate');
  const [depthCol, setDepthCol] = useState<string>('depth_of_cut');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processUploadedFile(e.target.files[0]);
    }
  };

  const processUploadedFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.uploadCSV(file);
      setUploadResult(res);

      // Auto-populate detected mappings
      if (res.detectedMapping) {
        if (res.detectedMapping.wear) setTargetCol(res.detectedMapping.wear);
        if (res.detectedMapping.toolId) setToolIdCol(res.detectedMapping.toolId);
        if (res.detectedMapping.cycle) setCycleCol(res.detectedMapping.cycle);
        if (res.detectedMapping.force) setForceCol(res.detectedMapping.force);
        if (res.detectedMapping.vibration) setVibCol(res.detectedMapping.vibration);
        if (res.detectedMapping.acoustic) setAeCol(res.detectedMapping.acoustic);
        if (res.detectedMapping.speed) setSpeedCol(res.detectedMapping.speed);
        if (res.detectedMapping.feed) setFeedCol(res.detectedMapping.feed);
        if (res.detectedMapping.depth) setDepthCol(res.detectedMapping.depth);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload CSV dataset.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.loadSampleDataset(315);
      setUploadResult(res);

      // Set mappings for standard PHM 2010 sample
      setTargetCol('tool_wear');
      setToolIdCol('tool_id');
      setCycleCol('cycle');
      setForceCol('cutting_force');
      setVibCol('vibration');
      setAeCol('acoustic_emission');
      setSpeedCol('spindle_speed');
      setFeedCol('feed_rate');
      setDepthCol('depth_of_cut');
    } catch (err: any) {
      setError(err.message || 'Failed to load sample dataset.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunPreprocessing = async () => {
    if (!uploadResult) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.preprocess({
        targetColumn: targetCol,
        toolIdColumn: toolIdCol,
        cycleColumn: cycleCol,
        removeOutliers: true,
        sensorColumns: {
          force: forceCol,
          vibration: vibCol,
          acoustic: aeCol,
          speed: speedCol,
          feed: feedCol,
          depth: depthCol,
        },
      });
      setPreprocessResult(res);
      onDatasetReady();
    } catch (err: any) {
      setError(err.message || 'Preprocessing failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center space-x-3">
            <span>Upload CNC Sensor Dataset</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Ingest milling sensor streams (PHM 2010 compatible), validate columns, and execute automated preprocessing.
          </p>
        </div>

        <button
          onClick={handleLoadSample}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          <span>Load Realistic PHM 2010 Dataset</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Drag and Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-4 ${
          dragActive
            ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
            : 'border-slate-700 hover:border-slate-500 bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-cyan-400 shadow-lg">
          <UploadCloud className="w-8 h-8" />
        </div>
        <div className="space-y-1 max-w-md">
          <p className="text-base font-semibold text-white">
            Drag & drop your CNC sensor CSV file here, or <span className="text-cyan-400 underline">browse files</span>
          </p>
          <p className="text-xs text-slate-400">
            Supports cutting forces, vibration signals, acoustic emission, spindle speeds, and flank wear ($V_B$)
          </p>
        </div>
        <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
          <span>Supported format: .CSV</span>
          <span>•</span>
          <span>Max size: 30 MB</span>
        </div>
      </div>

      {/* Uploaded Dataset Summary */}
      {uploadResult && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{uploadResult.fileName}</h3>
                <p className="text-xs text-slate-400">Dataset validated successfully</p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              READY FOR PREPROCESSING
            </span>
          </div>

          {/* Dataset Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">TOTAL ROWS</span>
              <span className="text-base font-bold text-white">{uploadResult.rowCount.toLocaleString()}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">COLUMNS</span>
              <span className="text-base font-bold text-cyan-400">{uploadResult.columnCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">NUMERICAL FEATS</span>
              <span className="text-base font-bold text-blue-400">{uploadResult.numericalColumns.length}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">MISSING VALUES</span>
              <span className="text-base font-bold text-emerald-400">{uploadResult.missingValues}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">DUPLICATES</span>
              <span className="text-base font-bold text-purple-400">{uploadResult.duplicates}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">TARGET DETECTED</span>
              <span className="text-base font-bold text-amber-400 truncate block">
                {uploadResult.detectedMapping?.wear || 'tool_wear'}
              </span>
            </div>
          </div>

          {/* Flexible Column Mapping Controls */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                <span>Dataset Column Mapping & Domain Configuration</span>
              </h4>
              <span className="text-xs text-slate-400">Flexibly adapt to custom machine channel names</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              {/* Target Column */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold flex items-center space-x-1">
                  <span>Target Variable ($V_B$ Wear):</span>
                  <span className="text-rose-400">*</span>
                </label>
                <select
                  value={targetCol}
                  onChange={(e) => setTargetCol(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  {uploadResult.headers.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              {/* Tool ID Column */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Tool Identifier Column:</label>
                <select
                  value={toolIdCol}
                  onChange={(e) => setToolIdCol(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="">-- None --</option>
                  {uploadResult.headers.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              {/* Cycle Column */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Machining Cycle / Sample Column:</label>
                <select
                  value={cycleCol}
                  onChange={(e) => setCycleCol(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="">-- None --</option>
                  {uploadResult.headers.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              {/* Force Column */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Cutting Force Channel (N):</label>
                <select
                  value={forceCol}
                  onChange={(e) => setForceCol(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="">-- None --</option>
                  {uploadResult.headers.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              {/* Vibration Column */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Vibration Channel (g RMS):</label>
                <select
                  value={vibCol}
                  onChange={(e) => setVibCol(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="">-- None --</option>
                  {uploadResult.headers.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              {/* Acoustic Emission Column */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Acoustic Emission Channel (V):</label>
                <select
                  value={aeCol}
                  onChange={(e) => setAeCol(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="">-- None --</option>
                  {uploadResult.headers.map((h: string) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleRunPreprocessing}
                disabled={loading}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                <span>Execute Feature Engineering & Preprocessing</span>
              </button>
            </div>
          </div>

          {/* Dataset Preview Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-semibold uppercase text-slate-400 flex items-center space-x-2">
              <Table className="w-4 h-4 text-slate-400" />
              <span>Dataset Preview (Top 10 Records)</span>
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase">
                  <tr>
                    {uploadResult.headers.map((h: string) => (
                      <th key={h} className="py-2 px-3 border-b border-slate-800 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {uploadResult.preview.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      {uploadResult.headers.map((h: string) => (
                        <td key={h} className="py-2 px-3 whitespace-nowrap text-slate-300">
                          {typeof row[h] === 'number' ? Number(row[h]).toFixed(3) : row[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Preprocessing Statistics Summary */}
      {preprocessResult && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/30 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>Feature Engineering & Cleaning Pipeline Complete</span>
              </h3>
              <p className="text-xs text-slate-400">
                Derived rolling RMS, standard deviation, and energy proxies without look-ahead bias
              </p>
            </div>

            <button
              onClick={() => onNavigate('model')}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <span>Proceed to Train XGBoost Model</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">TOTAL ROWS</span>
              <span className="text-sm font-bold text-white">{preprocessResult.stats.totalRows}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">VALID ROWS</span>
              <span className="text-sm font-bold text-emerald-400">{preprocessResult.stats.validRows}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">MISSING HANDLED</span>
              <span className="text-sm font-bold text-blue-400">{preprocessResult.stats.missingValuesHandled}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">OUTLIERS (IQR)</span>
              <span className="text-sm font-bold text-purple-400">{preprocessResult.stats.outliersDetected}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">ENGINEERED FEATS</span>
              <span className="text-sm font-bold text-cyan-400">{preprocessResult.featureNames.length}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">TRAIN SAMPLES (80%)</span>
              <span className="text-sm font-bold text-white">{preprocessResult.stats.trainSamples}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">TEST SAMPLES (20%)</span>
              <span className="text-sm font-bold text-white">{preprocessResult.stats.testSamples}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
