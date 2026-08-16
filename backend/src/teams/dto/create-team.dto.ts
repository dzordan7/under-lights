import { IsString, IsOptional } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  naziv!: string;

  @IsOptional()
  @IsString()
  logo_url?: string;
}
