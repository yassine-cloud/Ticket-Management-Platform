import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsNotEmpty()
  @IsString()
  username!: string;

  @IsNotEmpty()
  @IsString()
  displayName!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password!: string;
}
