import { Type } from "class-transformer";
import { IsDateString, IsNotEmpty, IsNumber, IsString, Min } from "class-validator";

export class CreateContractVersionDto {
  @IsDateString()
  effectiveFrom!: string;

  @IsDateString()
  effectiveTo!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hourlyRate!: number;

  @IsString()
  @IsNotEmpty()
  termsHash!: string;
}
