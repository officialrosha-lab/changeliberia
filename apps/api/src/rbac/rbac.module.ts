import { Module, Global } from '@nestjs/common';
import { RolePermissionService } from './role-permission.service';
import { PermissionGuard } from './guards/permission.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [RolePermissionService, PermissionGuard],
  exports: [RolePermissionService, PermissionGuard],
})
export class RbacModule {}
