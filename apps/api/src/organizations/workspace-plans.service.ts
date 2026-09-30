import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EntitlementScope,
  MembershipInterval,
  Prisma,
  WorkspacePlan,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FeatureFlagService } from '../admin/feature-flag.service';

const FEATURE_FLAG_NAME = 'WORKSPACE_BILLING_ENABLED';

export interface CreateWorkspacePlanDto {
  key: string;
  name: string;
  description?: string;
  scope: EntitlementScope;
  priceAmount: number;
  currency?: string;
  interval: MembershipInterval;
  seatLimit?: number;
  entitlementKeys?: string[];
}

export interface UpdateWorkspacePlanDto {
  name?: string;
  description?: string;
  priceAmount?: number;
  currency?: string;
  interval?: MembershipInterval;
  seatLimit?: number | null;
  entitlementKeys?: string[];
  active?: boolean;
}

/**
 * Shared catalog service for both Organization- and Institution-scoped
 * workspace plans — see the schema comment above `WorkspacePlan` for why
 * these two product lines share one plan model. Both OrganizationsService
 * and InstitutionSubscriptionsService depend on this rather than querying
 * WorkspacePlan directly, so the ORGANIZATION vs. INSTITUTION scope split
 * and the single feature flag live in exactly one place.
 */
@Injectable()
export class WorkspacePlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly featureFlags: FeatureFlagService,
  ) {}

  isEnabled(): Promise<boolean> {
    return this.featureFlags.isEnabled(FEATURE_FLAG_NAME);
  }

  async setEnabled(enabled: boolean): Promise<{ enabled: boolean }> {
    await this.featureFlags.setToggle(
      FEATURE_FLAG_NAME,
      enabled,
      undefined,
      'Gates the public workspace-plans routes and Organization/Institution subscribe flows (Milestone 9).',
    );
    return { enabled };
  }

  async listActivePlans(scope: EntitlementScope): Promise<WorkspacePlan[]> {
    if (!(await this.isEnabled())) return [];
    return this.prisma.workspacePlan.findMany({
      where: { scope, active: true },
      orderBy: { priceAmount: 'asc' },
    });
  }

  async findActivePlanByKey(
    key: string,
    scope: EntitlementScope,
  ): Promise<WorkspacePlan | null> {
    const plan = await this.prisma.workspacePlan.findUnique({ where: { key } });
    if (!plan || !plan.active || plan.scope !== scope) return null;
    return plan;
  }

  async listAllPlans(): Promise<WorkspacePlan[]> {
    return this.prisma.workspacePlan.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async createPlan(dto: CreateWorkspacePlanDto): Promise<WorkspacePlan> {
    const existing = await this.prisma.workspacePlan.findUnique({
      where: { key: dto.key },
    });
    if (existing) {
      throw new ConflictException(`Plan "${dto.key}" already exists`);
    }
    return this.prisma.workspacePlan.create({
      data: {
        key: dto.key,
        name: dto.name,
        description: dto.description,
        scope: dto.scope,
        priceAmount: new Prisma.Decimal(dto.priceAmount),
        currency: dto.currency ?? 'USD',
        interval: dto.interval,
        seatLimit: dto.seatLimit,
        entitlementKeys: JSON.stringify(dto.entitlementKeys ?? []),
      },
    });
  }

  async updatePlan(
    id: string,
    dto: UpdateWorkspacePlanDto,
  ): Promise<WorkspacePlan> {
    const plan = await this.prisma.workspacePlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException(`Plan not found: ${id}`);
    return this.prisma.workspacePlan.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        priceAmount:
          dto.priceAmount !== undefined
            ? new Prisma.Decimal(dto.priceAmount)
            : undefined,
        currency: dto.currency,
        interval: dto.interval,
        seatLimit: dto.seatLimit,
        entitlementKeys:
          dto.entitlementKeys !== undefined
            ? JSON.stringify(dto.entitlementKeys)
            : undefined,
        active: dto.active,
      },
    });
  }
}
