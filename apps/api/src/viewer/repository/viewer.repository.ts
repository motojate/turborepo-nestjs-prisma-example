import { Injectable } from '@nestjs/common';
import { PrismaReadService } from 'src/shared/database/prisma-read.service';
import { ViewerAggregateQueryDto } from '../dtos/viewer-aggregate-query.dto';
import { Prisma } from '@renderer-orchestrator/database';

export type RawViewerItem = {
  sessionId: string;
  viewerId: string;
  viewerIp: string;
  viewerAgent: string;
  isInternalUser: boolean;
  isHost: boolean;
  startedAt: string;
  endedAt?: string | null;
  durationSec: number | null;
};

export type ViewerDbResultRaw = {
  time_bucket: Date;
  count: number;
  avg_duration: number | null;
  viewers: RawViewerItem[];
};

@Injectable()
export class ViewerRepository {
  constructor(private readonly prisma: PrismaReadService) {}

  async findRawAggregates(dto: ViewerAggregateQueryDto) {
    const { signalKey, format, startDateTime, endDateTime, rendererGroup } =
      dto;

    let unit: 'hour' | 'day' | 'month' | 'year';
    switch (format) {
      case 'h':
        unit = 'hour';
        break;
      case 'd':
        unit = 'day';
        break;
      case 'm':
        unit = 'month';
        break;
      case 'y':
        unit = 'year';
        break;
      default:
        unit = 'hour';
    }

    const interval =
      unit === 'hour'
        ? '1 hour'
        : unit === 'day'
          ? '1 day'
          : unit === 'month'
            ? '1 month'
            : '1 year';

    const conditions: Prisma.Sql[] = [
      Prisma.sql`signal_key = ${signalKey}`,
      Prisma.sql`started_at >= ${startDateTime}`,
      Prisma.sql`started_at < ${endDateTime}`,
    ];

    if (rendererGroup)
      conditions.push(Prisma.sql`renderer_group = ${rendererGroup}`);

    const whereClause = conditions.reduce(
      (acc, cur) => Prisma.sql`${acc} AND ${cur}`,
    );

    return this.prisma.db.$queryRaw<ViewerDbResultRaw[]>`
    SELECT 
      date_bin(${interval}::interval, started_at, ${startDateTime}) AS time_bucket,
      COUNT(*)::int AS count,
      AVG(duration_sec)::float AS avg_duration,
      COALESCE(
        json_agg(
          json_build_object(
            'sessionId', session_id,
            'viewerId', viewer_id,
            'viewerIp', viewer_ip,
            'viewerAgent', viewer_agent,
            'isInternalUser', is_internal_user,
            'isHost', is_host,
            'startedAt', started_at,
            'endedAt', ended_at,
            'durationSec', duration_sec
          )
          ORDER BY started_at ASC
        ),
        '[]'::json
        ) AS viewers
    FROM "VIEWER_HISTORY"
    WHERE ${whereClause}
    GROUP BY 1
    ORDER BY 1 ASC;
    `;
  }
}
