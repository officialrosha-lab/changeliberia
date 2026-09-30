import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PermissionAction, PermissionResource } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { Permission } from '../rbac/decorators/permission.decorator';
import {
  CreatePackageDto,
  SponsorshipsService,
  UpdatePackageDto,
} from './sponsorships.service';

@Controller('admin/sponsorships')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AdminSponsorshipsController {
  constructor(private readonly sponsorships: SponsorshipsService) {}

  @Get('packages')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.READ)
  listAllPackages() {
    return this.sponsorships.listAllPackages();
  }

  @Post('packages')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.CREATE)
  createPackage(@Body() dto: CreatePackageDto) {
    return this.sponsorships.createPackage(dto);
  }

  @Patch('packages/:id')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.UPDATE)
  updatePackage(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.sponsorships.updatePackage(id, dto);
  }

  @Get('purchases')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.READ)
  listAllPurchases() {
    return this.sponsorships.listAllPurchases();
  }

  @Post('purchases/:id/fulfill')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.UPDATE)
  fulfill(@Param('id') id: string, @Body() body: { sponsorId: string }) {
    return this.sponsorships.fulfill(id, body.sponsorId);
  }
}
