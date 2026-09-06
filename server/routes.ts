import { Router } from 'express';
import {
  isSupabaseConfigured,
  getSupabaseConfig,
  testSupabaseConnection,
  fetchFundsFromSupabase,
} from './supabase.js';

export const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', (_req, res) => {
  const config = getSupabaseConfig();
  res.json({
    status: 'ok',
    supabaseConfigured: isSupabaseConfigured(),
    url: config ? config.url : null,
    source: config ? config.source : null,
  });
});

// Supabase connection status endpoint with environment diagnostics (safe, no keys exposed)
apiRouter.get('/supabase/status', async (_req, res) => {
  try {
    const configured = isSupabaseConfigured();
    const config = getSupabaseConfig();

    if (!configured) {
      return res.json({
        configured: false,
        connected: false,
        url: null,
        message:
          'Supabase environment variables not found. Please set VITE_PUBLIC_SUPABASE_URL and VITE_PUBLIC_SUPABASE_ANON_KEY.',
      });
    }

    const connection = await testSupabaseConnection();
    return res.json({
      configured: true,
      connected: connection.ok,
      url: config?.url,
      source: config?.source,
      fundCount: connection.fundCount ?? 0,
      stockCount: connection.stockCount ?? 0,
      error: connection.error,
    });
  } catch (error: any) {
    return res.status(500).json({
      configured: isSupabaseConfigured(),
      connected: false,
      error: error?.message || 'Error checking Supabase connection',
    });
  }
});

/**
 * GET /api/funds
 * Returns all mutual funds and ETFs present in the Supabase database with their holdings.
 */
apiRouter.get('/funds', async (_req, res) => {
  if (!isSupabaseConfigured()) {
    return res.json({
      source: 'unconfigured',
      funds: [],
      message:
        'VITE_PUBLIC_SUPABASE_URL or VITE_PUBLIC_SUPABASE_ANON_KEY is not configured. Please add your Supabase credentials in your Vercel Project Settings > Environment Variables or AI Studio Settings.',
    });
  }

  try {
    const result = await fetchFundsFromSupabase();
    if (!result.success) {
      return res.status(500).json({
        source: 'error',
        funds: [],
        error: result.error,
        message: `Supabase query error: ${result.error}`,
      });
    }

    return res.json({
      source: 'supabase',
      funds: result.funds,
      count: result.funds.length,
    });
  } catch (error: any) {
    console.error('Error in /api/funds handler:', error);
    return res.status(500).json({
      source: 'error',
      funds: [],
      error: error?.message || 'Server error fetching funds',
      message: error?.message,
    });
  }
});
