import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { FreelancersModule } from "./modules/freelancers/freelancers.module";
import { ContractsModule } from "./modules/contracts/contracts.module";
import { AttendanceModule } from "./modules/attendance/attendance.module";
import { AuditModule } from "./modules/audit/audit.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    FreelancersModule,
    ContractsModule,
    AttendanceModule,
    AuditModule,
  ],
})
export class AppModule {}
