import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const convertToUtc = (d: string) => {
  if (!d) return d;

  const hasTimezone = /(Z|[+-]\d{2}:?\d{2})$/.test(d);

  if (hasTimezone) return dayjs(d).utc().toDate();
  else return dayjs.tz(d, 'Asia/Seoul').utc().toDate();
};

const getSafeDailySettlementBoundary = (): Date => {
  const nowKst = dayjs().tz('Asia/Seoul');

  const settlementThreshold = nowKst.startOf('day').add(45, 'minute');

  if (nowKst.isBefore(settlementThreshold))
    return nowKst.subtract(1, 'day').startOf('day').toDate();
  else return nowKst.startOf('day').toDate();
};

const getSafeHourlySettlementBoundary = (): Date => {
  const nowKst = dayjs().tz('Asia/Seoul');

  const settlementThreshold = nowKst.startOf('hour').add(40, 'minute');

  if (nowKst.isBefore(settlementThreshold))
    return nowKst.subtract(1, 'hour').startOf('hour').toDate();
  else return nowKst.startOf('hour').toDate();
};

const mapFormatToUnit = (
  format: 'h' | 'd' | 'm' | 'y',
): 'hour' | 'day' | 'month' | 'year' => {
  switch (format) {
    case 'd':
      return 'day';
    case 'm':
      return 'month';
    case 'y':
      return 'year';
    case 'h':
      return 'hour';
  }
};

const dayjsUtc = (date?: dayjs.ConfigType) => dayjs(date).utc();

export const dateUtil = {
  convertToUtc,
  getSafeDailySettlementBoundary,
  getSafeHourlySettlementBoundary,
  mapFormatToUnit,
  dayjsUtc,
} as const;
