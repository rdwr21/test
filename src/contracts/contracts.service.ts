import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ContractStatus, ContractVersionStatus } from "@prisma/client";
import { addDays } from "date-fns";
import { AccessService } from "../access/access.service";
import { AuditService } from "../audit/audit.service";
import { endOfUtcDay, startOfUtcDay } from "../common/utils/date.util";
import { PrismaService } from "../prisma/prisma.service";
import { CreateContractDto } from "./dto/create-contract.dto";
import { CreateContractVersionDto } from "./dto/create-contract-version.dto";

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly access: AccessService,
  ) {}

  async createContract(dto: CreateContractDto, actorUserId: string) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate <= startDate) {
      throw new BadRequestException("endDate must be after startDate");
    }

    const contract = await this.prisma.$transaction(async (tx) => {
      const created = await tx.contract.create({
        data: {
          contractNumber: dto.contractNumber,
          vendorOrgId: dto.vendorOrgId,
          status: ContractStatus.DRAFT,
          startDate,
          endDate,
        },
      });
      await tx.contractVersion.create({
        data: {
          contractId: created.id,
          versionNumber: 1,
          effectiveFrom: startDate,
          effectiveTo: endDate,
          status: ContractVersionStatus.DRAFT,
          hourlyRate: dto.hourlyRate,
          termsHash: dto.termsHash,
        },
      });
      return created;
    });

    await this.audit.log({
      actorUserId,
      action: "CONTRACT_CREATE",
      entityType: "contract",
      entityId: contract.id,
      metadata: { contractNumber: contract.contractNumber },
    });

    return contract;
  }

  async createVersion(contractId: string, dto: CreateContractVersionDto, actorUserId: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) {
      throw new NotFoundException("Contract not found");
    }
    const effectiveFrom = new Date(dto.effectiveFrom);
    const effectiveTo = new Date(dto.effectiveTo);
    if (effectiveTo <= effectiveFrom) {
      throw new BadRequestException("effectiveTo must be after effectiveFrom");
    }

    const latest = await this.prisma.contractVersion.findFirst({
      where: { contractId },
      orderBy: { versionNumber: "desc" },
    });
    const versionNumber = (latest?.versionNumber ?? 0) + 1;

    const version = await this.prisma.contractVersion.create({
      data: {
        contractId,
        versionNumber,
        effectiveFrom,
        effectiveTo,
        status: ContractVersionStatus.DRAFT,
        hourlyRate: dto.hourlyRate,
        termsHash: dto.termsHash,
      },
    });

    await this.audit.log({
      actorUserId,
      action: "CONTRACT_VERSION_CREATE",
      entityType: "contract_version",
      entityId: version.id,
      metadata: { contractId, versionNumber },
    });

    return version;
  }

  async signVersion(contractId: string, versionId: string, actorUserId: string, signedAt?: Date) {
    const result = await this.prisma.$transaction(async (tx) => {
      const version = await tx.contractVersion.findUnique({
        where: { id: versionId },
        include: { contract: true },
      });
      if (!version || version.contractId !== contractId) {
        throw new NotFoundException("Contract version not found");
      }
      if (version.status === ContractVersionStatus.SIGNED) {
        return version;
      }

      if (version.status === ContractVersionStatus.VOID) {
        throw new BadRequestException("Cannot sign a void version");
      }

      const currentVersionId = version.contract.currentVersionId;
      if (currentVersionId && currentVersionId !== version.id) {
        await tx.contractVersion.update({
          where: { id: currentVersionId },
          data: { status: ContractVersionStatus.SUPERSEDED },
        });
      }

      const updatedVersion = await tx.contractVersion.update({
        where: { id: version.id },
        data: {
          status: ContractVersionStatus.SIGNED,
          signedAt: signedAt ?? new Date(),
          supersedesVersionId: currentVersionId ?? undefined,
        },
      });

      await tx.contract.update({
        where: { id: contractId },
        data: {
          status: ContractStatus.ACTIVE,
          currentVersionId: updatedVersion.id,
          startDate: updatedVersion.effectiveFrom,
          endDate: updatedVersion.effectiveTo,
        },
      });

      return updatedVersion;
    });

    await this.access.reactivateByContract(contractId, actorUserId);
    await this.audit.log({
      actorUserId,
      action: "CONTRACT_VERSION_SIGNED",
      entityType: "contract_version",
      entityId: result.id,
      metadata: { contractId, versionNumber: result.versionNumber },
    });

    return result;
  }

  async expireContracts(actorUserId?: string) {
    const now = new Date();
    const contracts = await this.prisma.contract.findMany({
      where: { status: ContractStatus.ACTIVE },
      include: { currentVersion: true },
    });

    for (const contract of contracts) {
      const activeVersion = await this.prisma.contractVersion.findFirst({
        where: {
          contractId: contract.id,
          status: ContractVersionStatus.SIGNED,
          effectiveFrom: { lte: now },
          effectiveTo: { gte: now },
        },
        orderBy: { effectiveFrom: "desc" },
      });

      if (activeVersion) {
        if (contract.currentVersionId !== activeVersion.id) {
          await this.prisma.contract.update({
            where: { id: contract.id },
            data: { currentVersionId: activeVersion.id },
          });
        }
        continue;
      }

      if (contract.currentVersion && contract.currentVersion.effectiveTo < now) {
        await this.prisma.contract.update({
          where: { id: contract.id },
          data: { status: ContractStatus.EXPIRED },
        });
        await this.access.suspendByContract(contract.id, actorUserId);
        await this.audit.log({
          actorUserId,
          action: "CONTRACT_EXPIRED",
          entityType: "contract",
          entityId: contract.id,
          metadata: { contractNumber: contract.contractNumber },
        });
      }
    }
  }

  async sendReminders(actorUserId?: string) {
    const reminderOffsets = [
      { type: "H30", days: 30 },
      { type: "H14", days: 14 },
      { type: "H7", days: 7 },
    ] as const;

    const now = new Date();
    for (const reminder of reminderOffsets) {
      const targetDate = addDays(now, reminder.days);
      const start = startOfUtcDay(targetDate);
      const end = endOfUtcDay(targetDate);
      const versions = await this.prisma.contractVersion.findMany({
        where: {
          status: ContractVersionStatus.SIGNED,
          effectiveTo: { gte: start, lte: end },
        },
      });

      for (const version of versions) {
        await this.prisma.contractNotification.upsert({
          where: {
            contractId_contractVersionId_reminderType: {
              contractId: version.contractId,
              contractVersionId: version.id,
              reminderType: reminder.type,
            },
          },
          create: {
            contractId: version.contractId,
            contractVersionId: version.id,
            reminderType: reminder.type,
          },
          update: {},
        });
      }
    }

    await this.audit.log({
      actorUserId,
      action: "CONTRACT_REMINDERS_RUN",
      entityType: "system",
      entityId: "scheduler",
      metadata: { executedAt: now.toISOString() },
    });
  }
}
