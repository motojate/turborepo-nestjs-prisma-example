import { Module } from '@nestjs/common';
import { ViewerService } from './viewer.service';
import { ViewerRepository } from './repository/viewer.repository';
import { ViewerController } from './viewer.contorller';
import { RendererHistoryModule } from 'src/renderer-history/renderer-history.module';

@Module({
  imports: [RendererHistoryModule],
  controllers: [ViewerController],
  providers: [ViewerService, ViewerRepository],
})
export class ViewerModule {}
