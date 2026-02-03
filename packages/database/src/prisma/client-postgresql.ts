import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../generated/client";
import { applyReadonlyPlugin } from "./plugin";

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

type PrismaReplicaOptions = Readonly<{
  urls: string[];
}>;

type PrismaPgClientOptions = Readonly<{
  url: string;
  appName?: string;

  log?: Prisma.LogLevel[];
  pool?: PgPoolOptions;

  isReadonly?: boolean;

  // replicas?: PrismaReplicaOptions;

  onError?: (err: Error) => void;
}>;

type DisposeFn = (() => Promise<void>) & { _called?: true };

export type PrismaPgHandle = Readonly<{
  client: PrismaClient;
  ping: () => Promise<void>;
  dispose: () => Promise<void>;
}>;

export const createPrismaPgClient = (options: PrismaPgClientOptions) => {
  const { url, appName, pool: poolOptions, log, onError, isReadonly } = options;
  const pool = new Pool({
    connectionString: url,
    application_name: appName,
    ...DEFAULT_POOL_OPTIONS,
    ...poolOptions,
  });

  const logPrefix = `[pg${appName ? `:${appName}` : ""}]`;

  const safeCallOnError = (err: unknown, source?: string) => {
    const e = err instanceof Error ? err : new Error(String(err));

    if (onError) {
      try {
        onError(e);
      } catch (hookErr) {
        console.error(`${logPrefix} onError handler threw`, hookErr);
        console.error(`${logPrefix} original error`, e);
      }
      return;
    }

    console.error(`${logPrefix}${source ? ` ${source}` : ""}`, e);
  };

  pool.on("error", (e) => safeCallOnError(e, "pool.error"));

  const adapter = new PrismaPg(pool);
  const baseClient = new PrismaClient({ adapter, log });
  const client = isReadonly ? applyReadonlyPlugin(baseClient) : baseClient;

  const ping = async (): Promise<void> => {
    try {
      const c = await pool.connect();
      try {
        await c.query("SELECT 1");
      } finally {
        c.release();
      }
    } catch (err) {
      safeCallOnError(err, "ping");
      throw err;
    }
  };

  const dispose: DisposeFn = async () => {
    if (dispose._called) return;
    dispose._called = true;

    try {
      await client.$disconnect();
    } catch (err) {
      safeCallOnError(err, "db.disconnect");
      throw err;
    }

    try {
      await pool.end();
    } catch (err) {
      safeCallOnError(err, "pool.end");
      throw err;
    }
  };

  return { client, ping, dispose };
};
