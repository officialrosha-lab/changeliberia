import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { EndorsementsService } from './endorsements.service';
import { EndorsementsController } from './endorsements.controller';
import { AdminEndorsementsController } from './admin-endorsements.controller';

@Module({
  imports: [ActivityModule],
  providers: [EndorsementsService],
  controllers: [EndorsementsController, AdminEndorsementsController],
})
export class EndorsementsModule {}
