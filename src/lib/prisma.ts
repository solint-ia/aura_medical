import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl() {
  const configuredUrl = process.env.DATABASE_URL;
  if (!configuredUrl) {
    throw new Error("DATABASE_URL is required to initialize Prisma.");
  }

  const url = new URL(configuredUrl);
  if (!url.searchParams.has("sslmode")) url.searchParams.set("sslmode", "require");
  if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "15");
  if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "60");
  if (url.port === "6543") {
    // O Supavisor na porta 6543 opera em modo transacional: prepared
    // statements precisam ser desativados e uma conexão por instância evita
    // esgotar o pool quando a plataforma escala horizontalmente.
    if (!url.searchParams.has("pgbouncer")) url.searchParams.set("pgbouncer", "true");
    if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "1");
  }
  return url.toString();
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
    transactionOptions: {
      maxWait: 10_000,
      timeout: 30_000,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
