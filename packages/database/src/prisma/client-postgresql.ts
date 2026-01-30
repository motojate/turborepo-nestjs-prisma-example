import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "generated/prisma/client";

const DEFAULT_POOL_OPTIONS: Required<PgPoolOptions> = {
  max: 15,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
};

type PgPoolOptions = Readonly<{
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}>;

type PrismaPgClientOptions = Readonly<{
  url: string;
  appName?: string;

  log?: Prisma.LogLevel[];
  pool?: PgPoolOptions;

  readOnlyGuard?: boolean;
}>;

export const createPrismaPgClient = (options: PrismaPgClientOptions) => {
  const { url, appName, pool: poolOptions, readOnlyGuard, log } = options;
  const pool = new Pool({
    connectionString: url,
    application_name: appName,
    ...DEFAULT_POOL_OPTIONS,
    ...poolOptions,
  });

  pool.on("error", (err) => {
    console.error(`Unexpected error on idle pg client: ${appName}`, err);
  });

  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({
    adapter,
    log,
  });

  const dispose = async () => {
    await client.$disconnect().catch(() => undefined);
    await pool.end().catch(() => undefined);
  };

  return { client, dispose } as const;
};
