import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

export const RendererIdWithDateRangeDocs = () => {
  return applyDecorators(
    ApiOperation({
      summary: '렌더러 id 조회',
    }),
    ApiParam({ name: 'id', type: Number }),
    ApiQuery({
      name: 'startDateTime',
      required: false,
      type: String,
      example: '2025-05-01 00:00',
      description: '조회 시작 시간 (형식: yyyy-MM-dd HH:mm)',
    }),
    ApiQuery({
      name: 'endDateTime',
      required: false,
      type: String,
      example: '2025-05-02 00:00',
      description: '조회 종료 시간 (형식: yyyy-MM-dd HH:mm)',
    }),
  );
};

export const RendererGroupWithDateRangeDocs = () => {
  return applyDecorators(
    ApiOperation({
      summary: '렌더러 Group 조회',
    }),
    ApiParam({ name: 'groupName', type: String }),
    ApiQuery({
      name: 'startDateTime',
      required: false,
      type: String,
      example: '2025-05-01 00:00',
      description: '조회 시작 시간 (형식: yyyy-MM-dd HH:mm)',
    }),
    ApiQuery({
      name: 'endDateTime',
      required: false,
      type: String,
      example: '2025-05-02 00:00',
      description: '조회 종료 시간 (형식: yyyy-MM-dd HH:mm)',
    }),
  );
};

export const AllRendererWithDateRangeDocs = () => {
  return applyDecorators(
    ApiOperation({
      summary: '렌더러 전체 조회',
    }),

    ApiQuery({
      name: 'startDateTime',
      required: false,
      type: String,
      example: '2025-05-01 00:00',
      description: '조회 시작 시간 (형식: yyyy-MM-dd HH:mm)',
    }),
    ApiQuery({
      name: 'endDateTime',
      required: false,
      type: String,
      example: '2025-05-02 00:00',
      description: '조회 종료 시간 (형식: yyyy-MM-dd HH:mm)',
    }),
  );
};

export const RendererNameWithDateRangeDocs = () => {
  return applyDecorators(
    ApiOperation({
      summary: '렌더러 이름으로로 조회',
    }),
    ApiParam({ name: 'rendererName', type: String }),
    ApiQuery({
      name: 'startDateTime',
      required: false,
      type: String,
      example: '2025-05-01 00:00',
      description: '조회 시작 시간 (형식: yyyy-MM-dd HH:mm)',
    }),
    ApiQuery({
      name: 'endDateTime',
      required: false,
      type: String,
      example: '2025-05-02 00:00',
      description: '조회 종료 시간 (형식: yyyy-MM-dd HH:mm)',
    }),
  );
};
