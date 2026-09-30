import {
  ApiPlan,
  ApiSubscription,
  EventRegistration,
  MembershipSubscriptionStatus,
  PetitionPromotion,
  PlacementStatus,
  PurchaseStatus,
  ResearchProductPurchase,
  SponsorshipPurchase,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from '../entitlements/entitlements.service';

/**
 * Plain exported functions, not NestJS providers — same
 * circular-dependency-avoidance pattern as memberships/membership-webhook.util.ts
 * and organizations/workspace-webhook.util.ts. WebhookEventHandlerService
 * needs to activate/fail these Milestone 10 purchase records; the services
 * that create them need PaymentModule's provider adapters, so importing
 * MonetizationModule into PaymentModule would be circular.
 *
 * Four of these five products (Promotion, Sponsorship, Research, Event) are
 * one-time purchases activated off `payment_intent.succeeded` /
 * `payment_intent.payment_failed`, disambiguated the same way the three
 * subscription products are: metadata set via
 * `payment_intent_data.metadata` on the Checkout Session (see the fix in
 * stripe-provider.adapter.ts this milestone). ApiSubscription is
 * subscription-based like Membership/Organization/Institution and follows
 * that exact pattern instead.
 */

function parseEntitlementKeys(json: string): string[] {
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed)
      ? parsed.filter((k) => typeof k === 'string')
      : [];
  } catch {
    return [];
  }
}

// ── Petition Promotion (one-time, PlacementStatus) ─────────────────────────

export async function activatePetitionPromotion(
  prisma: PrismaService,
  promotionId: string,
  params: { providerPaymentIntentId: string; eventId: string },
): Promise<PetitionPromotion> {
  const promotion = await prisma.petitionPromotion.findUniqueOrThrow({
    where: { id: promotionId },
  });
  const startsAt = promotion.startsAt ?? new Date();
  const durationMs = promotion.endsAt
    ? promotion.endsAt.getTime() -
      (promotion.startsAt?.getTime() ?? startsAt.getTime())
    : 7 * 24 * 60 * 60 * 1000; // default 7-day placement window
  return prisma.petitionPromotion.update({
    where: { id: promotionId },
    data: {
      status: PlacementStatus.ACTIVE,
      providerPaymentIntentId: params.providerPaymentIntentId,
      startsAt,
      endsAt: new Date(startsAt.getTime() + durationMs),
      lastWebhookEventId: params.eventId,
    },
  });
}

export async function failPetitionPromotionByProviderPaymentIntentId(
  prisma: PrismaService,
  providerPaymentIntentId: string,
  eventId: string,
): Promise<PetitionPromotion | null> {
  const promotion = await prisma.petitionPromotion.findUnique({
    where: { providerPaymentIntentId },
  });
  if (!promotion) return null;
  return prisma.petitionPromotion.update({
    where: { id: promotion.id },
    data: { status: PlacementStatus.CANCELLED, lastWebhookEventId: eventId },
  });
}

// ── Sponsorship (one-time, PlacementStatus) ────────────────────────────────

export async function activateSponsorshipPurchase(
  prisma: PrismaService,
  purchaseId: string,
  params: { providerPaymentIntentId: string; eventId: string },
): Promise<SponsorshipPurchase> {
  const purchase = await prisma.sponsorshipPurchase.findUniqueOrThrow({
    where: { id: purchaseId },
    include: { package: true },
  });
  const startsAt = new Date();
  const endsAt = new Date(
    startsAt.getTime() + purchase.package.durationDays * 24 * 60 * 60 * 1000,
  );
  return prisma.sponsorshipPurchase.update({
    where: { id: purchaseId },
    data: {
      status: PlacementStatus.ACTIVE,
      providerPaymentIntentId: params.providerPaymentIntentId,
      startsAt,
      endsAt,
      lastWebhookEventId: params.eventId,
    },
  });
}

export async function failSponsorshipPurchaseByProviderPaymentIntentId(
  prisma: PrismaService,
  providerPaymentIntentId: string,
  eventId: string,
): Promise<SponsorshipPurchase | null> {
  const purchase = await prisma.sponsorshipPurchase.findUnique({
    where: { providerPaymentIntentId },
  });
  if (!purchase) return null;
  return prisma.sponsorshipPurchase.update({
    where: { id: purchase.id },
    data: { status: PlacementStatus.CANCELLED, lastWebhookEventId: eventId },
  });
}

// ── Research Product (one-time, PurchaseStatus) ────────────────────────────

export async function activateResearchProductPurchase(
  prisma: PrismaService,
  purchaseId: string,
  params: { providerPaymentIntentId: string; eventId: string },
): Promise<ResearchProductPurchase> {
  return prisma.researchProductPurchase.update({
    where: { id: purchaseId },
    data: {
      status: PurchaseStatus.COMPLETED,
      providerPaymentIntentId: params.providerPaymentIntentId,
      lastWebhookEventId: params.eventId,
    },
  });
}

