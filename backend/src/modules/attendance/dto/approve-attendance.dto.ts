import { IsOptional, IsString } from "class-validator";

export class ApproveAttendanceDto {
  @IsOptional()
  @IsString()
  note?: string;
}
