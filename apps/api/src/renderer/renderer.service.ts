import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RendererService {
  private readonly logger = new Logger(RendererService.name);

  constructor() {}

  //   async getAllRenderersByFilter(signalKey: string, rendererGroup?: string) {
  //     return this
  //   }
}
