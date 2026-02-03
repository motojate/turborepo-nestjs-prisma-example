import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { RendererService } from './renderer.service';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';

@Controller('renderers')
export class RendererController {
  constructor(private readonly rendererService: RendererService) {}

  @Get()
  @ApiOperation({ summary: '렌더러 정보 조회' })
  @ApiQuery({ name: 'signalKey', required: true, type: String })
  @ApiQuery({ name: 'rendererGroup', required: false, type: String })
  async getAllRenderers(
    @Query('signalKey') signalKey: string,
    @Query('rendererGroup') rendererGroup?: string,
  ) {
    if (!signalKey)
      throw new BadRequestException('signalKey는 필수 입력 사항입니다.');
    return this.rendererService.getAllRenderersByFilter(
      signalKey,
      rendererGroup,
    );
  }

  @Get('groups')
  async getRendererGroups(@Query('signalKey') signalKey: string) {
    if (!signalKey)
      throw new BadRequestException('signalKey는 필수 입력 사항입니다.');
    const rendererGroups =
      await this.rendererService.getRendererGroupsBySignalKey(signalKey);
    return {
      signalKey,
      groups: rendererGroups,
    };
  }
}
