import { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Pool } from "pg";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaCreateResult } from "./prisma.factory";

/**
 * Lifecycle manager for PrismaClient + pg.Pool.
 *
 * - Optionally connects eagerly during NestJS bootstrap.
 * - Ensures both PrismaClient and Pool are closed on shutdown.
 */
export class PrismaClientManager implements OnModuleInit, OnModuleDestroy {
  readonly #pool: Pool;
  readonly #prisma: PrismaClient;
  readonly #eagerConnect: boolean;

  #connected = false;
  #destroyed = false;

  constructor(created: PrismaCreateResult) {
    this.#pool = created.pool;
    this.#prisma = created.prisma;
    this.#eagerConnect = created.eagerConnect;
  }

  getClient(): PrismaClient {
    return this.#prisma;
  }

  async onModuleInit(): Promise<void> {
    if (!this.#eagerConnect) return;
    if (this.#connected) return;

    await this.#prisma.$connect();
    this.#connected = true;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.#destroyed) return;
    this.#destroyed = true;

    try {
      await this.#prisma.$disconnect();
    } finally {
      await this.#pool.end().catch(() => undefined);
    }
  }
}
