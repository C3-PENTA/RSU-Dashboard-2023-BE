import { IsEmail, IsNotEmpty, MaxLength, IsString, MinLength } from 'class-validator';
import { IsStrongPassword } from '../service/password.validator';

export class SignUpDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @IsStrongPassword()
  @IsNotEmpty()
  password: string;
}