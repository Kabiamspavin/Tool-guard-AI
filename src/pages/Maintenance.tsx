import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  RotateCw,
  Copy,
  Printer,
  ShieldAlert,
  Download,
  FileDown,
  ChevronDown,
  Check,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardData } from '../types';

interface MaintenanceProps {
  data: DashboardData | null;
}

export const Maintenance: React.FC<MaintenanceProps> = ({ data }) => {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const latest = data?.latestPrediction || {
    wear: 0.174,
    risk: 'MEDIUM' as const,
    health: 'Moderate Wear',
    rul: '35 cycles',
    isDemo: true,
    timestamp: new Date().toISOString(),
  };

  const toolId = data?.currentTool || 'Tool_T01';

  const generateReport = async (): Promise<string> => {
    setLoading(true);
    try {
      const rep = await api.generateMaintenanceReport({
        toolId,
        predictedWear: latest.wear,
        riskLevel: latest.risk,
        toolHealth: latest.health,
        sensorValues: {
          cuttingForce: 195.5,
          vibration: 0.245,
          acousticEmission: 0.068,
        },
      });
      setReport(rep);
      return rep;
    } catch (err: any) {
      console.error(err);
      return '';
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (report) {
      navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(filename);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handleDownload = async (format: 'md' | 'html' | 'txt' | 'json') => {
    setShowDownloadMenu(false);
    let activeReport = report;
    if (!activeReport) {
      activeReport = await generateReport();
      if (!activeReport) return;
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const baseFilename = `ToolGuard_Maintenance_Report_${toolId}_${timestamp}`;

    if (format === 'md') {
      const mdContent = [
        `# ToolGuard AI — CNC Predictive Maintenance Report`,
        `**Generated At:** ${new Date().toISOString()}`,
        `**Tool Identifier:** ${toolId}`,
        `**Predicted Flank Wear ($V_B$):** ${Number(latest.wear).toFixed(3)} mm`,
        `**Risk Level:** ${latest.risk} (${latest.health})`,
        `**Remaining Useful Life:** ${latest.rul}`,
        `\n---\n`,
        activeReport,
      ].join('\n');
      triggerDownload(mdContent, `${baseFilename}.md`, 'text/markdown;charset=utf-8');
    } else if (format === 'txt') {
      const txtContent = [
        `================================================================================`,
        ` TOOLGUARD AI - CNC PREDICTIVE MAINTENANCE REPORT`,
        `================================================================================`,
        ` Timestamp:             ${new Date().toUTCString()}`,
        ` Active Tool:           ${toolId}`,
        ` Predicted Wear (VB):   ${Number(latest.wear).toFixed(3)} mm`,
        ` Severity Risk Band:    ${latest.risk} (${latest.health})`,
        ` Estimated RUL:         ${latest.rul}`,
        ` ISO 8688 Limit:        0.300 mm`,
        `================================================================================`,
        ``,
        activeReport.replace(/[#*`]/g, ''),
        ``,
        `================================================================================`,
        ` Quality / Maintenance Approval Sign-Off:`,
        ` Lead Machinist: _______________________    Date: ______________`,
        `================================================================================`,
      ].join('\n');
      triggerDownload(txtContent, `${baseFilename}.txt`, 'text/plain;charset=utf-8');
    } else if (format === 'json') {
      const jsonContent = JSON.stringify(
        {
          system: 'ToolGuard AI',
          reportType: 'Predictive Tool Maintenance & ISO Health Assessment',
          generatedAt: new Date().toISOString(),
          machineId: 'CNC-DMG-Mori-01',
          toolId,
          prediction: {
            predictedFlankWearMm: Number(latest.wear),
            isoThresholdMm: 0.3,
            riskLevel: latest.risk,
            toolHealth: latest.health,
            remainingUsefulLife: latest.rul,
          },
          telemetry: {
            cuttingForceN: 195.5,
            vibrationG: 0.245,
            acousticEmissionV: 0.068,
          },
          fullAdvisoryMarkdown: activeReport,
        },
        null,
        2
      );
      triggerDownload(jsonContent, `${baseFilename}.json`, 'application/json;charset=utf-8');
    } else if (format === 'html') {
      const riskColorMap: Record<string, { bg: string; text: string; border: string }> = {
        LOW: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
        MEDIUM: { bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
        HIGH: { bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' },
        CRITICAL: { bg: '#fff1f2', text: '#9f1239', border: '#fecdd3' },
      };
      const colors = riskColorMap[latest.risk] || riskColorMap.MEDIUM;

      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ToolGuard Maintenance Report - ${toolId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 40px 20px; line-height: 1.6; }
    .container { max-width: 900px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #0f172a; color: #ffffff; padding: 32px; border-bottom: 4px solid #06b6d4; }
    .header h1 { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { color: #94a3b8; font-size: 13px; margin-top: 6px; }
    .meta-row { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid #334155; font-size: 12px; color: #cbd5e1; font-family: monospace; }
    .content { padding: 32px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
    .kpi-card { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }
    .kpi-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }
    .kpi-value { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px; font-family: monospace; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: 800; font-size: 12px; text-transform: uppercase; background: ${colors.bg}; color: ${colors.text}; border: 1px solid ${colors.border}; }
    .report-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; white-space: pre-wrap; font-size: 13px; line-height: 1.7; color: #334155; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0; }
    .sig-line { border-bottom: 1px solid #94a3b8; height: 40px; margin-bottom: 8px; }
    .sig-label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8; }
    @media print { body { background: #fff; padding: 0; } .container { box-shadow: none; border: none; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ToolGuard AI — Predictive Tool Maintenance Advisory</h1>
      <p>Intelligent Condition-Based Maintenance & ISO Flank Wear Verification</p>
      <div class="meta-row">
        <span>MACHINE: CNC-DMG-Mori-01</span>
        <span>TOOL ID: ${toolId}</span>
        <span>DATE: ${new Date().toUTCString()}</span>
      </div>
    </div>
    <div class="content">
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-title">Predicted Wear (VB)</div>
          <div class="kpi-value">${Number(latest.wear).toFixed(3)} mm</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Risk Level</div>
          <div class="kpi-value"><span class="badge">${latest.risk}</span></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Tool Health</div>
          <div class="kpi-value" style="font-size: 16px;">${latest.health}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Remaining Life</div>
          <div class="kpi-value">${latest.rul}</div>
        </div>
      </div>

      <h3 style="font-size: 14px; text-transform: uppercase; color: #0f172a; margin-bottom: 12px; font-weight: 700;">Executive Engineering Advisory</h3>
      <div class="report-box">${activeReport.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>

      <div class="signatures">
        <div>
          <div class="sig-line"></div>
          <div class="sig-label">Certified CNC Machinist / Operator</div>
        </div>
        <div>
          <div class="sig-line"></div>
          <div class="sig-label">Maintenance & Reliability Lead Engineer</div>
        </div>
      </div>
    </div>
    <div class="footer">
      Generated automatically by ToolGuard AI Engineering Decision-Support System | ISO 8688-2 Standard Compliance
    </div>
  </div>
</body>
</html>`;
      triggerDownload(htmlContent, `${baseFilename}.html`, 'text/html;charset=utf-8');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {downloadSuccess && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-200 text-xs shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Downloaded <strong>{downloadSuccess}</strong> successfully</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center space-x-3">
            <span>Predictive Maintenance & ISO Tool Health</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Condition-based maintenance protocols, degradation boundary alerts, and AI-authored inspection reports.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0 relative">
          {/* Generate Button */}
          <button
            onClick={() => generateReport()}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            <span>{report ? 'Regenerate Report' : 'Generate AI Report'}</span>
          </button>

          {/* Download Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              title="Download Maintenance Report"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Download Report</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showDownloadMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-30 font-mono text-xs space-y-1 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] uppercase text-slate-400 border-b border-slate-800">
                  Select Format
                </div>
                <button
                  onClick={() => handleDownload('html')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-cyan-500/10 hover:text-cyan-400 text-slate-200 text-left transition-colors cursor-pointer"
                >
                  <span className="font-sans font-medium">Printable HTML (.html)</span>
                  <span className="text-[10px] text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800">
                    PDF/Print
                  </span>
                </button>
                <button
                  onClick={() => handleDownload('md')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-cyan-500/10 hover:text-cyan-400 text-slate-200 text-left transition-colors cursor-pointer"
                >
                  <span className="font-sans font-medium">Markdown (.md)</span>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">Doc</span>
                </button>
                <button
                  onClick={() => handleDownload('txt')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-cyan-500/10 hover:text-cyan-400 text-slate-200 text-left transition-colors cursor-pointer"
                >
                  <span className="font-sans font-medium">Shop-Floor Text (.txt)</span>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">Plain</span>
                </button>
                <button
                  onClick={() => handleDownload('json')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-cyan-500/10 hover:text-cyan-400 text-slate-200 text-left transition-colors cursor-pointer"
                >
                  <span className="font-sans font-medium">JSON Telemetry (.json)</span>
                  <span className="text-[10px] text-purple-400 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-800">
                    Data
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Health Status Matrix Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">Current Health State</span>
          <div className="text-xl font-bold text-white">{latest.health}</div>
          <span className="text-xs text-slate-400">Tool: {toolId}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">Predicted Wear ($V_B$)</span>
          <div className="text-xl font-bold font-mono text-cyan-400">{Number(latest.wear).toFixed(3)} mm</div>
          <span className="text-xs text-slate-400">ISO Flank Wear Criterion</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">Severity Risk Band</span>
          <div className="text-xl font-bold font-mono text-amber-400">{latest.risk}</div>
          <span className="text-xs text-slate-400">Condition-based monitoring</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">Estimated Useful Life</span>
          <div className="text-xl font-bold font-mono text-purple-400">{latest.rul}</div>
          <span className="text-xs text-slate-400">Until 0.300 mm threshold</span>
        </div>
      </div>

      {/* Operational Protocol Guidance */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <span>ISO Standard Degradation Protocols & Recommended Actions</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          {/* Low */}
          <div
            className={`p-4 rounded-xl border ${
              latest.risk === 'LOW'
                ? 'bg-emerald-500/10 border-emerald-500/40'
                : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-emerald-400">1. LOW RISK (&lt; 0.10 mm)</span>
              {latest.risk === 'LOW' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </div>
            <p className="text-slate-300 font-sans leading-relaxed">
              Normal cutting state. Maintain continuous high-frequency telemetry acquisition. No intervention needed.
            </p>
          </div>

          {/* Medium */}
          <div
            className={`p-4 rounded-xl border ${
              latest.risk === 'MEDIUM'
                ? 'bg-amber-500/10 border-amber-500/40'
                : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-amber-400">2. MEDIUM RISK (0.10 - 0.20 mm)</span>
              {latest.risk === 'MEDIUM' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
            </div>
            <p className="text-slate-300 font-sans leading-relaxed">
              Steady-state wear. Increase telemetry sampling and schedule optical tool inspection at next routine part unload.
            </p>
          </div>

          {/* High */}
          <div
            className={`p-4 rounded-xl border ${
              latest.risk === 'HIGH'
                ? 'bg-orange-500/10 border-orange-500/40'
                : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-orange-400">3. HIGH RISK (0.20 - 0.30 mm)</span>
              {latest.risk === 'HIGH' && <CheckCircle2 className="w-4 h-4 text-orange-400" />}
            </div>
            <p className="text-slate-300 font-sans leading-relaxed">
              Accelerated wear region. Schedule tool index/replacement prior to beginning precision finishing cuts to prevent chatter marks.
            </p>
          </div>

          {/* Critical */}
          <div
            className={`p-4 rounded-xl border ${
              latest.risk === 'CRITICAL'
                ? 'bg-rose-500/10 border-rose-500/40'
                : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-rose-400">4. CRITICAL RISK (&gt; 0.30 mm)</span>
              {latest.risk === 'CRITICAL' && <CheckCircle2 className="w-4 h-4 text-rose-400" />}
            </div>
            <p className="text-slate-300 font-sans leading-relaxed">
              Imminent failure or catastrophic chipping risk. Halt machining cycle at next safe retract position according to plant safety SOPs.
            </p>
          </div>
        </div>
      </div>

      {/* Generated Report Viewer */}
      {report && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-cyan-500/30 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-white font-bold">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span>Official CNC Tool Condition & Maintenance Advisory</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Format Download Buttons */}
              <button
                onClick={() => handleDownload('html')}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono transition-colors cursor-pointer"
                title="Download Printable HTML / PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>HTML</span>
              </button>

              <button
                onClick={() => handleDownload('md')}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono transition-colors cursor-pointer"
                title="Download Markdown Report"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Markdown</span>
              </button>

              <button
                onClick={() => handleDownload('txt')}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono transition-colors cursor-pointer"
                title="Download Text Document"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Text</span>
              </button>

              <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />

              <button
                onClick={handleCopy}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="Copy Markdown"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                onClick={() => window.print()}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="Print Report"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="prose prose-invert max-w-none text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans bg-slate-950 p-6 rounded-xl border border-slate-800">
            {report}
          </div>
        </div>
      )}
    </div>
  );
};
