import { Router } from 'express';
import { getNeonSql, isNeonConfigured } from './db.js';
import { MOCK_FUNDS } from '../src/data/mockFunds.js';

export const apiRouter = Router();

/**
 * Ensures Neon tables exist and seeds them with baseline statutory fund holdings if empty.
 */
let isInitialized = false;
export async function ensureNeonSchemaAndSeed() {
  if (!isNeonConfigured() || isInitialized) return;
  try {
    const sql = getNeonSql();

    // Create the 3 required tables as specified
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

    // Check if funds table has data
    const existing = await sql`SELECT COUNT(*)::int as count FROM funds`;
    if (existing[0]?.count === 0) {
      console.log('Seeding initial Indian Mutual Funds and ETFs into Neon Postgres...');

      for (const fund of MOCK_FUNDS) {
        await sql`
          INSERT INTO funds (id, scheme_code, name, amc, fund_type, category, as_of_date)
          VALUES (${fund.id}, ${fund.benchmark || 'N/A'}, ${fund.name}, ${fund.amc}, 'Equity', ${fund.category}, CURRENT_DATE)
          ON CONFLICT (id) DO NOTHING;
        `;

        for (const holding of fund.holdings) {
          // Upsert stock
          const stockResult = await sql`
            INSERT INTO stocks (isin, name, sector)
            VALUES (${holding.isin}, ${holding.name}, ${holding.sector})
            ON CONFLICT (isin) DO UPDATE SET name = EXCLUDED.name, sector = EXCLUDED.sector
            RETURNING id;
          `;
          const stockId = stockResult[0]?.id;

          if (stockId) {
            await sql`
              INSERT INTO holdings (fund_id, stock_id, weight_pct)
              VALUES (${fund.id}, ${stockId}, ${holding.weight})
              ON CONFLICT (fund_id, stock_id) DO UPDATE SET weight_pct = EXCLUDED.weight_pct;
            `;
          }
        }
      }
      console.log('Successfully seeded Neon database with initial fund holdings.');
    }

    isInitialized = true;
  } catch (err) {
    console.error('Failed to initialize or seed Neon tables:', err);
  }
}

/**
 * GET /api/funds/search?q=...
 * Returns matching funds from Neon Postgres (or fallback dataset)
 */
