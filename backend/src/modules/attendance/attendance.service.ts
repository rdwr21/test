import { BadRequestException, Injectable } from "@nestjs/common";
import { AttendanceStatus } from "@prisma/client";
import { ContractsService } from "../contracts/contracts.service";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contractsService: ContractsService,
  ) {}

  async submit(freelancerId: string, contractId: string, workDate: string, hours: number) {
    const date = new Date(workDate);
    const activeContract = await this.contractsService.getActiveContractByDate(contractId, date);
    if (!activeContract) {
      throw new BadRequestException("Contract is not active for the given date");
    }
    return this.prisma.attendance.create({
      data: {
        freelancerId,
        contractId,
        workDate: date,
        hours,
        status: AttendanceStatus.SUBMITTED,
      },
    });
  }

  async approve(attendanceId: string, approverId: string) {
    const attendance = await this.prisma.attendance.findUnique({ where: { id: attendanceId } });
    if (!attendance) {
      throw new BadRequestException("Attendance not found");
    }
    if (attendance.status !== AttendanceStatus.SUBMITTED) {
      throw new BadRequestException("Attendance not submitted");
    }
    return this.prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status: AttendanceStatus.APPROVED,
        approvedById: approverId,
      },
    });
  }
}
