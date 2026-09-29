import {
  MembershipPlan,
  MembershipSubscription,
  MembershipSubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from '../entitlements/entitlements.service';

/**
 * The provider-webhook-driven half of the membership lifecycle (activate,
 * mark past-due, cancel — each keyed by `providerSubscriptionId`), plus the
 * entitlement grant/revoke logic that goes with it.
 *
 * Pulled out as plain functions (not methods on `MembershipsService`) so
 * `WebhookEventHandlerService` — which lives in `PaymentModule`, a module
 * `MembershipsModule` already imports — can call them directly via a
 * regular TS import instead of injecting `MembershipsService`, which would
 * require `PaymentModule` to import `MembershipsModule` back and create a
 * circular module dependency. `EntitlementsService` is injectable here
 * without any module import because `EntitlementsModule` is `@Global()`.
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

export async function grantMembershipEntitlements(
  prisma: PrismaService,
  entitlementsService: EntitlementsService,
  subscription: MembershipSubscription & { plan: MembershipPlan },
): Promise<void> {
  const keys = parseEntitlementKeys(subscription.plan.entitlementKeys);
  for (const key of keys) {
    const entitlement = await prisma.entitlement.findUnique({
      where: { key },
    });
    // The plan can reference an entitlement key before an admin has
    // created the matching Entitlement catalog row — skip rather than
    // fail activation; the plan's entitlements simply won't take effect
    // until the catalog row exists.
    if (!entitlement) continue;

    const existingGrant = await prisma.entitlementGrant.findFirst({
      where: {
        entitlementId: entitlement.id,
        userId: subscription.userId,
        source: 'MEMBERSHIP_PLAN',
        sourceId: subscription.id,
        revokedAt: null,
      },
    });
    if (existingGrant) continue; // idempotent under webhook retries

    await entitlementsService.grant({
      entitlementKey: key,
      userId: subscription.userId,
      source: 'MEMBERSHIP_PLAN',
      sourceId: subscription.id,
    });
  }
}

export async function revokeMembershipEntitlements(
  prisma: PrismaService,
  entitlementsService: EntitlementsService,
  membershipSubscriptionId: string,
): Promise<void> {
  const grants = await prisma.entitlementGrant.findMany({
    where: {
      source: 'MEMBERSHIP_PLAN',
      sourceId: membershipSubscriptionId,
      revokedAt: null,
    },
  });
  for (const grant of grants) {
    await entitlementsService.revoke(grant.id);
  }
}

export async function activateMembershipSubscription(
  prisma: PrismaService,
  entitlementsService: EntitlementsService,
  membershipSubscriptionId: string,
  params: {
    providerSubscriptionId: string;
    providerCustomerId?: string;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    eventId: string;
  },
): Promise<MembershipSubscription> {
  const subscription = await prisma.membershipSubscription.update({
    where: { id: membershipSubscriptionId },
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
  await grantMembershipEntitlements(prisma, entitlementsService, subscription);
  return subscription;
}

export async function cancelMembershipSubscriptionByProviderSubscriptionId(
  prisma: PrismaService,
  entitlementsService: EntitlementsService,
  providerSubscriptionId: string,
  eventId: string,
): Promise<MembershipSubscription | null> {
  const subscription = await prisma.membershipSubscription.findUnique({
    where: { providerSubscriptionId },
  });
  if (!subscription) return null;

  const updated = await prisma.membershipSubscription.update({
    where: { id: subscription.id },
    data: {
      status: MembershipSubscriptionStatus.CANCELLED,
      cancelledAt: new Date(),
      cancellationReason: 'Cancelled by payment provider',
      lastWebhookEventId: eventId,
    },
  });
  await revokeMembershipEntitlements(
    prisma,
    entitlementsService,
    subscription.id,
  );
  return updated;
}

export async function markMembershipPastDue(
  prisma: PrismaService,
  providerSubscriptionId: string,
  eventId: string,
): Promise<void> {
  await prisma.membershipSubscription.updateMany({
    where: { providerSubscriptionId },
    data: {
      status: MembershipSubscriptionStatus.PAST_DUE,
      lastWebhookEventId: eventId,
    },
  });
}
