import { IsDateString, IsOptional } from "class-validator";

export class GetActiveContractByDateDto {
  @IsOptional()
  @IsDateString()
  date?: string;
}
