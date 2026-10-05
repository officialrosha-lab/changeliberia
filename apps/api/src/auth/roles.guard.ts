import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

export type RequestUser = { userId: string; phone: string; role: UserRole };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // Fail closed: a route guarded by RolesGuard with no @Roles() decorator
    // is a configuration bug, not an "any authenticated user" route — deny
    // rather than silently allow.
    if (!roles?.length) return false;
    const req = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = req.user;
    return !!user?.role && roles.includes(user.role);
  }
}
