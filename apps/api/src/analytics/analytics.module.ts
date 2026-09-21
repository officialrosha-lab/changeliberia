import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsService } from './analytics.service';
import { MessageAnalyticsService } from './services/message-analytics.service';
import { BroadcastAnalyticsService } from './services/broadcast-analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, MessageAnalyticsService, BroadcastAnalyticsService],
  exports: [AnalyticsService, MessageAnalyticsService, BroadcastAnalyticsService],
})
export class AnalyticsModule {}
