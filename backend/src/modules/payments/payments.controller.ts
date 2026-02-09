import { Body, Controller, Post } from "@nestjs/common";
import { ActorId } from "../auth/actor-id.decorator";
import { GeneratePaymentSummaryDto } from "./dto/generate-payment-summary.dto";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("summaries")
  async generateSummary(
    @Body() dto: GeneratePaymentSummaryDto,
    @ActorId() actorUserId: string,
  ) {
    return this.paymentsService.generateMonthlySummary(dto, actorUserId);
  }
}
