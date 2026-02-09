import { Module } from '@nestjs/common';
import { StreamService } from './stream.service';
import { NetworkModule } from 'src/network/network.module';

@Module({
  imports: [NetworkModule],
  providers: [StreamService],
})
export class StreamModule {}
