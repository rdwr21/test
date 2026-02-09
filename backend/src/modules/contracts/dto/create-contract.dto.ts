import { IsDateString, IsNotEmpty } from "class-validator";

export class CreateContractDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsNotEmpty()
  status!: string;
}
