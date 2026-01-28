/**
 * Options used to create a Prisma client backed by a pg.Pool via @prisma/adapter-pg.
 *
 * This library does not ship a NestJS module. Applications assemble providers themselves
 * and pass these options to the provider factory.
 *
 * @example
 *
 * ```ts
 * const write: PrismaClientOptions = {
 *   url: process.env.DATABASE_URL!,
 *   appName: "api",
 *   eagerConnect: true,
 *   pool: { max: 20 },
 *   log: ["warn", "error"],
 * };
 * ```
 */
export interface PrismaClientOptions {
  /**
   * PostgreSQL connection string.
   *
   * @example
   *
   * ```ts
   * url: "postgresql://user:pass@localhost:5432/mydb?schema=public"
   * ```
   */
  url: string;

  /**
   * Sets PostgreSQL `application_name`. Useful for tracing connections in `pg_stat_activity`.
   *
   * @example
   *
   * ```ts
   * appName: "api-ro"
   * ```
   */
  appName?: string;

  /**
   * If true, calls `$connect()` during NestJS `onModuleInit()` (via PrismaClientManager).
   *
   * Note:
   * - `onModuleInit()` runs only if the manager provider is instantiated.
   * - `createPrismaProviders()` can force instantiation at bootstrap via `eagerInit`.
   */
  eagerConnect?: boolean;

  /**
   * pg.Pool settings.
   */
  pool?: Readonly<{
    /** Maximum pool size. Default: 15 */
    max?: number;

    /** Idle connection timeout in ms. Default: 10_000 */
    idleTimeoutMillis?: number;

    /** Connection acquisition timeout in ms. Default: 5_000 */
    connectionTimeoutMillis?: number;
  }>;

  /**
   * Prisma log configuration.
   *
   * @example
   *
   * ```ts
   * log: ["warn", "error"]
   * ```
   */
  log?: any;
}
