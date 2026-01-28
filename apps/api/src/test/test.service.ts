import { Injectable } from '@nestjs/common';
import {
  InjectPrismaRead,
  PrismaReadClient,
} from '@renderer-orchestrator/database';

@Injectable()
export class TestService {
  constructor(@InjectPrismaRead() private readonly prisma: PrismaReadClient) {}
}
