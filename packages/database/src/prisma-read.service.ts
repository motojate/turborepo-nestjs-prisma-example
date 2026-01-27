import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { PRISMA_RO } from "./prisma.tokens";
import { PrismaClient } from "./generated/prisma/client";

@Injectable()
export class PrismaReadService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaReadService.name);

  constructor(@Inject(PRISMA_RO) private readonly prisma: PrismaClient) {}

  async onModuleInit() {
    await this.prisma.$connect();
    this.logger.log("Prisma RO connected");
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
    this.logger.log("Prisma RO disconnected");
  }
}
