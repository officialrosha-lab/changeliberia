import { Module } from '@nestjs/common';
import { ModeratorController } from './moderator.controller';
import { PetitionsModule } from '../petitions/petitions.module';
import { RbacModule } from '../rbac/rbac.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [PetitionsModule, RbacModule, EventsModule],
  controllers: [ModeratorController],
})
export class ModeratorModule {}
