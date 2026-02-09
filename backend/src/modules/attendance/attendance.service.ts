import { BadRequestException, Injectable } from "@nestjs/common";
import { AttendanceStatus } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import { ContractsService } from "../contracts/contracts.service";
import { PrismaService } from "../users/prisma.service";
import { SubmitAttendanceDto } from "./dto/submit-attendance.dto";

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contractsService: ContractsService,
    private readonly auditService: AuditService,
  ) {}

  async submit(dto: SubmitAttendanceDto, actorUserId: string) {
    const date = new Date(dto.workDate);
    const activeContract = await this.contractsService.getActiveContractByDate(dto.contractId, date);
    if (!activeContract) {
      throw new BadRequestException("Contract is not active for the given date");
    }

    const existing = await this.prisma.attendance.findUnique({
      where: {
        freelancerId_workDate: {
          freelancerId: dto.freelancerId,
          workDate: date,
        },
      },
    });
    if (existing) {
      if (existing.status === AttendanceStatus.APPROVED) {
        throw new BadRequestException("Approved attendance is immutable");
      }
      throw new BadRequestException("Attendance already submitted for this date");
    }

    const attendance = await this.prisma.attendance.create({
      data: {
        freelancerId: dto.freelancerId,
        contractId: dto.contractId,
        workDate: date,
        hours: dto.hours,
        status: AttendanceStatus.SUBMITTED,
      },
    });

    await this.auditService.log(actorUserId, "ATTENDANCE_SUBMIT", "attendance", attendance.id, {
      freelancerId: dto.freelancerId,
      contractId: dto.contractId,
      workDate: attendance.workDate.toISOString(),
      hours: attendance.hours,
    });

    return attendance;
  }

  async approve(attendanceId: string, approverId: string) {
    const attendance = await this.prisma.attendance.findUnique({ where: { id: attendanceId } });
    if (!attendance) {
      throw new BadRequestException("Attendance not found");
    }
    if (attendance.status !== AttendanceStatus.SUBMITTED) {
      throw new BadRequestException("Attendance not submitted");
    }
    const updated = await this.prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status: AttendanceStatus.APPROVED,
        approvedById: approverId,
      },
    });

    await this.auditService.log(approverId, "ATTENDANCE_APPROVE", "attendance", updated.id, {
      workDate: updated.workDate.toISOString(),
    });

    return updated;
  }
}
