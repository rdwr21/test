import { Type } from "class-transformer";
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreateContractDto {
  @IsString()
  @IsNotEmpty()
  contractNumber!: string;

  @IsUUID()
  vendorOrgId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hourlyRate!: number;

  @IsString()
  @IsNotEmpty()
  termsHash!: string;
}

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
