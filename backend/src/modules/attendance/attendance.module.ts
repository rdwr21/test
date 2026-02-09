import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { ContractsModule } from "../contracts/contracts.module";
import { AttendanceController } from "./attendance.controller";
import { AttendanceService } from "./attendance.service";

@Module({
  imports: [ContractsModule, AuditModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
})
export class AttendanceModule {}
