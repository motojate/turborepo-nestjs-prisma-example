import { Injectable } from '@nestjs/common';
import { RendererViewRepository } from './repository/renderer-view.repository';
import { dateUtil } from 'src/common/utils/date.util';
import { RendererHistoryRepository } from './repository/renderer-history.repository';

@Injectable()
export class RendererHistoryService {
  constructor(
    private readonly rendererViewRepository: RendererViewRepository,
    private readonly rendererHistoryRepository: RendererHistoryRepository,
  ) {}
  async getHourlyStatsPeak(
    signalKey: string,
    startDateTime: Date,
    endDateTime: Date,
    rendererGroup?: string,
  ) {
    const boundaryDate = dateUtil.getSafeHourlySettlementBoundary();

    // 2. [Hourly Task] Boundary 이전 데이터 (집계 완료된 구간)
    const hourlyTask =
      startDateTime < boundaryDate
        ? this.rendererViewRepository.findHourlyAggregated(
            // *주1: Hourly용 메서드 호출
            signalKey,
            startDateTime,
            endDateTime < boundaryDate ? endDateTime : boundaryDate,
            rendererGroup,
          )
        : null;

    // 3. [Minutely Task] Boundary 이후 데이터 (아직 집계 안 된 최신 구간)
    const minutelyTask =
      endDateTime > boundaryDate
        ? this.rendererViewRepository.findMinutelyAggregated(
            // Minutely용 메서드 호출
            signalKey,
            startDateTime > boundaryDate ? startDateTime : boundaryDate,
            endDateTime,
            rendererGroup,
          )
        : null;

    const [hourlyPeak, minutelyPeak] = await Promise.all([
      hourlyTask,
      minutelyTask,
    ]);

    if (!hourlyPeak && !minutelyPeak) return {};

    if (!hourlyPeak) return minutelyPeak!;
    if (!minutelyPeak) return hourlyPeak!;

    return hourlyPeak.maxCcu >= minutelyPeak.maxCcu ? hourlyPeak : minutelyPeak;
  }

  async getDailyStatsPeak(
    signalKey: string,
    startDateTime: Date,
    endDateTime: Date,
    rendererGroup?: string,
  ) {
    const boundaryDate = dateUtil.getSafeDailySettlementBoundary();

    const dailyTask =
      startDateTime < boundaryDate
        ? this.rendererViewRepository.findDailyAggregated(
            signalKey,
            startDateTime,
            endDateTime < boundaryDate ? endDateTime : boundaryDate,
            rendererGroup,
          )
        : null;

    const minutelyTask =
      endDateTime > boundaryDate
        ? this.rendererViewRepository.findMinutelyAggregated(
            signalKey,
            startDateTime > boundaryDate ? startDateTime : boundaryDate,
            endDateTime,
            rendererGroup,
          )
        : null;

    const [dailyPeak, minutelyPeak] = await Promise.all([
      dailyTask,
      minutelyTask,
    ]);

    if (!dailyPeak && !minutelyPeak) return {};

    if (!dailyPeak) return minutelyPeak;
    if (!minutelyPeak) return dailyPeak;

    return dailyPeak.maxCcu >= minutelyPeak.maxCcu ? dailyPeak : minutelyPeak;
  }

  async getStartedAtUtc(dto: { signalKey: string; rendererGroup?: string }) {
    return this.rendererViewRepository.findOldestDate(
      dto.signalKey,
      dto.rendererGroup,
    );
  }

  async getRendererGroupsBySignalKey(signalKey: string) {
    return this.rendererHistoryRepository.findRendererGroupsBySignalKey(
      signalKey,
    );
  }
}
