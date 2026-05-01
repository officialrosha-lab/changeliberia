import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SponsorsService } from './sponsors.service';

@Controller('sponsors')
export class SponsorsController {
  constructor(private readonly sponsors: SponsorsService) {}

  @Get()
  findAll() {
    return this.sponsors.findAll();
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/sponsors')
export class AdminSponsorsController {
  constructor(private readonly sponsors: SponsorsService) {}

  @Get()
  findAll() {
    return this.sponsors.findAllAdmin();
  }

  @Post()
  create(@Body() body: {
    name: string;
    logoUrl: string;
    websiteUrl?: string;
    type?: string;
    displayOrder?: number;
    isActive?: boolean;
  }) {
    return this.sponsors.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: {
    name?: string;
    logoUrl?: string;
    websiteUrl?: string;
    type?: string;
    displayOrder?: number;
    isActive?: boolean;
  }) {
    return this.sponsors.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sponsors.remove(id);
  }
}
