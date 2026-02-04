import { Controller, Get } from '@nestjs/common';

@Controller('metrics')
export class MetricsController {
  @Get('urls')
  getAllSignalingUrls() {
    return [
      {
        key: 'z8a37xaz0',
        url: 'wss://ssr-staging.conworth.net/webrtc/server',
        description: 'staging signaling server',
      },
    ] as const;
  }
}
