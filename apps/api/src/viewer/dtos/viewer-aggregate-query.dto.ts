import { IsDate, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { ViewerAggregateInterval } from '../enums/viewer-aggregate-interval.enum';
import { Transform } from 'class-transformer';
import { convertToUtc } from 'src/common/utils/date.util';

export class ViewerAggregateQueryDto {
  @IsString()
  @Length(1, 10)
  signalKey!: string;

  @IsEnum(ViewerAggregateInterval)
  format!: ViewerAggregateInterval;

  @Transform(({ value }) => convertToUtc(value))
  @IsDate()
  startDateTime!: Date;

  @Transform(({ value }) => convertToUtc(value))
  @IsDate()
  endDateTime!: Date;

  @IsOptional()
  @IsString()
  rendererGroup?: string;
}
