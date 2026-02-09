import { Injectable, NotFoundException } from "@nestjs/common";
import { UserStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class FreelancersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return this.prisma.freelancer.create({
      data: {
        userId,
        status: UserStatus.ACTIVE,
      },
      include: { user: true },
    });
  }
}
