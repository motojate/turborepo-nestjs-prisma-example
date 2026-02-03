import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const convertToUtc = (d: string) => {
  if (!d) return d;

  const hasTimezone = /(Z|[+-]\d{2}:?\d{2})$/.test(d);

  if (hasTimezone) return dayjs(d).utc().toDate();
  else return dayjs.tz(d, 'Asia/Seoul').utc().toDate();
};
