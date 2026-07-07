import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SignaturesModule } from '../signatures/signatures.module';
import { SmsService } from './sms.service';
import { SmsInboundController } from './sms-inbound.controller';

@Module({
  imports: [PrismaModule, SignaturesModule],
  controllers: [SmsInboundController],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
