import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';
import { Role } from '../../users/role.enum';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  ime!: string;

  @IsEnum(Role)
  uloga!: Role;
}
