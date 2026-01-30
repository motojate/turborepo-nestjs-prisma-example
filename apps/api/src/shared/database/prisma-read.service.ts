import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  PrismaClient,
  applyReadOnlyGuard,
  createPrismaPgClient,
} from '@renderer-orchestrator/database';

@Injectable()
export class PrismaReadService implements OnModuleInit, OnModuleDestroy {
  public readonly db: PrismaClient;
  private readonly dispose: () => Promise<void>;

  constructor() {
    const { client, dispose } = createPrismaPgClient({
      appName: 'api',
      log: ['warn'],
      pool: {
        max: 50,
      },
      readOnlyGuard: true,
      url: process.env.DATABASE_RO_URL,
    });

    this.db = applyReadOnlyGuard(client);
    this.dispose = dispose;
  }

  async onModuleInit() {
    await this.db.$connect();
  }
  async onModuleDestroy() {
    await this.dispose();
  }
}
