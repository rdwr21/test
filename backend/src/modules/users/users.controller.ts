import { Body, Controller, Post } from "@nestjs/common";
import { Roles } from "../auth/roles.decorator";
import { CreateUserDto } from "./dto/create-user.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles("admin")
  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto.email, dto.password, dto.roles);
  }
}
