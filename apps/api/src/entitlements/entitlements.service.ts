import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Entitlement,
  EntitlementGrant,
  EntitlementScope,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface EntitlementActor {
  userId?: string;
  institutionId?: string;
  organizationId?: string;
}

export interface CreateEntitlementDto {
  key: string;
  name: string;
  scope: EntitlementScope;
}

export interface GrantEntitlementDto {
  entitlementKey: string;
  userId?: string;
  institutionId?: string;
  organizationId?: string;
  source: string;
  sourceId?: string;
  expiresAt?: Date;
}

/**
 * Resolves and manages entitlement grants. Mirrors `RolePermissionService`'s
 * shape (the RBAC module this deliberately parallels), but for optional,
 * gateable capabilities rather than access-control roles.
 *
 * `hasEntitlement()` currently checks direct grants only — no purchase
 * product (MembershipSubscription, OrganizationSubscription, ...) exists
 * yet, so there is nothing to live-join. Milestones 8+ extend this method
 * to also treat an active subscription as an implicit grant, per the
 * architecture plan, without pre-materializing a grant row for it.
 */
@Injectable()
export class EntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  async hasEntitlement(actor: EntitlementActor, key: string): Promise<boolean> {
    if (!actor.userId && !actor.institutionId && !actor.organizationId) {
      return false;
    }

    const entitlement = await this.prisma.entitlement.findUnique({
      where: { key },
    });
    if (!entitlement) return false;

    const targets = [
      actor.userId ? { userId: actor.userId } : null,
      actor.institutionId ? { institutionId: actor.institutionId } : null,
      actor.organizationId ? { organizationId: actor.organizationId } : null,
    ].filter(
      (
        t,
      ): t is
        | { userId: string }
        | { institutionId: string }
        | { organizationId: string } => t !== null,
    );

    if (targets.length === 0) return false;

    const now = new Date();
    const grant = await this.prisma.entitlementGrant.findFirst({
      where: {
        entitlementId: entitlement.id,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        AND: [{ OR: targets }],
      },
    });

    return grant !== null;
  }

  async createEntitlement(dto: CreateEntitlementDto): Promise<Entitlement> {
    const existing = await this.prisma.entitlement.findUnique({
      where: { key: dto.key },
    });
    if (existing) {
      throw new BadRequestException(`Entitlement "${dto.key}" already exists`);
    }
    return this.prisma.entitlement.create({ data: dto });
  }

  async listEntitlements(): Promise<Entitlement[]> {
    return this.prisma.entitlement.findMany({ orderBy: { key: 'asc' } });
  }

  async grant(dto: GrantEntitlementDto): Promise<EntitlementGrant> {
    const entitlement = await this.prisma.entitlement.findUnique({
      where: { key: dto.entitlementKey },
    });
    if (!entitlement) {
      throw new NotFoundException(
        `Entitlement "${dto.entitlementKey}" not found`,
      );
    }

    const target = this.pickTarget(entitlement.scope, dto);

    return this.prisma.entitlementGrant.create({
      data: {
        entitlementId: entitlement.id,
        source: dto.source,
        sourceId: dto.sourceId,
        expiresAt: dto.expiresAt,
        ...target,
      },
    });
  }

  async revoke(grantId: string): Promise<EntitlementGrant> {
    const grant = await this.prisma.entitlementGrant.findUnique({
      where: { id: grantId },
    });
    if (!grant) throw new NotFoundException(`Grant not found: ${grantId}`);

    return this.prisma.entitlementGrant.update({
      where: { id: grantId },
      data: { revokedAt: new Date() },
    });
  }

  async listGrantsForActor(
    actor: EntitlementActor,
  ): Promise<EntitlementGrant[]> {
    const targets = [
      actor.userId ? { userId: actor.userId } : null,
      actor.institutionId ? { institutionId: actor.institutionId } : null,
      actor.organizationId ? { organizationId: actor.organizationId } : null,
    ].filter(
      (
        t,
      ): t is
        | { userId: string }
        | { institutionId: string }
        | { organizationId: string } => t !== null,
    );

    if (targets.length === 0) return [];

    return this.prisma.entitlementGrant.findMany({
      where: { OR: targets },
      include: { entitlement: true },
      orderBy: { grantedAt: 'desc' },
    });
  }

  private pickTarget(
    scope: EntitlementScope,
    dto: GrantEntitlementDto,
  ):
    | { userId: string }
    | { institutionId: string }
    | { organizationId: string } {
    if (scope === EntitlementScope.USER) {
      if (!dto.userId)
        throw new BadRequestException(
          'userId is required for a USER-scoped entitlement',
        );
      return { userId: dto.userId };
    }
    if (scope === EntitlementScope.INSTITUTION) {
      if (!dto.institutionId)
        throw new BadRequestException(
          'institutionId is required for an INSTITUTION-scoped entitlement',
        );
      return { institutionId: dto.institutionId };
    }
    if (!dto.organizationId)
      throw new BadRequestException(
        'organizationId is required for an ORGANIZATION-scoped entitlement',
      );
    return { organizationId: dto.organizationId };
  }
}
