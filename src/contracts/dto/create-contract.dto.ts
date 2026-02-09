import { Type } from "class-transformer";
import { IsDateString, IsNotEmpty, IsNumber, IsString, IsUUID, Min } from "class-validator";

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
