// import { Pool } from "pg";
// import { PrismaPg } from "@prisma/adapter-pg";
// import { Prisma, PrismaClient } from "../generated/client";
// import { applyReadonlyPlugin } from "./plugin";

// const DEFAULT_POOL_OPTIONS: Required<PgPoolOptions> = {
//   max: 15,
//   idleTimeoutMillis: 10_000,
//   connectionTimeoutMillis: 5_000,
// };

// type PgPoolOptions = Readonly<{
//   max?: number;
//   idleTimeoutMillis?: number;
//   connectionTimeoutMillis?: number;
// }>;

// type PrismaReplicaOptions = Readonly<{
//   urls: string[];
// }>;

// type PrismaPgClientOptions = Readonly<{
//   url: string;
//   appName?: string;

//   log?: Prisma.LogLevel[];
//   pool?: PgPoolOptions;

//   isReadonly?: boolean;

//   // replicas?: PrismaReplicaOptions;

//   onError?: (err: Error) => void;
// }>;

// type DisposeFn = (() => Promise<void>) & { _called?: true };

// export type PrismaPgHandle = Readonly<{
//   client: PrismaClient;
//   ping: () => Promise<void>;
//   dispose: () => Promise<void>;
// }>;

// export const createPrismaPgClient = (options: PrismaPgClientOptions) => {
//   const { url, appName, pool: poolOptions, log, onError, isReadonly } = options;
//   const pool = new Pool({
//     connectionString: url,
//     application_name: appName,
//     ...DEFAULT_POOL_OPTIONS,
//     ...poolOptions,
//   });

//   const logPrefix = `[pg${appName ? `:${appName}` : ""}]`;

//   const safeCallOnError = (err: unknown, source?: string) => {
//     const e = err instanceof Error ? err : new Error(String(err));

//     if (onError) {
//       try {
//         onError(e);
//       } catch (hookErr) {
//         console.error(`${logPrefix} onError handler threw`, hookErr);
//         console.error(`${logPrefix} original error`, e);
//       }
//       return;
//     }

//     console.error(`${logPrefix}${source ? ` ${source}` : ""}`, e);
//   };

//   pool.on("error", (e) => safeCallOnError(e, "pool.error"));

//   const adapter = new PrismaPg(pool);
//   const baseClient = new PrismaClient({ adapter, log });
//   const client = isReadonly ? applyReadonlyPlugin(baseClient) : baseClient;

//   const ping = async (): Promise<void> => {
//     const c = await pool.connect();
//     try {
//       await c.query("SELECT 1");
//     } finally {
//       c.release();
//     }
//   };

//   const dispose: DisposeFn = async () => {
//     if (dispose._called) return;
//     dispose._called = true;

//     try {
//       await client.$disconnect();
//     } catch (err) {
//       safeCallOnError(err, "db.disconnect");
//       throw err;
//     }

//     try {
//       await pool.end();
//     } catch (err) {
//       safeCallOnError(err, "pool.end");
//       throw err;
//     }
//   };

//   return { client, ping, dispose };
// };

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  SCHEMA_CONSTRUCTORS,
  AvailableSchemas,
  SchemaClientMap,
  SchemaLogLevelMap,
} from "./client-factory.generated";
import { applyReadonlyPlugin } from "./plugin";

// Pool 옵션은 그대로 유지
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

// 💡 LogLevel이 스키마마다 다를 수 있으므로 제네릭으로 처리
type PrismaPgClientOptions<S extends AvailableSchemas> = Readonly<{
  schema: S; // 👈 필수: 어떤 스키마를 쓸지 지정
  url: string;
  appName?: string;

  // 해당 스키마의 Prisma 네임스페이스에서 LogLevel을 가져옴
  log?: SchemaLogLevelMap[S][];
  pool?: PgPoolOptions;

  isReadonly?: boolean;
  onError?: (err: Error) => void;
}>;

type DisposeFn = (() => Promise<void>) & { _called?: true };

// 💡 핸들러도 제네릭 적용
export type PrismaPgHandle<S extends AvailableSchemas> = Readonly<{
  client: SchemaClientMap[S];
  ping: () => Promise<void>;
  dispose: () => Promise<void>;
}>;

export const createPrismaPgClient = <S extends AvailableSchemas>(
  options: PrismaPgClientOptions<S>,
): PrismaPgHandle<S> => {
  const {
    schema, // 👈 schema 이름 추출
    url,
    appName,
    pool: poolOptions,
    log,
    onError,
    isReadonly,
  } = options;

  // 1. Connection Pool 생성
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

  // 2. Adapter 및 Client 생성
  const adapter = new PrismaPg(pool);

  // 💡 팩토리 맵에서 생성자 가져오기
  const ClientConstructor = SCHEMA_CONSTRUCTORS[schema];

  if (!ClientConstructor) {
    throw new Error(
      `Prisma schema '${schema}' not found in generated factory.`,
    );
  }

  // 생성자 호출 (TS가 생성자 시그니처를 완벽히 추론하지 못할 수 있어 as any 혹은 타입 단언 필요)
  // Adapter를 사용하는 생성자 옵션은 모든 Prisma Client가 동일합니다.
  const baseClient = new (ClientConstructor as any)({
    adapter,
    log,
  }) as SchemaClientMap[S];

  // 3. Plugin 적용 (Readonly 등)
  // applyReadonlyPlugin 내부 구현에 따라 타입 캐스팅이 필요할 수 있습니다.
  const client = isReadonly ? applyReadonlyPlugin(baseClient) : baseClient;

  // 4. Ping 함수
  const ping = async (): Promise<void> => {
    // 풀 연결 테스트 (Prisma를 통하지 않고 직접 Pool로 확인)
    const c = await pool.connect();
    try {
      await c.query("SELECT 1");
    } finally {
      c.release();
    }
  };

  // 5. Dispose 함수
  const dispose: DisposeFn = async () => {
    if (dispose._called) return;
    dispose._called = true;

    try {
      // Prisma 연결 해제
      await client.$disconnect();
    } catch (err) {
      safeCallOnError(err, "db.disconnect");
      throw err;
    }

    try {
      // PG Pool 종료
      await pool.end();
    } catch (err) {
      safeCallOnError(err, "pool.end");
      throw err;
    }
  };

  return { client, ping, dispose };
};
