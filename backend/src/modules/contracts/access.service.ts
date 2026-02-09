import { Injectable } from "@nestjs/common";
import { AccessGrantStatus } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../users/prisma.service";

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
    if (actorUserId) {
      await this.audit.log(actorUserId, "ACCESS_SUSPEND", "contract", contractId, {
        reason: "contract_expired_or_suspended",
      });
    }
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
    if (actorUserId) {
      await this.audit.log(actorUserId, "ACCESS_REACTIVATE", "contract", contractId, {
        reason: "contract_signed",
      });
    }
  }
}
