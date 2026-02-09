import { IsUUID } from "class-validator";

export class CreateFreelancerDto {
  @IsUUID()
  userId!: string;
}
