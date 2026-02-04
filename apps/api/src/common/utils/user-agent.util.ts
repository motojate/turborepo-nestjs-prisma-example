import type { IBrowser, IOS, IDevice } from 'ua-parser-js';
import { UAParser } from 'ua-parser-js';
import type { ParsedUserAgent } from '../types/user-agent.type';

export const parseUserAgent = (userAgentString: string): ParsedUserAgent => {
  if (!userAgentString) {
    return {
      raw: '',
      summary: 'Unknown',
      browser: {} as IBrowser,
      os: {} as IOS,
      device: {} as IDevice,
    };
  }

  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  const browserName = result.browser.name || 'Unknown Browser';
  const browserVer = result.browser.version || '';
  const osName = result.os.name || 'Unknown OS';
  const osVer = result.os.version || '';

  const summary = `${browserName} ${browserVer} (${osName} ${osVer})`.trim();

  return {
    raw: userAgentString,
    summary,
    browser: result.browser,
    os: result.os,
    device: result.device,
  };
};
