export type PrismaLogLevel = "query" | "info" | "warn" | "error";

/**
 * Prisma Client가 최소한으로 가져야 하는 형태(구조적 타입)
 * - PrismaPromise를 사용해서 "Prisma스럽게" 반환 타입을 고정
 */
export type PrismaClientLike = Readonly<{
  $extends: (extension: PrismaExtension) => unknown;
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
}>;

/**
 * Prisma $extends extension 타입(필요한 부분만 구조적 타입으로 엄격하게)
 * - PrismaPromise 사용 (runtime/client)
 * - any 사용 안 함
 */
export type PrismaExtension = Readonly<{
  query?: Readonly<{
    $allModels?: Readonly<{
      $allOperations?: (
        params: Readonly<{
          model: string;
          operation: string;
          args: unknown;
          query: (args: unknown) => Promise<unknown>;
        }>,
      ) => Promise<unknown>;
    }>;
  }>;
  client?: Readonly<{
    $executeRaw?: (...args: readonly unknown[]) => Promise<unknown>;
    $executeRawUnsafe?: (...args: readonly unknown[]) => Promise<unknown>;
  }>;
}>;

/**
 * schema 패키지에서 생성된 PrismaClient ctor를 주입 받기 위한 타입
 * (driver adapter용 ctor args를 구조적으로만 맞춘다)
 */
export type PrismaClientCtor<TClient extends PrismaClientLike> = new (
  args: Readonly<{
    adapter: unknown;
    log?: readonly PrismaLogLevel[];
  }>,
) => TClient;
