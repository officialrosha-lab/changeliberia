import { Module, Global } from '@nestjs/common';
import { RolePermissionService } from './role-permission.service';
import { PermissionGuard } from './guards/permission.guard';
import { RbacController } from './rbac.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [RbacController],
  providers: [RolePermissionService, PermissionGuard],
  exports: [RolePermissionService, PermissionGuard],
})
export class RbacModule {}
