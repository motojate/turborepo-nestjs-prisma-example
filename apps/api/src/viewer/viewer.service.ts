import { Injectable } from '@nestjs/common';
import { ViewerRepository } from './repository/viewer.repository';
import { ViewerAggregateQueryDto } from './dtos/viewer-aggregate-query.dto';
import { RendererHistoryService } from 'src/renderer-history/renderer-history.service';
import { dateUtil } from 'src/common/utils/date.util';
import {
  ViewerAggregateRow,
  ViewerDbResultRaw,
  ViewerItem,
} from './viewer.types';
import { parseUserAgent } from 'src/common/utils/user-agent.util';

@Injectable()
export class ViewerService {
  constructor(
    private readonly viewerRepository: ViewerRepository,
    private readonly rendererHistoryService: RendererHistoryService,
  ) {}

  async getAggregates(dto: ViewerAggregateQueryDto) {
    const rawDataPromise = this.viewerRepository.findRawAggregates(dto);

    const ccuPromise =
      dto.format === 'd'
        ? this.rendererHistoryService.getDailyStatsPeak(
            dto.signalKey,
            dto.startDateTime,
            dto.endDateTime,
            dto.rendererGroup,
          )
        : this.rendererHistoryService.getHourlyStatsPeak(
            dto.signalKey,
            dto.startDateTime,
            dto.endDateTime,
            dto.rendererGroup,
          );
    const [rawData, ccu] = await Promise.all([rawDataPromise, ccuPromise]);

    const { totalViewers, sumAvgDuration } = rawData.reduce(
      (acc, cur) => ({
        totalViewers: acc.totalViewers + (cur.count ?? 0),
        sumAvgDuration: acc.sumAvgDuration + (cur.avg_duration ?? 0),
      }),
      { totalViewers: 0, sumAvgDuration: 0 },
    );

    const unit = dateUtil.mapFormatToUnit(dto.format);

    const result = this.transformAndFillViewerData(
      rawData,
      dto.startDateTime,
      dto.endDateTime,
      unit,
    );

    const finalAvgDurationSec =
      rawData.length === 0
        ? 0
        : Math.round((sumAvgDuration / rawData.length) * 100) / 100;

    return {
      totalViewers,
      totalAvgDurationSec: finalAvgDurationSec,
      ccu,
      viewers: result,
    };
  }
  async getStartedAtUtc(dto: { signalKey: string; rendererGroup?: string }) {
    return this.rendererHistoryService.getStartedAtUtc(dto);
  }

  private transformAndFillViewerData(
    data: ViewerDbResultRaw[],
    startDateTime: Date,
    endDateTime: Date,
    unit: 'hour' | 'day' | 'month' | 'year',
  ) {
    const filledData: ViewerAggregateRow[] = [];

    let current = dateUtil.dayjsUtc(startDateTime);
    const end = dateUtil.dayjsUtc(endDateTime);

    const dataMap = new Map<
      number,
      { count: number; avg: number; items: ViewerItem[] }
    >(
      data.map((item) => {
        const parsedViewers: ViewerItem[] = (item.viewers ?? []).map(
          (viewer) => ({
            ...viewer,
            viewerAgent: parseUserAgent(viewer.viewerAgent),
          }),
        );

        return [
          dateUtil.dayjsUtc(item.time_bucket).valueOf(),
          {
            count: Number(item.count),
            avg: item.avg_duration ?? 0,
            items: parsedViewers,
          },
        ];
      }),
    );

    while (current.isBefore(end)) {
      const key = current.valueOf();
      const record = dataMap.get(key) ?? { count: 0, avg: 0, items: [] };

      filledData.push({
        time: current.toDate(),
        count: record.count,
        avgDurationSec: Math.round(record.avg * 100) / 100,
        items: record.items,
      });

      current = current.add(1, unit);
    }
    return filledData;
  }
}
