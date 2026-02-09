import { Module } from '@nestjs/common';
import { NetworkModule } from './network/network.module';
import { StreamModule } from './stream/stream.module';

@Module({
  imports: [NetworkModule, StreamModule],
})
export class AppModule {}
