import { Body, Controller, Post } from "@nestjs/common";
import { Roles } from "../auth/roles.decorator";
import { CreateFreelancerDto } from "./dto/create-freelancer.dto";
import { FreelancersService } from "./freelancers.service";

@Controller("freelancers")
export class FreelancersController {
  constructor(private readonly freelancersService: FreelancersService) {}

  @Roles("admin", "hr")
  @Post()
  async create(@Body() dto: CreateFreelancerDto) {
    return this.freelancersService.create(dto.userId);
  }
}
