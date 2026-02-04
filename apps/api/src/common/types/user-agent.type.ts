import { IBrowser, IOS, IDevice } from 'ua-parser-js';

export type ParsedUserAgent = {
  raw: string;
  summary: string;
  browser: IBrowser;
  os: IOS;
  device: IDevice;
};
