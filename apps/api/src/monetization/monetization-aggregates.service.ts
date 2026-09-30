import { Injectable } from '@nestjs/common';
import {
  MembershipInterval,
  MembershipSubscriptionStatus,
  PlacementStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const ACTIVE = MembershipSubscriptionStatus.ACTIVE;
const PAST_DUE = MembershipSubscriptionStatus.PAST_DUE;
// A promotion/sponsorship purchase that ever reached ACTIVE was captured by
// the payment provider; EXPIRED is just the natural end of its paid window,
// not a refund — both count toward "money actually collected".
const CAPTURED_PLACEMENT: PlacementStatus[] = [
  PlacementStatus.ACTIVE,
  PlacementStatus.EXPIRED,
];

function toNumber(value: Prisma.Decimal | null | undefined): number {
  return value ? value.toNumber() : 0;
}

function monthlyEquivalent(
  amount: Prisma.Decimal,
  interval: MembershipInterval,
): number {
  const value = amount.toNumber();
  if (interval === 'YEARLY') return value / 12;
  if (interval === 'QUARTERLY') return value / 3;
  return value;
}

export interface OneTimeRevenue {
  petitionPromotions: number;
  sponsorships: number;
  researchProducts: number;
  events: number;
  total: number;
}

export interface RecurringMonthlyRevenue {
  memberships: number;
  organizations: number;
  institutions: number;
  apiPlans: number;
  total: number;
}

export interface MonetizationSummary {
  asOf: string;
  oneTimeRevenue: OneTimeRevenue;
  recurringMonthlyRevenue: RecurringMonthlyRevenue;
  activeCounts: {
    payingMembers: number;
    payingOrganizations: number;
    payingInstitutions: number;
    apiSubscribers: number;
    activeSponsorships: number;
    activePromotions: number;
  };
  lifetimeCounts: {
    promotionsPurchased: number;
    sponsorshipsPurchased: number;
    researchProductsSold: number;
    paidEventRegistrations: number;
    freeEventRegistrations: number;
  };
  needsAttention: {
    draftInvoices: number;
    pastDueSubscriptions: number;
    openServiceRequests: number;
    unfulfilledSponsorshipPurchases: number;
  };
}

export interface PublicTransparencySummary {
  asOf: string;
  totalOneTimeRevenueCollected: number;
  totalRecurringMonthlyRevenue: number;
  payingMembers: number;
  payingOrganizations: number;
  payingInstitutions: number;
  lifetimePromotionsPurchased: number;
  lifetimeSponsorshipsPurchased: number;
  lifetimeResearchProductsSold: number;
  lifetimePaidEventRegistrations: number;
  civicPrinciple: string;
}

export type SubscriptionProductType =
  | 'MEMBERSHIP'
  | 'ORGANIZATION'
  | 'INSTITUTION'
  | 'API';

export interface UnifiedSubscriptionRow {
  productType: SubscriptionProductType;
  id: string;
  status: MembershipSubscriptionStatus;
  planKey: string;
  planName: string;
  subject: string;
  createdAt: Date;
  currentPeriodEnd: Date | null;
}

export const CIVIC_PRINCIPLE_STATEMENT =
  'Creating, signing, following, and viewing a petition — and participating in or viewing Civic Pulse — is free forever. No payment, plan, or subscription can ever change a signature count, a poll result, a petition’s legitimacy, or a government’s obligation to respond. A verified lawmaker’s basic constituency access is free forever too. Every figure below is what the platform collects for optional tools, distribution, and professional services on top of that free foundation.';

/**
 * Aggregation layer feeding both the admin monetization dashboard (full
 * detail, RBAC-gated) and the public transparency center (a narrow,
 * non-sensitive subset — see getPublicSummary). One computation, two
 * views, so the two surfaces can never drift on how a figure is derived.
 *
 * Money figures are honest about what this schema can actually answer:
 * - "One-time revenue" sums real captured amounts (a promotion, a
 *   sponsorship, a research report, a paid event seat) — every one of
 *   these purchase rows holds (or joins to) the amount actually charged.
 * - "Recurring monthly revenue" is an estimated run-rate from ACTIVE
 *   subscriptions' plan prices, normalized to a monthly figure — this
 *   schema has no per-renewal payment ledger for the new subscription
 *   products (see monetization-webhook.util.ts), so a precise
 *   all-time-collected figure for recurring products isn't derivable
 *   without fabricating one.
 */
@Injectable()
export class MonetizationAggregatesService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(): Promise<MonetizationSummary> {
    const [
      promotionRevenue,
      sponsorshipPurchases,
      researchPurchases,
      paidEventRegistrations,
      freeEventRegistrationsCount,
      activePromotions,
      activeSponsorships,
      membershipSubs,
      organizationSubs,
      institutionSubs,
      apiSubs,
      draftInvoices,
      pastDueMembership,
      pastDueOrganization,
      pastDueInstitution,
      pastDueApi,
      openServiceRequests,
      unfulfilledSponsorshipPurchases,
    ] = await Promise.all([
      this.prisma.petitionPromotion.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { status: { in: CAPTURED_PLACEMENT } },
      }),
      this.prisma.sponsorshipPurchase.findMany({
        where: { status: { in: CAPTURED_PLACEMENT } },
        select: { package: { select: { priceAmount: true } } },
      }),
      this.prisma.researchProductPurchase.findMany({
        where: { status: 'COMPLETED' },
        select: { product: { select: { priceAmount: true } } },
      }),
      this.prisma.eventRegistration.findMany({
        where: {
          purchaseStatus: 'COMPLETED',
          status: { not: 'CANCELLED' },
          event: { priceAmount: { not: null } },
        },
        select: { event: { select: { priceAmount: true } } },
      }),
      this.prisma.eventRegistration.count({
        where: {
          purchaseStatus: 'COMPLETED',
          status: { not: 'CANCELLED' },
          event: { priceAmount: null },
        },
      }),
      this.prisma.petitionPromotion.count({
        where: { status: PlacementStatus.ACTIVE },
      }),
      this.prisma.sponsorshipPurchase.count({
        where: { status: PlacementStatus.ACTIVE },
      }),
      this.prisma.membershipSubscription.findMany({
        where: { status: ACTIVE },
        select: { plan: { select: { priceAmount: true, interval: true } } },
      }),
      this.prisma.organizationSubscription.findMany({
        where: { status: ACTIVE },
        select: { plan: { select: { priceAmount: true, interval: true } } },
      }),
      this.prisma.institutionSubscription.findMany({
        where: { status: ACTIVE },
        select: { plan: { select: { priceAmount: true, interval: true } } },
      }),
      this.prisma.apiSubscription.findMany({
        where: { status: ACTIVE },
        select: { plan: { select: { priceAmount: true, interval: true } } },
      }),
      this.prisma.invoice.count({ where: { status: 'DRAFT' } }),
      this.prisma.membershipSubscription.count({
        where: { status: PAST_DUE },
      }),
      this.prisma.organizationSubscription.count({
        where: { status: PAST_DUE },
      }),
      this.prisma.institutionSubscription.count({
        where: { status: PAST_DUE },
      }),
      this.prisma.apiSubscription.count({ where: { status: PAST_DUE } }),
      this.prisma.professionalServiceRequest.count({
        where: { status: { in: ['SUBMITTED', 'SCOPING'] } },
      }),
      this.prisma.sponsorshipPurchase.count({
        where: { status: PlacementStatus.ACTIVE, sponsorId: null },
      }),
    ]);

    const sponsorshipRevenue = sponsorshipPurchases.reduce(
      (sum, p) => sum + toNumber(p.package.priceAmount),
      0,
    );
    const researchRevenue = researchPurchases.reduce(
      (sum, p) => sum + toNumber(p.product.priceAmount),
      0,
    );
    const eventRevenue = paidEventRegistrations.reduce(
      (sum, r) => sum + toNumber(r.event.priceAmount),
      0,
    );
    const promotionTotal = toNumber(promotionRevenue._sum.amount);

    const oneTimeRevenue: OneTimeRevenue = {
      petitionPromotions: promotionTotal,
      sponsorships: sponsorshipRevenue,
      researchProducts: researchRevenue,
      events: eventRevenue,
      total:
        promotionTotal + sponsorshipRevenue + researchRevenue + eventRevenue,
    };

    const membershipMrr = membershipSubs.reduce(
      (sum, s) => sum + monthlyEquivalent(s.plan.priceAmount, s.plan.interval),
      0,
    );
    const organizationMrr = organizationSubs.reduce(
      (sum, s) => sum + monthlyEquivalent(s.plan.priceAmount, s.plan.interval),
      0,
    );
    const institutionMrr = institutionSubs.reduce(
      (sum, s) => sum + monthlyEquivalent(s.plan.priceAmount, s.plan.interval),
      0,
    );
    const apiMrr = apiSubs.reduce(
      (sum, s) => sum + monthlyEquivalent(s.plan.priceAmount, s.plan.interval),
      0,
    );

    const recurringMonthlyRevenue: RecurringMonthlyRevenue = {
      memberships: membershipMrr,
      organizations: organizationMrr,
      institutions: institutionMrr,
      apiPlans: apiMrr,
      total: membershipMrr + organizationMrr + institutionMrr + apiMrr,
    };

    return {
      asOf: new Date().toISOString(),
      oneTimeRevenue,
      recurringMonthlyRevenue,
      activeCounts: {
        payingMembers: membershipSubs.length,
        payingOrganizations: organizationSubs.length,
        payingInstitutions: institutionSubs.length,
        apiSubscribers: apiSubs.length,
        activeSponsorships,
        activePromotions,
      },
      lifetimeCounts: {
        promotionsPurchased: promotionRevenue._count,
        sponsorshipsPurchased: sponsorshipPurchases.length,
        researchProductsSold: researchPurchases.length,
        paidEventRegistrations: paidEventRegistrations.length,
        freeEventRegistrations: freeEventRegistrationsCount,
      },
      needsAttention: {
        draftInvoices,
        pastDueSubscriptions:
          pastDueMembership +
          pastDueOrganization +
          pastDueInstitution +
          pastDueApi,
        openServiceRequests,
        unfulfilledSponsorshipPurchases,
      },
    };
  }

  async getPublicSummary(): Promise<PublicTransparencySummary> {
    const summary = await this.getSummary();
    return {
      asOf: summary.asOf,
      totalOneTimeRevenueCollected: summary.oneTimeRevenue.total,
      totalRecurringMonthlyRevenue: summary.recurringMonthlyRevenue.total,
      payingMembers: summary.activeCounts.payingMembers,
      payingOrganizations: summary.activeCounts.payingOrganizations,
      payingInstitutions: summary.activeCounts.payingInstitutions,
      lifetimePromotionsPurchased: summary.lifetimeCounts.promotionsPurchased,
      lifetimeSponsorshipsPurchased:
        summary.lifetimeCounts.sponsorshipsPurchased,
      lifetimeResearchProductsSold: summary.lifetimeCounts.researchProductsSold,
      lifetimePaidEventRegistrations:
        summary.lifetimeCounts.paidEventRegistrations,
      civicPrinciple: CIVIC_PRINCIPLE_STATEMENT,
    };
  }

  async listAllSubscriptions(): Promise<UnifiedSubscriptionRow[]> {
    const [memberships, organizations, institutions, apiSubs] =
      await Promise.all([
        this.prisma.membershipSubscription.findMany({
          include: {
            user: { select: { fullName: true, email: true } },
            plan: { select: { key: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.organizationSubscription.findMany({
          include: {
            organization: { select: { name: true } },
            plan: { select: { key: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.institutionSubscription.findMany({
          include: {
            institution: { select: { name: true } },
            plan: { select: { key: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.apiSubscription.findMany({
          include: {
            user: { select: { fullName: true, email: true } },
            plan: { select: { key: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    const rows: UnifiedSubscriptionRow[] = [
      ...memberships.map((s) => ({
        productType: 'MEMBERSHIP' as const,
        id: s.id,
        status: s.status,
        planKey: s.plan.key,
        planName: s.plan.name,
        subject: s.user.fullName || s.user.email || s.userId,
        createdAt: s.createdAt,
        currentPeriodEnd: s.currentPeriodEnd,
      })),
      ...organizations.map((s) => ({
        productType: 'ORGANIZATION' as const,
        id: s.id,
        status: s.status,
        planKey: s.plan.key,
        planName: s.plan.name,
        subject: s.organization.name,
        createdAt: s.createdAt,
        currentPeriodEnd: s.currentPeriodEnd,
      })),
      ...institutions.map((s) => ({
        productType: 'INSTITUTION' as const,
        id: s.id,
        status: s.status,
        planKey: s.plan.key,
        planName: s.plan.name,
        subject: s.institution.name,
        createdAt: s.createdAt,
        currentPeriodEnd: s.currentPeriodEnd,
      })),
      ...apiSubs.map((s) => ({
        productType: 'API' as const,
        id: s.id,
        status: s.status,
        planKey: s.plan.key,
        planName: s.plan.name,
        subject: s.user.fullName || s.user.email || s.userId,
        createdAt: s.createdAt,
        currentPeriodEnd: s.currentPeriodEnd,
      })),
    ];

    rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return rows;
  }
}
