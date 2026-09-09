import { IsInt, IsEnum } from 'class-validator';
import { AwardType } from '../award-type.enum';

export class CreateAwardDto {
  @IsInt()
  player_id!: number;

  @IsEnum(AwardType)
  tip!: AwardType;
}
