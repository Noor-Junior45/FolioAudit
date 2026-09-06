import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

function cleanEnv(val?: string): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

export function getSupabaseConfig(): { url: string; key: string; source: string } | null {
  const url =
    cleanEnv(process.env.VITE_PUBLIC_SUPABASE_URL) ||
    cleanEnv(process.env.VITE_SUPABASE_URL) ||
    cleanEnv(process.env.SUPABASE_URL) ||
    cleanEnv(process.env.VITE_PUBLIC_SUPABASE_PROJECT_URL);

  const key =
    cleanEnv(process.env.VITE_PUBLIC_SUPABASE_ANON_KEY) ||
    cleanEnv(process.env.VITE_PUBLIC_SUPABASE_KEY) ||
    cleanEnv(process.env.VITE_SUPABASE_ANON_KEY) ||
    cleanEnv(process.env.SUPABASE_ANON_KEY) ||
    cleanEnv(process.env.SUPABASE_KEY) ||
    cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!url || !key) return null;

  let source = 'VITE_PUBLIC_SUPABASE_URL';
  if (cleanEnv(process.env.VITE_PUBLIC_SUPABASE_URL)) source = 'VITE_PUBLIC_SUPABASE_URL';
  else if (cleanEnv(process.env.SUPABASE_URL)) source = 'SUPABASE_URL';

  return { url, key, source };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

let serverClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (serverClient) return serverClient;
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error(
      'Supabase environment variables missing. Please set VITE_PUBLIC_SUPABASE_URL and VITE_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  serverClient = createClient(config.url, config.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return serverClient;
}

export async function testSupabaseConnection(): Promise<{
  ok: boolean;
  url?: string;
  source?: string;
  fundCount?: number;
  stockCount?: number;
  error?: string;
}> {
  const config = getSupabaseConfig();
  if (!config) {
    return {
      ok: false,
      error: 'VITE_PUBLIC_SUPABASE_URL or VITE_PUBLIC_SUPABASE_ANON_KEY is not set.',
    };
  }

  try {
    const client = getSupabaseClient();
    const { count: fundCount, error: fundErr } = await client
      .from('funds')
      .select('*', { count: 'exact', head: true });

    if (fundErr) {
      return {
        ok: false,
        url: config.url,
        source: config.source,
        error: fundErr.message,
      };
    }

    const { count: stockCount } = await client
      .from('stocks')
      .select('*', { count: 'exact', head: true });

    return {
      ok: true,
      url: config.url,
      source: config.source,
      fundCount: fundCount ?? 0,
      stockCount: stockCount ?? 0,
    };
  } catch (err: any) {
    return {
      ok: false,
      url: config.url,
      source: config.source,
      error: err?.message || 'Failed to connect to Supabase',
    };
  }
}

export async function fetchFundsFromSupabase(): Promise<{
  success: boolean;
  funds: any[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      funds: [],
      error: 'Supabase is not configured. Set VITE_PUBLIC_SUPABASE_URL and VITE_PUBLIC_SUPABASE_ANON_KEY.',
    };
  }

  try {
    const client = getSupabaseClient();

    // 1. Try relational query
    const { data: nested, error: nestedErr } = await client
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

    if (!nestedErr && nested && nested.length > 0) {
      const formatted = nested.map((f: any) => ({
        ...f,
        holdings: (Array.isArray(f.holdings) ? f.holdings : []).map((h: any) => ({
          isin: h.stocks?.isin || h.isin || '',
          name: h.stocks?.name || h.name || 'Unknown Stock',
          sector: h.stocks?.sector || h.sector || 'Other',
          weight: Number(h.weight_pct || h.weight || 0),
        })),
      }));
      return { success: true, funds: formatted };
    }

    // 2. Parallel flat fetch fallback
    const [fundsRes, holdingsRes, stocksRes] = await Promise.all([
      client.from('funds').select('*').order('name'),
      client.from('holdings').select('*'),
      client.from('stocks').select('*'),
    ]);

    if (fundsRes.error) {
      throw fundsRes.error;
    }

    const stockMap = new Map<any, any>();
    for (const s of stocksRes.data || []) {
      stockMap.set(String(s.id), s);
    }

    const holdingsMap = new Map<string, any[]>();
    for (const h of holdingsRes.data || []) {
      const fId = String(h.fund_id);
      if (!holdingsMap.has(fId)) holdingsMap.set(fId, []);
      const stock = stockMap.get(String(h.stock_id)) || {};
      holdingsMap.get(fId)!.push({
        isin: stock.isin || h.isin || '',
        name: stock.name || h.stock_name || 'Unknown Stock',
        sector: stock.sector || h.sector || 'Other',
        weight: Number(h.weight_pct || h.weight || 0),
      });
    }

    const mapped = (fundsRes.data || []).map((f: any) => ({
      ...f,
      holdings: (holdingsMap.get(String(f.id)) || []).sort(
        (a, b) => b.weight - a.weight
      ),
    }));

    return { success: true, funds: mapped };
  } catch (err: any) {
    console.error('fetchFundsFromSupabase error:', err);
    return {
      success: false,
      funds: [],
      error: err?.message || 'Database query error',
    };
  }
}
