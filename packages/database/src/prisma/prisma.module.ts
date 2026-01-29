import {
  DynamicModule,
  InjectionToken,
  Module,
  ModuleMetadata,
  OptionalFactoryDependency,
  Provider,
} from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import type {
  PrismaClientCtor,
  PrismaClientLike,
  PrismaLogLevel,
} from "./prisma.types";
import type { PgPoolOptions } from "./prisma-pg.factory";

export type PrismaModuleOptions<TClient extends PrismaClientLike> = Readonly<{
  clientCtor: PrismaClientCtor<TClient>;

  url: string;
  appName?: string;
  log?: readonly PrismaLogLevel[];
  pool?: PgPoolOptions;

  /**
   * read-only guard 적용 여부 (레플리카를 read 전용으로 쓰는 경우 추천)
   */
  readOnlyGuard?: boolean;

  /**
   * 기존처럼 module init 시 connect/disconnect를 PrismaService가 수행
   */
  eagerConnect?: boolean;

  isGlobal?: boolean;
}>;

export type PrismaModuleAsyncOptions<TClient extends PrismaClientLike> =
  Readonly<{
    clientCtor: PrismaClientCtor<TClient>;
    isGlobal?: boolean;

    imports?: ModuleMetadata["imports"];
    inject?: (InjectionToken | OptionalFactoryDependency)[];
    useFactory: (
      ...args: readonly unknown[]
    ) =>
      | Promise<Omit<PrismaModuleOptions<TClient>, "clientCtor" | "isGlobal">>
      | Omit<PrismaModuleOptions<TClient>, "clientCtor" | "isGlobal">;
  }>;

export const PRISMA_OPTIONS = Symbol("PRISMA_OPTIONS");

@Module({})
export class PrismaModule {
  static register<TClient extends PrismaClientLike>(
    options: PrismaModuleOptions<TClient>,
  ): DynamicModule {
    const providers: Provider[] = [
      { provide: PRISMA_OPTIONS, useValue: options },
      PrismaService,
    ];

    return {
      module: PrismaModule,
      global: options.isGlobal ?? false,
      providers,
      exports: [PrismaService],
    };
  }

  static registerAsync<TClient extends PrismaClientLike>(
    options: PrismaModuleAsyncOptions<TClient>,
  ): DynamicModule {
    const optionsProvider: Provider = {
      provide: PRISMA_OPTIONS,
      useFactory: async (...args: readonly unknown[]) => {
        const partial = await options.useFactory(...args);
        return {
          ...partial,
          cientCtor: options.clientCtor,
          isGlobal: options.isGlobal ?? false,
        };
      },
      inject: options.inject ?? [],
    };

    return {
      module: PrismaModule,
      global: options.isGlobal ?? false,
      imports: options.imports ?? [],
      providers: [optionsProvider, PrismaService],
      exports: [PrismaService],
    };
  }
}
