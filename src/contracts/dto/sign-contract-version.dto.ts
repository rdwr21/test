import { IsDateString, IsOptional } from "class-validator";

export class SignContractVersionDto {
  @IsOptional()
  @IsDateString()
  signedAt?: string;
}
