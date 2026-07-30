import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl() {
  let url =
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DIRECT_URL ||
    "postgresql://postgres:%40Auraregenera%401%40@db.pwqnrdnjgemglpfgetii.supabase.co:5432/postgres";

  // Ensure SSL and connection timeout parameters for Vercel Serverless
  if (!url.includes("sslmode=") && !url.includes("pgbouncer=")) {
    url += (url.includes("?") ? "&" : "?") + "sslmode=require&connect_timeout=30";
  }

  return url;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
