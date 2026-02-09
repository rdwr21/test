import { Body, Controller, Param, Post, Req } from "@nestjs/common";
import { Request } from "express";
import { Roles } from "../auth/roles.decorator";
import { SubmitAttendanceDto } from "./dto/submit-attendance.dto";
import { AttendanceService } from "./attendance.service";

@Controller("attendance")
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Roles("freelancer")
  @Post()
  async submit(@Body() dto: SubmitAttendanceDto) {
    return this.attendanceService.submit(
      dto.freelancerId,
      dto.contractId,
      dto.workDate,
      dto.hours,
    );
  }

  @Roles("pic")
  @Post(":id/approve")
  async approve(@Param("id") attendanceId: string, @Req() request: Request) {
    const user = request.user as { userId: string };
    return this.attendanceService.approve(attendanceId, user.userId);
  }
}
