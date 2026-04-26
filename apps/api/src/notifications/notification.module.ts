import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationTriggerService } from './notification-trigger.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationTriggerService],
  exports: [NotificationService],
})
export class NotificationModule {}
