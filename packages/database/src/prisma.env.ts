export interface PrismaEnv {
  DATABASE_RW_URL?: string;
  DATABASE_RO_URL?: string;

  DB_POOL_MAX?: string;
  DB_POOL_IDLE_TIMEOUT?: string;

  APP_NAME?: string;
}
