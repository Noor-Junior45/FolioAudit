import { Fund } from '../types';

/**
 * Client-side API caller for FolioAudit backend routes.
 * Communicates with /api/* routes without exposing database credentials.
 */

const FUND_PALETTES = [
  { color: '#00A896', colorLight: '#E6F6F4' },
  { color: '#FF6B4A', colorLight: '#FFF0ED' },
  { color: '#0284C7', colorLight: '#E0F2FE' },
  { color: '#334155', colorLight: '#F1F5F9' },
  { color: '#8B5CF6', colorLight: '#EDE9FE' },
  { color: '#10B981', colorLight: '#D1FAE5' },
  { color: '#F59E0B', colorLight: '#FEF3C7' },
  { color: '#EC4899', colorLight: '#FCE7F3' },
];

/**
 * Fetches all mutual funds and ETFs present in the backend database.
 */
export async function fetchBackendFunds(): Promise<{
  source: string;
  funds: Fund[];
  message?: string;
  detectedEnvVar?: string;
}> {
  try {
    const res = await fetch('/api/funds');
    if (!res.ok) {
      let errorDetail = `HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson.message || errJson.error) {
          errorDetail = errJson.message || errJson.error;
        }
      } catch {
        // Body was not JSON
      }
      return {
        source: 'error',
        funds: [],
        message: `API request failed: ${errorDetail}. Ensure DATABASE_URL or POSTGRES_URL is set in Vercel Environment Variables.`,
      };
    }

    const data = await res.json();
    const mappedFunds: Fund[] = (data.funds || []).map((f: any, idx: number) => {
      const palette = FUND_PALETTES[idx % FUND_PALETTES.length];
      return {
        id: String(f.id),
        name: f.name || 'Unnamed Fund',
        shortName: f.name || 'Unnamed Fund',
        amc: f.amc || 'Unknown AMC',
        category: f.category || f.fund_type || 'Equity',
        benchmark: f.scheme_code || 'N/A',
        aumCr: 0,
        color: palette.color,
        colorLight: palette.colorLight,
        holdings: Array.isArray(f.holdings)
          ? f.holdings.map((h: any) => ({
              isin: h.isin,
              name: h.name,
              sector: h.sector || 'Other',
              weight: Number(h.weight || 0),
            }))
          : [],
      };
    });

    return {
      source: data.source,
      funds: mappedFunds,
      message: data.message,
      detectedEnvVar: data.detectedEnvVar,
    };
  } catch (err: any) {
    console.error('fetchBackendFunds error:', err);
    return {
      source: 'error',
      funds: [],
      message: err?.message || 'Failed to connect to backend service',
    };
  }
}

/**
 * Check Neon connection and environment variable status for diagnostics.
 */
export async function checkNeonStatus(): Promise<{
  configured: boolean;
  connected: boolean;
  detectedEnvVar?: string;
  database?: string;
  fundCount?: number;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/neon/status');
    if (!res.ok) {
      return {
        configured: false,
        connected: false,
        message: `Status check failed (HTTP ${res.status})`,
      };
    }
    return await res.json();
  } catch (err: any) {
    return {
      configured: false,
      connected: false,
      message: err?.message || 'Network error checking database status',
    };
  }
}

