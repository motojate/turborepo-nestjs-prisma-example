import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaClientOptions } from "./prisma.types";

const READ_OPERATIONS = new Set<string>([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);

function assertReadOnly(model: string, operation: string): void {
  if (!READ_OPERATIONS.has(operation)) {
    throw new Error(
      `[PrismaReadOnly] Forbidden write operation: ${model}.${operation}()`,
    );
  }
}

const DEFAULT_POOL = Object.freeze({
  max: 15,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
});

function withDefaultPool(pool?: PrismaClientOptions["pool"]) {
  return {
    max: pool?.max ?? DEFAULT_POOL.max,
    idleTimeoutMillis:
      pool?.idleTimeoutMillis ?? DEFAULT_POOL.idleTimeoutMillis,
    connectionTimeoutMillis:
      pool?.connectionTimeoutMillis ?? DEFAULT_POOL.connectionTimeoutMillis,
  };
}

function applyReadOnlyGuard(base: PrismaClient): PrismaClient {
  const ro = base.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          assertReadOnly(model, operation);
          return query(args);
        },
      },
    },
    client: {
      $executeRaw: async () => {
        throw new Error("[PrismaReadOnly] Forbidden: $executeRaw");
      },
      $executeRawUnsafe: async () => {
        throw new Error("[PrismaReadOnly] Forbidden: $executeRawUnsafe");
      },
      // Policy choice:
      // - keep allowed for read-only reporting use cases, or
      // - uncomment to forbid raw queries completely.
      //
      // $queryRaw: async () => {
      //   throw new Error("[PrismaReadOnly] Forbidden: $queryRaw");
      // },
      // $queryRawUnsafe: async () => {
      //   throw new Error("[PrismaReadOnly] Forbidden: $queryRawUnsafe");
      // },
    },
  });

  return ro as unknown as PrismaClient;
}

/**
 * Result of creating a Prisma client and its underlying pg.Pool.
 */
export type PrismaCreateResult = Readonly<{
  prisma: PrismaClient;
  pool: Pool;
  eagerConnect: boolean;
}>;

function createBase(options: PrismaClientOptions): {
  prisma: PrismaClient;
  pool: Pool;
} {
  const poolOpts = withDefaultPool(options.pool);

  const pool = new Pool({
    connectionString: options.url,
    application_name: options.appName,
    max: poolOpts.max,
    idleTimeoutMillis: poolOpts.idleTimeoutMillis,
    connectionTimeoutMillis: poolOpts.connectionTimeoutMillis,
  });

  const adapter = new PrismaPg(pool);

  const prisma = new PrismaClient({
    adapter,
    log: options.log ?? ["warn", "error"],
  });

  return { prisma, pool };
}

/**
 * Creates a standard read/write Prisma client.
 */
export function createWriteClient(
  options: PrismaClientOptions,
): PrismaCreateResult {
  const { prisma, pool } = createBase(options);
  return { prisma, pool, eagerConnect: options.eagerConnect ?? false };
}

/**
 * Creates a read-only Prisma client by applying a query-level guard.
 */
export function createReadClient(
  options: PrismaClientOptions,
): PrismaCreateResult {
  const { prisma: base, pool } = createBase(options);
  const prisma = applyReadOnlyGuard(base);
  return { prisma, pool, eagerConnect: options.eagerConnect ?? false };
}
