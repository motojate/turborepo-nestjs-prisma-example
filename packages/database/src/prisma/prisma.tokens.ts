import type { InjectionToken } from "@nestjs/common";
import type { PrismaClientLike } from "./prisma.types";
import type {
  PrismaInstance,
  PrismaModuleOptions,
} from "./prisma.module-options";

// 옵션
export const PRISMA_OPTIONS = Symbol("PRISMA_OPTIONS") as InjectionToken<
  PrismaModuleOptions<PrismaClientLike>
>;

// 생성된 instance (prisma + pool)
export const PRISMA_INSTANCE = Symbol("PRISMA_INSTANCE") as InjectionToken<
  PrismaInstance<PrismaClientLike>
>;

// prisma client만
export const PRISMA_CLIENT = Symbol(
  "PRISMA_CLIENT",
) as InjectionToken<PrismaClientLike>;

// pg pool (accelerate면 null)
export const PRISMA_POOL = Symbol("PRISMA_POOL") as InjectionToken<unknown>;