apiRouter.get('/funds/search', async (req, res) => {
  const query = (req.query.q as string || '').trim();

  if (isNeonConfigured()) {
    try {
      await ensureNeonSchemaAndSeed();
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
          LIMIT 15;
        `;
      } else {
        funds = await sql`
          SELECT id, scheme_code, name, amc, fund_type, category, as_of_date
          FROM funds
          ORDER BY name ASC
          LIMIT 15;
        `;
      }
      return res.json({ source: 'neon', funds });
    } catch (error: any) {
      console.warn('Neon search failed, falling back to local dataset:', error.message);
    }
  }

  // Fallback if Neon is not configured or query error
  const filtered = query
    ? MOCK_FUNDS.filter(
        (f) =>
          f.name.toLowerCase().includes(query.toLowerCase()) ||
          f.amc.toLowerCase().includes(query.toLowerCase()) ||
          f.category.toLowerCase().includes(query.toLowerCase())
      )
    : MOCK_FUNDS;

  return res.json({
    source: 'fallback',
    funds: filtered.slice(0, 15).map((f) => ({
      id: f.id,
      scheme_code: f.benchmark,
      name: f.name,
      amc: f.amc,
      fund_type: 'Equity',
      category: f.category,
      as_of_date: new Date().toISOString().split('T')[0],
      holdingsCount: f.holdings.length
    }))
  });
});

/**
 * GET /api/compare?ids=1,2,3
 * Returns holdings pivoted by fund, for the comparison table
 */
apiRouter.get('/compare', async (req, res) => {
  const idsParam = req.query.ids as string || '';
  const fundIds = idsParam.split(',').map((s) => s.trim()).filter(Boolean);

  if (fundIds.length === 0) {
    return res.status(400).json({ error: 'ids query parameter is required (e.g., ?ids=ppfas-flexi,hdfc-nifty50)' });
  }

  if (isNeonConfigured()) {
    try {
      await ensureNeonSchemaAndSeed();
      const sql = getNeonSql();

      // Fetch selected funds
      const funds = await sql`
        SELECT id, scheme_code, name, amc, fund_type, category, as_of_date
        FROM funds
        WHERE id = ANY(${fundIds});
      `;

      // Fetch all holdings for these funds joined with stocks
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

      // Pivot holdings by stock ISIN
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
      console.warn('Neon compare query failed, falling back to local dataset:', error.message);
    }
  }

  // Fallback to local dataset
  const matchedFunds = MOCK_FUNDS.filter((f) => fundIds.includes(f.id));
  const stockMap = new Map<string, {
    isin: string;
    name: string;
    sector: string;
    weights: Record<string, number>;
    combinedWeight: number;
  }>();

  for (const fund of matchedFunds) {
    for (const h of fund.holdings) {
      if (!stockMap.has(h.isin)) {
        stockMap.set(h.isin, {
          isin: h.isin,
          name: h.name,
          sector: h.sector,
          weights: {},
          combinedWeight: 0
        });
      }
      const item = stockMap.get(h.isin)!;
      item.weights[fund.id] = h.weight;
      item.combinedWeight += h.weight;
    }
  }

  const stocks = Array.from(stockMap.values()).sort((a, b) => b.combinedWeight - a.combinedWeight);

  return res.json({
    source: 'fallback',
    funds: matchedFunds.map((f) => ({
      id: f.id,
      name: f.name,
      amc: f.amc,
      category: f.category,
      benchmark: f.benchmark
    })),
    stocks,
    totalUniqueStocks: stocks.length
  });
});

/**
 * GET /api/overlap?ids=1,2,3
 * Returns pairwise overlap % between every pair of selected funds
 */
apiRouter.get('/overlap', async (req, res) => {
  const idsParam = req.query.ids as string || '';
  const fundIds = idsParam.split(',').map((s) => s.trim()).filter(Boolean);

  if (fundIds.length < 2) {
    return res.status(400).json({ error: 'At least 2 fund IDs are required for pairwise overlap' });
  }

  // Generate all pairs
  const pairs: { fundAId: string; fundBId: string }[] = [];
  for (let i = 0; i < fundIds.length; i++) {
    for (let j = i + 1; j < fundIds.length; j++) {
      pairs.push({ fundAId: fundIds[i], fundBId: fundIds[j] });
    }
  }

  if (isNeonConfigured()) {
    try {
      await ensureNeonSchemaAndSeed();
      const sql = getNeonSql();

      const results = [];

      for (const { fundAId, fundBId } of pairs) {
        // Minimum weight overlap formula: SUM(LEAST(hA.weight_pct, hB.weight_pct))
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
      console.warn('Neon overlap query failed, falling back:', error.message);
    }
  }

  // Fallback calculation using local dataset
  const results = [];
  for (const { fundAId, fundBId } of pairs) {
    const fundA = MOCK_FUNDS.find((f) => f.id === fundAId);
    const fundB = MOCK_FUNDS.find((f) => f.id === fundBId);

    if (!fundA || !fundB) continue;

    const mapB = new Map(fundB.holdings.map((h) => [h.isin, h.weight]));
    let overlapSum = 0;
    let commonCount = 0;

    for (const hA of fundA.holdings) {
      if (mapB.has(hA.isin)) {
        const wB = mapB.get(hA.isin)!;
        overlapSum += Math.min(hA.weight, wB);
        commonCount++;
      }
    }

    results.push({
      fundA: { id: fundA.id, name: fundA.name },
      fundB: { id: fundB.id, name: fundB.name },
      overlapPercentage: Number(overlapSum.toFixed(2)),
      commonStocksCount: commonCount
    });
  }

  return res.json({ source: 'fallback', pairs: results });
});

/**
 * GET /api/top-holdings?ids=1,2,3
 * Returns combined top holdings across selected funds
 */
apiRouter.get('/top-holdings', async (req, res) => {
  const idsParam = req.query.ids as string || '';
  const fundIds = idsParam.split(',').map((s) => s.trim()).filter(Boolean);

  if (fundIds.length === 0) {
    return res.status(400).json({ error: 'ids query parameter is required' });
  }

  if (isNeonConfigured()) {
    try {
      await ensureNeonSchemaAndSeed();
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
      console.warn('Neon top holdings query failed, falling back:', error.message);
    }
  }

  // Fallback to local data
  const matchedFunds = MOCK_FUNDS.filter((f) => fundIds.includes(f.id));
  const stockMap = new Map<string, {
    isin: string;
    stock_name: string;
    sector: string;
    combined_weight: number;
    held_by_fund_count: number;
  }>();

  for (const fund of matchedFunds) {
    for (const h of fund.holdings) {
      if (!stockMap.has(h.isin)) {
        stockMap.set(h.isin, {
          isin: h.isin,
          stock_name: h.name,
          sector: h.sector,
          combined_weight: 0,
          held_by_fund_count: 0
        });
      }
      const item = stockMap.get(h.isin)!;
      item.combined_weight += h.weight;
      item.held_by_fund_count += 1;
    }
  }

  const topHoldings = Array.from(stockMap.values())
    .sort((a, b) => b.combined_weight - a.combined_weight)
    .slice(0, 10);

  return res.json({ source: 'fallback', topHoldings });
});
