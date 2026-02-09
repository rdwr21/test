import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString({ each: true })
  roles?: string[];

  @IsOptional()
  @IsUUID()
  freelancerId?: string;
}
