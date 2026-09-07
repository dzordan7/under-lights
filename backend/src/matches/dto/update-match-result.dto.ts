import { IsInt, Min } from 'class-validator';

export class UpdateMatchResultDto {
  @IsInt()
  @Min(0)
  rezultat_a!: number;

  @IsInt()
  @Min(0)
  rezultat_b!: number;
}
