/**
 * Client-side API caller for FolioAudit backend routes.
 * Securely communicates with /api/* routes without exposing any database credentials.
 */

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
