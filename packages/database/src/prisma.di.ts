import type { Provider } from "@nestjs/common";
import { Inject } from "@nestjs/common";

import { PrismaClient } from "./generated/prisma/client";
import { PrismaClientOptions } from "./prisma.types";
import { PrismaClientManager } from "./prisma.manager";
import { createReadClient, createWriteClient } from "./prisma.factory";

type PrismaProvidersBaseOptions = Readonly<{
  /**
   * Connection name for multi-connection setups.
   * Default: "default"
   */
  name?: string;

  /**
   * If true, forces manager instantiation at bootstrap so `eagerConnect` is applied reliably.
   * Default: true
   */
  eagerInit?: boolean;
}>;

type PrismaProvidersWithWrite = Readonly<{
  /** Read/write connection options. */
  write: PrismaClientOptions;

  /**
   * Read-only connection options.
   * If omitted, the write options are reused for the read-only client.
   */
  read?: PrismaClientOptions;
}>;

type PrismaProvidersReadOnlyOnly = Readonly<{
  write?: undefined;

  /** Read-only connection options. */
  read: PrismaClientOptions;
}>;

/**
 * Options for creating Prisma-related NestJS providers.
 *
 * Supports:
 * - write/read split
 * - write-only (read reuses write)
 * - read-only applications (no write providers created)
 */
export type PrismaProvidersOptions = PrismaProvidersBaseOptions &
  (PrismaProvidersWithWrite | PrismaProvidersReadOnlyOnly);

function token(name: string, scope: string): symbol {
  return Symbol.for(`@db/prisma/${name}/${scope}`);
}
function rwManagerToken(name: string): symbol {
  return token(name, "manager:rw");
}
function roManagerToken(name: string): symbol {
  return token(name, "manager:ro");
}
function rwClientToken(name: string): symbol {
  return token(name, "client:rw");
}
function roClientToken(name: string): symbol {
  return token(name, "client:ro");
}
function initToken(name: string): symbol {
  return token(name, "init");
}

/**
 * Create Prisma Providers
 *
 * Builds a set of NestJS providers for Prisma without exposing a Nest module.
 * Applications compose these providers directly inside their own modules.
 *
 * Features:
 * - Supports write/read split or read-only mode
 * - Optional eager initialization at application bootstrap
 * - No token knowledge required in application code
 *
 * @example
 *
 * ```ts
 * const providers = createPrismaProviders({
 *   write: {
 *     url: process.env.DATABASE_URL!,
 *     eagerConnect: true,
 *   },
 *   read: {
 *     url: process.env.DATABASE_READ_URL!,
 *     eagerConnect: true,
 *   },
 * });
 * ```
 */
export function createPrismaProviders(
  options: PrismaProvidersOptions,
): Provider[] {
  const name = options.name ?? "default";
  const eagerInit = options.eagerInit ?? true;

  const providers: Provider[] = [];

  const readOptions =
    "write" in options && options.write
      ? (options.read ?? options.write)
      : options.read;

  const RO_MANAGER = roManagerToken(name);
  const RO_CLIENT = roClientToken(name);

  providers.push(
    {
      provide: RO_MANAGER,
      useFactory: () => new PrismaClientManager(createReadClient(readOptions)),
    },
    {
      provide: RO_CLIENT,
      useFactory: (m: PrismaClientManager) => m.getClient(),
      inject: [RO_MANAGER],
    },
  );

  if ("write" in options && options.write) {
    const RW_MANAGER = rwManagerToken(name);
    const RW_CLIENT = rwClientToken(name);

    providers.push(
      {
        provide: RW_MANAGER,
        useFactory: () =>
          new PrismaClientManager(createWriteClient(options.write)),
      },
      {
        provide: RW_CLIENT,
        useFactory: (m: PrismaClientManager) => m.getClient(),
        inject: [RW_MANAGER],
      },
    );

    if (eagerInit) {
      providers.push({
        provide: initToken(name),
        useFactory: () => true,
        inject: [RW_MANAGER, RO_MANAGER],
      });
    }

    return providers;
  }

  if (eagerInit) {
    providers.push({
      provide: initToken(name),
      useFactory: () => true,
      inject: [RO_MANAGER],
    });
  }

  return providers;
}

/**
 * Injects the write (read/write) PrismaClient.
 *
 * If the providers were created in read-only mode (no `write` option),
 * this token is not registered and DI will fail.
 *
 * @example
 *
 * ```ts
 * class UserRepo {
 *   constructor(@InjectPrismaWrite() private readonly prisma: PrismaClient) {}
 * }
 * ```
 */
export const InjectPrismaWrite = (name?: string) =>
  Inject(rwClientToken(name ?? "default"));

/**
 * Injects the read-only PrismaClient.
 *
 * @example
 *
 * ```ts
 * class UserQueryRepo {
 *   constructor(@InjectPrismaRead() private readonly prisma: PrismaClient) {}
 * }
 * ```
 */
export const InjectPrismaRead = (name?: string) =>
  Inject(roClientToken(name ?? "default"));

/**
 * Prisma Client (WRITE)
 *
 * Type-safe database client for TypeScript.
 */
export type PrismaWriteClient = PrismaClient;

/**
 * Prisma Client (READ ONLY)
 *
 * Type-safe database client for TypeScript.
 */
export type PrismaReadClient = PrismaClient;
