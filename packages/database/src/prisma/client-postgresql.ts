import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { applyReadonlyPlugin } from "./plugin";
import {
  AvailableSchemas,
  getConstructor,
  SchemaClientMap,
  SchemaLogLevelMap,
} from "./client-factory.generated";

type PgPoolOptions = Readonly<{
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}>;

const DEFAULT_POOL_OPTIONS: Required<PgPoolOptions> = {
  max: 15,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
};

type PrismaPgClientOptions<S extends AvailableSchemas> = Readonly<{
  schema: S;
  url: string;
  appName?: string;
  log?: readonly SchemaLogLevelMap[S][];
  pool?: PgPoolOptions;
  isReadonly?: boolean;
  onError?: (err: Error) => void;
}>;

type DisposeFn = (() => Promise<void>) & { _called?: true };

export type PrismaPgHandle<S extends AvailableSchemas> = Readonly<{
  client: SchemaClientMap[S];
  ping: () => Promise<void>;
  dispose: DisposeFn;
}>;

export const createPrismaPgHandle = <S extends AvailableSchemas>(
  options: PrismaPgClientOptions<S>,
): PrismaPgHandle<S> => {
  const {
    schema,
    url,
    appName,
    pool: poolOptions,
    log,
    onError,
    isReadonly,
  } = options;

  const pool = new Pool({
    connectionString: url,
    application_name: appName,
    ...DEFAULT_POOL_OPTIONS,
    ...poolOptions,
  });

  const logPrefix = `[pg:${schema}${appName ? `:${appName}` : ""}]`;

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

  const Ctor = getConstructor(schema);

  const baseClient = new Ctor({ adapter });

  const client = isReadonly
    ? (applyReadonlyPlugin(baseClient) as SchemaClientMap[S])
    : baseClient;

  const ping = async () => {
    const c = await pool.connect();
    try {
      await c.query("SELECT 1");
    } finally {
      c.release();
    }
  };

  const dispose: DisposeFn = async () => {
    if (dispose._called) return;
    dispose._called = true;

    try {
      await client.$disconnect();
    } catch (err) {
      safeCallOnError(err, "db.disconnect");
    }

    try {
      await pool.end();
    } catch (err) {
      safeCallOnError(err, "pool.end");
    }
  };

  return { client, ping, dispose };
};
