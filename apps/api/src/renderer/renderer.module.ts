import { Module } from '@nestjs/common';
import { RendererHistoryModule } from 'src/renderer-history/renderer-history.module';
import { RendererService } from './renderer.service';
import { RendererRepository } from './repository/renderer.repository';
import { RendererController } from './renderer.controller';

@Module({
  imports: [RendererHistoryModule],
  providers: [RendererService, RendererRepository],
  controllers: [RendererController],
})
export class RendererModule {}
