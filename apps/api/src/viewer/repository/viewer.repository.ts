import { Injectable } from '@nestjs/common';
import { PrismaReadService } from 'src/shared/database/prisma-read.service';

@Injectable()
export class ViewerRepository {
  constructor(private readonly prisma: PrismaReadService) {}

  // async findRawAggregates
}
