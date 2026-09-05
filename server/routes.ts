import { Router } from 'express';
import { getNeonSql, isNeonConfigured } from './db.js';

export const apiRouter = Router();

/**
 * Ensures Neon tables exist according to the specified schema:
 * - funds(id, scheme_code, name, amc, fund_type, category, as_of_date)
 * - stocks(id, isin, name, sector)
 * - holdings(id, fund_id, stock_id, quantity, market_value_lacs, weight_pct)
 */
let isInitialized = false;
export async function ensureNeonSchema() {
  if (!isNeonConfigured() || isInitialized) return;
  try {
    const sql = getNeonSql();

    await sql`
      CREATE TABLE IF NOT EXISTS funds (
        id VARCHAR(100) PRIMARY KEY,
        scheme_code VARCHAR(50),
        name TEXT NOT NULL,
        amc VARCHAR(255),
        fund_type VARCHAR(100),
        category VARCHAR(100),
        as_of_date DATE DEFAULT CURRENT_DATE
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS stocks (
        id SERIAL PRIMARY KEY,
        isin VARCHAR(50) UNIQUE NOT NULL,
        name TEXT NOT NULL,
        sector VARCHAR(100)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS holdings (
        id SERIAL PRIMARY KEY,
        fund_id VARCHAR(100) REFERENCES funds(id) ON DELETE CASCADE,
        stock_id INTEGER REFERENCES stocks(id) ON DELETE CASCADE,
        quantity NUMERIC DEFAULT 0,
        market_value_lacs NUMERIC DEFAULT 0,
        weight_pct NUMERIC(6, 2) NOT NULL,
        CONSTRAINT unique_fund_stock UNIQUE(fund_id, stock_id)
      );
    `;

    isInitialized = true;
  } catch (err) {
    console.error('Failed to verify or initialize Neon tables:', err);
  }
}

/**
 * GET /api/funds
 * Returns all mutual funds and ETFs present in the backend database with their holdings.
 */
apiRouter.get('/funds', async (req, res) => {
  if (!isNeonConfigured()) {
    return res.json({
      source: 'unconfigured',
      funds: [],
      message: 'DATABASE_URL is not configured. Please add your Neon connection string in Settings.'
    });
  }

  try {
    await ensureNeonSchema();
    const sql = getNeonSql();

    const fundsWithHoldings = await sql`
      SELECT 
        f.id,
        f.scheme_code,
        f.name,
        f.amc,
        f.fund_type,
        f.category,
        f.as_of_date,
        COALESCE(
          json_agg(
            json_build_object(
              'isin', s.isin,
              'name', s.name,
              'sector', COALESCE(s.sector, 'Other'),
              'weight', h.weight_pct::float
            ) ORDER BY h.weight_pct DESC
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) AS holdings
      FROM funds f
      LEFT JOIN holdings h ON f.id = h.fund_id
      LEFT JOIN stocks s ON h.stock_id = s.id
      GROUP BY f.id, f.scheme_code, f.name, f.amc, f.fund_type, f.category, f.as_of_date
      ORDER BY f.name ASC;
    `;

    return res.json({
      source: 'neon',
      funds: fundsWithHoldings,
      count: fundsWithHoldings.length
    });
  } catch (error: any) {
    console.error('Error fetching funds from Neon:', error);
    return res.status(500).json({
      source: 'error',
      funds: [],
      error: error?.message || 'Database query error'
    });
  }
});

/**
 * GET /api/funds/search?q=...
 * Returns matching funds from the backend database.
 */
apiRouter.get('/funds/search', async (req, res) => {
  const query = (req.query.q as string || '').trim();

  if (!isNeonConfigured()) {
    return res.json({
      source: 'unconfigured',
      funds: [],
      message: 'DATABASE_URL is not configured.'
    });
  }

  try {
    await ensureNeonSchema();
    const sql = getNeonSql();

    let funds;
    if (query) {
      const wildcard = `%${query}%`;
      funds = await sql`
        SELECT id, scheme_code, name, amc, fund_type, category, as_of_date
        FROM funds
        WHERE name ILIKE ${wildcard}
           OR amc ILIKE ${wildcard}
           OR category ILIKE ${wildcard}
        ORDER BY name ASC
        LIMIT 50;
      `;
    } else {
      funds = await sql`
        SELECT id, scheme_code, name, amc, fund_type, category, as_of_date
        FROM funds
        ORDER BY name ASC
        LIMIT 50;
      `;
    }

    return res.json({ source: 'neon', funds });
  } catch (error: any) {
    console.error('Error searching funds in Neon:', error);
    return res.status(500).json({ source: 'error', funds: [], error: error?.message });
  }
});

/**
 * GET /api/compare?ids=1,2,3
 * Returns holdings pivoted by fund, for the comparison table.
 */
