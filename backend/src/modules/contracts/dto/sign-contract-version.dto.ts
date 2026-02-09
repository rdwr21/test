import { IsDateString, IsOptional, IsString } from "class-validator";

export class SignContractVersionDto {
  @IsOptional()
  @IsDateString()
  signedAt?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
