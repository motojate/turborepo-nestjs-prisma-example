import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { PrismaClient } from "./generated/prisma/client";
import { PRISMA_RW } from "./prisma.tokens";

@Injectable()
export class PrismaWriteService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaWriteService.name);

  constructor(@Inject(PRISMA_RW) private readonly prisma: PrismaClient) {}

  async onModuleInit() {
    await this.prisma.$connect();
    this.logger.log("Prisma RW connected");
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
    this.logger.log("Prisma RW disconnected");
  }
}
