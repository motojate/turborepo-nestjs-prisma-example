import { readReplicas } from "@prisma/extension-read-replicas";

type ReplicaExtension = ReturnType<typeof readReplicas>;

interface ExtensibleClient {
  $extends: (args: ReplicaExtension) => unknown;
}

export const applyReplicaPlugin = <T extends ExtensibleClient>(
  prisma: T,
  urls?: string[],
) => {
  if (!urls || urls.length === 0) return prisma;

  const extendedClient = prisma.$extends(
    readReplicas({
      replicas: urls.map((url) => prisma), // TODO: client create 메서드로 변경.
    }),
  );

  return extendedClient as ReturnType<T["$extends"]>;
};
