/**
 * Dataset Service
 * Provides realistic PHM 2010 Milling sensor data generation and CSV parsing utilities.
 */

export interface CNCSensorRecord {
  tool_id: string;
  cycle: number;
  cutting_force: number;
  vibration: number;
  acoustic_emission: number;
  spindle_speed: number;
  feed_rate: number;
  depth_of_cut: number;
  tool_wear: number;
  [key: string]: any;
}

export class DatasetService {
  /**
   * Generates realistic PHM 2010 CNC Tool Wear dataset.
   * Tool wear progresses non-linearly:
   * Phase 1: Break-in / Initial rapid wear (0 - 0.05 mm)
   * Phase 2: Steady-state / Linear wear (0.05 - 0.22 mm)
   * Phase 3: Accelerated / Tertiary catastrophic failure (> 0.25 mm)
   * Cutting force, vibration RMS, and acoustic emission rise synchronously with flank wear (Taylor's tool life principle).
   */
  public static generatePHM2010Sample(numCycles: number = 315): CNCSensorRecord[] {
    const data: CNCSensorRecord[] = [];
    const tools = ['Tool_T01', 'Tool_T02', 'Tool_T03'];

    for (const toolId of tools) {
      let cumulativeWear = 0.02; // Initial break-in wear (mm)
      const maxCyclesForTool = toolId === 'Tool_T01' ? 105 : toolId === 'Tool_T02' ? 105 : 105;

      for (let cycle = 1; cycle <= maxCyclesForTool; cycle++) {
        // Wear growth rate changes across phases
        let deltaWear: number;
        if (cumulativeWear < 0.08) {
          deltaWear = 0.0012 + Math.random() * 0.0006;
        } else if (cumulativeWear < 0.22) {
          deltaWear = 0.0018 + Math.random() * 0.0008;
        } else {
          // Accelerated tertiary wear
          deltaWear = 0.0035 + Math.random() * 0.0018;
        }
        cumulativeWear += deltaWear;

        // Process parameters with small realistic variations
        const spindleSpeed = 10400 + Math.sin(cycle * 0.1) * 120 + (Math.random() - 0.5) * 60; // RPM
        const feedRate = 1555 + (Math.random() - 0.5) * 40; // mm/min
        const depthOfCut = 0.75 + (Math.random() - 0.5) * 0.05; // mm

        // Sensor physics: Force and Vibration scale strongly with tool wear (friction & clearance face degradation)
        const baseForce = 120 + cumulativeWear * 580; // N
        const cuttingForce = Number((baseForce + (Math.random() - 0.5) * 25).toFixed(2));

        const baseVib = 0.15 + cumulativeWear * 1.85; // g (RMS)
        const vibration = Number((baseVib + (Math.random() - 0.5) * 0.08).toFixed(3));

        const baseAE = 0.045 + cumulativeWear * 0.32; // V (RMS)
        const acousticEmission = Number((baseAE + (Math.random() - 0.5) * 0.02).toFixed(4));

        data.push({
          tool_id: toolId,
          cycle,
          cutting_force: cuttingForce,
          vibration: Math.max(0.05, vibration),
          acoustic_emission: Math.max(0.01, acousticEmission),
          spindle_speed: Number(spindleSpeed.toFixed(0)),
          feed_rate: Number(feedRate.toFixed(1)),
          depth_of_cut: Number(depthOfCut.toFixed(3)),
          tool_wear: Number(cumulativeWear.toFixed(4)),
        });
      }
    }

    return data;
  }

  /**
   * Parse CSV string into array of object records
   */
  public static parseCSV(csvText: string): { headers: string[]; rows: Record<string, any>[] } {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };

    // Delimiter detection (comma, semicolon, tab)
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

    const headers = firstLine.split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const rows: Record<string, any>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(delimiter);
      if (parts.length !== headers.length) continue;

      const record: Record<string, any> = {};
      for (let j = 0; j < headers.length; j++) {
        const val = parts[j].trim().replace(/^["']|["']$/g, '');
        const num = Number(val);
        record[headers[j]] = !isNaN(num) && val !== '' ? num : val;
      }
      rows.push(record);
    }

    return { headers, rows };
  }

  /**
   * Automatically detect standard CNC column mappings
   */
  public static detectColumnMapping(headers: string[]): {
    force?: string;
    vibration?: string;
    acoustic?: string;
    speed?: string;
    feed?: string;
    depth?: string;
    wear?: string;
    toolId?: string;
    cycle?: string;
  } {
    const mapping: any = {};
    const lower = headers.map((h) => h.toLowerCase());

    const findMatch = (patterns: string[]): string | undefined => {
      for (let i = 0; i < lower.length; i++) {
        const h = lower[i];
        if (patterns.some((p) => h.includes(p))) {
          return headers[i];
        }
      }
      return undefined;
    };

    mapping.wear = findMatch(['wear', 'tool_wear', 'flute_wear', 'vb', 'flank_wear']);
    mapping.force = findMatch(['force', 'cutting_force', 'fz', 'fx', 'fy', 'smcac', 'smcdc']);
    mapping.vibration = findMatch(['vib', 'vibration', 'vib_spindle', 'vib_table', 'accel']);
    mapping.acoustic = findMatch(['acoustic', 'ae', 'ae_rms', 'ae_count', 'acoustic_emission']);
    mapping.speed = findMatch(['speed', 'spindle', 'rpm']);
    mapping.feed = findMatch(['feed', 'feed_rate', 'feedrate']);
    mapping.depth = findMatch(['depth', 'doc', 'depth_of_cut']);
    mapping.toolId = findMatch(['tool', 'tool_id', 'cutter', 'flute']);
    mapping.cycle = findMatch(['cycle', 'cut', 'sample', 'time', 'step']);

    return mapping;
  }
}
