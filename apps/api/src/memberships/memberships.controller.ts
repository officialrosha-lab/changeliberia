import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { MembershipsService, SubscribeDto } from './memberships.service';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

@Controller('memberships')
export class MembershipsController {
  constructor(private readonly memberships: MembershipsService) {}

  @Get('plans')
  listPlans() {
    return this.memberships.listActivePlans();
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  subscribe(@CurrentUser() user: AuthUser, @Body() dto: SubscribeDto) {
    return this.memberships.subscribe(user.userId, dto);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@CurrentUser() user: AuthUser) {
    return this.memberships.cancelMySubscription(user.userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMySubscription(@CurrentUser() user: AuthUser) {
    const subscription = await this.memberships.getMySubscription(user.userId);
    return { subscription };
  }
}
