import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ActivityLoggerService } from './activity-logger.service';
import { ActivityLogController } from './activity-log.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ActivityLogController],
  providers: [ActivityLoggerService],
  exports: [ActivityLoggerService],
})
export class ActivityModule {}
