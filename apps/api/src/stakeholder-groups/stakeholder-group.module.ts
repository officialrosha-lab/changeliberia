import { Module } from '@nestjs/common';
import { StakeholderGroupService } from './stakeholder-group.service';
import { StakeholderGroupController } from './stakeholder-group.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [StakeholderGroupService],
  controllers: [StakeholderGroupController],
  exports: [StakeholderGroupService],
})
export class StakeholderGroupModule {}
