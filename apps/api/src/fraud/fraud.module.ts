import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FraudController } from './fraud.controller';
import { FraudScheduler } from './fraud.scheduler';
import { FraudService } from './fraud.service';

@Module({
  imports: [AuthModule],
  controllers: [FraudController],
  providers: [FraudService, FraudScheduler],
  exports: [FraudService],
})
export class FraudModule {}
