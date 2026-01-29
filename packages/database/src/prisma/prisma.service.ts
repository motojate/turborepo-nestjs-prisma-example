import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from "@nestjs/common";
import type { Pool } from "pg";
import type { PrismaClientLike } from "./prisma.types";
import type {
  PrismaInstance,
  PrismaModuleOptions,
} from "./prisma.module-options";
import {
  PRISMA_CLIENT,
  PRISMA_INSTANCE,
  PRISMA_OPTIONS,
} from "./prisma.tokens";

@Injectable()
export class PrismaService<TClient extends PrismaClientLike = PrismaClientLike>
  implements OnModuleInit, OnModuleDestroy
{
  public readonly prisma: TClient;
  public readonly pool?: Pool;

  constructor(
    @Inject(PRISMA_INSTANCE) instance: PrismaInstance<TClient>,
    @Optional()
    @Inject(PRISMA_OPTIONS)
    private readonly options?: PrismaModuleOptions<TClient>,
    // 편의상 client 토큰도 유지하고 싶으면 주입 가능 (필요 없으면 지워도 됨)
    @Optional() @Inject(PRISMA_CLIENT) _client?: TClient,
  ) {
    this.prisma = instance.prisma;
    this.pool = instance.pool;
  }

  async onModuleInit() {
    if (this.options?.eagerConnect) {
      await this.prisma.$connect();
    }
  }

  async onModuleDestroy() {
    // 기본값: disconnect는 true로 두는 게 안전
    const shouldDisconnect = this.options?.eagerDisconnect ?? true;

    if (!shouldDisconnect) return;

    try {
      await this.prisma.$disconnect();
    } finally {
      await this.pool?.end?.();
    }
  }
}
