import { Injectable, Logger } from '@nestjs/common';
import { RendererRepository } from './repository/renderer.repository';
import { RendererHistoryService } from 'src/renderer-history/renderer-history.service';

@Injectable()
export class RendererService {
  private readonly logger = new Logger(RendererService.name);

  constructor(
    private readonly rendererRepository: RendererRepository,
    private readonly rendererHistoryService: RendererHistoryService,
  ) {}

  async getAllRenderersByFilter(signalKey: string, rendererGroup?: string) {
    return this.rendererRepository.findAllRenderersByFilter(
      signalKey,
      rendererGroup,
    );
  }

  async getRendererGroupsBySignalKey(signalKey: string) {
    const rendererGroupsPromise =
      this.rendererRepository.findRendererGroupsBySignalKey(signalKey);
    const rendererHistoryGroupsPromise =
      this.rendererHistoryService.getRendererGroupsBySignalKey(signalKey);

    const [rendererGroups, rendererHistoryGroups] = await Promise.all([
      rendererGroupsPromise,
      rendererHistoryGroupsPromise,
    ]);

    const distinctRendererGroups = new Set([
      ...rendererGroups,
      ...rendererHistoryGroups,
    ]);

    return [...distinctRendererGroups].map((v) => ({ value: v }));
  }
}
