export type { PrismaClientOptions } from "./prisma.types";

export { createReadClient, createWriteClient } from "./prisma.factory";
export type { PrismaCreateResult } from "./prisma.factory";

export { PrismaClientManager } from "./prisma.manager";

export {
  createPrismaProviders,
  InjectPrismaRead,
  InjectPrismaWrite,
} from "./prisma.di";
export type {
  PrismaProvidersOptions,
  PrismaReadClient,
  PrismaWriteClient,
} from "./prisma.di";
