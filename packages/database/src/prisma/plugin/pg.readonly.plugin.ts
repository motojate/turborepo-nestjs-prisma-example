interface OperationParams {
  model: string;
  operation: string;
  args: unknown;
  query: (args: unknown) => Promise<unknown>;
}

interface ReadonlyExtension {
  query: {
    $allModels: {
      $allOperations: (params: OperationParams) => Promise<unknown>;
    };
  };
  client: {
    $executeRaw: () => Promise<never>;
    $executeRawUnsafe: () => Promise<never>;
  };
}

interface ExtensibleClient {
  $extends: (args: ReadonlyExtension) => unknown;
}

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
  "$queryRawUnsafe", // raw query 중 읽기 전용은 허용
]);

const assertReadonly = (model: string, operation: string): void => {
  if (!READ_OPERATIONS.has(operation)) {
    throw new Error(
      `[PrismaReadOnly] Forbidden write operation: ${model}.${operation}()`,
    );
  }
};

export const applyReadonlyPlugin = <T extends ExtensibleClient>(prisma: T) => {
  const extension = {
    query: {
      $allModels: {
        $allOperations: async ({
          model,
          operation,
          args,
          query,
        }: OperationParams) => {
          assertReadonly(model, operation);
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
  };

  return prisma.$extends(extension) as ReturnType<T["$extends"]>;
};
