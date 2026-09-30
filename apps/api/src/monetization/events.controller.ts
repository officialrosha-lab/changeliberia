import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { EventsService, RegisterForEventDto } from './events.service';

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  listActive() {
    return this.events.listActiveEvents();
  }

  @Post(':key/register')
  @UseGuards(JwtAuthGuard)
  register(
    @CurrentUser() user: AuthUser,
    @Param('key') key: string,
    @Body() dto: RegisterForEventDto,
  ) {
    return this.events.register(user.userId, key, dto);
  }

  @Post(':key/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@CurrentUser() user: AuthUser, @Param('key') key: string) {
    return this.events.cancelRegistration(user.userId, key);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  listMine(@CurrentUser() user: AuthUser) {
    return this.events.listMine(user.userId);
  }
}
