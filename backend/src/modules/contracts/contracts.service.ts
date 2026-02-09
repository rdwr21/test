import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ContractStatus, ContractVersionStatus } from "@prisma/client";
import { addDays } from "date-fns";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../users/prisma.service";
import { AccessService } from "./access.service";
import { CreateContractDto, CreateContractDraftDto } from "./dto/create-contract.dto";
import { CreateContractVersionDto } from "./dto/create-contract-version.dto";
import { endOfUtcDay, startOfUtcDay } from "./utils/date.util";

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly accessService: AccessService,
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

    await this.auditService.log(actorUserId, "CONTRACT_CREATE", "contract", contract.id, {
      contractNumber: contract.contractNumber,
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

    await this.auditService.log(actorUserId, "CONTRACT_VERSION_CREATE", "contract_version", version.id, {
      contractId,
      versionNumber,
    });

    return version;
  }

  async createContractDraft(dto: CreateContractDraftDto) {
    const effectiveFrom = new Date(dto.effectiveFrom);
    const effectiveTo = new Date(dto.effectiveTo);
    if (effectiveTo <= effectiveFrom) {
      throw new BadRequestException("effectiveTo must be after effectiveFrom");
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.contractId) {
        const existing = await tx.contract.findUnique({ where: { id: dto.contractId } });
        if (!existing) {
          throw new NotFoundException("Contract not found");
        }
        if (existing.status === ContractStatus.TERMINATED) {
          throw new BadRequestException("Cannot add version to terminated contract");
        }

        const latest = await tx.contractVersion.findFirst({
          where: { contractId: existing.id },
          orderBy: { versionNumber: "desc" },
        });

        const version = await tx.contractVersion.create({
          data: {
            contractId: existing.id,
            versionNumber: (latest?.versionNumber ?? 0) + 1,
            status: ContractVersionStatus.DRAFT,
            effectiveFrom,
            effectiveTo,
            termsHash: dto.termsHash,
          },
        });

        return { contract: existing, version };
      }

      const contract = await tx.contract.create({
        data: {
          status: ContractStatus.DRAFT,
          startDate: effectiveFrom,
          endDate: effectiveTo,
        },
      });

      const version = await tx.contractVersion.create({
        data: {
          contractId: contract.id,
          versionNumber: 1,
          status: ContractVersionStatus.DRAFT,
          effectiveFrom,
          effectiveTo,
          termsHash: dto.termsHash,
        },
      });

      return { contract, version };
    });
  }

  async approveContractVersion(contractId: string, versionId: string) {
    const version = await this.prisma.contractVersion.findUnique({
      where: { id: versionId },
      include: { contract: true },
    });
    if (!version || version.contractId !== contractId) {
      throw new NotFoundException("Contract version not found");
    }
    if (
      version.status !== ContractVersionStatus.DRAFT &&
      version.status !== ContractVersionStatus.IN_REVIEW
    ) {
      throw new BadRequestException("Only draft or in-review versions can be approved");
    }

    const updated = await this.prisma.contractVersion.update({
      where: { id: versionId },
      data: { status: ContractVersionStatus.APPROVED },
    });

    if (version.contract.status === ContractStatus.DRAFT) {
      await this.prisma.contract.update({
        where: { id: contractId },
        data: { status: ContractStatus.IN_REVIEW },
      });
    }

    return updated;
  }

  async signContractVersion(contractId: string, versionId: string, signedAt?: Date) {
    return this.prisma.$transaction(async (tx) => {
      const version = await tx.contractVersion.findUnique({
        where: { id: versionId },
        include: { contract: true },
      });
      if (!version || version.contractId !== contractId) {
        throw new NotFoundException("Contract version not found");
      }
      if (version.status !== ContractVersionStatus.APPROVED) {
        throw new BadRequestException("Only approved versions can be signed");
      }

      const currentSigned = await tx.contractVersion.findFirst({
        where: {
          contractId,
          status: ContractVersionStatus.SIGNED,
        },
        orderBy: { effectiveFrom: "desc" },
      });

      if (currentSigned) {
        await tx.contractVersion.update({
          where: { id: currentSigned.id },
          data: { status: ContractVersionStatus.SUPERSEDED },
        });
      }

      const signedVersion = await tx.contractVersion.update({
        where: { id: versionId },
        data: {
          status: ContractVersionStatus.SIGNED,
          signedAt: signedAt ?? new Date(),
          supersedesVersionId: currentSigned?.id,
        },
      });

      await tx.contract.update({
        where: { id: contractId },
        data: {
          status: ContractStatus.ACTIVE,
          startDate: signedVersion.effectiveFrom,
          endDate: signedVersion.effectiveTo,
          currentVersionId: signedVersion.id,
        },
      });

      return signedVersion;
    });
  }

  async getActiveContractByDate(contractId: string, date: Date) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });
    if (!contract) {
      throw new NotFoundException("Contract not found");
    }
    if (contract.status !== ContractStatus.ACTIVE) {
      return null;
    }

    if (date < contract.startDate || date > contract.endDate) {
      return null;
    }

    const version = await this.prisma.contractVersion.findFirst({
      where: {
        contractId,
        status: ContractVersionStatus.SIGNED,
        effectiveFrom: { lte: date },
        effectiveTo: { gte: date },
      },
      orderBy: { effectiveFrom: "desc" },
    });

    if (!version) {
      return null;
    }

    return { contract, version };
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
        await this.accessService.suspendByContract(contract.id, actorUserId);
        if (actorUserId) {
          await this.auditService.log(actorUserId, "CONTRACT_EXPIRED", "contract", contract.id, {
            contractNumber: contract.contractNumber,
          });
        }
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

    if (actorUserId) {
      await this.auditService.log(actorUserId, "CONTRACT_REMINDERS_RUN", "system", "scheduler", {
        executedAt: now.toISOString(),
      });
    }
  }
}
