import { Body, Controller, Post } from "@nestjs/common";
import { Roles } from "../auth/roles.decorator";
import { CreateContractDto } from "./dto/create-contract.dto";
import { ContractsService } from "./contracts.service";

@Controller("contracts")
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Roles("hr")
  @Post()
  async create(@Body() dto: CreateContractDto) {
    return this.contractsService.create(dto.startDate, dto.endDate, dto.status);
  }
}
