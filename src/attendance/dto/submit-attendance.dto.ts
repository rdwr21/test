import { Type } from "class-transformer";
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from "class-validator";

export class SubmitAttendanceDto {
  @IsUUID()
  freelancerId!: string;

  @IsUUID()
  contractId!: string;

  @IsUUID()
  workItemId!: string;

  @IsDateString()
  workDate!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hours!: number;

  @IsOptional()
  @IsNotEmpty()
  lateReason?: string;
}
