import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to initialize the PostgreSQL pool.");
}

const databasePort = new URL(connectionString).port;

// Use a singleton Pool instance for server-side Next.js route handlers
export const dbPool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  // Atrás do pooler transacional cada instância serverless deve manter o
  // mínimo de conexões. O valor pode ser elevado explicitamente fora dele.
  max: Number(process.env.PG_POOL_MAX) || (databasePort === "6543" ? 1 : 10),
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
});
