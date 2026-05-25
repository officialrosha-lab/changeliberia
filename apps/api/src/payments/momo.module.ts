import { Module } from '@nestjs/common';
import { MoMoService } from './providers/momo.service';
import { MoMoWebhookService } from './momo-webhook.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [PrismaModule, ActivityModule],
  providers: [MoMoService, MoMoWebhookService],
  exports: [MoMoService, MoMoWebhookService],
})
export class MoMoModule {}