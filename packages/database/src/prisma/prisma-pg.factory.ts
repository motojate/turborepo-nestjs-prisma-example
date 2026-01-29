import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import type { PrismaClientLike, PrismaLogLevel } from "./prisma.types";
import { applyReadOnlyGuard } from "./prisma-readonly.guard";

export type PgPoolOptions = Readonly<{
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}>;

export type PrismaPgFactoryOptions<TClient extends PrismaClientLike> =
  Readonly<{
    url: string;
    appName?: string;

    clientCtor: PrismaClientCtor<TClient>;
    log?: readonly PrismaLogLevel[];
    pool?: PgPoolOptions;

    readOnlyGuard?: boolean;
  }>;

export type PrismaPgInstance<TClient extends PrismaClientLike> = Readonly<{
  prisma: TClient;
  pool: Pool;
}>;

const DEFAULT_POOL: Required<PgPoolOptions> = Object.freeze({
  max: 15,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
});

function withDefaultPool(pool?: PgPoolOptions): Required<PgPoolOptions> {
  return {
    max: pool?.max ?? DEFAULT_POOL.max,
    idleTimeoutMillis:
      pool?.idleTimeoutMillis ?? DEFAULT_POOL.idleTimeoutMillis,
    connectionTimeoutMillis:
      pool?.connectionTimeoutMillis ?? DEFAULT_POOL.connectionTimeoutMillis,
  };
}

export function createPrismaPgClient<TClient extends PrismaClientLike>(
  options: PrismaPgFactoryOptions<TClient>,
): PrismaPgInstance<TClient> {
  const poolOpts = withDefaultPool(options.pool);

  const pool = new Pool({
    connectionString: options.url,
    application_name: options.appName,
    max: poolOpts.max,
    idleTimeoutMillis: poolOpts.idleTimeoutMillis,
    connectionTimeoutMillis: poolOpts.connectionTimeoutMillis,
  });

  const adapter = new PrismaPg(pool);

  const base = new options.clientCtor({
    adapter,
    log: options.log,
  });

  const prisma = options.readOnlyGuard ? applyReadOnlyGuard(base) : base;

  return { prisma, pool };
}
