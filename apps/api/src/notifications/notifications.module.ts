import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';

// HTTP routes live in NotificationModule (notification.controller.ts); the
// legacy NotificationsController double-prefixed its path ('api/v1/...' on
// top of the global prefix) and is intentionally not registered.
@Module({
  imports: [PrismaModule, EventsModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
