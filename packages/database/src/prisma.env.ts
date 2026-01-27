export interface PrismaEnv {
  DATABASE_RO_URL?: string;
  DATABASE_RW_URL?: string;

  APP_NAME?: string;

  DB_POOL_MAX?: string; // number
  DB_POOL_IDLE_TIMEOUT?: string; // ms
  DB_POOL_CONN_TIMEOUT?: string; // ms

  DB_EAGER_CONNECT?: string; // "true" | "false"
}
