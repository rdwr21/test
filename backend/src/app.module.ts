import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { FreelancersModule } from "./modules/freelancers/freelancers.module";
import { ContractsModule } from "./modules/contracts/contracts.module";
import { AttendanceModule } from "./modules/attendance/attendance.module";
import { AuditModule } from "./modules/audit/audit.module";
import { PrismaModule } from "./modules/users/prisma.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { SchedulerModule } from "./modules/scheduler/scheduler.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    FreelancersModule,
    ContractsModule,
    AttendanceModule,
    AuditModule,
    PaymentsModule,
    SchedulerModule,
  ],
})
export class AppModule {}
