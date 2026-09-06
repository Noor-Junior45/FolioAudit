import { Fund } from '../types';
import {
  isClientSupabaseConfigured,
  fetchFundsDirectFromSupabase,
} from './supabase';

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
 * Fetches all mutual funds and ETFs present in the Supabase database.
 * Attempts direct Supabase browser fetch first (via VITE_PUBLIC_ variables),
 * falling back to the backend proxy route (/api/funds) if needed.
 */
export async function fetchBackendFunds(): Promise<{
  source: string;
  funds: Fund[];
  message?: string;
  detectedEnvVar?: string;
}> {
  // Strategy 1: Direct Supabase client query from browser
  if (isClientSupabaseConfigured()) {
    try {
      const direct = await fetchFundsDirectFromSupabase();
      if (direct.success && direct.funds.length > 0) {
        return {
          source: 'supabase',
          funds: direct.funds,
          message: 'Loaded successfully from Supabase',
        };
      }
      if (direct.error) {
        console.warn('Direct Supabase query failed, attempting /api/funds fallback:', direct.error);
      }
    } catch (directErr) {
      console.warn('Direct Supabase fetch error, attempting fallback:', directErr);
    }
  }

  // Strategy 2: Serverless/Express proxy route (/api/funds)
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
        message: `API request failed: ${errorDetail}. Ensure VITE_PUBLIC_SUPABASE_URL and VITE_PUBLIC_SUPABASE_ANON_KEY are set.`,
      };
    }

    const data = await res.json();
    if (data.source === 'unconfigured') {
      return {
        source: 'unconfigured',
        funds: [],
        message: data.message,
      };
    }

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
      source: data.source || 'supabase',
      funds: mappedFunds,
      message: data.message,
      detectedEnvVar: data.detectedEnvVar,
    };
  } catch (err: any) {
    console.error('fetchBackendFunds error:', err);
    return {
      source: 'error',
      funds: [],
      message: err?.message || 'Failed to connect to backend database',
    };
  }
}

/**
 * Check Supabase connection and environment variable status for diagnostics.
 */
export async function checkSupabaseStatus(): Promise<{
  configured: boolean;
  connected: boolean;
  url?: string;
  fundCount?: number;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/supabase/status');
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
      message: err?.message || 'Network error checking Supabase status',
    };
  }
}


