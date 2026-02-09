import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UserStatus } from "@prisma/client";
import { UsersService } from "../users/users.service";

interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions?: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET") || "dev_secret_change_me",
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      return null;
    }
    if (user.status !== UserStatus.ACTIVE) {
      return null;
    }
    return {
      userId: user.id,
      email: user.email,
      roles: user.roles.map((role) => role.role.name),
      permissions: user.roles
        .flatMap((role) => role.role.permissions.map((perm) => perm.permission.code))
        .filter((value, index, array) => array.indexOf(value) === index),
    };
  }
}
