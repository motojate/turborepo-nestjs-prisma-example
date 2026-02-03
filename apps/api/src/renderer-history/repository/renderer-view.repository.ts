import { Inject, Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@renderer-orchestrator/database';
import { PRISMA_READ_CLIENT } from 'src/common/tokens/prisma.token';

const DEFAULT_AGGREGATED_VALUE = {
  time: '',
  avgCcu: 0,
  maxCcu: 0,
  minCcu: 0,
  medianCcu: 0,
  p95Ccu: 0,
  p99Ccu: 0,
  rendererCount: 0,
};

type BucketModelName = 'rendererStatsDaily' | 'rendererStatsMinutely';

type WhereByModel = {
  rendererStatsDaily: Prisma.RendererStatsDailyWhereInput;
  rendererStatsMinutely: Prisma.RendererStatsMinutelyWhereInput;
};

@Injectable()
export class RendererViewRepository {
  constructor(
    @Inject(PRISMA_READ_CLIENT) private readonly prisma: PrismaClient,
  ) {}

  async findMinutelyAggregated(
    signalKey: string,
    start: Date,
    end: Date,
    rendererGroup?: string,
  ) {
    const results = await this.prisma.rendererStatsMinutely.groupBy({
      by: ['bucket'],
      where: {
        signalKey,
        bucket: { gte: start, lt: end },
        rendererGroup,
      },
      _sum: {
        avgCcu: true,
        maxCcu: true,
        minCcu: true,
        medianCcu: true,
        p95Ccu: true,
        p99Ccu: true,
      },
      _count: {
        _all: true,
      },
      orderBy: { _sum: { maxCcu: 'desc' } },
      take: 1,
    });

    if (!results || results.length === 0) return DEFAULT_AGGREGATED_VALUE;

    const top = results[0];

    return {
      time: top.bucket,
      avgCcu: top._sum.avgCcu || 0,
      maxCcu: top._sum.maxCcu || 0,
      minCcu: top._sum.minCcu || 0,
      medianCcu: top._sum.medianCcu || 0,
      p95Ccu: top._sum.p95Ccu || 0,
      p99Ccu: top._sum.p99Ccu || 0,
      rendererCount: top._count._all,
    };
  }

  async findHourlyAggregated(
    signalKey: string,
    start: Date,
    end: Date,
    rendererGroup?: string,
  ) {
    const results = await this.prisma.rendererStatsHourly.groupBy({
      by: ['bucket'],
      where: {
        signalKey,
        bucket: { gte: start, lt: end },
        rendererGroup,
      },
      _sum: {
        avgCcu: true,
        maxCcu: true,
        minCcu: true,
        medianCcu: true,
        p95Ccu: true,
        p99Ccu: true,
      },
      _count: {
        _all: true,
      },
      orderBy: { _sum: { maxCcu: 'desc' } },
      take: 1,
    });

    if (!results || results.length === 0) return DEFAULT_AGGREGATED_VALUE;

    const top = results[0];

    return {
      time: top.bucket,
      avgCcu: top._sum.avgCcu || 0,
      maxCcu: top._sum.maxCcu || 0,
      minCcu: top._sum.minCcu || 0,
      medianCcu: top._sum.medianCcu || 0,
      p95Ccu: top._sum.p95Ccu || 0,
      p99Ccu: top._sum.p99Ccu || 0,
      rendererCount: top._count._all,
    };
  }

  async findDailyAggregated(
    signalKey: string,
    start: Date,
    end: Date,
    rendererGroup?: string,
  ) {
    const results = await this.prisma.rendererStatsDaily.groupBy({
      by: ['bucket'],
      where: {
        signalKey,
        bucket: { gte: start, lt: end },
        rendererGroup,
      },
      _sum: {
        avgCcu: true,
        maxCcu: true,
        minCcu: true,
        medianCcu: true,
        p95Ccu: true,
        p99Ccu: true,
      },
      _count: {
        _all: true,
      },
      orderBy: { _sum: { maxCcu: 'desc' } },
      take: 1,
    });

    if (!results || results.length === 0) return DEFAULT_AGGREGATED_VALUE;

    const top = results[0];

    return {
      time: top.bucket,
      avgCcu: top._sum.avgCcu || 0,
      maxCcu: top._sum.maxCcu || 0,
      minCcu: top._sum.minCcu || 0,
      medianCcu: top._sum.medianCcu || 0,
      p95Ccu: top._sum.p95Ccu || 0,
      p99Ccu: top._sum.p99Ccu || 0,
      rendererCount: top._count._all,
    };
  }

  async findOldestDate(signalKey: string, rendererGroup?: string) {
    const dailyOldest = await this.findFirstBucket(
      'rendererStatsDaily',
      signalKey,
      rendererGroup,
    );

    if (dailyOldest) return dailyOldest.bucket;

    const minutelyOldest = await this.findFirstBucket(
      'rendererStatsMinutely',
      signalKey,
      rendererGroup,
    );

    return minutelyOldest?.bucket || null;
  }

  private async findFirstBucket<M extends BucketModelName>(
    modelName: M,
    signalKey: string,
    rendererGroup?: string,
  ): Promise<{ bucket: Date } | null> {
    const where = {
      signalKey,
      ...(rendererGroup ? { rendererGroup } : {}),
    } satisfies WhereByModel[M];

    const findFirstByModel = {
      rendererStatsDaily: (w: Prisma.RendererStatsDailyWhereInput) =>
        this.prisma.rendererStatsDaily.findFirst({
          where: w,
          select: { bucket: true },
          orderBy: { bucket: 'asc' },
        }),
      rendererStatsMinutely: (w: Prisma.RendererStatsMinutelyWhereInput) =>
        this.prisma.rendererStatsMinutely.findFirst({
          where: w,
          select: { bucket: true },
          orderBy: { bucket: 'asc' },
        }),
    } as const;

    return findFirstByModel[modelName](where);
  }
}
