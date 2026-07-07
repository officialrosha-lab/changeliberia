import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { ContactDirectoryModule } from '../contact-directory/contact-directory.module';
import { ActivityModule } from '../activity/activity.module';
import { StakeholderGroupModule } from '../stakeholder-groups/stakeholder-group.module';
import { OfficialsModule } from '../officials/officials.module';
import { PetitionsController } from './petitions.controller';
import { PetitionsService } from './petitions.service';
import { PetitionEmailService } from '../contact-directory/email/petition-email.service';
import { PetitionMediaStorageService } from './petition-media-storage.service';
import { PetitionsScheduler } from './petitions.scheduler';
import { ImpactAreaReportService } from './impact-area-report.service';

@Module({
  imports: [
    AuthModule,
    EmailModule,
    ContactDirectoryModule,
    ActivityModule,
    StakeholderGroupModule,
    OfficialsModule,
  ],
  controllers: [PetitionsController],
  providers: [PetitionsService, PetitionEmailService, PetitionMediaStorageService, PetitionsScheduler, ImpactAreaReportService],
  exports: [PetitionsService, PetitionEmailService],
})
export class PetitionsModule {}
