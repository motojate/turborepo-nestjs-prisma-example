import { DynamicModule, Module, Provider } from "@nestjs/common";
import type {
  PrismaModuleAsyncOptions,
  PrismaModuleOptions,
} from "./prisma.module-options";
import { PrismaService } from "./prisma.service";
import {
  PRISMA_CLIENT,
  PRISMA_INSTANCE,
  PRISMA_OPTIONS,
  PRISMA_POOL,
} from "./prisma.tokens";
import { PrismaClientLike, PrismaInstance } from "./prisma.types";

@Module({})
export class PrismaModule {
  static register<TClient extends PrismaClientLike>(
    options: PrismaModuleOptions<TClient>,
  ): DynamicModule {
    const providers = buildProviders(options);
    return {
      module: PrismaModule,
      global: options.isGlobal ?? false,
      providers,
      exports: [PrismaService, PRISMA_CLIENT, PRISMA_POOL],
    };
  }

  static registerAsync<TClient extends PrismaClientLike>(
    options: PrismaModuleAsyncOptions<TClient>,
  ): DynamicModule {
    const optionsProvider: Provider = {
      provide: PRISMA_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };

    const providers = buildProvidersFromToken();

    return {
      module: PrismaModule,
      global: options.isGlobal ?? false,
      imports: options.imports ?? [],
      providers: [optionsProvider, ...providers],
      exports: [PrismaService, PRISMA_CLIENT, PRISMA_POOL],
    };
  }
}

function buildProviders<TClient extends PrismaClientLike>(
  options: PrismaModuleOptions<TClient>,
): Provider[] {
  const instance = options.createInstance();
  return [
    { provide: PRISMA_OPTIONS, useValue: options },
    { provide: PRISMA_INSTANCE, useValue: instance },
    {
      provide: PRISMA_CLIENT,
      useFactory: (i: PrismaInstance<TClient>) => i.prisma,
      inject: [PRISMA_INSTANCE],
    },
    {
      provide: PRISMA_POOL,
      useFactory: (i: PrismaInstance<TClient>) => i.pool ?? null,
      inject: [PRISMA_INSTANCE],
    },
    PrismaService,
  ];
}

function buildProvidersFromToken(): Provider[] {
  return [
    {
      provide: PRISMA_INSTANCE,
      inject: [PRISMA_OPTIONS],
      useFactory: (opts: PrismaModuleOptions<PrismaClientLike>) =>
        opts.createInstance(),
    },
    {
      provide: PRISMA_CLIENT,
      inject: [PRISMA_INSTANCE],
      useFactory: (i: PrismaInstance<PrismaClientLike>) => i.prisma,
    },
    {
      provide: PRISMA_POOL,
      inject: [PRISMA_INSTANCE],
      useFactory: (i: PrismaInstance<PrismaClientLike>) => i.pool ?? null,
    },
    PrismaService,
  ];
}
