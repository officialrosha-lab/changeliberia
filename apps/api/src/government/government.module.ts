import { Module } from '@nestjs/common';
import { GovernmentService } from './government.service';
import { GovernmentController } from './government.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [GovernmentController],
  providers: [GovernmentService],
  exports: [GovernmentService],
})
export class GovernmentModule {}
