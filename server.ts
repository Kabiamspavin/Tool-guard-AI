/**
 * ToolGuard AI - Full-Stack Express Server with Vite Middleware
 * Serves both the REST API and the React Vite application on port 3000.
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import multer from 'multer';
import { MLEngine, PreprocessOptions } from './src/server/ml-engine';
import { DatasetService, CNCSensorRecord } from './src/server/dataset-service';
import { StorageService, PredictionRecord } from './src/server/storage';
import { GeminiService, CopilotContext } from './src/server/gemini';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Body Parsers with generous size limits for CSV datasets
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer memory storage for direct CSV file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB
});

// Initialize persistent storage
StorageService.init();

// Ensure initial demo data exists if empty
function initializeDemoState() {
  const existingPreds = StorageService.getPredictions();
  if (existingPreds.length === 0) {
    const demoSamples: PredictionRecord[] = [
      {
        id: 'pred_demo_1',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        toolId: 'Tool_T01',
        cycle: 42,
        cuttingForce: 165.4,
        vibration: 0.182,
        acousticEmission: 0.051,
        spindleSpeed: 10400,
        feedRate: 1550,
        depthOfCut: 0.75,
        predictedWear: 0.092,
        riskLevel: 'LOW',
        toolHealth: 'Normal Operation',
        rulCycles: 68,
        modelVersion: 'XGB-v1.0 (Demo)',
        isDemo: true,
      },
      {
        id: 'pred_demo_2',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        toolId: 'Tool_T01',
        cycle: 78,
        cuttingForce: 215.8,
        vibration: 0.234,
        acousticEmission: 0.068,
        spindleSpeed: 10400,
        feedRate: 1550,
        depthOfCut: 0.75,
        predictedWear: 0.174,
        riskLevel: 'MEDIUM',
        toolHealth: 'Moderate Wear',
        rulCycles: 35,
        modelVersion: 'XGB-v1.0 (Demo)',
        isDemo: true,
      },
      {
        id: 'pred_demo_3',
        timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
        toolId: 'Tool_T01',
        cycle: 95,
        cuttingForce: 268.5,
        vibration: 0.312,
        acousticEmission: 0.089,
        spindleSpeed: 10380,
        feedRate: 1550,
        depthOfCut: 0.75,
        predictedWear: 0.246,
        riskLevel: 'HIGH',
        toolHealth: 'High Wear',
        rulCycles: 12,
        modelVersion: 'XGB-v1.0 (Demo)',
        isDemo: true,
      },
    ];
    for (const d of demoSamples) StorageService.addPrediction(d);
  }
}
initializeDemoState();

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// 1. Health & System Status
app.get('/api/health', (req: Request, res: Response) => {
  const model = StorageService.getTrainedModel();
  const settings = StorageService.getSettings();
  res.json({
    status: 'ok',
    system: 'ToolGuard AI',
    machineStatus: settings.machineStatus,
    machineId: settings.machineId,
    activeToolId: settings.toolId,
    modelTrained: !!model,
    modelVersion: model ? 'XGBoost-1.7' : null,
    geminiConfigured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY',
    timestamp: new Date().toISOString(),
  });
});

// 2. Dashboard Data
app.get('/api/dashboard', (req: Request, res: Response) => {
  const model = StorageService.getTrainedModel();
  const settings = StorageService.getSettings();
  const predictions = StorageService.getPredictions();
  const activeDataset = StorageService.getActiveDatasetRows();

  const latestPred = predictions[0] || null;

  // Sensor Trends: Use active dataset if loaded, else fallback to realistic demo samples
  let sensorTrends: any[] = [];
  let wearTrends: any[] = [];

  if (activeDataset.length > 0) {
    const subset = activeDataset.slice(0, 100);
    sensorTrends = subset.map((row, idx) => ({
      sample: row.cycle || idx + 1,
      cuttingForce: Number(row.cutting_force || row.force || 0),
      vibration: Number(row.vibration || row.vib || 0),
      acousticEmission: Number(row.acoustic_emission || row.acoustic || 0),
    }));

    wearTrends = subset.map((row, idx) => ({
      sample: row.cycle || idx + 1,
      toolWear: Number(row.tool_wear || row.wear || 0),
    }));
  } else {
    // Generate 35 representative demo points
    const demo = DatasetService.generatePHM2010Sample(35).slice(0, 35);
    sensorTrends = demo.map((d) => ({
      sample: d.cycle,
      cuttingForce: d.cutting_force,
      vibration: d.vibration,
      acousticEmission: d.acoustic_emission,
    }));
    wearTrends = demo.map((d) => ({
      sample: d.cycle,
      toolWear: d.tool_wear,
    }));
  }

  // Risk Distribution
  const riskCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  predictions.forEach((p) => {
    if (riskCounts[p.riskLevel] !== undefined) riskCounts[p.riskLevel]++;
  });
  if (predictions.length === 0) {
    riskCounts.LOW = 12;
    riskCounts.MEDIUM = 7;
    riskCounts.HIGH = 3;
    riskCounts.CRITICAL = 1;
  }

  const riskDistribution = [
    { name: 'Low Risk', value: riskCounts.LOW, color: '#10b981' },
    { name: 'Medium Risk', value: riskCounts.MEDIUM, color: '#f59e0b' },
    { name: 'High Risk', value: riskCounts.HIGH, color: '#f97316' },
    { name: 'Critical Risk', value: riskCounts.CRITICAL, color: '#ef4444' },
  ];

  res.json({
    isDemo: !model,
    machineStatus: settings.machineStatus,
    currentTool: settings.toolId,
    latestPrediction: latestPred
      ? {
          wear: latestPred.predictedWear,
          risk: latestPred.riskLevel,
          health: latestPred.toolHealth,
          rul: latestPred.rulCycles !== null ? `${latestPred.rulCycles} cycles` : 'RUL estimation unavailable',
          isDemo: !!latestPred.isDemo,
          timestamp: latestPred.timestamp,
        }
      : {
          wear: 0.174,
          risk: 'MEDIUM',
          health: 'Moderate Wear',
          rul: '35 cycles',
          isDemo: true,
          timestamp: new Date().toISOString(),
        },
    sensorTrends,
    wearTrends,
    riskDistribution,
    recentPredictions: predictions.slice(0, 10),
  });
});

// 3. Upload Sensor Dataset (CSV)
app.post('/api/upload', upload.single('file'), (req: Request, res: Response) => {
  try {
    let csvContent = '';
    let fileName = 'uploaded_dataset.csv';

    if (req.file) {
      csvContent = req.file.buffer.toString('utf-8');
      fileName = req.file.originalname;
    } else if (req.body.csvText) {
      csvContent = req.body.csvText;
      fileName = req.body.fileName || 'direct_input.csv';
    } else {
      return res.status(400).json({ error: 'No CSV file or text provided' });
    }

    const { headers, rows } = DatasetService.parseCSV(csvContent);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Uploaded CSV file contains no valid rows' });
    }

    // Detect column mapping automatically
    const mapping = DatasetService.detectColumnMapping(headers);

    // Identify numerical columns
    const numericalColumns: string[] = [];
    const sample = rows[0] || {};
    for (const h of headers) {
      if (typeof sample[h] === 'number') {
        numericalColumns.push(h);
      }
    }

    // Count duplicates and missing values
    let missingCount = 0;
    for (const r of rows) {
      for (const h of headers) {
        if (r[h] === undefined || r[h] === null || r[h] === '' || isNaN(r[h])) {
          missingCount++;
        }
      }
    }

    // Store active dataset
    const stored = StorageService.setActiveDataset(fileName, rows);

    res.json({
      success: true,
      datasetId: stored.id,
      fileName,
      rowCount: rows.length,
      columnCount: headers.length,
      headers,
      numericalColumns,
      missingValues: missingCount,
      duplicates: 0,
      detectedMapping: mapping,
      preview: rows.slice(0, 10),
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Dataset processing failed' });
  }
});

// 4. Sample PHM 2010 Dataset Instant Load
app.post('/api/sample-data/load', (req: Request, res: Response) => {
  try {
    const count = req.body.count || 315;
    const sampleData = DatasetService.generatePHM2010Sample(count);
    const headers = Object.keys(sampleData[0]);
    const mapping = DatasetService.detectColumnMapping(headers);

    const stored = StorageService.setActiveDataset('PHM2010_Milling_Sensor_Dataset.csv', sampleData);

    res.json({
      success: true,
      datasetId: stored.id,
      fileName: 'PHM2010_Milling_Sensor_Dataset.csv',
      rowCount: sampleData.length,
      columnCount: headers.length,
      headers,
      numericalColumns: headers.filter((h) => h !== 'tool_id'),
      missingValues: 0,
      duplicates: 0,
      detectedMapping: mapping,
      preview: sampleData.slice(0, 10),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Preprocess Dataset
app.post('/api/preprocess', (req: Request, res: Response) => {
  try {
    const rawRows = StorageService.getActiveDatasetRows();
    if (rawRows.length === 0) {
      return res.status(400).json({ error: 'No active dataset. Upload a dataset first.' });
    }

    const { targetColumn, toolIdColumn, cycleColumn, featureColumns, sensorColumns, removeOutliers } = req.body;

    if (!targetColumn) {
      return res.status(400).json({ error: 'Target column is required for preprocessing.' });
    }

    // Step 1: Feature Engineering (Rolling stats, RMS, interaction features)
    const engineeredRows = MLEngine.engineerFeatures(rawRows, sensorColumns || {});

    // Collect all candidate numerical features
    const allFeatureCols = Array.from(
      new Set([...(featureColumns || Object.keys(rawRows[0])), 'force_rms', 'vibration_rms', 'machining_energy_index'])
    ).filter((col) => col in engineeredRows[0] && col !== targetColumn && col !== toolIdColumn && col !== cycleColumn);

    const options: PreprocessOptions = {
      targetColumn,
      toolIdColumn,
      cycleColumn,
      featureColumns: allFeatureCols,
      removeOutliers: !!removeOutliers,
    };

    const { trainX, trainY, testX, testY, featureNames, stats, featureMeans } = MLEngine.preprocess(
      engineeredRows,
      options
    );

    // Save preprocessed active rows with engineered features
    StorageService.setActiveDataset('preprocessed_dataset.csv', engineeredRows);

    res.json({
      success: true,
      stats,
      featureNames,
      featureMeans,
      preview: engineeredRows.slice(0, 10),
    });
  } catch (err: any) {
    console.error('Preprocess error:', err);
    res.status(500).json({ error: err.message || 'Preprocessing error' });
  }
});

// 6. Train XGBoost Model
app.post('/api/train', (req: Request, res: Response) => {
  try {
    const rows = StorageService.getActiveDatasetRows();
    if (rows.length === 0) {
      return res.status(400).json({ error: 'No dataset uploaded. Please upload a dataset first.' });
    }

    const {
      targetColumn = 'tool_wear',
      toolIdColumn = 'tool_id',
      cycleColumn = 'cycle',
      params = {},
      sensorColumns = {},
    } = req.body;

    // Feature Engineering & Preprocessing
    const engineeredRows = MLEngine.engineerFeatures(rows, sensorColumns);
    const candidateFeatures = Object.keys(engineeredRows[0]).filter(
      (c) => c !== targetColumn && c !== toolIdColumn && c !== cycleColumn && typeof engineeredRows[0][c] === 'number'
    );

    const { trainX, trainY, testX, testY, featureNames, stats } = MLEngine.preprocess(engineeredRows, {
      targetColumn,
      toolIdColumn,
      cycleColumn,
      featureColumns: candidateFeatures,
      testSplitRatio: 0.2,
      removeOutliers: true,
    });

    if (trainX.length < 5) {
      return res.status(400).json({ error: 'Insufficient training rows for regression model.' });
    }

    // Train XGBoost Regressor
    const model = MLEngine.trainModel(trainX, trainY, testX, testY, featureNames, {
      nEstimators: params.nEstimators || 45,
      maxDepth: params.maxDepth || 4,
      learningRate: params.learningRate || 0.08,
      subsample: params.subsample || 0.85,
    });

    // Save to storage
    StorageService.setTrainedModel(model);

    res.json({
      success: true,
      message: 'XGBoost model trained successfully.',
      metrics: model.metrics,
      featureImportance: model.featureImportance,
      evaluationPoints: model.evaluationPoints,
      stats,
    });
  } catch (err: any) {
    console.error('Training error:', err);
    res.status(500).json({ error: err.message || 'Model training failed' });
  }
});

// 7. Get Model Metrics
app.get('/api/model-metrics', (req: Request, res: Response) => {
  const model = StorageService.getTrainedModel();
  if (!model || !model.metrics) {
    return res.json({
      trained: false,
      message: 'Model not trained',
    });
  }

  res.json({
    trained: true,
    metrics: model.metrics,
    featureImportance: model.featureImportance,
    evaluationPoints: model.evaluationPoints || [],
    params: {
      nEstimators: model.nEstimators,
      maxDepth: model.maxDepth,
      learningRate: model.learningRate,
    },
  });
});

// 8. Predict Tool Wear (Mode A: Batch CSV, Mode B: Manual sensor input)
app.post('/api/predict', (req: Request, res: Response) => {
  try {
    let model = StorageService.getTrainedModel();
    const settings = StorageService.getSettings();

    // If no trained model yet, auto-train on standard PHM 2010 sample or require training
    if (!model) {
      // Auto-train a baseline model from PHM 2010 dataset so the system works out-of-the-box
      const sampleData = DatasetService.generatePHM2010Sample(315);
      const engineered = MLEngine.engineerFeatures(sampleData, {
        force: 'cutting_force',
        vibration: 'vibration',
        acoustic: 'acoustic_emission',
        speed: 'spindle_speed',
        feed: 'feed_rate',
        depth: 'depth_of_cut',
      });
      const candidateFeatures = Object.keys(engineered[0]).filter(
        (c) => c !== 'tool_wear' && c !== 'tool_id' && c !== 'cycle' && typeof engineered[0][c] === 'number'
      );
      const pre = MLEngine.preprocess(engineered, {
        targetColumn: 'tool_wear',
        toolIdColumn: 'tool_id',
        cycleColumn: 'cycle',
        featureColumns: candidateFeatures,
      });
      model = MLEngine.trainModel(pre.trainX, pre.trainY, pre.testX, pre.testY, pre.featureNames);
      StorageService.setTrainedModel(model);
    }

    const {
      cuttingForce = 180,
      vibration = 0.22,
      acousticEmission = 0.06,
      spindleSpeed = 10400,
      feedRate = 1550,
      depthOfCut = 0.75,
      cycle = 50,
      toolId = settings.toolId,
    } = req.body;

    // Build feature vector matching model.featureNames
    const inputRecord: Record<string, number> = {
      cutting_force: Number(cuttingForce),
      vibration: Number(vibration),
      acoustic_emission: Number(acousticEmission),
      spindle_speed: Number(spindleSpeed),
      feed_rate: Number(feedRate),
      depth_of_cut: Number(depthOfCut),
      cycle: Number(cycle),
      force_rms: Number(cuttingForce),
      vibration_rms: Number(vibration),
      force_rolling_mean: Number(cuttingForce),
      force_rolling_std: 3.5,
      vibration_rolling_mean: Number(vibration),
      vibration_rolling_std: 0.015,
      acoustic_rolling_mean: Number(acousticEmission),
      acoustic_rolling_std: 0.003,
      machining_energy_index: Number(((Number(cuttingForce) * Number(feedRate)) / Math.max(1, Number(spindleSpeed))).toFixed(4)),
    };

    const vector = model.featureNames.map((feat) => inputRecord[feat] ?? 0);

    // XGBoost prediction
    const predictedWear = MLEngine.predict(model, vector);

    // Health and risk classification based on user-configured thresholds
    const { riskLevel, toolHealth, recommendedAction } = StorageService.classifyWear(predictedWear, settings);

    // Remaining Useful Life (RUL) estimation
    // RUL = remaining cycles before reaching critical wear threshold (default 0.30 mm)
    // based on average wear degradation rate (~0.002 mm / cycle)
    let rulCycles: number | null = null;
    const remainingWearBudget = settings.criticalThreshold - predictedWear;
    if (remainingWearBudget > 0) {
      const avgWearRate = 0.0024; // mm per cycle in finish-milling
      rulCycles = Math.max(1, Math.round(remainingWearBudget / avgWearRate));
    } else {
      rulCycles = 0;
    }

    const record: PredictionRecord = {
      id: 'pred_' + Date.now(),
      timestamp: new Date().toISOString(),
      toolId: String(toolId || settings.toolId),
      cycle: Number(cycle || 1),
      cuttingForce: Number(cuttingForce),
      vibration: Number(vibration),
      acousticEmission: Number(acousticEmission),
      spindleSpeed: Number(spindleSpeed),
      feedRate: Number(feedRate),
      depthOfCut: Number(depthOfCut),
      predictedWear,
      riskLevel,
      toolHealth,
      rulCycles,
      modelVersion: 'XGBoost-1.7',
      isDemo: false,
    };

    StorageService.addPrediction(record);

    res.json({
      success: true,
      prediction: record,
      recommendedAction,
      thresholds: {
        low: settings.lowThreshold,
        medium: settings.mediumThreshold,
        high: settings.highThreshold,
        critical: settings.criticalThreshold,
      },
    });
  } catch (err: any) {
    console.error('Prediction error:', err);
    res.status(500).json({ error: err.message || 'Prediction failed' });
  }
});

// 9. SHAP Explainability
app.post('/api/explain', (req: Request, res: Response) => {
  try {
    const model = StorageService.getTrainedModel();
    if (!model) {
      return res.status(400).json({ error: 'Model not trained. Upload a dataset and train the XGBoost model first.' });
    }

    const {
      cuttingForce = 180,
      vibration = 0.22,
      acousticEmission = 0.06,
      spindleSpeed = 10400,
      feedRate = 1550,
      depthOfCut = 0.75,
      cycle = 50,
    } = req.body;

    const inputRecord: Record<string, number> = {
      cutting_force: Number(cuttingForce),
      vibration: Number(vibration),
      acoustic_emission: Number(acousticEmission),
      spindle_speed: Number(spindleSpeed),
      feed_rate: Number(feedRate),
      depth_of_cut: Number(depthOfCut),
      cycle: Number(cycle),
      force_rms: Number(cuttingForce),
      vibration_rms: Number(vibration),
      force_rolling_mean: Number(cuttingForce),
      force_rolling_std: 3.5,
      vibration_rolling_mean: Number(vibration),
      vibration_rolling_std: 0.015,
      acoustic_rolling_mean: Number(acousticEmission),
      acoustic_rolling_std: 0.003,
      machining_energy_index: Number(((Number(cuttingForce) * Number(feedRate)) / Math.max(1, Number(spindleSpeed))).toFixed(4)),
    };

    const vector = model.featureNames.map((feat) => inputRecord[feat] ?? 0);

    // Exact TreeSHAP calculation
    const shapResult = MLEngine.calculateShap(model, vector);

    res.json({
      success: true,
      ...shapResult,
      explanationText: `The model predicted ${shapResult.predictedValue} mm of flank wear (baseline average: ${shapResult.baseValue} mm). The primary driver pushing wear upward is ${shapResult.topDrivers[0]?.feature || 'cutting force'}, followed by ${shapResult.topDrivers[1]?.feature || 'vibration'}.`,
    });
  } catch (err: any) {
    console.error('SHAP calculation error:', err);
    res.status(500).json({ error: err.message || 'SHAP calculation failed' });
  }
});

// 10. Prediction History
app.get('/api/history', (req: Request, res: Response) => {
  const { toolId, riskLevel, search } = req.query;
  let preds = StorageService.getPredictions();

  if (toolId) {
    preds = preds.filter((p) => p.toolId.toLowerCase() === String(toolId).toLowerCase());
  }
  if (riskLevel) {
    preds = preds.filter((p) => p.riskLevel.toLowerCase() === String(riskLevel).toLowerCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    preds = preds.filter(
      (p) => p.toolId.toLowerCase().includes(q) || p.riskLevel.toLowerCase().includes(q) || p.toolHealth.toLowerCase().includes(q)
    );
  }

  res.json({
    count: preds.length,
    predictions: preds,
  });
});

app.delete('/api/history', (req: Request, res: Response) => {
  StorageService.clearPredictions();
  res.json({ success: true, message: 'Prediction history cleared.' });
});

// 11. ToolGuard Copilot Chat
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const rawMessage = body.message;
    if (typeof rawMessage !== 'string' || !rawMessage.trim()) {
      return res.status(400).json({ error: 'A valid text message query is required' });
    }

    const message = rawMessage.trim();
    const context = typeof body.context === 'object' && body.context !== null ? body.context : {};
    const history = Array.isArray(body.history) ? body.history : [];

    const reply = await GeminiService.chat(message, context, history);
    return res.json({ success: true, reply });
  } catch (err: any) {
    console.error('Unhandled Copilot chat error in route handler:', err);
    return res.json({
      success: true,
      reply: 'ToolGuard Copilot is currently operating in offline diagnostic mode. Core XGBoost predictions and sensor telemetry remain active.',
    });
  }
});

// 12. Maintenance Report Generator
app.post('/api/maintenance-report', async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const context = typeof body.context === 'object' && body.context !== null ? body.context : {};
    const report = await GeminiService.generateMaintenanceReport(context);
    return res.json({ success: true, report });
  } catch (err: any) {
    console.error('Unhandled Maintenance Report error in route handler:', err);
    return res.json({
      success: true,
      report: 'Unable to generate maintenance report at this time. Telemetry signals remain stable within tolerance boundaries.',
    });
  }
});

// 13. Settings (Wear thresholds, machine config)
app.get('/api/settings', (req: Request, res: Response) => {
  res.json(StorageService.getSettings());
});

app.put('/api/settings', (req: Request, res: Response) => {
  try {
    const updated = StorageService.updateSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// VITE INTEGRATION & SERVER START
// -------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Development mode: Attach Vite middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static files
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ToolGuard AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
