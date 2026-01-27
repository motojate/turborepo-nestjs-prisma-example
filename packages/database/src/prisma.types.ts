import { Prisma } from "./generated/prisma/client";

export type PrismaPoolOptions = Readonly<{
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}>;

export type PrismaClientOptions = Readonly<{
  url: string;
  appName: string;

  eagerConnect?: boolean;
  pool?: PrismaPoolOptions;
  log?: Prisma.LogLevel[];
}>;

export type PrismaReadOnlyOptions = PrismaClientOptions;
export type PrismaWriteOnlyOptions = PrismaClientOptions;

export type PrismaReadWriteOptions = Readonly<{
  ro: PrismaReadOnlyOptions;
  rw: PrismaWriteOnlyOptions;
}>;
