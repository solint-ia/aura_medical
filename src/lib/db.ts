import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DIRECT_URL ||
  "postgresql://postgres:%40Auraregenera%401%40@db.pwqnrdnjgemglpfgetii.supabase.co:5432/postgres";

// Use a singleton Pool instance for server-side Next.js route handlers
export const dbPool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
});
