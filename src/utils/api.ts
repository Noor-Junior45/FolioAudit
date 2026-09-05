import { Fund } from '../types';

/**
 * Client-side API caller for FolioAudit backend routes.
 * Securely communicates with /api/* routes without exposing any database credentials.
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
}> {
  try {
    const res = await fetch('/api/funds');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
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
    return { source: data.source, funds: mappedFunds, message: data.message };
  } catch (err: any) {
    console.error('fetchBackendFunds error:', err);
    return { source: 'error', funds: [], message: err?.message };
  }
}

export interface FundSearchResult {
  id: string;
  scheme_code: string;
  name: string;
  amc: string;
  fund_type: string;
  category: string;
  as_of_date: string;
  holdingsCount?: number;
}

export interface ComparisonStockRow {
  isin: string;
  name: string;
  sector: string;
  weights: Record<string, number>;
  combinedWeight: number;
}

export interface ComparisonResponse {
  source: 'neon' | 'fallback';
  funds: Array<{
    id: string;
    name: string;
    amc: string;
    category: string;
    scheme_code?: string;
  }>;
  stocks: ComparisonStockRow[];
  totalUniqueStocks: number;
}

export interface OverlapPairResponse {
  fundA: { id: string; name: string };
  fundB: { id: string; name: string };
  overlapPercentage: number;
  commonStocksCount: number;
}

export interface TopHoldingItem {
  isin: string;
  stock_name: string;
  sector: string;
  combined_weight: number;
  held_by_fund_count: number;
}

/**
 * Search funds via GET /api/funds/search?q=...
 */
export async function searchFundsApi(query: string): Promise<FundSearchResult[]> {
  try {
    const res = await fetch(`/api/funds/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.funds || [];
  } catch (err) {
    console.warn('searchFundsApi error:', err);
    return [];
  }
}

/**
 * Compare holdings via GET /api/compare?ids=1,2,3
 */
export async function compareFundsApi(ids: string[]): Promise<ComparisonResponse | null> {
  if (!ids || ids.length === 0) return null;
  try {
    const res = await fetch(`/api/compare?ids=${encodeURIComponent(ids.join(','))}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('compareFundsApi error:', err);
    return null;
  }
}

/**
 * Pairwise overlap via GET /api/overlap?ids=1,2,3
 */
export async function getOverlapApi(ids: string[]): Promise<OverlapPairResponse[]> {
  if (!ids || ids.length < 2) return [];
  try {
    const res = await fetch(`/api/overlap?ids=${encodeURIComponent(ids.join(','))}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.pairs || [];
  } catch (err) {
    console.warn('getOverlapApi error:', err);
    return [];
  }
}

/**
 * Top holdings via GET /api/top-holdings?ids=1,2,3
 */
export async function getTopHoldingsApi(ids: string[]): Promise<TopHoldingItem[]> {
  if (!ids || ids.length === 0) return [];
  try {
    const res = await fetch(`/api/top-holdings?ids=${encodeURIComponent(ids.join(','))}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.topHoldings || [];
  } catch (err) {
    console.warn('getTopHoldingsApi error:', err);
    return [];
  }
}

/**
 * Check Neon connection status
 */
export async function checkNeonStatus(): Promise<{
  configured: boolean;
  connected: boolean;
  database?: string;
  message?: string;
}> {
  try {
    const res = await fetch('/api/neon/status');
    if (!res.ok) return { configured: false, connected: false };
    return await res.json();
  } catch {
    return { configured: false, connected: false };
  }
}
