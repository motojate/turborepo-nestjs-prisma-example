import { Inject, Injectable } from "@nestjs/common";
import { PRISMA_RO } from "./prisma.tokens";
import { PrismaClient } from "./generated/prisma/client";

@Injectable()
export class PrismaReadService {
  constructor(@Inject(PRISMA_RO) private readonly prisma: PrismaClient) {}

  getClient(): PrismaClient {
    return this.prisma;
  }
}
