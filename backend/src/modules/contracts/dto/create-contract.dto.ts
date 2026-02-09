import { IsDateString, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateContractDraftDto {
  @IsOptional()
  @IsUUID()
  contractId?: string;

  @IsDateString()
  effectiveFrom!: string;

  @IsDateString()
  effectiveTo!: string;

  @IsString()
  termsHash!: string;
}
