import { Controller, Get, Query } from '@nestjs/common';
import { EntitlementScope } from '@prisma/client';
import { WorkspacePlansService } from './workspace-plans.service';

/**
 * Public, unauthenticated plan catalog for both Organization- and
 * Institution-scoped workspace plans — separate from OrganizationsController
 * (which needs auth for everything else) and from
 * InstitutionSubscriptionsController (whose `institutions/:institutionId`
 * prefix would otherwise collide with a literal path segment here).
 */
@Controller('workspace-plans')
export class WorkspacePlansController {
  constructor(private readonly workspacePlans: WorkspacePlansService) {}

  @Get()
  listPlans(@Query('scope') scope?: string) {
    const resolvedScope =
      scope === 'INSTITUTION'
        ? EntitlementScope.INSTITUTION
        : EntitlementScope.ORGANIZATION;
    return this.workspacePlans.listActivePlans(resolvedScope);
  }
}
