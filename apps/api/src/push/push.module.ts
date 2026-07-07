import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PushNotificationService } from './push-notification.service';
import { PushEventService } from './push-event.service';
import { PushController } from './push.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PushController],
  providers: [PushNotificationService, PushEventService],
  exports: [PushNotificationService],
})
export class PushModule {}
