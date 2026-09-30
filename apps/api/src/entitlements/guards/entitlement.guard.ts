import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EntitlementsService } from '../entitlements.service';
import { REQUIRES_ENTITLEMENT_KEY } from '../decorators/requires-entitlement.decorator';
import { RequestUser } from '../../auth/roles.guard';

interface EntitlementRequest {
  user?: RequestUser;
  officialInstitution?: { id: string };
}

/**
 * Gates a route behind `@RequiresEntitlement(key)`. Mirrors PermissionGuard
 * exactly: no metadata means no gate, ADMIN always bypasses.
 *
 * CIVIC-PRINCIPLE GUARDRAIL: never add this guard (or the decorator it
 * reads) to a route that creates/signs/follows/views a petition, that
 * participates in or views Civic Pulse, or to a verified lawmaker's basic
 * `officials/me/constituency*` routes. That non-negotiable boundary is
 * enforced by `civic-principle.e2e-spec.ts`, which fails CI if any of those
 * routes carry `REQUIRES_ENTITLEMENT_KEY` metadata.
 */
@Injectable()
export class EntitlementGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlementsService: EntitlementsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const key = this.reflector.get<string>(
      REQUIRES_ENTITLEMENT_KEY,
      context.getHandler(),
    );
    if (!key) return true;

    const request = context.switchToHttp().getRequest<EntitlementRequest>();
    const user = request.user;
    if (!user || !user.userId) {
      throw new ForbiddenException('User not authenticated');
    }
    if (user.role === 'ADMIN') return true;

    const hasEntitlement = await this.entitlementsService.hasEntitlement(
      { userId: user.userId, institutionId: request.officialInstitution?.id },
      key,
    );

    if (!hasEntitlement) {
      throw new ForbiddenException(`Missing required entitlement: ${key}`);
    }
    return true;
  }
}
