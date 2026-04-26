import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolePermissionService } from '../role-permission.service';
import { PERMISSION_KEY } from '../decorators/permission.decorator';
import { PermissionResource, PermissionAction } from '@prisma/client';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rolePermissionService: RolePermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.get<{
      resource: PermissionResource;
      action: PermissionAction;
    }>(PERMISSION_KEY, context.getHandler());

    if (!permission) {
      // No permission required
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.sub) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasPermission = await this.rolePermissionService.hasPermission(
      user.sub,
      permission.resource,
      permission.action,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `User does not have permission: ${permission.resource}:${permission.action}`,
      );
    }

    return true;
  }
}
