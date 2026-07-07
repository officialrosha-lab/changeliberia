import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsObject, IsString } from 'class-validator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PushNotificationService } from './push-notification.service';

class SubscribeDto {
  @IsString() endpoint!: string;
  @IsObject() keys!: { p256dh: string; auth: string };
}

class UnsubscribeDto {
  @IsString() endpoint!: string;
}

interface AuthUser {
  userId: string;
}

@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushNotificationService) {}

  @Get('vapid-public-key')
  getPublicKey() {
    return { publicKey: this.pushService.getPublicKey() };
  }

  @Post('subscribe')
  @UseGuards(OptionalJwtAuthGuard)
  async subscribe(@CurrentUser() user: AuthUser | undefined, @Body() dto: SubscribeDto) {
    await this.pushService.subscribe(user?.userId, dto);
    return { success: true };
  }

  @Post('unsubscribe')
  @UseGuards(OptionalJwtAuthGuard)
  async unsubscribe(@Body() dto: UnsubscribeDto) {
    await this.pushService.unsubscribe(dto.endpoint);
    return { success: true };
  }
}
