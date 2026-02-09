import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { AttendanceModule } from "./attendance/attendance.module";
import { AuditModule } from "./audit/audit.module";
import { ContractsModule } from "./contracts/contracts.module";
import { PaymentsModule } from "./payments/payments.module";
import { PrismaModule } from "./prisma/prisma.module";
import { AccessModule } from "./access/access.module";
import { SchedulerModule } from "./scheduler/scheduler.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuditModule,
    AccessModule,
    ContractsModule,
    AttendanceModule,
    PaymentsModule,
    SchedulerModule,
  ],
})
export class AppModule {}
