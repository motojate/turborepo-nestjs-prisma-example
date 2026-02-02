import { Controller, Get, Query } from '@nestjs/common';
import { ViewerService } from './viewer.service';
import { ViewerAggregateQueryDto } from './dtos/viewer-aggregate-query.dto';

@Controller('viewers')
export class ViewerController {
  constructor(private readonly viewerService: ViewerService) {}

  @Get('aggregate')
  async aggregate(@Query() dto: ViewerAggregateQueryDto) {
    const res = await this.viewerService.getAggregates(dto);

    return res;
  }
}
