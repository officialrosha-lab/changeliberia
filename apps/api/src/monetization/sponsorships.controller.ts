import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  PurchaseSponsorshipDto,
  SponsorshipsService,
} from './sponsorships.service';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

@Controller('sponsorships')
export class SponsorshipsController {
  constructor(private readonly sponsorships: SponsorshipsService) {}

  @Get('packages')
  listPackages() {
    return this.sponsorships.listActivePackages();
  }

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  purchase(@CurrentUser() user: AuthUser, @Body() dto: PurchaseSponsorshipDto) {
    return this.sponsorships.purchase(user.userId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  listMine(@CurrentUser() user: AuthUser) {
    return this.sponsorships.listMine(user.userId);
  }
}
