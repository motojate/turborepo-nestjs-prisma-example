import { Global, Module } from '@nestjs/common';
import { createPrismaProviders } from '@renderer-orchestrator/database';

const prismaProviders = createPrismaProviders({
  name: 'default',
  read: {
    url: process.env.DATABASE_RO_URL,
    appName: 'api',
    eagerConnect: true,
    pool: { max: 50 },
    log: ['warn', 'error'],
  },
  eagerInit: true,
});

@Global()
@Module({
  providers: prismaProviders,
  exports: prismaProviders,
})
export class DatabaseModule {}
