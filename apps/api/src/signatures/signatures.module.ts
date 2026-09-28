import { Module } from '@nestjs/common';
import { SignaturesController } from './signatures.controller';
import { SignaturesService } from './signatures.service';
import { LocationClassificationService } from './location-classification.service';
import { IpRegionHintService } from './ip-region-hint.service';
import { FraudModule } from '../fraud/fraud.module';
import { EventsModule } from '../events/events.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [FraudModule, EventsModule, ActivityModule],
  controllers: [SignaturesController],
  providers: [
    SignaturesService,
    LocationClassificationService,
    IpRegionHintService,
  ],
  exports: [SignaturesService],
})
export class SignaturesModule {}
