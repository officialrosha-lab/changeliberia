import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PromotionPlacement } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  PetitionPromotionsService,
  PromoteDto,
} from './petition-promotions.service';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

@Controller()
export class PetitionPromotionsController {
  constructor(private readonly promotions: PetitionPromotionsService) {}

  @Get('petitions/featured')
  listFeatured(
    @Query('placement') placement: PromotionPlacement = 'FEATURED_HOME',
  ) {
    return this.promotions.listFeatured(placement);
  }

  @Post('petitions/:id/promote')
  @UseGuards(JwtAuthGuard)
  promote(
    @CurrentUser() user: AuthUser,
    @Param('id') petitionId: string,
    @Body() dto: PromoteDto,
  ) {
    return this.promotions.promote(user.userId, petitionId, dto);
  }

  @Get('petition-promotions/me')
  @UseGuards(JwtAuthGuard)
  listMine(@CurrentUser() user: AuthUser) {
    return this.promotions.listMine(user.userId);
  }
}
