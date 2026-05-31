import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesScheduler } from './messages.scheduler';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [MessagesService, MessagesScheduler],
  controllers: [MessagesController],
  exports: [MessagesService],
})
export class MessagesModule {}
