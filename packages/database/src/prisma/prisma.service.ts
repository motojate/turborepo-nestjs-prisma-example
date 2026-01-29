import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { PrismaClientLike } from "./prisma.types";
import { PRISMA_OPTIONS, PrismaModuleOptions } from "./prisma.module";
import { createPrismaPgClient } from "./prisma-pg.factory";
import { Pool } from "pg";

@Injectable()
export class PrismaService<TClient extends PrismaClientLike = PrismaClientLike>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly client: TClient;
  private readonly pool: Pool;
  private readonly eagerConnect: boolean;

  constructor(@Inject(PRISMA_OPTIONS) options: PrismaModuleOptions<TClient>) {
    const { prisma, pool } = createPrismaPgClient({
      url: options.url,
      appName: options.appName,
      clientCtor: options.clientCtor,
      log: options.log,
      pool: options.pool,
      readOnlyGuard: options.readOnlyGuard,
    });

    this.client = prisma;
    this.pool = pool;
    this.eagerConnect = options.eagerConnect ?? true;

    return new Proxy(this, {
      get: (target, prop, receiver) => {
        if (prop in target) {
          const v = Reflect.get(target, prop, receiver) as unknown;
          return v;
        }
        const c = target.client as unknown as Record<PropertyKey, unknown>;
        return c[prop];
      },
    });
  }
  async onModuleInit() {
    if (!this.eagerConnect) return;
    await this.client.$connect();
  }
  async onModuleDestroy() {
    await this.client.$disconnect();
    await this.pool.end();
  }
}
