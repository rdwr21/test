import { BadRequestException, createParamDecorator, ExecutionContext } from "@nestjs/common";

export const ActorId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const actorId = request.headers["x-user-id"];
    if (!actorId || typeof actorId !== "string") {
      throw new BadRequestException("Missing x-user-id header");
    }
    return actorId;
  },
);
