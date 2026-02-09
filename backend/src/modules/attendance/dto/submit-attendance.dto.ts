import { Type } from "class-transformer";
import { IsDateString, IsNumber, IsUUID, Min } from "class-validator";

export class SubmitAttendanceDto {
  @IsUUID()
  freelancerId!: string;

  @IsUUID()
  contractId!: string;

  @IsDateString()
  workDate!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hours!: number;
}
