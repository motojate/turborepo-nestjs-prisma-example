import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@renderer-orchestrator/database';
import { PRISMA_READ_CLIENT } from 'src/common/tokens/prisma.token';

@Injectable()
export class RendererRepository {
  constructor(
    @Inject(PRISMA_READ_CLIENT) private readonly prisma: PrismaClient,
  ) {}

  async findRendererGroupsBySignalKey(signalKey: string) {
    const data = await this.prisma.renderer.findMany({
      where: {
        signalKey,
        rendererGroup: {
          not: null,
        },
      },
      select: { rendererGroup: true },
      distinct: ['rendererGroup'],
    });

    return data.map((v) => v.rendererGroup);
  }
}
