import { Global, Module } from '@nestjs/common';
import { PrismaReadService } from './prisma-read.service';

@Global()
@Module({
  providers: [PrismaReadService],
  exports: [PrismaReadService],
})
export class PrismaModule {}
