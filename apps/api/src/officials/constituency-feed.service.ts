import { Injectable } from '@nestjs/common';
import { Institution, PetitionStatus, PollStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConstituencyScopeService,
  ConstituencyScopeFilter,
} from './constituency-scope.service';

export interface ConstituencyFeedFilters {
  page?: number;
  limit?: number;
  category?: string;
}

// Static, admin-tunable-later thresholds for the descriptive feed
// indicators below. Deliberately not percentile/ranking-based — see the
// spec's explicit prohibition on ranking petitions as "most important".
// TODO(Milestone 6): source these from FeatureToggle config once the
// entitlements/feature-flag infra lands, so admins can tune without a
// deploy — hardcoded for now since that infra doesn't exist yet.
const RECENTLY_CREATED_WINDOW_DAYS = 14;
const HIGH_PARTICIPATION_SIGNATURE_THRESHOLD = 100;
const RAPID_GROWTH_WINDOW_DAYS = 7;
const RAPID_GROWTH_SIGNATURE_THRESHOLD = 20;
const AWAITING_RESPONSE_STALENESS_DAYS = 7;
const HIGH_PARTICIPATION_VOTE_THRESHOLD = 50;

export interface PetitionFeedIndicators {
  isRecentlyCreated: boolean;
  isHighParticipation: boolean;
  isRapidlyGrowing: boolean;
  isAwaitingResponse: boolean;
}

export interface PollFeedIndicators {
  isRecentlyCreated: boolean;
  isHighParticipation: boolean;
}

function paginationOf(filters: ConstituencyFeedFilters) {
  const page = filters.page && filters.page >= 1 ? filters.page : 1;
  const limit =
    filters.limit && filters.limit >= 1 ? Math.min(filters.limit, 50) : 20;
  return { page, take: limit, skip: (page - 1) * limit };
}

/**
 * Assembles constituency-scoped feeds (petitions, Civic Pulse polls, issue
 * trends) for a verified lawmaker's dashboard. All scoping goes through
 * `ConstituencyScopeService` — never re-derives county/district filtering
 * ad hoc — and every indicator here is a plain descriptive flag against a
 * static threshold, never a ranking (spec explicitly prohibits labeling a
 * petition "most important"/"best"/"worst").
 *
 * Reuses, rather than duplicates: `LocationClassificationService` and
 * `PetitionsService.getSignatureBreakdown`/`getCommunityInsights` remain
 * the per-petition detail views this feed links out to; this service only
 * assembles the scoped list + lightweight aggregate indicators.
 */
