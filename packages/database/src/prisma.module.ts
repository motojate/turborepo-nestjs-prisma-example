import { Module } from "@nestjs/common";
import { PrismaReadService } from "./prisma-read.service";
import { PrismaWriteService } from "./prisma-write.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PRISMA_RO, PRISMA_RW } from "./prisma.tokens";
import { PrismaEnv } from "./prisma.env";
import { createPrismaClientWithAdapterPg } from "./prisma.factory";

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PRISMA_RO,
      inject: [ConfigService],
      useFactory: (cfg: ConfigService<PrismaEnv, true>) => {
        const url = cfg.getOrThrow("DATABASE_RO_URL", { infer: true });
        const appName = cfg.get("APP_NAME", { infer: true }) ?? "ro-api";
        const max = cfg.get("DB_POOL_MAX", { infer: true });
        const idle = cfg.get("DB_POOL_IDLE_TIMEOUT", { infer: true });
        const { prisma } = createPrismaClientWithAdapterPg({
          url,
          appName,
          readOnly: true,
          pool: {
            max: max ? parseInt(max, 10) : 50,
            idleTimeoutMillis: idle ? parseInt(idle, 10) : 10000,
          },
        });
        return prisma;
      },
    },
    {
      provide: PRISMA_RW,
      inject: [ConfigService],
      useFactory: (cfg: ConfigService<PrismaEnv, true>) => {
        const url = cfg.getOrThrow("DATABASE_RW_URL", { infer: true });
        const appName = cfg.get("APP_NAME", { infer: true }) ?? "ro-api";
        const max = cfg.get("DB_POOL_MAX", { infer: true });
        const idle = cfg.get("DB_POOL_IDLE_TIMEOUT", { infer: true });
        const { prisma } = createPrismaClientWithAdapterPg({
          url,
          appName,
          readOnly: false,
          pool: {
            max: max ? parseInt(max, 10) : 15,
            idleTimeoutMillis: idle ? parseInt(idle, 10) : 10000,
          },
        });
        return prisma;
      },
    },

    PrismaReadService,
    PrismaWriteService,
  ],
  exports: [PrismaReadService, PrismaWriteService],
})
export class PrismaModule {}
