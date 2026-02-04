import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './shared/database/prisma.module';
import { ViewerModule } from './viewer/viewer.module';
import { RendererModule } from './renderer/renderer.module';
import { RendererHistoryModule } from './renderer-history/renderer-history.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ViewerModule,
    RendererModule,
    RendererHistoryModule,
    MetricsModule,
  ],
})
export class AppModule {}
