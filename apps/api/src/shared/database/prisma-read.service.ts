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
  private readonly ping: () => Promise<void>;

  constructor() {
    const { client, dispose, ping } = createPrismaPgClient({
      appName: 'api',
      log: ['info', 'query', 'error', 'warn'],
      pool: {
        max: 50,
      },
      readOnlyGuard: true,
      url: process.env.DATABASE_RO_URL,
    });

    this.db = applyReadOnlyGuard(client);

    this.dispose = dispose;
    this.ping = ping;
  }

  async onModuleInit() {
    await this.ping();
    await this.db.$connect();
  }
  async onModuleDestroy() {
    await this.dispose();
  }
}
