import { readReplicas } from "@prisma/extension-read-replicas";
import { PrismaClient } from "../../generated/client";
import { createPrismaPgClient } from "../client-postgresql";

export const applyReplicaPlugin = (prisma: PrismaClient, urls?: string[]) => {
  if (!urls || urls.length === 0) return prisma;

  return prisma.$extends(
    readReplicas({
      replicas: urls.map((url) => createPrismaPgClient({ url })),
    }),
  );
};
