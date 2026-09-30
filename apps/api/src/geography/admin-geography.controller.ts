import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserRole } from '@prisma/client';
import { ActivityLoggerService } from '../activity/activity-logger.service';
import { GeographyService } from './geography.service';
import { CreateElectoralDistrictDto, UpdateElectoralDistrictDto } from './dto';

interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Admin-only district entry/verification. Districts are added one at a
 * time and source-attributed rather than bulk-seeded — see the
 * seed-geography.ts caveat about not fabricating an authoritative
 * district dataset. Counties are fixed (seeded, not admin-editable here).
 */
@Controller('admin/geography')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminGeographyController {
  constructor(
    private readonly geographyService: GeographyService,
    private readonly activityLogger: ActivityLoggerService,
  ) {}

  @Get('counties')
  listCounties() {
    return this.geographyService.listCounties();
  }

  @Get('districts')
  listDistricts() {
    return this.geographyService.listAllDistricts();
  }

  @Post('districts')
  async createDistrict(
    @Body() dto: CreateElectoralDistrictDto,
    @CurrentUser() user: AuthUser,
  ) {
    const district = await this.geographyService.createDistrict(dto);
    this.activityLogger.logAsync({
      adminId: user.userId,
      action: 'CREATE_ELECTORAL_DISTRICT',
      entityType: 'ElectoralDistrict',
      entityId: district.id,
      description: `Created electoral district "${district.name}"`,
      changes: dto,
    });
    return district;
  }

  @Patch('districts/:id')
  async updateDistrict(
    @Param('id') id: string,
    @Body() dto: UpdateElectoralDistrictDto,
    @CurrentUser() user: AuthUser,
  ) {
    const district = await this.geographyService.updateDistrict(id, dto);
    this.activityLogger.logAsync({
      adminId: user.userId,
      action: 'UPDATE_ELECTORAL_DISTRICT',
      entityType: 'ElectoralDistrict',
      entityId: id,
      description: `Updated electoral district "${district.name}"`,
      changes: dto,
    });
    return district;
  }

  @Patch('districts/:id/verify')
  async verifyDistrict(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const district = await this.geographyService.verifyDistrict(id);
    this.activityLogger.logAsync({
      adminId: user.userId,
      action: 'VERIFY_ELECTORAL_DISTRICT',
      entityType: 'ElectoralDistrict',
      entityId: id,
      description: `Marked electoral district "${district.name}" as verified`,
    });
    return district;
  }
}
