import { Module } from '@nestjs/common';
import { ViewerService } from './viewer.service';
import { ViewerRepository } from './repository/viewer.repository';
import { ViewerController } from './viewer.contorller';

@Module({
  controllers: [ViewerController],
  providers: [ViewerService, ViewerRepository],
})
export class ViewerModule {}
