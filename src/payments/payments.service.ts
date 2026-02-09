import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  AdjustmentStatus,
  AttendanceStatus,
  BillingExceptionStatus,
  ContractVersionStatus,
  PaymentSummaryStatus,
} from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { GeneratePaymentSummaryDto } from "./dto/generate-payment-summary.dto";

type ExceptionInput = { attendanceId: string; reason: string };
type SummaryItemInput = {
  attendanceId: string;
  hours: number;
  rate: number;
  amount: number;
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async generateMonthlySummary(dto: GeneratePaymentSummaryDto, actorUserId: string) {
    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);
    if (periodEnd <= periodStart) {
      throw new BadRequestException("periodEnd must be after periodStart");
    }

    const freelancer = await this.prisma.freelancer.findUnique({
      where: { id: dto.freelancerId },
    });
    if (!freelancer) {
      throw new NotFoundException("Freelancer not found");
    }

    const attendances = await this.prisma.attendance.findMany({
      where: {
        freelancerId: dto.freelancerId,
        contractId: dto.contractId,
        status: AttendanceStatus.APPROVED,
        workDate: { gte: periodStart, lte: periodEnd },
      },
      include: { adjustments: true },
    });

    const versions = await this.prisma.contractVersion.findMany({
      where: {
        contractId: dto.contractId,
        status: ContractVersionStatus.SIGNED,
        effectiveFrom: { lte: periodEnd },
        effectiveTo: { gte: periodStart },
      },
      orderBy: { effectiveFrom: "desc" },
    });

    const exceptions: ExceptionInput[] = [];
    const items: SummaryItemInput[] = [];

    for (const attendance of attendances) {
      if (attendance.approvedAt && attendance.approvedAt > periodEnd) {
        exceptions.push({ attendanceId: attendance.id, reason: "LATE_APPROVAL" });
        continue;
      }
      const hasPendingAdjustment = attendance.adjustments.some(
        (adjustment) => adjustment.status === AdjustmentStatus.PENDING,
      );
      if (hasPendingAdjustment) {
        exceptions.push({ attendanceId: attendance.id, reason: "PENDING_ADJUSTMENT" });
        continue;
      }

      const matched = versions.filter(
        (version) =>
          attendance.workDate >= version.effectiveFrom &&
          attendance.workDate <= version.effectiveTo,
      );
      if (matched.length === 0) {
        exceptions.push({ attendanceId: attendance.id, reason: "NO_ACTIVE_VERSION" });
        continue;
      }

      const version = matched[0];
      if (matched.length > 1) {
        exceptions.push({ attendanceId: attendance.id, reason: "VERSION_CONFLICT" });
      }

      const rate = version.hourlyRate;
      const amount = attendance.hours * rate;
      items.push({
        attendanceId: attendance.id,
        hours: attendance.hours,
        rate,
        amount,
      });
    }

    const status = freelancer.complianceHold
      ? PaymentSummaryStatus.ON_HOLD
      : PaymentSummaryStatus.DRAFT;

    const summary = await this.prisma.$transaction(async (tx) => {
      const created = await tx.paymentSummary.create({
        data: {
          freelancerId: dto.freelancerId,
          contractId: dto.contractId,
          periodStart,
          periodEnd,
          status,
        },
      });

      if (items.length > 0) {
        await tx.paymentSummaryItem.createMany({
          data: items.map((item) => ({
            paymentSummaryId: created.id,
            attendanceId: item.attendanceId,
            hours: item.hours,
            rate: item.rate,
            amount: item.amount,
          })),
        });
      }

      if (exceptions.length > 0) {
        await tx.billingException.createMany({
          data: exceptions.map((exception) => ({
            attendanceId: exception.attendanceId,
            reason: exception.reason,
            status: BillingExceptionStatus.OPEN,
          })),
        });
      }

      return created;
    });

    await this.audit.log({
      actorUserId,
      action: "PAYMENT_SUMMARY_GENERATE",
      entityType: "payment_summary",
      entityId: summary.id,
      metadata: { items: items.length, exceptions: exceptions.length },
    });

    return summary;
  }
}
