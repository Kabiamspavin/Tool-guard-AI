export interface SystemHealth {
  status: string;
  system: string;
  machineStatus: 'ONLINE' | 'STANDBY' | 'MAINTENANCE' | 'ALERT';
  machineId: string;
  activeToolId: string;
  modelTrained: boolean;
  modelVersion: string | null;
  geminiConfigured: boolean;
  timestamp: string;
}

export interface PredictionItem {
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

export interface DashboardData {
  isDemo: boolean;
  machineStatus: 'ONLINE' | 'STANDBY' | 'MAINTENANCE' | 'ALERT';
  currentTool: string;
  latestPrediction: {
    wear: number;
    risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    health: string;
    rul: string;
    isDemo: boolean;
    timestamp: string;
  };
  sensorTrends: {
    sample: number;
    cuttingForce: number;
    vibration: number;
    acousticEmission: number;
  }[];
  wearTrends: {
    sample: number;
    toolWear: number;
  }[];
  riskDistribution: {
    name: string;
    value: number;
    color: string;
  }[];
  recentPredictions: PredictionItem[];
}

export interface ShapData {
  baseValue: number;
  predictedValue: number;
  shapValues: {
    feature: string;
    value: number;
    contribution: number;
  }[];
  topDrivers: {
    feature: string;
    impact: 'increases_wear' | 'decreases_wear';
    magnitude: number;
  }[];
  explanationText?: string;
}

export interface ModelMetricsData {
  trained: boolean;
  message?: string;
  metrics?: {
    mae: number;
    mse: number;
    rmse: number;
    r2: number;
    trainSamples: number;
    testSamples: number;
    trainedAt: string;
    datasetName: string;
  };
  featureImportance?: Record<string, number>;
  evaluationPoints?: { actual: number; predicted: number; residual: number }[];
  params?: {
    nEstimators: number;
    maxDepth: number;
    learningRate: number;
  };
}

export interface AppSettings {
  lowThreshold: number;
  mediumThreshold: number;
  highThreshold: number;
  criticalThreshold: number;
  machineId: string;
  machineStatus: 'ONLINE' | 'STANDBY' | 'MAINTENANCE' | 'ALERT';
  toolId: string;
  samplingRateHz: number;
  enableAlerts: boolean;
}
