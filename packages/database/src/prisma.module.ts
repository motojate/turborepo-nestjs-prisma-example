import { DynamicModule, Module } from "@nestjs/common";
import {
  PRISMA_RO,
  PRISMA_RW,
  PRISMA_RO_MANAGER,
  PRISMA_RW_MANAGER,
} from "./prisma.tokens";
import { PrismaClientManager } from "./prisma.manager";
import { PrismaReadService } from "./prisma-read.service";
import { PrismaWriteService } from "./prisma-write.service";
import {
  PrismaReadOnlyOptions,
  PrismaReadWriteOptions,
  PrismaWriteOnlyOptions,
} from "./prisma.types";
import { createReadClient, createWriteClient } from "./prisma.factory";

@Module({})
export class PrismaModule {
  static forReadOnly(options: PrismaReadOnlyOptions): DynamicModule {
    return {
      module: PrismaModule,
      providers: [
        {
          provide: PRISMA_RO_MANAGER,
          useFactory: () => new PrismaClientManager(createReadClient(options)),
        },
        {
          provide: PRISMA_RO,
          inject: [PRISMA_RO_MANAGER],
          useFactory: (mgr: PrismaClientManager) => mgr.getClient(),
        },
        PrismaReadService,
      ],
      exports: [PRISMA_RO, PrismaReadService],
    };
  }

  static forWriteOnly(options: PrismaWriteOnlyOptions): DynamicModule {
    return {
      module: PrismaModule,
      providers: [
        {
          provide: PRISMA_RW_MANAGER,
          useFactory: () => new PrismaClientManager(createWriteClient(options)),
        },
        {
          provide: PRISMA_RW,
          inject: [PRISMA_RW_MANAGER],
          useFactory: (mgr: PrismaClientManager) => mgr.getClient(),
        },
        PrismaWriteService,
      ],
      exports: [PRISMA_RW, PrismaWriteService],
    };
  }

  static forReadWrite(options: PrismaReadWriteOptions): DynamicModule {
    return {
      module: PrismaModule,
      providers: [
        {
          provide: PRISMA_RO_MANAGER,
          useFactory: () =>
            new PrismaClientManager(createReadClient(options.ro)),
        },
        {
          provide: PRISMA_RO,
          inject: [PRISMA_RO_MANAGER],
          useFactory: (mgr: PrismaClientManager) => mgr.getClient(),
        },

        {
          provide: PRISMA_RW_MANAGER,
          useFactory: () =>
            new PrismaClientManager(createWriteClient(options.rw)),
        },
        {
          provide: PRISMA_RW,
          inject: [PRISMA_RW_MANAGER],
          useFactory: (mgr: PrismaClientManager) => mgr.getClient(),
        },

        PrismaReadService,
        PrismaWriteService,
      ],
      exports: [PRISMA_RO, PRISMA_RW, PrismaReadService, PrismaWriteService],
    };
  }
}
