import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { ContactDirectoryModule } from '../contact-directory/contact-directory.module';
import { PetitionsController } from './petitions.controller';
import { PetitionsService } from './petitions.service';
import { PetitionEmailService } from '../contact-directory/email/petition-email.service';
import { PetitionMediaStorageService } from './petition-media-storage.service';

@Module({
  imports: [AuthModule, EmailModule, ContactDirectoryModule],
  controllers: [PetitionsController],
  providers: [PetitionsService, PetitionEmailService, PetitionMediaStorageService],
  exports: [PetitionsService, PetitionEmailService],
})
export class PetitionsModule {}
