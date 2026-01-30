import { PrismaClient } from "../generated/client";

const READ_OPERATIONS = new Set<string>([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "$queryRaw",
  "$queryRawUnsafe",
]);

const assertReadOnly = (model: string, operation: string): void => {
  if (!READ_OPERATIONS.has(operation)) {
    throw new Error(
      `[PrismaReadOnly] Forbidden write operation: ${model}.${operation}()`,
    );
  }
};

export const applyReadOnlyGuard = (prisma: PrismaClient): PrismaClient => {
  return prisma.$extends({
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
  }) as unknown as PrismaClient;
};
