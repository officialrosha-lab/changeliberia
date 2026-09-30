import { Controller, Get } from '@nestjs/common';
import { FeatureFlagService } from '../admin/feature-flag.service';
import {
  CIVIC_PRINCIPLE_STATEMENT,
  MonetizationAggregatesService,
} from './monetization-aggregates.service';

const TRANSPARENCY_PAGE_FLAG = 'TRANSPARENCY_PAGE_ENABLED';

/**
 * Unauthenticated, public. Serves only aggregate, non-sensitive figures —
 * no per-user data, no individual purchase/subscription rows. See
 * MonetizationAggregatesService.getPublicSummary for exactly what is and
 * isn't included.
 */
@Controller('transparency')
export class PublicTransparencyController {
  constructor(
    private readonly aggregates: MonetizationAggregatesService,
    private readonly featureFlags: FeatureFlagService,
  ) {}

  @Get('overview')
  async getOverview() {
    const enabled = await this.featureFlags.isEnabled(TRANSPARENCY_PAGE_FLAG);
    if (!enabled) {
      return { enabled: false, civicPrinciple: CIVIC_PRINCIPLE_STATEMENT };
    }
    const summary = await this.aggregates.getPublicSummary();
    return { enabled: true, ...summary };
  }
}
