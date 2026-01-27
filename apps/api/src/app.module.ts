import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@renderer-orchestrator/database';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule.forReadOnly({
      url: 'test',
      appName: 'api',
      eagerConnect: false,
      pool: { max: 50 },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
