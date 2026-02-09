import { BadRequestException, Injectable } from "@nestjs/common";
import { ContractStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(startDate: string, endDate: string, status: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      throw new BadRequestException("endDate must be after startDate");
    }
    const mappedStatus = ContractStatus[status as keyof typeof ContractStatus];
    if (!mappedStatus) {
      throw new BadRequestException("Invalid status");
    }
    return this.prisma.contract.create({
      data: {
        status: mappedStatus,
        startDate: start,
        endDate: end,
      },
    });
  }
}
