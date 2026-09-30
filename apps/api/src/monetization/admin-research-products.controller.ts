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
  CreateResearchProductDto,
  ResearchProductsService,
  UpdateResearchProductDto,
} from './research-products.service';

@Controller('admin/research-products')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AdminResearchProductsController {
  constructor(private readonly researchProducts: ResearchProductsService) {}

  @Get()
  @Permission(PermissionResource.MONETIZATION, PermissionAction.READ)
  listAll() {
    return this.researchProducts.listAllProducts();
  }

  @Post()
  @Permission(PermissionResource.MONETIZATION, PermissionAction.CREATE)
  create(@Body() dto: CreateResearchProductDto) {
    return this.researchProducts.createProduct(dto);
  }

  @Patch(':id')
  @Permission(PermissionResource.MONETIZATION, PermissionAction.UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateResearchProductDto) {
    return this.researchProducts.updateProduct(id, dto);
  }
}
