import { IsEmail, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @MaxLength(50)
    username: string;
  
    @IsOptional()
    @MaxLength(50)
    name: string;
  
    @IsOptional()
    @MaxLength(50)
    @IsEmail()
    email: string;
  
    @IsOptional()
    password: string;
  
    @IsOptional()    
    role: number;
  }