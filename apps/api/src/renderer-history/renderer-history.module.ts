import { Module } from '@nestjs/common';
import { RendererHistoryRepository } from './repository/renderer-history.repository';
import { RendererViewRepository } from './repository/renderer-view.repository';
import { RendererHistoryService } from './renderer-history.service';

@Module({
  providers: [
    RendererHistoryService,
    RendererHistoryRepository,
    RendererViewRepository,
  ],
  exports: [RendererHistoryService],
})
export class RendererHistoryModule {}
