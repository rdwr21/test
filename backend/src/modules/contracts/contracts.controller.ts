import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { Roles } from "../auth/roles.decorator";
import { ApproveContractVersionDto } from "./dto/approve-contract-version.dto";
import { CreateContractDraftDto } from "./dto/create-contract.dto";
import { GetActiveContractByDateDto } from "./dto/get-active-contract.dto";
import { SignContractVersionDto } from "./dto/sign-contract-version.dto";
import { ContractsService } from "./contracts.service";

@Controller("contracts")
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Roles("hr")
  @Post("drafts")
  async createDraft(@Body() dto: CreateContractDraftDto) {
    return this.contractsService.createContractDraft(dto);
  }

  @Roles("hr")
  @Post(":id/versions/:versionId/approve")
  async approveVersion(
    @Param("id") contractId: string,
    @Param("versionId") versionId: string,
    @Body() _dto: ApproveContractVersionDto,
  ) {
    return this.contractsService.approveContractVersion(contractId, versionId);
  }

  @Roles("hr")
  @Post(":id/versions/:versionId/sign")
  async signVersion(
    @Param("id") contractId: string,
    @Param("versionId") versionId: string,
    @Body() dto: SignContractVersionDto,
  ) {
    const signedAt = dto.signedAt ? new Date(dto.signedAt) : undefined;
    return this.contractsService.signContractVersion(contractId, versionId, signedAt);
  }

  @Roles("hr", "pic", "admin")
  @Get(":id/active")
  async getActiveByDate(
    @Param("id") contractId: string,
    @Query() query: GetActiveContractByDateDto,
  ) {
    const date = query.date ? new Date(query.date) : new Date();
    return this.contractsService.getActiveContractByDate(contractId, date);
  }
}
