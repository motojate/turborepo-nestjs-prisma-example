import { Inject, Injectable } from '@nestjs/common';
import { ViewerAggregateQueryDto } from '../dtos/viewer-aggregate-query.dto';
import { Prisma, PrismaClient } from '@renderer-orchestrator/database';
import { PRISMA_READ_CLIENT } from 'src/common/tokens/prisma.token';
import { ViewerDbResultRaw } from '../viewer.types';

@Injectable()
export class ViewerRepository {
  constructor(
    @Inject(PRISMA_READ_CLIENT) private readonly prisma: PrismaClient,
  ) {}

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

    return this.prisma.$queryRaw<ViewerDbResultRaw[]>`
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
