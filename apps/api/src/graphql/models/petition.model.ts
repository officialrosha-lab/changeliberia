import { Field, ObjectType, Int } from '@nestjs/graphql';

/**
 * Read-only GraphQL projection of Petition, intended for external/research
 * consumption (spec's "Open API for research institutions"). Deliberately
 * a subset — no creator PII, no moderation internals, no mutations. All
 * write operations remain REST-only; this API exists purely for querying
 * already-public petition data in a more flexible shape.
 */
@ObjectType('Petition')
export class PetitionModel {
  @Field() id!: string;
  @Field() title!: string;
  @Field() summary!: string;
  @Field(() => String, { nullable: true }) category?: string | null;
  @Field(() => [String]) categories!: string[];
  @Field(() => String, { nullable: true }) petitionType?: string | null;
  @Field(() => String, { nullable: true }) county?: string | null;
  @Field(() => String, { nullable: true }) district?: string | null;
  @Field(() => String, { nullable: true }) community?: string | null;
  @Field(() => String, { nullable: true }) impactScope?: string | null;
  @Field(() => [String]) counties!: string[];
  @Field(() => Int) goal!: number;
  @Field() status!: string;
  @Field(() => Int) signaturesCount!: number;
  @Field(() => Int) todaySignatures!: number;
  @Field() createdAt!: Date;
}

@ObjectType('InsightRow')
export class InsightRowModel {
  @Field() label!: string;
  @Field(() => Int) count!: number;
}

@ObjectType('SignatureBreakdown')
export class SignatureBreakdownModel {
  @Field(() => Int) total!: number;
  @Field(() => Int) directlyAffected!: number;
  @Field(() => Int) nearbyCommunity!: number;
  @Field(() => Int) supporters!: number;
  @Field(() => Int) diasporaSupport!: number;
  @Field(() => Int) unknown!: number;
}

@ObjectType('CommunityInsights')
export class CommunityInsightsModel {
  @Field(() => [InsightRowModel]) byCounty!: InsightRowModel[];
  @Field(() => [InsightRowModel]) byDistrict!: InsightRowModel[];
  @Field(() => [InsightRowModel]) byCommunity!: InsightRowModel[];
  @Field(() => Int) diasporaTotal!: number;
}
