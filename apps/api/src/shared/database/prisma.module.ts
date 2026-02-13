import {
  Global,
  Inject,
  Module,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import {
  PRISMA_READ_CLIENT,
  PRISMA_READ_HANDLE,
} from 'src/common/tokens/prisma.token';

import {
  createPrismaPgHandle,
  PrismaPgHandle,
} from '@renderer-orchestrator/database/src/prisma/client-postgresql';

@Global()
@Module({
  providers: [
    {
      provide: PRISMA_READ_HANDLE,
      useFactory: async () => {
        return createPrismaPgHandle({
          schema: 'api',
          appName: 'api',
          log: ['info', 'query', 'error', 'warn'],
          pool: { max: 50 },
          url: process.env.DATABASE_RO_URL,
          isReadonly: true,
        });
      },
    },
    {
      provide: PRISMA_READ_CLIENT,
      inject: [PRISMA_READ_HANDLE],
      useFactory: (h: PrismaPgHandle<'api'>) => h.client,
    },
  ],
  exports: [PRISMA_READ_CLIENT],
})
export class PrismaModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(PRISMA_READ_HANDLE) private readonly ro: PrismaPgHandle<'api'>,
  ) {}
  async onModuleInit() {
    await this.ro.ping();
    await this.ro.client.$connect();
  }
  async onModuleDestroy() {
    await this.ro.dispose();
  }
}
