import { neon, Pool, type NeonQueryFunction } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

let sqlClient: NeonQueryFunction<false, false> | null = null;
let poolClient: Pool | null = null;

function sanitizeUrl(raw?: string): string | null {
  if (!raw) return null;
  // Remove accidental surrounding quotes, whitespace, or trailing semicolons
  const trimmed = raw.trim().replace(/^["']|["']$/g, '').trim().replace(/;$/, '');
  return trimmed || null;
}

/**
 * Supported Neon/Postgres connection environment variables across Vercel, Neon, and local environments.
 */
const ENV_CANDIDATES = [
  'DATABASE_URL',
  'POSTGRES_URL',
  'NEON_DATABASE_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING',
  'DATABASE_URL_UNPOOLED',
] as const;

export function getDetectedEnvVar(): { name: string; isSet: boolean } | null {
  for (const name of ENV_CANDIDATES) {
    const val = sanitizeUrl(process.env[name]);
    if (val) {
      return { name, isSet: true };
    }
  }
  return null;
}

export function getConnectionString(): string {
  for (const name of ENV_CANDIDATES) {
    const val = sanitizeUrl(process.env[name]);
    if (val) {
      return val;
    }
  }

  throw new Error(
    'No database connection string found. Please set DATABASE_URL or POSTGRES_URL in your Vercel or environment settings.'
  );
}

export function isNeonConfigured(): boolean {
  return getDetectedEnvVar() !== null;
}

/**
 * Lazy-initialized Neon serverless SQL function.
 * Tagged template literals: sql`SELECT ...`
 */
export function getNeonSql(): NeonQueryFunction<false, false> {
  if (!sqlClient) {
    const connectionString = getConnectionString();
    sqlClient = neon(connectionString);
  }
  return sqlClient;
}

/**
 * Lazy-initialized Neon connection pool for client/pool operations.
 */
export function getNeonPool(): Pool {
  if (!poolClient) {
    const connectionString = getConnectionString();
    poolClient = new Pool({ connectionString });
  }
  return poolClient;
}

/**
 * Test the database connection and return status/version info with diagnostics.
 */
export async function testNeonConnection(): Promise<{
  ok: boolean;
  detectedEnvVar?: string;
  version?: string;
  database?: string;
  fundCount?: number;
  error?: string;
}> {
  const detected = getDetectedEnvVar();
  if (!detected) {
    return {
      ok: false,
      error: 'None of DATABASE_URL, POSTGRES_URL, or NEON_DATABASE_URL are configured.',
    };
  }

  try {
    const sql = getNeonSql();
    const result = await sql`SELECT version(), current_database() as db_name`;
    const row = result[0] as { version?: string; db_name?: string } | undefined;

    let fundCount = 0;
    try {
      const countRes = await sql`SELECT count(*)::int as cnt FROM funds`;
      fundCount = countRes[0]?.cnt || 0;
    } catch {
      // funds table might not exist yet
    }

    return {
      ok: true,
      detectedEnvVar: detected.name,
      version: row?.version,
      database: row?.db_name,
      fundCount,
    };
  } catch (error: any) {
    return {
      ok: false,
      detectedEnvVar: detected.name,
      error: error?.message || 'Failed to connect to Neon database',
    };
  }
}
