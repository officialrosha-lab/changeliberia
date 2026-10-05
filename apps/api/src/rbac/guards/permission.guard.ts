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
import { RequestUser } from '../../auth/roles.guard';

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
      // Fail closed: a route guarded by PermissionGuard with no
      // @Permission() decorator is a configuration bug, not an
      // "any authenticated user" route — deny rather than silently allow.
      return false;
    }

    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;

    if (!user || !user.userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admins bypass RBAC — they always have full access
    if (user.role === 'ADMIN') return true;

    const hasPermission = await this.rolePermissionService.hasPermission(
      user.userId,
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
