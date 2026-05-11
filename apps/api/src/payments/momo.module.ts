import { Module } from '@nestjs/common';
import { MoMoService } from './providers/momo.service';
import { MoMoWebhookService } from './momo-webhook.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [MoMoService, MoMoWebhookService],
  exports: [MoMoService, MoMoWebhookService],
})
export class MoMoModule {}