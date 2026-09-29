import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EntitlementsService } from './entitlements.service';
import { EntitlementGuard } from './guards/entitlement.guard';
import { AdminEntitlementsController } from './admin-entitlements.controller';

// Global, mirroring RbacModule — @RequiresEntitlement()/EntitlementGuard
// need to be usable from any feature module without each one importing
// this module explicitly.
@Global()
@Module({
  imports: [PrismaModule],
  controllers: [AdminEntitlementsController],
  providers: [EntitlementsService, EntitlementGuard],
  exports: [EntitlementsService, EntitlementGuard],
})
export class EntitlementsModule {}
