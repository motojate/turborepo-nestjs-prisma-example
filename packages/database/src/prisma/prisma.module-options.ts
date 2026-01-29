import type { Pool } from "pg";
import type {
  InjectionToken,
  ModuleMetadata,
  OptionalFactoryDependency,
} from "@nestjs/common";
import type { PrismaClientLike } from "./prisma.types";

/**
 * prisma + (선택) pool
 * - adapter-pg: pool 있음
 * - accelerate: pool 없음
 */
export type PrismaInstance<TClient extends PrismaClientLike> = Readonly<{
  prisma: TClient;
  pool?: Pool;
}>;

export type PrismaModuleOptions<TClient extends PrismaClientLike> = Readonly<{
  /**
   * global module 여부
   */
  isGlobal?: boolean;

  /**
   * module init 시 $connect 호출
   */
  eagerConnect?: boolean;

  /**
   * module destroy 시 $disconnect + pool.end
   */
  eagerDisconnect?: boolean;

  /**
   * Prisma 인스턴스 생성 책임은 "앱"이 진다.
   * (라이브러리는 generated/edge/accelerate 타입을 몰라도 됨)
   */
  createInstance: () => PrismaInstance<TClient>;
}>;

export type PrismaModuleAsyncOptions<TClient extends PrismaClientLike> =
  Readonly<{
    isGlobal?: boolean;

    imports?: ModuleMetadata["imports"];
    inject?: (InjectionToken | OptionalFactoryDependency)[];

    useFactory: (
      ...args: readonly unknown[]
    ) => PrismaModuleOptions<TClient> | Promise<PrismaModuleOptions<TClient>>;
  }>;
