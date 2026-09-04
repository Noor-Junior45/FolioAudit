import { neon, Pool, type NeonQueryFunction } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

let sqlClient: NeonQueryFunction<false, false> | null = null;
let poolClient: Pool | null = null;

export function getConnectionString(): string {
  const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL or NEON_DATABASE_URL environment variable is required. Please add your Neon connection string.'
    );
  }
  return url;
}

export function isNeonConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL || process.env.NEON_DATABASE_URL);
}

/**
 * Lazy-initialized Neon serverless SQL function.
 * Allows executing queries using tagged template literals:
 * e.g., const result = await sql`SELECT * FROM my_table`;
 * or executing raw SQL strings with sql(rawSql).
 */
export function getNeonSql(): NeonQueryFunction<false, false> {
  if (!sqlClient) {
    const connectionString = getConnectionString();
    sqlClient = neon(connectionString);
  }
  return sqlClient;
}

/**
 * Lazy-initialized Neon connection pool for standard client/pool operations.
 */
export function getNeonPool(): Pool {
  if (!poolClient) {
    const connectionString = getConnectionString();
    poolClient = new Pool({ connectionString });
  }
  return poolClient;
}

/**
 * Test the database connection and return status/version info.
 */
export async function testNeonConnection(): Promise<{
  ok: boolean;
  version?: string;
  database?: string;
  error?: string;
}> {
  if (!isNeonConfigured()) {
    return {
      ok: false,
      error: 'DATABASE_URL or NEON_DATABASE_URL environment variable is not configured',
    };
  }

  try {
    const sql = getNeonSql();
    const result = await sql`SELECT version(), current_database() as db_name`;
    const row = result[0] as { version?: string; db_name?: string } | undefined;
    return {
      ok: true,
      version: row?.version,
      database: row?.db_name,
    };
  } catch (error: any) {
    return {
      ok: false,
      error: error?.message || 'Failed to connect to Neon database',
    };
  }
}
