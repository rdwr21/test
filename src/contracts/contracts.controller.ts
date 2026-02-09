import { Body, Controller, Param, Post } from "@nestjs/common";
import { ActorId } from "../common/decorators/actor-id.decorator";
import { ContractsService } from "./contracts.service";
import { CreateContractDto } from "./dto/create-contract.dto";
import { CreateContractVersionDto } from "./dto/create-contract-version.dto";
import { SignContractVersionDto } from "./dto/sign-contract-version.dto";

@Controller("contracts")
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  async createContract(@Body() dto: CreateContractDto, @ActorId() actorUserId: string) {
    return this.contractsService.createContract(dto, actorUserId);
  }

  @Post(":id/versions")
  async createVersion(
    @Param("id") contractId: string,
    @Body() dto: CreateContractVersionDto,
    @ActorId() actorUserId: string,
  ) {
    return this.contractsService.createVersion(contractId, dto, actorUserId);
  }

  @Post(":id/versions/:versionId/sign")
  async signVersion(
    @Param("id") contractId: string,
    @Param("versionId") versionId: string,
    @Body() dto: SignContractVersionDto,
    @ActorId() actorUserId: string,
  ) {
    const signedAt = dto.signedAt ? new Date(dto.signedAt) : undefined;
    return this.contractsService.signVersion(contractId, versionId, actorUserId, signedAt);
  }
}
