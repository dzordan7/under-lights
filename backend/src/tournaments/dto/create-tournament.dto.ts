import {
  IsString,
  IsInt,
  Min,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateTournamentDto {
  @IsString()
  naziv!: string;

  @IsString()
  grad!: string;

  @IsOptional()
  @IsString()
  lokacija?: string;

  @IsInt()
  @Min(2)
  broj_grupa!: number;

  @IsOptional()
  @IsDateString()
  datum_pocetka?: string;
}
