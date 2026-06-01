import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsService } from './analytics.service';
import { MessageAnalyticsService } from './services/message-analytics.service';
import { BroadcastAnalyticsService } from './services/broadcast-analytics.service';
import { AnalyticsRealtimeService } from './services/analytics-realtime.service';
import { AnalyticsGateway } from './gateways/analytics.gateway';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    MessageAnalyticsService,
    BroadcastAnalyticsService,
    AnalyticsRealtimeService,
    AnalyticsGateway,
  ],
  exports: [
    AnalyticsService,
    MessageAnalyticsService,
    BroadcastAnalyticsService,
    AnalyticsRealtimeService,
    AnalyticsGateway,
  ],
})
export class AnalyticsModule {}
