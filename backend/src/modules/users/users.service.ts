import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
  }

  async createUser(email: string, password: string, roles?: string[]) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException("User already exists");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const roleNames = roles?.length ? roles : ["user"];

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          passwordHash,
          status: UserStatus.ACTIVE,
        },
        include: { roles: { include: { role: true } } },
      });

      const roleRecords = await Promise.all(
        roleNames.map((roleName) =>
          tx.role.upsert({
            where: { name: roleName },
            update: {},
            create: { name: roleName },
          }),
        ),
      );

      await tx.userRole.createMany({
        data: roleRecords.map((role) => ({
          userId: created.id,
          roleId: role.id,
        })),
      });

      const updated = await tx.user.findUnique({
        where: { id: created.id },
        include: { roles: { include: { role: true } } },
      });

      if (!updated) {
        throw new NotFoundException("User creation failed");
      }

      return updated;
    });
  }
}
