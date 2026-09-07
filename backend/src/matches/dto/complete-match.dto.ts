import {
  IsInt,
  Min,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PlayerStatsDto {
  @IsInt()
  player_id!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  golovi?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  asistencije?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  zuti_kartoni?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  crveni_kartoni?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  odbrane?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  primljeni_golovi?: number;
}

export class CompleteMatchDto {
  @IsInt()
  @Min(0)
  rezultat_a!: number;

  @IsInt()
  @Min(0)
  rezultat_b!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlayerStatsDto)
  stats?: PlayerStatsDto[];
}