export async function failResearchProductPurchaseByProviderPaymentIntentId(
  prisma: PrismaService,
  providerPaymentIntentId: string,
  eventId: string,
): Promise<ResearchProductPurchase | null> {
  const purchase = await prisma.researchProductPurchase.findUnique({
    where: { providerPaymentIntentId },
  });
  if (!purchase) return null;
  return prisma.researchProductPurchase.update({
    where: { id: purchase.id },
    data: { status: PurchaseStatus.FAILED, lastWebhookEventId: eventId },
  });
}

// ── Event Registration (one-time, PurchaseStatus) ──────────────────────────

export async function activateEventRegistration(
  prisma: PrismaService,
  registrationId: string,
  params: { providerPaymentIntentId: string; eventId: string },
): Promise<EventRegistration> {
  return prisma.eventRegistration.update({
    where: { id: registrationId },
    data: {
      purchaseStatus: PurchaseStatus.COMPLETED,
      providerPaymentIntentId: params.providerPaymentIntentId,
      lastWebhookEventId: params.eventId,
    },
  });
}

export async function failEventRegistrationByProviderPaymentIntentId(
  prisma: PrismaService,
  providerPaymentIntentId: string,
  eventId: string,
): Promise<EventRegistration | null> {
  const registration = await prisma.eventRegistration.findUnique({
    where: { providerPaymentIntentId },
  });
  if (!registration) return null;
  return prisma.eventRegistration.update({
    where: { id: registration.id },
    data: {
      purchaseStatus: PurchaseStatus.FAILED,
      status: 'CANCELLED',
      lastWebhookEventId: eventId,
    },
  });
}

// ── API Subscription (recurring, mirrors membership-webhook.util.ts) ──────

export async function grantApiSubscriptionEntitlements(
  prisma: PrismaService,
  entitlementsService: EntitlementsService,
  subscription: ApiSubscription & { plan: ApiPlan },
): Promise<void> {
  const keys = parseEntitlementKeys(subscription.plan.entitlementKeys);
  for (const key of keys) {
    const entitlement = await prisma.entitlement.findUnique({ where: { key } });
    if (!entitlement) continue;
    const existingGrant = await prisma.entitlementGrant.findFirst({
      where: {
        entitlementId: entitlement.id,
        userId: subscription.userId,
        source: 'API_PLAN',
        sourceId: subscription.id,
        revokedAt: null,
      },
    });
    if (existingGrant) continue;
    await entitlementsService.grant({
      entitlementKey: key,
      userId: subscription.userId,
      source: 'API_PLAN',
      sourceId: subscription.id,
    });
  }
}

export async function revokeApiSubscriptionEntitlements(
  prisma: PrismaService,
  entitlementsService: EntitlementsService,
  apiSubscriptionId: string,
): Promise<void> {
  const grants = await prisma.entitlementGrant.findMany({
    where: { source: 'API_PLAN', sourceId: apiSubscriptionId, revokedAt: null },
  });
  for (const grant of grants) {
    await entitlementsService.revoke(grant.id);
  }
}

export async function activateApiSubscription(
  prisma: PrismaService,
  entitlementsService: EntitlementsService,
  apiSubscriptionId: string,
  params: {
    providerSubscriptionId: string;
    providerCustomerId?: string;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    eventId: string;
  },
): Promise<ApiSubscription> {
  const subscription = await prisma.apiSubscription.update({
    where: { id: apiSubscriptionId },
    data: {
      status: MembershipSubscriptionStatus.ACTIVE,
      providerSubscriptionId: params.providerSubscriptionId,
      providerCustomerId: params.providerCustomerId,
      currentPeriodStart: params.currentPeriodStart,
      currentPeriodEnd: params.currentPeriodEnd,
      lastWebhookEventId: params.eventId,
    },
    include: { plan: true },
  });
  await grantApiSubscriptionEntitlements(
    prisma,
    entitlementsService,
    subscription,
  );
  return subscription;
}

export async function cancelApiSubscriptionByProviderSubscriptionId(
  prisma: PrismaService,
  entitlementsService: EntitlementsService,
  providerSubscriptionId: string,
  eventId: string,
): Promise<ApiSubscription | null> {
  const subscription = await prisma.apiSubscription.findUnique({
    where: { providerSubscriptionId },
  });
  if (!subscription) return null;
  const updated = await prisma.apiSubscription.update({
    where: { id: subscription.id },
    data: {
      status: MembershipSubscriptionStatus.CANCELLED,
      cancelledAt: new Date(),
      cancellationReason: 'Cancelled by payment provider',
      lastWebhookEventId: eventId,
    },
  });
  // Revoking granted entitlements also stops issued API keys from working
  // for entitlement-gated endpoints; the keys themselves are revoked
  // explicitly by ApiBillingService.cancelSubscription, not here.
  await revokeApiSubscriptionEntitlements(
    prisma,
    entitlementsService,
    subscription.id,
  );
  return updated;
}

export async function markApiSubscriptionPastDue(
  prisma: PrismaService,
  providerSubscriptionId: string,
  eventId: string,
): Promise<void> {
  await prisma.apiSubscription.updateMany({
    where: { providerSubscriptionId },
    data: {
      status: MembershipSubscriptionStatus.PAST_DUE,
      lastWebhookEventId: eventId,
    },
  });
}
