import { Inject, Injectable } from "@nestjs/common";
import { PrismaClient } from "./generated/prisma/client";
import { PRISMA_RW } from "./prisma.tokens";

@Injectable()
export class PrismaWriteService {
  constructor(@Inject(PRISMA_RW) private readonly prisma: PrismaClient) {}

  getClient(): PrismaClient {
    return this.prisma;
  }
}
