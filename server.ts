import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { isNeonConfigured, testNeonConnection } from './server/db.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Neon connection status endpoint (no auth required as requested)
  app.get('/api/neon/status', async (req, res) => {
    try {
      const configured = isNeonConfigured();
      if (!configured) {
        return res.json({
          configured: false,
          connected: false,
          message:
            'DATABASE_URL or NEON_DATABASE_URL is not set. Please provide your Neon connection string in the environment variables.',
        });
      }

      const connection = await testNeonConnection();
      return res.json({
        configured: true,
        connected: connection.ok,
        database: connection.database,
        version: connection.version,
        error: connection.error,
      });
    } catch (error: any) {
      return res.status(500).json({
        configured: isNeonConfigured(),
        connected: false,
        error: error?.message || 'Error checking Neon connection',
      });
    }
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
