import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  PurchaseResearchProductDto,
  ResearchProductsService,
} from './research-products.service';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

@Controller('research-products')
export class ResearchProductsController {
  constructor(private readonly researchProducts: ResearchProductsService) {}

  @Get()
  listActive() {
    return this.researchProducts.listActiveProducts();
  }

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  purchase(
    @CurrentUser() user: AuthUser,
    @Body() dto: PurchaseResearchProductDto,
  ) {
    return this.researchProducts.purchase(user.userId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  listMine(@CurrentUser() user: AuthUser) {
    return this.researchProducts.listMine(user.userId);
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  async getDownloadUrl(
    @CurrentUser() user: AuthUser,
    @Param('id') productId: string,
  ) {
    const url = await this.researchProducts.getDownloadUrl(
      user.userId,
      productId,
    );
    return { url };
  }
}
