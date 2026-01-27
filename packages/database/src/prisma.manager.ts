import { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Pool } from "pg";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaCreateResult } from "./prisma.factory";

export class PrismaClientManager implements OnModuleInit, OnModuleDestroy {
  #pool: Pool;
  #prisma: PrismaClient;
  #eagerConnect: boolean;

  constructor(created: PrismaCreateResult) {
    this.#pool = created.pool;
    this.#prisma = created.prisma;
    this.#eagerConnect = created.eagerConnect;
  }

  getClient(): PrismaClient {
    return this.#prisma;
  }

  async onModuleInit() {
    if (!this.#eagerConnect) return;
    await this.#prisma.$connect();
  }

  async onModuleDestroy() {
    await this.#prisma.$disconnect();
    await this.#pool.end();
  }
}
