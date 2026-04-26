import { Module } from '@nestjs/common';
import { SignaturesController } from './signatures.controller';
import { SignaturesService } from './signatures.service';
import { FraudModule } from '../fraud/fraud.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [FraudModule, EventsModule],
  controllers: [SignaturesController],
  providers: [SignaturesService],
})
export class SignaturesModule {}
