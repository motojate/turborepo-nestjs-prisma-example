import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "./generated/prisma/client";

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
  if (!READ_OPERATIONS.has(operation))
    throw new Error(
      `[PrismaReadOnly] Forbidden write operation: ${model}.${operation}()`,
    );
}

export type PrismaClientFactoryOptions = Readonly<{
  url: string;
  appName: string;
  pool?: Readonly<{
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  }>;
  log?: Prisma.LogLevel[];
  readOnly: boolean;
}>;

export function createPrismaClientWithAdapterPg(
  options: PrismaClientFactoryOptions,
): { prisma: PrismaClient; pool: Pool } {
  const pool = new Pool({
    connectionString: options.url,
    application_name: options.appName,
    max: options.pool?.max,
    idleTimeoutMillis: options.pool?.idleTimeoutMillis,
    connectionTimeoutMillis: options.pool?.connectionTimeoutMillis,
  });

  const adapter = new PrismaPg(pool);

  const basePrisma = new PrismaClient({
    adapter,
    log: options.log ?? ["query", "warn", "info", "error"],
  });

  if (!options.readOnly) return { prisma: basePrisma, pool };

  const roClient = basePrisma.$extends({
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
    },
  }) as unknown as PrismaClient;

  return { prisma: roClient, pool };
}
