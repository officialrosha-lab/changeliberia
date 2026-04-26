import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { GrowthService } from './growth.service';
import { GrowthController } from './growth.controller';

@Module({
  imports: [PrismaModule],
  providers: [WhatsAppService, GrowthService],
  controllers: [WhatsAppController, GrowthController],
  exports: [WhatsAppService, GrowthService],
})
export class WhatsAppModule {}
