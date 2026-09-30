import {
  InstitutionSubscription,
  MembershipSubscriptionStatus,
  OrganizationSubscription,
  WorkspacePlan,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from '../entitlements/entitlements.service';

/**
 * Plain exported functions, not NestJS providers — the same
 * circular-dependency-avoidance pattern as
 * memberships/membership-webhook.util.ts. PaymentModule's
 * WebhookEventHandlerService needs to activate/cancel OrganizationSubscription
 * and InstitutionSubscription rows and grant/revoke their entitlements, but
 * OrganizationsModule needs PaymentModule's provider adapters — importing
 * OrganizationsModule into PaymentModule would be circular. Plain functions
 * taking PrismaService/EntitlementsService as explicit parameters have zero
 * module-graph implications.
 *
 * Organization and Institution subscriptions share the exact same shape and
 * lifecycle, so their handling is written twice here rather than through a
 * shared generic helper — Prisma's per-model delegate types don't share a
 * common interface, and two short, explicit, readable functions beat one
 * generic one fighting the type system for two call sites.
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

// ── Organization ─────────────────────────────────────────────────────────

export async function grantOrganizationEntitlements(
  prisma: PrismaService,
  entitlementsService: EntitlementsService,
  subscription: OrganizationSubscription & { plan: WorkspacePlan },
): Promise<void> {
  const keys = parseEntitlementKeys(subscription.plan.entitlementKeys);
  for (const key of keys) {
    const entitlement = await prisma.entitlement.findUnique({
      where: { key },
    });
    if (!entitlement) continue;
    const existingGrant = await prisma.entitlementGrant.findFirst({
      where: {
        entitlementId: entitlement.id,
        organizationId: subscription.organizationId,
        source: 'ORGANIZATION_PLAN',
        sourceId: subscription.id,
        revokedAt: null,
      },
    });
    if (existingGrant) continue;
    await entitlementsService.grant({
      entitlementKey: key,
      organizationId: subscription.organizationId,
      source: 'ORGANIZATION_PLAN',
      sourceId: subscription.id,
    });
  }
}

export async function revokeOrganizationEntitlements(
  prisma: PrismaService,
  entitlementsService: EntitlementsService,
  organizationSubscriptionId: string,
): Promise<void> {
  const grants = await prisma.entitlementGrant.findMany({
    where: {
      source: 'ORGANIZATION_PLAN',
      sourceId: organizationSubscriptionId,
      revokedAt: null,
    },
  });
  for (const grant of grants) {
    await entitlementsService.revoke(grant.id);
  }
}

export async function activateOrganizationSubscription(
  prisma: PrismaService,
  entitlementsService: EntitlementsService,
  organizationSubscriptionId: string,
  params: {
    providerSubscriptionId: string;
    providerCustomerId?: string;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    eventId: string;
  },
): Promise<OrganizationSubscription> {
  const subscription = await prisma.organizationSubscription.update({
    where: { id: organizationSubscriptionId },
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
  await grantOrganizationEntitlements(
    prisma,
    entitlementsService,
    subscription,
  );
  return subscription;
}

export async function cancelOrganizationSubscriptionByProviderSubscriptionId(
  prisma: PrismaService,
  entitlementsService: EntitlementsService,
  providerSubscriptionId: string,
  eventId: string,
): Promise<OrganizationSubscription | null> {
  const subscription = await prisma.organizationSubscription.findUnique({
    where: { providerSubscriptionId },
  });
  if (!subscription) return null;
  const updated = await prisma.organizationSubscription.update({
    where: { id: subscription.id },
    data: {
      status: MembershipSubscriptionStatus.CANCELLED,
      cancelledAt: new Date(),
      cancellationReason: 'Cancelled by payment provider',
      lastWebhookEventId: eventId,
    },
  });
  await revokeOrganizationEntitlements(
    prisma,
    entitlementsService,
    subscription.id,
  );
  return updated;
}

export async function markOrganizationPastDue(
  prisma: PrismaService,
  providerSubscriptionId: string,
  eventId: string,
): Promise<void> {
  await prisma.organizationSubscription.updateMany({
    where: { providerSubscriptionId },
    data: {
      status: MembershipSubscriptionStatus.PAST_DUE,
      lastWebhookEventId: eventId,
    },
  });
}

// ── Institution ──────────────────────────────────────────────────────────

export async function grantInstitutionEntitlements(
  prisma: PrismaService,
  entitlementsService: EntitlementsService,
  subscription: InstitutionSubscription & { plan: WorkspacePlan },
): Promise<void> {
  const keys = parseEntitlementKeys(subscription.plan.entitlementKeys);
  for (const key of keys) {
    const entitlement = await prisma.entitlement.findUnique({
      where: { key },
    });
    if (!entitlement) continue;
    const existingGrant = await prisma.entitlementGrant.findFirst({
      where: {
        entitlementId: entitlement.id,
        institutionId: subscription.institutionId,
        source: 'INSTITUTION_PLAN',
        sourceId: subscription.id,
        revokedAt: null,
      },
    });
    if (existingGrant) continue;
    await entitlementsService.grant({
      entitlementKey: key,
      institutionId: subscription.institutionId,
      source: 'INSTITUTION_PLAN',
      sourceId: subscription.id,
    });
  }
}

export async function revokeInstitutionEntitlements(
  prisma: PrismaService,
  entitlementsService: EntitlementsService,
  institutionSubscriptionId: string,
): Promise<void> {
  const grants = await prisma.entitlementGrant.findMany({
    where: {
      source: 'INSTITUTION_PLAN',
      sourceId: institutionSubscriptionId,
      revokedAt: null,
    },
  });
  for (const grant of grants) {
    await entitlementsService.revoke(grant.id);
  }
}

export async function activateInstitutionSubscription(
  prisma: PrismaService,
  entitlementsService: EntitlementsService,
  institutionSubscriptionId: string,
  params: {
    providerSubscriptionId: string;
    providerCustomerId?: string;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    eventId: string;
  },
): Promise<InstitutionSubscription> {
  const subscription = await prisma.institutionSubscription.update({
    where: { id: institutionSubscriptionId },
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
  await grantInstitutionEntitlements(prisma, entitlementsService, subscription);
  return subscription;
}

export async function cancelInstitutionSubscriptionByProviderSubscriptionId(
  prisma: PrismaService,
  entitlementsService: EntitlementsService,
  providerSubscriptionId: string,
  eventId: string,
): Promise<InstitutionSubscription | null> {
  const subscription = await prisma.institutionSubscription.findUnique({
    where: { providerSubscriptionId },
  });
  if (!subscription) return null;
  const updated = await prisma.institutionSubscription.update({
    where: { id: subscription.id },
    data: {
      status: MembershipSubscriptionStatus.CANCELLED,
      cancelledAt: new Date(),
      cancellationReason: 'Cancelled by payment provider',
      lastWebhookEventId: eventId,
    },
  });
  await revokeInstitutionEntitlements(
    prisma,
    entitlementsService,
    subscription.id,
  );
  return updated;
}

export async function markInstitutionPastDue(
  prisma: PrismaService,
  providerSubscriptionId: string,
  eventId: string,
): Promise<void> {
  await prisma.institutionSubscription.updateMany({
    where: { providerSubscriptionId },
    data: {
      status: MembershipSubscriptionStatus.PAST_DUE,
      lastWebhookEventId: eventId,
    },
  });
}