apiRouter.get('/compare', async (req, res) => {
  const idsParam = req.query.ids as string || '';
  const fundIds = idsParam.split(',').map((s) => s.trim()).filter(Boolean);

  if (fundIds.length === 0) {
    return res.status(400).json({ error: 'ids query parameter is required' });
  }

  if (!isNeonConfigured()) {
    return res.json({
      source: 'unconfigured',
      funds: [],
      stocks: [],
      totalUniqueStocks: 0,
      message: 'DATABASE_URL is not configured.'
    });
  }

  try {
    await ensureNeonSchema();
    const sql = getNeonSql();

    const funds = await sql`
      SELECT id, scheme_code, name, amc, fund_type, category, as_of_date
      FROM funds
      WHERE id = ANY(${fundIds});
    `;

    const rows = await sql`
      SELECT 
        s.isin,
        s.name AS stock_name,
        s.sector,
        h.fund_id,
        h.weight_pct::float AS weight_pct,
        h.market_value_lacs::float AS market_value_lacs
      FROM holdings h
      JOIN stocks s ON h.stock_id = s.id
      WHERE h.fund_id = ANY(${fundIds});
    `;

    const stockMap = new Map<string, {
      isin: string;
      name: string;
      sector: string;
      weights: Record<string, number>;
      combinedWeight: number;
    }>();

    for (const row of rows) {
      if (!stockMap.has(row.isin)) {
        stockMap.set(row.isin, {
          isin: row.isin,
          name: row.stock_name,
          sector: row.sector || 'Unclassified',
          weights: {},
          combinedWeight: 0,
        });
      }
      const item = stockMap.get(row.isin)!;
      item.weights[row.fund_id] = row.weight_pct;
      item.combinedWeight += row.weight_pct;
    }

    const stocks = Array.from(stockMap.values()).sort((a, b) => b.combinedWeight - a.combinedWeight);

    return res.json({
      source: 'neon',
      funds,
      stocks,
      totalUniqueStocks: stocks.length,
    });
  } catch (error: any) {
    console.error('Error executing compare query in Neon:', error);
    return res.status(500).json({ source: 'error', funds: [], stocks: [], totalUniqueStocks: 0, error: error?.message });
  }
});

/**
 * GET /api/overlap?ids=1,2,3
 * Returns pairwise overlap % between every pair of selected funds.
 */
apiRouter.get('/overlap', async (req, res) => {
  const idsParam = req.query.ids as string || '';
  const fundIds = idsParam.split(',').map((s) => s.trim()).filter(Boolean);

  if (fundIds.length < 2) {
    return res.status(400).json({ error: 'At least 2 fund IDs are required for pairwise overlap' });
  }

  if (!isNeonConfigured()) {
    return res.json({ source: 'unconfigured', pairs: [] });
  }

  try {
    await ensureNeonSchema();
    const sql = getNeonSql();

    const pairs: { fundAId: string; fundBId: string }[] = [];
    for (let i = 0; i < fundIds.length; i++) {
      for (let j = i + 1; j < fundIds.length; j++) {
        pairs.push({ fundAId: fundIds[i], fundBId: fundIds[j] });
      }
    }

    const results = [];

    for (const { fundAId, fundBId } of pairs) {
      const overlapQuery = await sql`
        SELECT 
          COALESCE(SUM(LEAST(h1.weight_pct, h2.weight_pct)), 0)::float AS overlap_pct,
          COUNT(s.id)::int AS common_stocks_count
        FROM holdings h1
        JOIN holdings h2 ON h1.stock_id = h2.stock_id
        JOIN stocks s ON h1.stock_id = s.id
        WHERE h1.fund_id = ${fundAId} AND h2.fund_id = ${fundBId};
      `;

      const fundsInfo = await sql`
        SELECT id, name FROM funds WHERE id IN (${fundAId}, ${fundBId});
      `;
      const fundA = fundsInfo.find((f) => f.id === fundAId) || { id: fundAId, name: fundAId };
      const fundB = fundsInfo.find((f) => f.id === fundBId) || { id: fundBId, name: fundBId };

      results.push({
        fundA,
        fundB,
        overlapPercentage: Number(overlapQuery[0]?.overlap_pct?.toFixed(2) || 0),
        commonStocksCount: overlapQuery[0]?.common_stocks_count || 0
      });
    }

    return res.json({ source: 'neon', pairs: results });
  } catch (error: any) {
    console.error('Error executing overlap query in Neon:', error);
    return res.status(500).json({ source: 'error', pairs: [], error: error?.message });
  }
});

/**
 * GET /api/top-holdings?ids=1,2,3
 * Returns combined top holdings across selected funds.
 */
apiRouter.get('/top-holdings', async (req, res) => {
  const idsParam = req.query.ids as string || '';
  const fundIds = idsParam.split(',').map((s) => s.trim()).filter(Boolean);

  if (fundIds.length === 0) {
    return res.status(400).json({ error: 'ids query parameter is required' });
  }

  if (!isNeonConfigured()) {
    return res.json({ source: 'unconfigured', topHoldings: [] });
  }

  try {
    await ensureNeonSchema();
    const sql = getNeonSql();

    const topStocks = await sql`
      SELECT 
        s.isin,
        s.name AS stock_name,
        s.sector,
        SUM(h.weight_pct)::float AS combined_weight,
        COUNT(h.fund_id)::int AS held_by_fund_count
      FROM holdings h
      JOIN stocks s ON h.stock_id = s.id
      WHERE h.fund_id = ANY(${fundIds})
      GROUP BY s.isin, s.name, s.sector
      ORDER BY combined_weight DESC
      LIMIT 10;
    `;

    return res.json({ source: 'neon', topHoldings: topStocks });
  } catch (error: any) {
    console.error('Error executing top-holdings query in Neon:', error);
    return res.status(500).json({ source: 'error', topHoldings: [], error: error?.message });
  }
});
