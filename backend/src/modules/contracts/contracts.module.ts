import { Module } from "@nestjs/common";
import { ContractsController } from "./contracts.controller";
import { ContractsService } from "./contracts.service";
import { AccessService } from "./access.service";

@Module({
  controllers: [ContractsController],
  providers: [ContractsService, AccessService],
  exports: [ContractsService],
})
export class ContractsModule {}
