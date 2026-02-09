import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { AuditService } from "./audit.service";

type RequestUser = {
  userId?: string;
  roles?: string[];
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();
    const user = request.user as RequestUser | undefined;

    const action = resolveAction(request.method, request.route?.path ?? request.url);
    if (!action || !user?.userId) {
      return next.handle();
    }

    const entityType = resolveEntityType(context.getClass().name);
    const roles = user.roles ?? [];
    const path = request.originalUrl ?? request.url;

    return next.handle().pipe(
      tap((payload) => {
        const entityId = resolveEntityId(payload) ?? "unknown";
        void this.auditService.log(user.userId as string, action, entityType, entityId, {
          roles,
          path,
          method: request.method,
          statusCode: response.statusCode,
        });
      }),
    );
  }
}

function resolveAction(method: string, path: string): string | null {
  const normalized = (path || "").toLowerCase();
  if (normalized.includes("approve")) {
    return "APPROVE";
  }
  if (normalized.includes("sign")) {
    return "UPDATE";
  }
  if (method === "POST") {
    return "CREATE";
  }
  if (method === "PUT" || method === "PATCH") {
    return "UPDATE";
  }
  return null;
}

function resolveEntityType(className: string): string {
  const trimmed = className.replace(/Controller$/, "");
  return trimmed.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
}

function resolveEntityId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.id === "string") {
    return record.id;
  }
  if (record.contract && typeof record.contract === "object") {
    const contract = record.contract as Record<string, unknown>;
    if (typeof contract.id === "string") {
      return contract.id;
    }
  }
  if (record.version && typeof record.version === "object") {
    const version = record.version as Record<string, unknown>;
    if (typeof version.id === "string") {
      return version.id;
    }
  }
  return undefined;
}
