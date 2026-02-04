import { Controller, Get, Query } from '@nestjs/common';
import { ViewerService } from './viewer.service';
import { ViewerAggregateQueryDto } from './dtos/viewer-aggregate-query.dto';

@Controller('viewers')
export class ViewerController {
  constructor(private readonly viewerService: ViewerService) {}

  @Get('aggregate')
  async aggregate(@Query() dto: ViewerAggregateQueryDto) {
    const res = await this.viewerService.getAggregates(dto);

    return {
      signalKey: dto.signalKey,
      format: dto.format,
      startDateTime: dto.startDateTime,
      endDateTime: dto.endDateTime,
      rendererGroup: dto.rendererGroup,
      ...res,
    };
  }

  @Get('stats/started-at')
  async getStartedAtUtc(
    @Query('signalKey') signalKey: string,
    @Query('rendererGroup') rendererGroup?: string,
  ) {
    const startedAtUtc = await this.viewerService.getStartedAtUtc({
      signalKey,
      rendererGroup,
    });

    return { startedAtUtc };
  }
}