@Injectable()
export class ConstituencyFeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly constituencyScope: ConstituencyScopeService,
  ) {}

  async getConstituencyPetitionFeed(
    institution: Institution,
    filters: ConstituencyFeedFilters = {},
  ) {
    const scope = this.constituencyScope.buildScopeFilter(institution);
    if (!scope) {
      return { scope: null, data: [], pagination: emptyPagination() };
    }

    const { page, take, skip } = paginationOf(filters);
    const where = {
      ...scope,
      status: PetitionStatus.APPROVED,
      ...(filters.category ? { category: filters.category } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.petition.findMany({
        where,
        select: {
          id: true,
          title: true,
          summary: true,
          category: true,
          county: true,
          district: true,
          signaturesCount: true,
          goal: true,
          status: true,
          createdAt: true,
          governmentResponses: {
            where: { institutionId: institution.id },
            select: { currentStage: true, createdAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.petition.count({ where }),
    ]);

    const recentSignatureCounts = await this.countRecentSignatures(
      rows.map((r) => r.id),
    );

    const now = Date.now();
    const data = rows.map((row) => {
      const { governmentResponses, ...petition } = row;
      const response = governmentResponses[0];
      const ageDays =
        (now - petition.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const recentSignatures = recentSignatureCounts.get(petition.id) ?? 0;
      const staleReceived =
        !response ||
        (response.currentStage === 'RECEIVED' &&
          (now - response.createdAt.getTime()) / (1000 * 60 * 60 * 24) >=
            AWAITING_RESPONSE_STALENESS_DAYS);

      const indicators: PetitionFeedIndicators = {
        isRecentlyCreated: ageDays <= RECENTLY_CREATED_WINDOW_DAYS,
        isHighParticipation:
          petition.signaturesCount >= HIGH_PARTICIPATION_SIGNATURE_THRESHOLD,
        isRapidlyGrowing: recentSignatures >= RAPID_GROWTH_SIGNATURE_THRESHOLD,
        isAwaitingResponse: staleReceived,
      };

      return { ...petition, indicators };
    });

    return {
      scope,
      data,
      pagination: {
        page,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /** Signatures created in the last RAPID_GROWTH_WINDOW_DAYS, per petition — one query, not N+1. */
  private async countRecentSignatures(
    petitionIds: string[],
  ): Promise<Map<string, number>> {
    if (petitionIds.length === 0) return new Map();
    const since = new Date(
      Date.now() - RAPID_GROWTH_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );
    const grouped = await this.prisma.signature.groupBy({
      by: ['petitionId'],
      where: { petitionId: { in: petitionIds }, createdAt: { gte: since } },
      _count: { _all: true },
    });
    return new Map(grouped.map((g) => [g.petitionId, g._count._all]));
  }

  async getConstituencyPollFeed(
    institution: Institution,
    filters: ConstituencyFeedFilters = {},
  ) {
    const scope = this.constituencyScope.buildScopeFilter(institution);
    if (!scope) {
      return { scope: null, data: [], pagination: emptyPagination() };
    }

    const { page, take, skip } = paginationOf(filters);
    const where = {
      ...scopeToPollWhere(scope),
      status: {
        in: [PollStatus.ACTIVE, PollStatus.EXPIRED, PollStatus.CLOSED],
      },
      ...(filters.category ? { category: filters.category } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.poll.findMany({
        where,
        select: {
          id: true,
          slug: true,
          title: true,
          category: true,
          county: true,
          district: true,
          status: true,
          totalVotes: true,
          expiresAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.poll.count({ where }),
    ]);

    const now = Date.now();
    const data = rows.map((poll) => {
      const ageDays = (now - poll.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const indicators: PollFeedIndicators = {
        isRecentlyCreated: ageDays <= RECENTLY_CREATED_WINDOW_DAYS,
        isHighParticipation:
          poll.totalVotes >= HIGH_PARTICIPATION_VOTE_THRESHOLD,
      };
      return { ...poll, indicators };
    });

    return {
      scope,
      data,
      pagination: {
        page,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /**
   * Groups the constituency's approved petitions by category over the
   * given period — structurally the same `groupBy(['category'])` pattern
   * already used in `getConstituency`, just parameterized by time window.
   * Purely descriptive counts, not a trend-direction/ranking computation.
   */
  async getIssueTrends(
    institution: Institution,
    period: 'week' | 'month' | 'quarter' | 'year' = 'month',
  ) {
    const scope = this.constituencyScope.buildScopeFilter(institution);
    if (!scope) return { scope: null, since: null, categories: [] };

    const days = { week: 7, month: 30, quarter: 90, year: 365 }[period];
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const grouped = await this.prisma.petition.groupBy({
      by: ['category'],
      where: {
        ...scope,
        status: PetitionStatus.APPROVED,
        createdAt: { gte: since },
      },
      _count: { id: true },
      _sum: { signaturesCount: true },
      orderBy: { _count: { id: 'desc' } },
    });

    return {
      scope,
      since,
      categories: grouped.map((g) => ({
        category: g.category,
        petitionCount: g._count.id,
        signaturesTotal: g._sum.signaturesCount ?? 0,
      })),
    };
  }
}

function emptyPagination() {
  return { page: 1, limit: 20, total: 0, totalPages: 0 };
}

function scopeToPollWhere(scope: ConstituencyScopeFilter) {
  // Poll's county/district are nullable in the schema (null = national) —
  // this only narrows to the officeholder's own county/district, it never
  // widens to include national-scope polls, consistent with the
  // constituency feed being "what's specific to my area", not "everything".
  return scope.district
    ? { county: scope.county, district: scope.district }
    : { county: scope.county };
}
