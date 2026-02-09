import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { UserStatus } from "@prisma/client";
import { UsersService } from "../users/users.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("User is not active");
    }
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const roles = user.roles.map((role) => role.role.name);
    const permissions = user.roles
      .flatMap((role) => role.role.permissions.map((perm) => perm.permission.code))
      .filter((value, index, array) => array.indexOf(value) === index);
    const payload = {
      sub: user.id,
      email: user.email,
      roles,
      permissions,
    };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
