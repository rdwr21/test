import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ContractStatus, ContractVersionStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateContractDraftDto } from "./dto/create-contract.dto";

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

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
}
