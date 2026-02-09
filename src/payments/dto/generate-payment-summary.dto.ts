import { IsDateString, IsUUID } from "class-validator";

export class GeneratePaymentSummaryDto {
  @IsUUID()
  freelancerId!: string;

  @IsUUID()
  contractId!: string;

  @IsDateString()
  periodStart!: string;

  @IsDateString()
  periodEnd!: string;
}
