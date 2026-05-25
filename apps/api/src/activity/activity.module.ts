import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityLoggerService } from './activity-logger.service';
import { ActivityLogController } from './activity-log.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ActivityLogController],
  providers: [ActivityLoggerService],
  exports: [ActivityLoggerService],
})
export class ActivityModule {}
