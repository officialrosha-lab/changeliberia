import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';
import { AdminSponsorsController, SponsorsController } from './sponsors.controller';
import { SponsorsService } from './sponsors.service';

@Module({
  imports: [PrismaModule, RbacModule],
  providers: [SponsorsService],
  controllers: [SponsorsController, AdminSponsorsController],
})
export class SponsorsModule {}
