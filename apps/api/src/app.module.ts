import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './shared/database/prisma.module';
import { ViewerModule } from './viewer/viewer.module';
import { RendererModule } from './renderer/renderer.module';
import { RendererHistoryModule } from './renderer-history/renderer-history.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ViewerModule,
    RendererModule,
    RendererHistoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
