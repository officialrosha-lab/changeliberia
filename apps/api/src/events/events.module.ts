import { Module, forwardRef } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventBusService } from './event-bus.service';
import { FacebookEventsListener } from './facebook-events.listener';
import { PetitionsGateway } from './petitions.gateway';
import { NotificationsGateway } from './notifications.gateway';
import { PetitionsRealtimeService } from './petitions-realtime.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FacebookModule } from '../facebook/facebook.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    PrismaModule,
    forwardRef(() => FacebookModule),
  ],
  providers: [
    EventBusService,
    FacebookEventsListener,
    PetitionsGateway,
    NotificationsGateway,
    PetitionsRealtimeService,
  ],
  exports: [
    EventBusService,
    FacebookEventsListener,
    PetitionsGateway,
    NotificationsGateway,
    PetitionsRealtimeService,
  ],
})
export class EventsModule {}
