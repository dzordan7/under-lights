import {
  IsString,
  IsInt,
  IsEnum,
  IsOptional,
  IsEmail,
  IsDateString,
} from 'class-validator';
import { Position } from '../position.enum';

export class CreatePlayerDto {
  @IsString()
  ime!: string;

  @IsString()
  prezime!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsInt()
  broj_dresa!: number;

  @IsEnum(Position)
  pozicija!: Position;

  @IsOptional()
  @IsDateString()
  datum_rodjenja?: string;
}
