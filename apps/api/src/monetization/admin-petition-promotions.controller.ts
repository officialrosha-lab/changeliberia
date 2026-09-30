import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  PermissionAction,
  PermissionResource,
  PromotionPlacement,
} from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { Permission } from '../rbac/decorators/permission.decorator';
import { PetitionPromotionsService } from './petition-promotions.service';

@Controller('admin/petition-promotions')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AdminPetitionPromotionsController {
  constructor(private readonly promotions: PetitionPromotionsService) {}

  @Get()
  @Permission(PermissionResource.MONETIZATION, PermissionAction.READ)
  listAll() {
    return this.promotions.listAll();
  }

  @Get('pricing')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.READ)
  getPricing() {
    return this.promotions.getPricing();
  }

  @Patch('pricing')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.UPDATE)
  setPricing(@Body() pricing: Record<PromotionPlacement, number>) {
    return this.promotions.setPricing(pricing);
  }
}
