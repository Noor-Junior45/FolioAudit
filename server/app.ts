import express from 'express';
import { apiRouter, ensureNeonSchema } from './routes.js';
import { isNeonConfigured } from './db.js';

export const app = express();

// Standard middleware
app.use(express.json());

// Enable CORS for API routes so both local preview, custom domains, and Vercel work seamlessly
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Initialize database schema on startup if Neon is configured
if (isNeonConfigured()) {
  ensureNeonSchema().catch((err) => {
    console.error('ensureNeonSchema error:', err);
  });
}

// Mount routes at both /api and root to handle any rewrite pathing on Vercel or Express
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
