import { IsOptional, IsString } from "class-validator";

export class ApproveContractVersionDto {
  @IsOptional()
  @IsString()
  note?: string;
}
