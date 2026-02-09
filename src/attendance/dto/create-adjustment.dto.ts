import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, Min } from "class-validator";

export class CreateAdjustmentDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  adjustedHours!: number;

  @IsNotEmpty()
  reason!: string;
}
