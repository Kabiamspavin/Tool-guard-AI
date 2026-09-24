/**
 * Storage & Persistence Layer for ToolGuard AI
 * Maintains database tables: predictions, datasets, models, settings, maintenance_logs
 */

import fs from 'fs';
import path from 'path';
import { BoostedTreeModel } from './ml-engine';

export interface AppSettings {
  lowThreshold: number; // e.g. 0.10 mm
  mediumThreshold: number; // e.g. 0.20 mm
  highThreshold: number; // e.g. 0.30 mm
  criticalThreshold: number; // > 0.30 mm
  machineId: string;
  machineStatus: 'ONLINE' | 'STANDBY' | 'MAINTENANCE' | 'ALERT';
  toolId: string;
  samplingRateHz: number;
  enableAlerts: boolean;
}

export interface PredictionRecord {
  id: string;
  timestamp: string;
  toolId: string;
  cycle: number;
  cuttingForce: number;
  vibration: number;
  acousticEmission: number;
  spindleSpeed: number;
  feedRate: number;
  depthOfCut: number;
  predictedWear: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  toolHealth: string;
  rulCycles: number | null;
  modelVersion: string;
  isDemo?: boolean;
}

export interface StoredDataset {
  id: string;
  name: string;
  uploadedAt: string;
  rowCount: number;
  columnCount: number;
  columns: string[];
  sampleRows: Record<string, any>[];
  preprocessed: boolean;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'toolguard_db.json');

export class StorageService {
  private static defaultSettings: AppSettings = {
    lowThreshold: 0.10,
    mediumThreshold: 0.20,
    highThreshold: 0.30,
    criticalThreshold: 0.30,
    machineId: 'CNC-DMG-Mori-01',
    machineStatus: 'ONLINE',
    toolId: 'Tool_T01',
    samplingRateHz: 50000,
    enableAlerts: true,
  };

  private static inMemoryState: {
    settings: AppSettings;
    predictions: PredictionRecord[];
    datasets: StoredDataset[];
    activeDatasetRows: Record<string, any>[];
    trainedModel: BoostedTreeModel | null;
  } = {
    settings: { ...StorageService.defaultSettings },
    predictions: [],
    datasets: [],
    activeDatasetRows: [],
    trainedModel: null,
  };

  public static init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.settings) this.inMemoryState.settings = { ...this.defaultSettings, ...parsed.settings };
        if (parsed.predictions) this.inMemoryState.predictions = parsed.predictions;
        if (parsed.datasets) this.inMemoryState.datasets = parsed.datasets;
        if (parsed.trainedModel) this.inMemoryState.trainedModel = parsed.trainedModel;
      }
    } catch (e) {
      console.warn('Could not read existing storage file, initializing defaults:', e);
    }
  }

  public static save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(
        DB_FILE,
        JSON.stringify(
          {
            settings: this.inMemoryState.settings,
            predictions: this.inMemoryState.predictions.slice(0, 1000),
            datasets: this.inMemoryState.datasets,
            trainedModel: this.inMemoryState.trainedModel,
          },
          null,
          2
        )
      );
    } catch (e) {
      console.error('Failed to persist storage:', e);
    }
  }

  public static getSettings(): AppSettings {
    return this.inMemoryState.settings;
  }

  public static updateSettings(newSettings: Partial<AppSettings>): AppSettings {
    this.inMemoryState.settings = { ...this.inMemoryState.settings, ...newSettings };
    this.save();
    return this.inMemoryState.settings;
  }

  public static getTrainedModel(): BoostedTreeModel | null {
    return this.inMemoryState.trainedModel;
  }

  public static setTrainedModel(model: BoostedTreeModel) {
    this.inMemoryState.trainedModel = model;
    this.save();
  }

  public static getPredictions(): PredictionRecord[] {
    return this.inMemoryState.predictions;
  }

  public static addPrediction(pred: PredictionRecord) {
    this.inMemoryState.predictions.unshift(pred);
    if (this.inMemoryState.predictions.length > 500) {
      this.inMemoryState.predictions = this.inMemoryState.predictions.slice(0, 500);
    }
    this.save();
  }

  public static clearPredictions() {
    this.inMemoryState.predictions = [];
    this.save();
  }

  public static setActiveDataset(name: string, rows: Record<string, any>[]) {
    this.inMemoryState.activeDatasetRows = rows;
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    const ds: StoredDataset = {
      id: 'ds_' + Date.now(),
      name,
      uploadedAt: new Date().toISOString(),
      rowCount: rows.length,
      columnCount: columns.length,
      columns,
      sampleRows: rows.slice(0, 5),
      preprocessed: false,
    };
    this.inMemoryState.datasets.unshift(ds);
    this.save();
    return ds;
  }

  public static getActiveDatasetRows(): Record<string, any>[] {
    return this.inMemoryState.activeDatasetRows;
  }

  public static getDatasets(): StoredDataset[] {
    return this.inMemoryState.datasets;
  }

  public static classifyWear(
    wear: number,
    settings: AppSettings
  ): { riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; toolHealth: string; recommendedAction: string } {
    if (wear < settings.lowThreshold) {
      return {
        riskLevel: 'LOW',
        toolHealth: 'Normal Operation',
        recommendedAction: 'Continue operation and monitor sensor trends.',
      };
    } else if (wear < settings.mediumThreshold) {
      return {
        riskLevel: 'MEDIUM',
        toolHealth: 'Moderate Wear',
        recommendedAction: 'Increase monitoring frequency and inspect tool condition at next scheduled break.',
      };
    } else if (wear < settings.highThreshold) {
      return {
        riskLevel: 'HIGH',
        toolHealth: 'High Wear',
        recommendedAction: 'Schedule tool inspection and evaluate replacement timing before final tolerance cut.',
      };
    } else {
      return {
        riskLevel: 'CRITICAL',
        toolHealth: 'Critical Wear / End of Life',
        recommendedAction:
          'Stop or isolate the affected operation according to plant safety procedures and inspect the tool immediately.',
      };
    }
  }
}
