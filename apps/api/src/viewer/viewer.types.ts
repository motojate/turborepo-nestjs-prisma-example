import { ParsedUserAgent } from 'src/common/types/user-agent.type';

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

export type ViewerItem = Omit<RawViewerItem, 'viewerAgent'> & {
  viewerAgent: ParsedUserAgent;
};

export type ViewerAggregateRow = {
  time: Date;
  count: number;
  avgDurationSec: number;
  items: ViewerItem[];
};
