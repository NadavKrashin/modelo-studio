/**
 * PostgreSQL integration point.
 *
 * When ready to move to a real database:
 * 1. Install: `npm install pg @prisma/client` (or drizzle-orm, knex, etc.)
 * 2. Implement the repository interfaces from `@/lib/repositories/interfaces`
 * 3. Swap the mock implementations in `@/lib/services/container.ts`
 *
 * Recommended schema migrations: use Prisma Migrate or node-pg-migrate.
 *
 * Tables needed:
 *   - models (id, external_id, source, name, localized_name, description, ...)
 *   - orders (id, order_number, customer_json, status, total, ...)
 *   - order_items (id, order_id, model_id, customization_json, ...)
 *   - order_status_history (id, order_id, status, note, timestamp)
 *   - filaments (id, name, material, color_hex, price_modifier, stock_grams, ...)
 *   - categories (id, slug, name, localized_name, ...)
 *   - search_terms (id, term, count, last_searched_at)
 */

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
}

export interface DatabaseClient {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  transaction<T>(fn: (client: DatabaseClient) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

/**
 * Placeholder — will be replaced with a real pool when PostgreSQL is enabled.
 */
export function createDatabaseClient(_config: DatabaseConfig): DatabaseClient {
  throw new Error(
    'PostgreSQL is not configured. Set DATABASE_URL in environment variables and implement the database client.'
  );
}
