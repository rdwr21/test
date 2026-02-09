import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(actorUserId: string, action: string, entityType: string, entityId: string, metadata?: object) {
    await this.prisma.auditEvent.create({
      data: {
        actorUserId,
        action,
        entityType,
        entityId,
        metadata: metadata ?? {},
      },
    });
  }

  async list(limit = 50) {
    return this.prisma.auditEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
