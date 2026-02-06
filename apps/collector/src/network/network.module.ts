import { Module } from '@nestjs/common';
import { HTTP_AGENT_TOKEN } from 'src/common/tokens/http-agent.token';
import { Agent } from 'undici';

@Module({
  providers: [
    {
      provide: HTTP_AGENT_TOKEN,
      useFactory: () => {
        return new Agent({
          keepAliveTimeout: 10000,
          keepAliveMaxTimeout: 10000,
          connections: 0,
          pipelining: 1,

          connect: {
            timeout: 1000,
          },
        });
      },
    },
  ],
  exports: [HTTP_AGENT_TOKEN],
})
export class NetworkModule {}
