import { Body, Controller, Param, Post, Req } from "@nestjs/common";
import { Request } from "express";
import { Roles } from "../auth/roles.decorator";
import { ApproveAttendanceDto } from "./dto/approve-attendance.dto";
import { SubmitAttendanceDto } from "./dto/submit-attendance.dto";
import { AttendanceService } from "./attendance.service";

@Controller("attendance")
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Roles("freelancer")
  @Post()
  async submit(@Body() dto: SubmitAttendanceDto, @Req() request: Request) {
    const user = request.user as { userId: string };
    return this.attendanceService.submit(dto, user.userId);
  }

  @Roles("pic")
  @Post(":id/approve")
  async approve(
    @Param("id") attendanceId: string,
    @Body() _dto: ApproveAttendanceDto,
    @Req() request: Request,
  ) {
    const user = request.user as { userId: string };
    return this.attendanceService.approve(attendanceId, user.userId);
  }
}
