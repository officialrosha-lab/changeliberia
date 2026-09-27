import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';

// HTTP routes live in NotificationModule (notification.controller.ts) —
// this module only provides NotificationsService, used by other modules
// as an event listener (e.g. @OnEvent('SIGNATURE_ADDED')) to create
// notification records. It previously also held a NotificationsController
// with a double-prefixed, unreachable, and functionally redundant set of
// routes; that dead file has been removed.
@Module({
  imports: [PrismaModule, EventsModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
