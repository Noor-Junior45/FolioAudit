import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Fund } from '../types';

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

function cleanEnv(val?: string): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

export function getClientSupabaseConfig(): { url: string; key: string } | null {
  const meta = (typeof import.meta !== 'undefined' ? (import.meta as any).env : {}) || {};

  const url =
    cleanEnv(meta.VITE_PUBLIC_SUPABASE_URL) ||
    cleanEnv(meta.VITE_SUPABASE_URL) ||
    cleanEnv(meta.VITE_PUBLIC_SUPABASE_PROJECT_URL) ||
    cleanEnv(typeof process !== 'undefined' ? process.env?.VITE_PUBLIC_SUPABASE_URL : undefined) ||
    cleanEnv(typeof process !== 'undefined' ? process.env?.SUPABASE_URL : undefined);

  const key =
    cleanEnv(meta.VITE_PUBLIC_SUPABASE_ANON_KEY) ||
    cleanEnv(meta.VITE_PUBLIC_SUPABASE_KEY) ||
    cleanEnv(meta.VITE_SUPABASE_ANON_KEY) ||
    cleanEnv(typeof process !== 'undefined' ? process.env?.VITE_PUBLIC_SUPABASE_ANON_KEY : undefined) ||
    cleanEnv(typeof process !== 'undefined' ? process.env?.SUPABASE_ANON_KEY : undefined);

  if (!url || !key) return null;
  return { url, key };
}

export function isClientSupabaseConfigured(): boolean {
  return getClientSupabaseConfig() !== null;
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  const config = getClientSupabaseConfig();
  if (!config) return null;

  try {
    cachedClient = createClient(config.url, config.key);
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Maps raw database rows into application Fund objects with holding details
 */
export function formatFundsData(
  fundsRows: any[],
  holdingsRows?: any[],
  stocksRows?: any[]
): Fund[] {
  // If relational nested holdings were returned:
  const isNested = fundsRows.length > 0 && Array.isArray(fundsRows[0].holdings);

  if (isNested) {
    return fundsRows.map((f: any, idx: number) => {
      const palette = FUND_PALETTES[idx % FUND_PALETTES.length];
      const rawHoldings = Array.isArray(f.holdings) ? f.holdings : [];

      const holdings = rawHoldings
        .map((h: any) => {
          const stock = h.stocks || h.stock || {};
          const isin = stock.isin || h.isin || '';
          const name = stock.name || h.stock_name || h.name || 'Unknown Stock';
          const sector = stock.sector || h.sector || 'Other';
          const weight = Number(h.weight_pct || h.weight || 0);
          return { isin, name, sector, weight };
        })
        .filter((h: any) => h.weight > 0 || h.name !== 'Unknown Stock')
        .sort((a: any, b: any) => b.weight - a.weight);

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
        holdings,
      };
    });
  }

  // Flat table mapping:
  const stockMap = new Map<any, any>();
  if (stocksRows) {
    for (const s of stocksRows) {
      stockMap.set(String(s.id), s);
    }
  }

  const holdingsByFund = new Map<string, any[]>();
  if (holdingsRows) {
    for (const h of holdingsRows) {
      const fId = String(h.fund_id);
      if (!holdingsByFund.has(fId)) {
        holdingsByFund.set(fId, []);
      }
      const stock = stockMap.get(String(h.stock_id)) || {};
      holdingsByFund.get(fId)!.push({
        isin: stock.isin || h.isin || '',
        name: stock.name || h.stock_name || 'Unknown Stock',
        sector: stock.sector || h.sector || 'Other',
        weight: Number(h.weight_pct || h.weight || 0),
      });
    }
  }

  return fundsRows.map((f: any, idx: number) => {
    const palette = FUND_PALETTES[idx % FUND_PALETTES.length];
    const list = (holdingsByFund.get(String(f.id)) || []).sort((a, b) => b.weight - a.weight);

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
      holdings: list,
    };
  });
}

/**
 * Fetches all funds and holdings directly from Supabase
 */
export async function fetchFundsDirectFromSupabase(): Promise<{
  success: boolean;
  funds: Fund[];
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      funds: [],
      error: 'Supabase client is not configured. Missing VITE_PUBLIC_SUPABASE_URL or VITE_PUBLIC_SUPABASE_ANON_KEY.',
    };
  }

  try {
    // Attempt 1: Relational nested query
    const { data: nestedData, error: nestedError } = await client
      .from('funds')
      .select(`
        id,
        scheme_code,
        name,
        amc,
        fund_type,
        category,
        as_of_date,
        holdings (
          weight_pct,
          stocks (
            isin,
            name,
            sector
          )
        )
      `)
      .order('name');

    if (!nestedError && nestedData && nestedData.length > 0) {
      const funds = formatFundsData(nestedData);
      return { success: true, funds };
    }

    // Attempt 2: If foreign key relationships are not exposed in schema cache, fetch tables in parallel
    const [fundsRes, holdingsRes, stocksRes] = await Promise.all([
      client.from('funds').select('*').order('name'),
      client.from('holdings').select('*'),
      client.from('stocks').select('*'),
    ]);

    if (fundsRes.error) {
      throw fundsRes.error;
    }

    const funds = formatFundsData(
      fundsRes.data || [],
      holdingsRes.data || [],
      stocksRes.data || []
    );

    return { success: true, funds };
  } catch (err: any) {
    console.error('fetchFundsDirectFromSupabase error:', err);
    return {
      success: false,
      funds: [],
      error: err?.message || 'Failed to query Supabase tables',
    };
  }
}
