import { Injectable } from "@nestjs/common";
import { AccessGrantStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class AccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async suspendByContract(contractId: string, actorUserId?: string): Promise<void> {
    await this.prisma.accessGrant.updateMany({
      where: { contractId, status: AccessGrantStatus.ACTIVE },
      data: { status: AccessGrantStatus.SUSPENDED },
    });
    await this.audit.log({
      actorUserId,
      action: "ACCESS_SUSPEND",
      entityType: "contract",
      entityId: contractId,
      metadata: { reason: "contract_expired_or_suspended" },
    });
  }

  async reactivateByContract(contractId: string, actorUserId?: string): Promise<void> {
    const now = new Date();
    await this.prisma.accessGrant.updateMany({
      where: {
        contractId,
        status: AccessGrantStatus.SUSPENDED,
        startAt: { lte: now },
        OR: [{ endAt: null }, { endAt: { gte: now } }],
      },
      data: { status: AccessGrantStatus.ACTIVE },
    });
    await this.audit.log({
      actorUserId,
      action: "ACCESS_REACTIVATE",
      entityType: "contract",
      entityId: contractId,
      metadata: { reason: "contract_signed" },
    });
  }
}
