import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { NETWORK_TOKENS } from 'src/common/tokens';
import { WebSocketFactory } from 'src/network/network.module';

@Injectable()
export class StreamService implements OnModuleInit {
  constructor(
    @Inject(NETWORK_TOKENS.WS_FACTORY)
    private readonly createSocket: WebSocketFactory,
  ) {}

  async onModuleInit() {}
}
