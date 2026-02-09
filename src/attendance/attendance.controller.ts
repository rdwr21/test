import { Body, Controller, Param, Post } from "@nestjs/common";
import { ActorId } from "../common/decorators/actor-id.decorator";
import { AttendanceService } from "./attendance.service";
import { CreateAdjustmentDto } from "./dto/create-adjustment.dto";
import { SubmitAttendanceDto } from "./dto/submit-attendance.dto";

@Controller("attendance")
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  async submit(@Body() dto: SubmitAttendanceDto, @ActorId() actorUserId: string) {
    return this.attendanceService.submitAttendance(dto, actorUserId);
  }

  @Post(":id/approve")
  async approve(@Param("id") attendanceId: string, @ActorId() actorUserId: string) {
    return this.attendanceService.approveAttendance(attendanceId, actorUserId);
  }

  @Post(":id/adjustments")
  async createAdjustment(
    @Param("id") attendanceId: string,
    @Body() dto: CreateAdjustmentDto,
    @ActorId() actorUserId: string,
  ) {
    return this.attendanceService.createAdjustment(attendanceId, dto, actorUserId);
  }
}
