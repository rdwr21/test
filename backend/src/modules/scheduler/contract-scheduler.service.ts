import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ContractsService } from "../contracts/contracts.service";

@Injectable()
export class ContractSchedulerService {
  private readonly systemActorId?: string;

  constructor(
    private readonly contractsService: ContractsService,
    configService: ConfigService,
  ) {
    this.systemActorId = configService.get<string>("SYSTEM_ACTOR_ID");
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleExpiration() {
    await this.contractsService.expireContracts(this.systemActorId);
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleReminders() {
    await this.contractsService.sendReminders(this.systemActorId);
  }
}
