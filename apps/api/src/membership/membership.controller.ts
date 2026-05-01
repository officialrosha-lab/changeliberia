import { Body, Controller, Delete, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { MembershipService } from './membership.service';

@Controller('membership')
export class MembershipController {
  constructor(private readonly service: MembershipService) {}

  @Get('count')
  count() {
    return this.service.count().then((count) => ({ count }));
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  status(@Req() req: { user: { userId: string } }) {
    return this.service.status(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('join')
  join(
    @Req() req: { user: { userId: string } },
    @Body() body: { role?: 'supporter' | 'advocate' },
  ) {
    return this.service.join(req.user.userId, body.role ?? 'supporter');
  }

  @UseGuards(JwtAuthGuard)
  @Delete('leave')
  leave(@Req() req: { user: { userId: string } }) {
    return this.service.leave(req.user.userId).then(() => ({ success: true }));
  }
}
