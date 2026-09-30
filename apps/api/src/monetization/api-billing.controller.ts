import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApiBillingService, SubscribeApiPlanDto } from './api-billing.service';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

@Controller('api-billing')
export class ApiBillingController {
  constructor(private readonly apiBilling: ApiBillingService) {}

  @Get('plans')
  listPlans() {
    return this.apiBilling.listActivePlans();
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  subscribe(@CurrentUser() user: AuthUser, @Body() dto: SubscribeApiPlanDto) {
    return this.apiBilling.subscribe(user.userId, dto);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@CurrentUser() user: AuthUser) {
    return this.apiBilling.cancelSubscription(user.userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMySubscription(@CurrentUser() user: AuthUser) {
    const subscription = await this.apiBilling.getMySubscription(user.userId);
    return { subscription };
  }

  @Post('keys')
  @UseGuards(JwtAuthGuard)
  async createKey(@CurrentUser() user: AuthUser) {
    const { apiKey, rawKey } = await this.apiBilling.createKey(user.userId);
    // rawKey is returned exactly once — the server never stores or shows it again.
    return { id: apiKey.id, keyPrefix: apiKey.keyPrefix, rawKey };
  }

  @Get('keys')
  @UseGuards(JwtAuthGuard)
  listKeys(@CurrentUser() user: AuthUser) {
    return this.apiBilling.listMyKeys(user.userId);
  }

  @Delete('keys/:id')
  @UseGuards(JwtAuthGuard)
  revokeKey(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.apiBilling.revokeKey(user.userId, id);
  }
}
