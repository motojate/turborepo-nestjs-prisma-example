import { Module } from '@nestjs/common';
import { NETWORK_TOKENS } from 'src/common/tokens';
import { Agent, WebSocket as UndiciWS } from 'undici';

const agentFactory = () => {
  return new Agent({
    keepAliveTimeout: 10_000,
    connections: 0,
    pipelining: 1,
    connect: { timeout: 3_000 },
  });
};

const wsFactory = (agent: Agent) => {
  return (url: string) => new UndiciWS(url, { dispatcher: agent });
};

export type WebSocketFactory = ReturnType<typeof wsFactory>;

@Module({
  providers: [
    {
      provide: NETWORK_TOKENS.HTTP_AGENT,
      useFactory: agentFactory,
    },
    {
      provide: NETWORK_TOKENS.WS_FACTORY,
      inject: [NETWORK_TOKENS.HTTP_AGENT],
      useFactory: wsFactory,
    },
  ],
  exports: [NETWORK_TOKENS.WS_FACTORY],
})
export class NetworkModule {}
