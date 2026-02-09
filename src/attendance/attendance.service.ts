import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  AdjustmentStatus,
  AttendanceStatus,
  ContractStatus,
} from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import { businessDaysBetween } from "../common/utils/date.util";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAdjustmentDto } from "./dto/create-adjustment.dto";
import { SubmitAttendanceDto } from "./dto/submit-attendance.dto";

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async submitAttendance(dto: SubmitAttendanceDto, actorUserId: string) {
    const workDate = new Date(dto.workDate);
    const workItem = await this.prisma.workItem.findUnique({
      where: { id: dto.workItemId },
    });
    if (!workItem) {
      throw new NotFoundException("Work item not found");
    }
    if (workItem.assignedFreelancerId !== dto.freelancerId) {
      throw new BadRequestException("Work item not assigned to freelancer");
    }
    if (workItem.contractId !== dto.contractId) {
      throw new BadRequestException("Work item contract mismatch");
    }

    const contract = await this.prisma.contract.findUnique({
      where: { id: dto.contractId },
    });
    if (!contract) {
      throw new NotFoundException("Contract not found");
    }
    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException("Contract is not active");
    }
    if (workDate < contract.startDate || workDate > contract.endDate) {
      throw new BadRequestException("Work date outside contract period");
    }

    const now = new Date();
    const businessDaysLate = businessDaysBetween(workDate, now);
    if (businessDaysLate > 2 && !dto.lateReason) {
      throw new BadRequestException("Late submissions require a reason");
    }

    const attendance = await this.prisma.attendance.create({
      data: {
        freelancerId: dto.freelancerId,
        contractId: dto.contractId,
        workItemId: dto.workItemId,
        workDate,
        hours: dto.hours,
        status: AttendanceStatus.SUBMITTED,
        submittedAt: now,
        lateReason: dto.lateReason,
        complianceOverride: false,
      },
    });

    await this.audit.log({
      actorUserId,
      action: "ATTENDANCE_SUBMIT",
      entityType: "attendance",
      entityId: attendance.id,
      metadata: { workDate: attendance.workDate.toISOString(), hours: attendance.hours },
    });

    return attendance;
  }

  async approveAttendance(attendanceId: string, actorUserId: string) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: { workItem: true, freelancer: { include: { user: true } } },
    });
    if (!attendance) {
      throw new NotFoundException("Attendance not found");
    }
    if (attendance.status !== AttendanceStatus.SUBMITTED) {
      throw new BadRequestException("Attendance is not submitted");
    }
    if (attendance.workItem.picUserId !== actorUserId) {
      throw new BadRequestException("Only the assigned PIC can approve");
    }
    if (attendance.freelancer.userId === actorUserId) {
      throw new BadRequestException("PIC cannot approve own attendance");
    }

    const approved = await this.prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status: AttendanceStatus.APPROVED,
        approvedAt: new Date(),
        approvedByUserId: actorUserId,
      },
    });

    await this.audit.log({
      actorUserId,
      action: "ATTENDANCE_APPROVE",
      entityType: "attendance",
      entityId: attendanceId,
      metadata: { workDate: approved.workDate.toISOString() },
    });

    return approved;
  }

  async createAdjustment(attendanceId: string, dto: CreateAdjustmentDto, actorUserId: string) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: { workItem: true },
    });
    if (!attendance) {
      throw new NotFoundException("Attendance not found");
    }
    if (attendance.status !== AttendanceStatus.APPROVED) {
      throw new BadRequestException("Only approved attendance can be adjusted");
    }
    if (attendance.workItem.picUserId !== actorUserId) {
      throw new BadRequestException("Only PIC can request adjustments");
    }

    const adjustment = await this.prisma.attendanceAdjustment.create({
      data: {
        attendanceId,
        adjustedHours: dto.adjustedHours,
        reason: dto.reason,
        status: AdjustmentStatus.PENDING,
      },
    });

    await this.audit.log({
      actorUserId,
      action: "ATTENDANCE_ADJUSTMENT_CREATE",
      entityType: "attendance_adjustment",
      entityId: adjustment.id,
      metadata: { attendanceId, adjustedHours: dto.adjustedHours },
    });

    return adjustment;
  }
}
