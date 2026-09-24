/**
 * ToolGuard AI - Frontend API Service
 */

import { DashboardData, ModelMetricsData, PredictionItem, ShapData, SystemHealth, AppSettings } from '../types';

const BASE_URL = '/api';

export const api = {
  async getHealth(): Promise<SystemHealth> {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async getDashboard(): Promise<DashboardData> {
    const res = await fetch(`${BASE_URL}/dashboard`);
    if (!res.ok) throw new Error('Failed to load dashboard data');
    return res.json();
  },

  async loadSampleDataset(count: number = 315) {
    const res = await fetch(`${BASE_URL}/sample-data/load`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count }),
    });
    if (!res.ok) throw new Error('Failed to load sample dataset');
    return res.json();
  },

  async uploadCSV(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Upload failed');
    }
    return res.json();
  },

  async preprocess(options: any) {
    const res = await fetch(`${BASE_URL}/preprocess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Preprocessing failed' }));
      throw new Error(err.error || 'Preprocessing failed');
    }
    return res.json();
  },

  async trainModel(params: any = {}) {
    const res = await fetch(`${BASE_URL}/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Training failed' }));
      throw new Error(err.error || 'Training failed');
    }
    return res.json();
  },

  async getModelMetrics(): Promise<ModelMetricsData> {
    const res = await fetch(`${BASE_URL}/model-metrics`);
    if (!res.ok) throw new Error('Failed to fetch model metrics');
    return res.json();
  },

  async predictWear(input: {
    toolId?: string;
    cycle?: number;
    cuttingForce: number;
    vibration: number;
    acousticEmission: number;
    spindleSpeed: number;
    feedRate: number;
    depthOfCut: number;
  }): Promise<{
    prediction: PredictionItem;
    recommendedAction: string;
    thresholds: any;
  }> {
    const res = await fetch(`${BASE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Prediction failed' }));
      throw new Error(err.error || 'Prediction failed');
    }
    return res.json();
  },

  async getShapExplanation(input: {
    cuttingForce: number;
    vibration: number;
    acousticEmission: number;
    spindleSpeed: number;
    feedRate: number;
    depthOfCut: number;
    cycle?: number;
  }): Promise<ShapData> {
    const res = await fetch(`${BASE_URL}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'SHAP calculation failed' }));
      throw new Error(err.error || 'SHAP calculation failed');
    }
    return res.json();
  },

  async getHistory(filters?: { toolId?: string; riskLevel?: string; search?: string }): Promise<{
    count: number;
    predictions: PredictionItem[];
  }> {
    const params = new URLSearchParams();
    if (filters?.toolId) params.append('toolId', filters.toolId);
    if (filters?.riskLevel) params.append('riskLevel', filters.riskLevel);
    if (filters?.search) params.append('search', filters.search);

    const res = await fetch(`${BASE_URL}/history?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  },

  async clearHistory(): Promise<void> {
    await fetch(`${BASE_URL}/history`, { method: 'DELETE' });
  },

  async askCopilot(message: string, context?: any): Promise<string> {
    try {
      const res = await fetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Communication error' }));
        throw new Error(err.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      return data.reply || 'No response returned from Copilot service.';
    } catch (err: any) {
      console.warn('[ToolGuard API] askCopilot encountered an issue:', err?.message || err);
      // Fallback message for network interruptions
      return (
        'Unable to connect to ToolGuard Copilot service right now. ' +
        'Please check your network connection. In the meantime, XGBoost predictions and telemetry analysis remain fully active.'
      );
    }
  },

  async generateMaintenanceReport(context?: any): Promise<string> {
    try {
      const res = await fetch(`${BASE_URL}/maintenance-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Report generation failed' }));
        throw new Error(err.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      return data.report || 'Maintenance report generation completed.';
    } catch (err: any) {
      console.warn('[ToolGuard API] generateMaintenanceReport issue:', err?.message || err);
      return (
        '# Predictive Maintenance Advisory\n\n' +
        'Automated report generation is temporarily running in offline mode. ' +
        'Please refer to the active risk band guidelines on this page for standard inspection procedures.'
      );
    }
  },

  async getSettings(): Promise<AppSettings> {
    const res = await fetch(`${BASE_URL}/settings`);
    if (!res.ok) throw new Error('Failed to load settings');
    return res.json();
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    const data = await res.json();
    return data.settings;
  },
};
