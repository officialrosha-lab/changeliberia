import { Module } from '@nestjs/common';
import { BroadcastService } from './broadcast.service';
import { BroadcastController } from './broadcast.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MessagesModule } from '../messages/messages.module';
import { StakeholderGroupModule } from '../stakeholder-groups/stakeholder-group.module';

@Module({
  imports: [PrismaModule, MessagesModule, StakeholderGroupModule],
  providers: [BroadcastService],
  controllers: [BroadcastController],
  exports: [BroadcastService],
})
export class BroadcastModule {}
