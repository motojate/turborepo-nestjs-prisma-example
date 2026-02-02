import { Injectable } from '@nestjs/common';
import { ViewerRepository } from './repository/viewer.repository';
import { ViewerAggregateQueryDto } from './dtos/viewer-aggregate-query.dto';

@Injectable()
export class ViewerService {
  constructor(private readonly viewerRepository: ViewerRepository) {}

  async getAggregates(dto: ViewerAggregateQueryDto) {
    const rawDataPromise = await this.viewerRepository.findRawAggregates(dto);
    console.log(rawDataPromise);

    return rawDataPromise;
  }
}
