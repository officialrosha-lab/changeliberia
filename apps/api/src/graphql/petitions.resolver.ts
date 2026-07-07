import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { PetitionsService } from '../petitions/petitions.service';
import {
  PetitionModel,
  SignatureBreakdownModel,
  CommunityInsightsModel,
} from './models/petition.model';

/**
 * Read-only GraphQL API, primarily for research/civil-society consumers
 * who want flexible querying over already-public petition data. Mutations
 * (signing, creating, moderating) remain REST-only — this resolver never
 * writes. @SkipThrottle: the app-wide ThrottlerGuard (registered as
 * APP_GUARD) assumes a plain HTTP execution context and throws on
 * GraphQL's context shape — rate-limiting GraphQL specifically would need
 * a dedicated GqlThrottlerGuard, out of scope for this pass.
 */
@SkipThrottle()
@Resolver(() => PetitionModel)
export class PetitionsResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly petitionsService: PetitionsService,
  ) {}

  @Query(() => [PetitionModel])
  async petitions(
    @Args('county', { nullable: true }) county?: string,
    @Args('category', { nullable: true }) category?: string,
    @Args('impactScope', { nullable: true }) impactScope?: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<PetitionModel[]> {
    return this.prisma.petition.findMany({
      where: {
        status: 'APPROVED',
        ...(county ? { county } : {}),
        ...(category ? { category } : {}),
        ...(impactScope ? { impactScope: impactScope as any } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit ?? 20, 100),
    });
  }

  @Query(() => PetitionModel, { nullable: true })
  async petition(@Args('id') id: string): Promise<PetitionModel | null> {
    return this.prisma.petition.findUnique({ where: { id } });
  }

  @Query(() => SignatureBreakdownModel, { nullable: true })
  async petitionSignatureBreakdown(@Args('id') id: string) {
    return this.petitionsService.getSignatureBreakdown(id);
  }

  @Query(() => CommunityInsightsModel, { nullable: true })
  async petitionCommunityInsights(@Args('id') id: string) {
    return this.petitionsService.getCommunityInsights(id);
  }
}
