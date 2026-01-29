import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@renderer-orchestrator/database';
import { PrismaClient } from '@renderer-orchestrator/schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule.register({
      url: process.env.DATABASE_RO_URL,
      clientCtor: PrismaClient,
      isGlobal: true,
      readOnlyGuard: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
