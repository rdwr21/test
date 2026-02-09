import { Controller, Get, Query } from "@nestjs/common";
import { Roles } from "../auth/roles.decorator";
import { AuditService } from "./audit.service";

@Controller("audit")
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Roles("auditor")
  @Get()
  async list(@Query("limit") limit?: string) {
    const parsed = limit ? Number(limit) : 50;
    return this.auditService.list(Number.isNaN(parsed) ? 50 : parsed);
  }
}
