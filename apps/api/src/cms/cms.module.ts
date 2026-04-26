import { Module } from '@nestjs/common';
import { CMSController } from './cms.controller';
import { CMSService } from './cms.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, RbacModule],
  providers: [CMSService],
  controllers: [CMSController],
  exports: [CMSService],
})
export class CMSModule {}
