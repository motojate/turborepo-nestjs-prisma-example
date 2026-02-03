import { Injectable } from '@nestjs/common';
import { ViewerRepository } from './repository/viewer.repository';
import { ViewerAggregateQueryDto } from './dtos/viewer-aggregate-query.dto';

@Injectable()
export class ViewerService {
  constructor(private readonly viewerRepository: ViewerRepository) {}

  async getAggregates(dto: ViewerAggregateQueryDto) {
    const rawDataPromise = this.viewerRepository.findRawAggregates(dto);

    // const ccuPromise =
    //   dto.format === 'd'
    //     ? this.rendererHistoryService.getDailyStatsPeak(
    //         dto.signalKey,
    //         dto.startDateTime,
    //         dto.endDateTime,
    //         dto.rendererGroup,
    //       )
    //     : this.rendererHistoryService.getHourlyStatsPeak(
    //         dto.signalKey,
    //         dto.startDateTime,
    //         dto.endDateTime,
    //         dto.rendererGroup,
    //       );
    console.log(rawDataPromise);

    return rawDataPromise;
  }
}
