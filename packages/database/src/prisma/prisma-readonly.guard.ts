import type { PrismaClientLike } from "./prisma.types";

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

export function applyReadOnlyGuard<TClient extends PrismaClientLike>(
  base: TClient,
): TClient {
  const ro = base.$extends({
    query: {
      $allModels: {
        $allOperations: async ({ model, operation, args, query }) => {
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
  });

  return ro as TClient;
}
